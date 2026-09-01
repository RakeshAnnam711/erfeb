'use strict'

var PROCESSOR = {
    CYBERSOURCE_CREDIT: 'cybersource_credit',
    CYBERSOURCE_PAYPAL: 'paypal_express',
    CYBERSOURCE_PAYPAL_CREDIT: 'paypal_credit',
    AUTHORIZE_NET_CREDIT: 'authorize_net_credit',
    BASIC_GIFT_CERTIFICATE: 'basic_gift_certificate',
    ADYEN_POS: 'adyen_pos',
    ADYEN_COMPONENT: 'adyen_component',
    ADYEN_CREDIT: 'adyen_credit',
    SALESFORCE_PAY: 'salesforce_payments',
    STRIPE_PAYMENT_ELEMENT: 'stripe_payment_element',
    STRIPE_APM: 'stripe_apm',
    STRIPE_CREDIT: 'stripe_credit'
}

var PAYMENT_METHOD = {
    STRIPE_PAYMENT_ELEMENT: 'STRIPE_PAYMENT_ELEMENT',
    STRIPE_APM: 'STRIPE_APM'
}

function normalizeErrorResult(result, fallbackMessage) {
    if (!result || !result.error || typeof result.error !== 'object') {
        return result;
    }

    var errorObject = result.error;
    result.error = true;

    if (!result.errorMessage && errorObject.message) {
        result.errorMessage = errorObject.message;
    }

    if (!result.serverErrors) {
        result.serverErrors = [];
    }

    if (result.serverErrors.length === 0) {
        result.serverErrors.push(result.errorMessage || fallbackMessage);
    }

    return result;
}

function getPaymentProcessorID(PaymentMgr, paymentMethodID) {
    if (!paymentMethodID) {
        return '';
    }

    var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodID);
    if (paymentMethod && paymentMethod.paymentProcessor) {
        return paymentMethod.paymentProcessor.ID.toLowerCase();
    }

    // Stripe Payment Element can be sent as method id or processor id by custom frontends.
    if (paymentMethodID === PAYMENT_METHOD.STRIPE_PAYMENT_ELEMENT || paymentMethodID === PROCESSOR.STRIPE_PAYMENT_ELEMENT) {
        return PROCESSOR.STRIPE_PAYMENT_ELEMENT;
    }

    if (paymentMethodID === PAYMENT_METHOD.STRIPE_APM || paymentMethodID === PROCESSOR.STRIPE_APM) {
        return PROCESSOR.STRIPE_APM;
    }

    return '';
}

function placeOrderStartPoint(lineItemContainer, paymentProcessor, paymentInstrumentIndex) {
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('cybersourceCartridgeEnabled')) {
        if(request.httpParameterMap.DFReferenceId.submitted) {
            session.privacy.DFReferenceId = request.httpParameterMap.DFReferenceId.stringValue;
        }
    }

    return {success: true};
}

function placeOrderHandleMissingBasket() {
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('cybersourceCartridgeEnabled')) {
        if('isPaymentRedirectInvoked' in session.privacy && session.privacy.isPaymentRedirectInvoked && 'orderID' in session.privacy && null !== session.privacy.orderID) {
            var OrderMgr = require('dw/order/OrderMgr');
            var order = OrderMgr.getOrder(session.privacy.orderID);

            var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
            COHelpers.reCreateBasket(order);
            return {};
        }
    }

    return {};
}

function placeOrderHandlePaymentResult(handlePaymentResult, order, paymentProcessor, paymentInstrumentIndex) {
    switch (paymentProcessor) {
        case PROCESSOR.CYBERSOURCE_CREDIT:
        case PROCESSOR.CYBERSOURCE_PAYPAL:
        case PROCESSOR.CYBERSOURCE_PAYPAL_CREDIT: {
            var URLUtils = require('dw/web/URLUtils');
            var Resource = require('dw/web/Resource');
            var CybersourceHelper = require('*/cartridge/scripts/cybersource/libCybersource').getCybersourceHelper();
            var CsSAType = dw.system.Site.getCurrent().getCustomPreferenceValue('CsSAType').value;

            var paymentInstrument = order.paymentInstruments[paymentInstrumentIndex]
            if (handlePaymentResult.error) {
                if(paymentInstrument.paymentMethod != null
                    && (paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.creditcard', 'cybersource', null)
                        || (CsSAType == Resource.msg('cssatype.SA_REDIRECT', 'cybersource', null)
                        || CsSAType == Resource.msg('cssatype.SA_SILENTPOST', 'cybersource', null)
                        || CsSAType == Resource.msg('cssatype.SA_FLEX', 'cybersource', null)))
                        || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.alipay', 'cybersource', null)
                        || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.sof', 'cybersource', null)
                        || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.idl', 'cybersource', null)
                        || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.mch', 'cybersource', null)
                        || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.paypalcredit', 'cybersource', null)
                ) {
                    return {
                        error: true,
                        cartError: true,
                        redirectUrl: URLUtils.https('Checkout-Begin', 'stage', 'payment', 'PlaceOrderError', Resource.msg('error.technical', 'checkout', null)).toString()
                    };
                }

                return {
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                };
            }

            if (handlePaymentResult.returnToPage){
                return {
                    returnEarly: true,
                    template: 'secureacceptance/secureAcceptanceIframeSummmary',
                    viewData: {
                        Order: handlePaymentResult.order
                    }
                };
            }

            if (handlePaymentResult.intermediate){
                return {
                    returnEarly: true,
                    template: handlePaymentResult.renderViewPath,
                    viewData: {
                        alipayReturnUrl : handlePaymentResult.alipayReturnUrl
                    }
                };
            }

            if (handlePaymentResult.intermediateSA) {
                return {
                    returnEarly: true,
                    template: handlePaymentResult.renderViewPath,
                    viewData: {
                        Data:handlePaymentResult.data,
                        FormAction:handlePaymentResult.formAction
                    }
                }
            }

            if (handlePaymentResult.intermediateSilentPost) {
                return {
                    returnEarly: true,
                    template: handlePaymentResult.renderViewPath,
                    viewData: {
                        requestData:handlePaymentResult.data,
                        formAction:handlePaymentResult.formAction,
                        cardObject:handlePaymentResult.cardObject
                    }
                }
            }

            if (handlePaymentResult.redirection) {
                return {
                    returnEarly: true,
                    redirectUrl: handlePaymentResult.redirectionURL
                }
            }

            if (handlePaymentResult.declined) {
                session.privacy.SkipTaxCalculation = false;

                if (paymentInstrument.paymentMethod != null
                    && (paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.creditcard', 'cybersource', null)
                    && (CsSAType == Resource.msg('cssatype.SA_REDIRECT', 'cybersource', null)
                    || CsSAType == Resource.msg('cssatype.SA_SILENTPOST', 'cybersource', null)))
                    || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.alipay', 'cybersource', null)
                    || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.sof', 'cybersource', null)
                    || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.idl', 'cybersource', null)
                    || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.mch', 'cybersource', null)
                    || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.klarna', 'cybersource', null)
                    || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.paypalcredit', 'cybersource', null)
                ){
                    return {
                        error: true,
                        cartError: true,
                        redirectUrl: URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'placeOrderError', Resource.msg('sa.billing.payment.error.declined', 'cybersource', null)).toString()
                    }
                }

                return {
                    error: true,
                    errorMessage: Resource.msg('sa.billing.payment.error.declined', 'cybersource', null)
                };
            }

            if (handlePaymentResult.missingPaymentInfo) {
                session.privacy.SkipTaxCalculation = false;

                if(paymentInstrument.paymentMethod != null
                    && (paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.creditcard','cybersource',null)
                        && (CsSAType == Resource.msg('cssatype.SA_REDIRECT','cybersource',null)
                            || CsSAType == Resource.msg('cssatype.SA_SILENTPOST','cybersource',null)))
                    || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.alipay','cybersource',null)
                    || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.sof','cybersource',null)
                    || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.idl','cybersource',null)
                    || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.mch','cybersource',null)
                    || paymentInstrument.paymentMethod == Resource.msg('paymentmethodname.paypalcredit','cybersource',null)
                ) {
                    return {
                        error: true,
                        cartError: true,
                        redirectUrl: URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'PlaceOrderError', Resource.msg('sa.billing.payment.error.declined', 'cybersource', null)).toString()
                    }
                }

                return {
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                };
            }

            if (handlePaymentResult.rejected) {
                var BasketMgr = require('dw/order/BasketMgr');
                currentBasket = BasketMgr.getCurrentBasket();
                var Transaction = require('dw/system/Transaction');
                Transaction.wrap(function () {
                    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
                    COHelpers.handlePayPal(currentBasket);
                });

                return {
                    error: true,
                    cartError : true,
                    redirectUrl: URLUtils.https('Checkout-Begin', 'stage', 'payment', 'payerAuthError', Resource.msg('payerauthentication.carderror', 'cybersource', null)).toString()
                };
            }

            if (handlePaymentResult.process3DRedirection){
                return {
                    returnEarly: true,
                    continueUrl: URLUtils.url('CheckoutServices-PayerAuthentication').toString()
                }
            }

            if (handlePaymentResult.processWeChat) {
                return {
                    returnEarly: true,
                    template: 'checkout/confirmation/weChatConfirmation',
                    viewData: {
                        paymentResult: handlePaymentResult,
                        weChatQRCode: handlePaymentResult.WeChatMerchantURL,
                        orderNo: order.orderNo,
                        order: order,
                        noOfCalls: CybersourceHelper.getNumofCheckStatusCalls() != null ? CybersourceHelper.getNumofCheckStatusCalls() : 6,
                        serviceCallInterval: CybersourceHelper.getServiceCallInterval() != null ? CybersourceHelper.getServiceCallInterval() : 10
                    }
                };
            }
            break;
        }
        case PROCESSOR.ADYEN_POS:
        case PROCESSOR.ADYEN_COMPONENT:
        case PROCESSOR.ADYEN_CREDIT: {
            var URLUtils = require('dw/web/URLUtils');
            var Resource = require('dw/web/Resource');
            var constants = require('*/cartridge/adyen/config/constants');

            if (handlePaymentResult.error) {
                return {
                    error: true,
                    errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
                };
            }

            if (handlePaymentResult.threeDS2) {
                return {
                    returnEarly: true,
                    continueUrl: URLUtils.url('Adyen-Adyen3DS2', 'resultCode', handlePaymentResult.resultCode, 'token3ds2', handlePaymentResult.token3ds2).toString()
                };
            }

            if (handlePaymentResult.redirectObject) {
                // If authorized3d, then redirectObject from credit card, hence it is 3D Secure
                if (handlePaymentResult.authorized3d) {
                    session.privacy.MD = handlePaymentResult.redirectObject.data.MD;
                    return {
                        returnEarly: true,
                        continueUrl: URLUtils.url('Adyen-Adyen3D', 'IssuerURL', handlePaymentResult.redirectObject.url, 'PaRequest', handlePaymentResult.redirectObject.data.PaReq, 'MD', handlePaymentResult.redirectObject.data.MD, 'signature', handlePaymentResult.signature).toString()
                    };
                }

                return {
                  returnEarly: true,
                  continueUrl: URLUtils.url('Adyen-Redirect', 'redirectUrl', handlePaymentResult.redirectObject.url, 'signature', handlePaymentResult.signature).toString()
                };
              }

                if (
                    handlePaymentResult.action &&
                    handlePaymentResult.action.type !== constants.ACTIONTYPES.VOUCHER
                ) {
                    var adyenCheckoutServices = require('*/cartridge/controllers/middlewares/checkout_services/adyenCheckoutServices');
                    return adyenCheckoutServices.processPayment(order, handlePaymentResult);
                }
            break;
        }
        case PROCESSOR.STRIPE_PAYMENT_ELEMENT: {
            var Resource = require('dw/web/Resource');

            if (handlePaymentResult.error) {
                return {
                    error: true,
                    errorMessage: handlePaymentResult.errorMessage || Resource.msg('error.payment.not.valid', 'checkout', null)
                };
            }

            if (handlePaymentResult.redirectUrl || handlePaymentResult.redirectURL) {
                return {
                    returnEarly: true,
                    redirectUrl: handlePaymentResult.redirectUrl || handlePaymentResult.redirectURL
                };
            }

            if (handlePaymentResult.continueUrl) {
                return {
                    returnEarly: true,
                    continueUrl: handlePaymentResult.continueUrl
                };
            }

            break;
        }
        default: {
            break;
        }
    }

    return handlePaymentResult;
}

function forterFraudCheck(order, handlePaymentResult) {
    var orderNumber = order.getCurrentOrderNo();
    var argOrderValidate = {
        orderNumber: orderNumber,
        orderValidateAttemptInput: 1,
        request: request,
        authorizePaymentResult: handlePaymentResult
    };
    var forterCall = require('int_forter_sfra/cartridge/scripts/pipelets/forter/forterValidate');
    var forterDecision = forterCall.validateOrder(argOrderValidate);
    if (forterDecision.result === false && forterDecision.orderValidateAttemptInput === 2) {
        argOrderValidate = {
            orderNumber               : orderNumber,
            orderValidateAttemptInput : 2,
            request                   : request,
            authorizePaymentResult    : handlePaymentResult
        };
       forterDecision = forterCall.validateOrder(argOrderValidate);
    }

    if (forterDecision.JsonResponseOutput && (forterDecision.JsonResponseOutput.processorAction == 'void' || forterDecision.JsonResponseOutput.processorAction == 'internalError')) {
        if (!empty(forterDecision.PlaceOrderError)) {
            return {
                error: true,
                errorMessage: forterDecision.PlaceOrderError.code,
                flagFraud: forterDecision.JsonResponseOutput.processorAction == 'void'
            };
        } else {
            var Resource = require('dw/web/Resource');
            return {
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null),
                flagFraud: forterDecision.JsonResponseOutput.processorAction == 'void'
            };
        }
    }

    return {};
}

function placeOrderPreAuthFraudCheck(order, currentBasket) {
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('forterEnabled')) {
        if (dw.system.Site.getCurrent().getCustomPreferenceValue('forterPreAuthFraudCheckEnabled')) {
            var forterFraudResult = module.exports.forterFraudCheck(order, {});
            if (forterFraudResult.error) {
                return forterFraudResult;
            }
        }
    }

    if (dw.system.Site.current.getCustomPreferenceValue('SignifydEnableCartridge')) {
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function() {
            order.custom.basketUUID = currentBasket.UUID;
        })

    }

    return {};
}

function saveSignifydHandlePaymentResult(handlePaymentResult, order, paymentProcessor, paymentInstrumentIndex) {
    var Transaction = require('dw/system/Transaction');
    Transaction.wrap(function () {
        order.paymentInstruments[paymentInstrumentIndex].paymentTransaction.custom.authorizePaymentResult = JSON.stringify(handlePaymentResult[paymentProcessor]);
    })
}

function adyenFraudCheck(handlePaymentResult, order, paymentProcessor, paymentInstrumentIndex) {
    var Transaction = require('dw/system/Transaction');

    var result = handlePaymentResult[paymentProcessor];
    switch (paymentProcessor) {
        case PROCESSOR.ADYEN_POS:
        case PROCESSOR.ADYEN_COMPONENT:
        case PROCESSOR.ADYEN_CREDIT: {
            if (!result.authResponse || !result.authResponse.fullResponse || !result.authResponse.fullResponse.fraudResult
                || empty(result.authResponse.fullResponse.fraudResult.accountScore) || !result.authResponse.fullResponse.additionalData
                || !result.authResponse.fullResponse.additionalData.fraudResultType || empty(result.authResponse.fullResponse.additionalData.fraudManualReview)) {
                function keysOnly(_key, value) {
                    if (typeof value === 'object') {
                        return value;
                    }

                    return '';
                }
                dw.system.Logger.error('Internal error: Adyen misconfigured or has service issues and is missing expected fraud info during place order for order ' + order.orderNo + ' : ' + JSON.stringify(result, keysOnly));

                return {success:true};
            }

            var additionalData = result.authResponse.fullResponse.additionalData;
            var fraudResult = result.authResponse.fullResponse.fraudResult;
            Transaction.wrap(function () {
                order.paymentInstruments[paymentInstrumentIndex].paymentTransaction.custom.Adyen_fraudResultType = additionalData.fraudResultType;
                order.paymentInstruments[paymentInstrumentIndex].paymentTransaction.custom.Adyen_fraudManualReview = additionalData.fraudManualReview;
                order.paymentInstruments[paymentInstrumentIndex].paymentTransaction.custom.Adyen_accountScore = fraudResult.accountScore;
            });

            var autoFailEnabled = dw.system.Site.current.getCustomPreferenceValue('adyenFraudFailOnFraud');
            var autoReviewEnabled = dw.system.Site.current.getCustomPreferenceValue('adyenFraudReviewOnManualFlag');

            if (autoFailEnabled && additionalData.fraudResultType === 'FRAUD') {
                return {
                    success: false,
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null),
                    flagFraud: true
                };
            } else if (autoReviewEnabled && (additionalData.fraudManualReview === 'true' || additionalData.fraudResultType === 'AMBER')) {
                if (order.giftCertificatePaymentInstruments.length || order.giftCertificateLineItems.length) {
                    return {
                        success:false,
                        error: true,
                        errorMessage: Resource.msg('error.technical', 'checkout', null)
                    };
                }
                return {
                    success: false,
                    status: 'flag'
                }
            }
        }
        default: {
            return {success:true};
        }
    }

    return {success:true};
}

// fraud provider returning 'DECLINE' or status === 'fail' should be converted to { error: true; flagFraud: true }
// fraud provider returning 'REVIEW' or status === 'flag' should be converted to { status: 'flag' }

// TODO RVW configuration for next 2 scenarios?
// fraud provider returning an exception error should be converted to { error: true; flagFraud: false }, indicates coding error that needs to be fixed
// fraud provider returning a timeout timeout error should be converted as appropriate for provider as some have jobs for backup and some don't, indicates 3rd party service error

// return { error: true; flagFraud; false } will stop place order and send back other fields as JSON
// return { error: true; flagFraud: true } will set session fraud and disable checkout
// return { status: 'flag' } will proceed to place order but leave order in created status and set status to CONFIRMATION_STATUS_NOTCONFIRMED for later processing

//TODO BEN all of these should go into a new script file require (adyenFraudCheck.js) for example
// and then they can get required when they are enabled, allowing people to extend this without copying this whole function
function placeOrderPostAuthFraudCheck(order, handlePaymentResult) {
    var Transaction = require('dw/system/Transaction');

    if (dw.system.Site.getCurrent().getCustomPreferenceValue('forterEnabled')) {
        if (dw.system.Site.getCurrent().getCustomPreferenceValue('forterPostAuthFraudCheckEnabled')) {
            var forterFraudResult = module.exports.forterFraudCheck(order, handlePaymentResult);
            if (forterFraudResult.error) {
                Transaction.wrap(function () { order.addNote('RVW integrations base: Forter', 'Flagged by placeOrderPostAuthFraudCheck'); });

                return forterFraudResult;
            }
        }
    }

    if (dw.system.Site.getCurrent().getCustomPreferenceValue('cybersourceCartridgeEnabled')
        && (dw.system.Site.current.getCustomPreferenceValue('csCardDecisionManagerEnable') || dw.system.Site.current.getCustomPreferenceValue('isDecisionManagerEnable'))) {
        var fraudDetectionStatus = require('int_cybersource_sfra/cartridge/scripts/hooks/fraudDetection').fraudDetection(order)
        if (fraudDetectionStatus.status === 'fail') {
            Transaction.wrap(function () { order.addNote('RVW integrations base: CyberSource', 'Flagged as failure by placeOrderPostAuthFraudCheck. ' + fraudDetectionStatus.errorMessage); });

            return {
                error: true,
                errorMessage: fraudDetectionStatus.errorMessage,
                flagFraud: true
            };
        }

        if (session.privacy.CybersourceFraudDecision == "REVIEW") {
            Transaction.wrap(function () { order.addNote('RVW integrations base: CyberSource', 'Flagged for review by placeOrderPostAuthFraudCheck.'); });

            var CybersourceConstants = require('*/cartridge/scripts/utils/CybersourceConstants');
            if (CybersourceConstants.BANK_TRANSFER_PROCESSOR.equals(order.paymentTransaction.paymentProcessor.ID)) {
                return {
                    error: true,
                    cartError: true,
                    flagFraud: true,
                    redirectUrl: handlePaymentResult.redirectionURL
                }
            }

            return {
                status: 'flag'
            }
        }
    }

    if (dw.system.Site.current.getCustomPreferenceValue('adyenCartridgeEnabled') && dw.system.Site.current.getCustomPreferenceValue('adyenFraudEnabled')) {
        var adyenFraudResult = module.exports.doForAllPaymentInstruments(order, module.exports.adyenFraudCheck.bind(this, handlePaymentResult));
        if (!adyenFraudResult.success) {
            Transaction.wrap(function () { order.addNote('RVW integrations base: Adyen', 'Flagged for review by placeOrderPostAuthFraudCheck.'); });

            return adyenFraudResult;
        }
    }

    if (dw.system.Site.current.getCustomPreferenceValue('SignifydEnableCartridge')) {
        // because signifyd is async it needs to save off the authorization result for later use
        // when this moves to sync in Q1, this can go away (along with the system preference) and work like all the other Fraud providers
        module.exports.doForAllPaymentInstruments(order, module.exports.saveSignifydHandlePaymentResult.bind(this, handlePaymentResult));

        var Signifyd = require('int_signifyd_sfra/cartridge/scripts/service/signifyd');
        var orderSessionID = Signifyd.getOrderSessionId(order.custom.basketUUID);
        Signifyd.setOrderSessionId(order, orderSessionID);
        if (Signifyd.Call(order)) {
            Transaction.wrap(function () { order.addNote('RVW integrations base: Signifyd', 'Flagged for review by placeOrderPostAuthFraudCheck.'); });

            //signifyd call successful, put order in review status
            return {
                status: 'flag'
            }
        }

    }

    return {};
}

function submitPaymentSetViewData(paymentProcessor, currentBasket) {
    var viewData = { paidWithPayPal: false, selectedPayment: 'others' };

    switch (paymentProcessor) {
        case PROCESSOR.CYBERSOURCE_PAYPAL:
        case PROCESSOR.CYBERSOURCE_PAYPAL_CREDIT: {
            return {};
        }
        case PROCESSOR.SALESFORCE_PAY: {
            var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
            var billingDetails = COHelpers.getBillingDetails(currentBasket);
            var viewData = {
                billingDetails: billingDetails
            }
            return viewData;
        }
        default: {
            return viewData;
        }
    }
}

function submitPayment(req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var HookManager = require('dw/system/HookMgr');
    var Resource = require('dw/web/Resource');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var server = require('server');
    // WGACA MODIFICATION - Affirm Class, helper and function requirements
    var Transaction = require('dw/system/Transaction');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var affirmHelper = require('*/cartridge/scripts/utils/affirmHelper');
    var Logger = require('dw/system/Logger');

    function removePaymentInstruments(basket, paymentInstruments) {
        for (var i = 0; i < paymentInstruments.length; i++) {
            var pi = paymentInstruments[i];
            basket.removePaymentInstrument(pi);
        }
    };
    // END MODIFICATION
    var viewData = res.viewData;
    var paymentForm = server.forms.getForm('billing');
    
    Logger.debug('paymentForm: ' + JSON.stringify(paymentForm));
    var currentBasket = BasketMgr.getCurrentBasket();
    
    var paymentMethodIdValue = paymentForm.paymentMethod.value;
    if (!paymentMethodIdValue && request.httpParameterMap.paymentMethod && request.httpParameterMap.paymentMethod.stringValue) {
        paymentMethodIdValue = request.httpParameterMap.paymentMethod.stringValue;
    }
    var paymentProcessor = '';
    
    //  If basket exists, check for gift certificate coverage
    if (currentBasket) {
        var giftCertInstruments = currentBasket.getGiftCertificatePaymentInstruments();
        var totalGiftCertAmount = 0;
        for (var i = 0; i < giftCertInstruments.length; i++) {
            var gcAmount = giftCertInstruments[i].paymentTransaction.amount.valueOrNull;
            if (gcAmount) {
                totalGiftCertAmount += gcAmount;
            }
        }
        var totalBasketAmount = currentBasket.totalGrossPrice.valueOrNull;
    
        // If gift certificates fully cover basket, override payment method
        if (totalGiftCertAmount >= totalBasketAmount) {
            paymentMethodIdValue = 'GIFT_CERTIFICATE';
        }
    
        // Edge case: basket total is literally 0 (e.g. 100% discount promo)
        if (!totalBasketAmount) {
            paymentProcessor = 'basic_gift_certificate'; // Simulate dummy processor
        }
    }
    
    // Resolve the payment processor from the selected payment method
    if (!paymentProcessor) {
        paymentProcessor = getPaymentProcessorID(PaymentMgr, paymentMethodIdValue);
    }
    
    //  If no processor was found, throw an error
    if (!paymentProcessor) {
        throw new Error(Resource.msg(
            'error.payment.processor.missing',
            'checkout',
            null
        ));
    }
    

    viewData.address = {
        firstName: { value: paymentForm.addressFields.firstName.value },
        lastName: { value: paymentForm.addressFields.lastName.value },
        address1: { value: paymentForm.addressFields.address1.value },
        address2: { value: paymentForm.addressFields.address2.value },
        city: { value: paymentForm.addressFields.city.value },
        postalCode: { value: paymentForm.addressFields.postalCode.value },
        countryCode: { value: paymentForm.addressFields.country.value }
    };

    if (Object.prototype.hasOwnProperty.call(paymentForm.addressFields, 'states')) {
        viewData.address.stateCode = { value: paymentForm.addressFields.states.stateCode.value };
    }

    viewData.phone = { value: paymentForm.contactInfoFields.phone.value };

    // WGACA MODIFICATION - Affirm code section - start
    Transaction.wrap(function () {
        if (paymentMethodIdValue == affirmHelper.AFFIRM_PAYMENT_METHOD) {
            removePaymentInstruments(currentBasket, currentBasket.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD));
        } else if (paymentMethodIdValue == PaymentInstrument.METHOD_CREDIT_CARD) {
            removePaymentInstruments(currentBasket, currentBasket.getPaymentInstruments(affirmHelper.AFFIRM_PAYMENT_METHOD));
        }
    });
    viewData.currencyCode =  { value: currentBasket.currencyCode };
    viewData.email =  { value: currentBasket.customerEmail };
    // END MODIFICATION Affirm code section - end

    var formFieldErrors = [];

    var billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);

    if (Object.keys(billingFormErrors).length) {
        formFieldErrors.push(billingFormErrors);
    }

    var contactInfoFormErrors = COHelpers.validateFields(paymentForm.contactInfoFields);
    if (Object.keys(contactInfoFormErrors).length) {
        formFieldErrors.push(contactInfoFormErrors);
    }

    var processFormHookResult = {};
    if (HookManager.hasHook('app.payment.form.processor.' + paymentProcessor)) {
        //TODO BEN cybersource hooks for the other payment processors besides cc, bank, and paypal_express
        processFormHookResult = HookManager.callHook('app.payment.form.processor.' + paymentProcessor,
            'processForm',
            req,
            paymentForm,
            viewData
        );
    } else {
        processFormHookResult = HookManager.callHook('app.payment.form.processor.default_form_processor', 'processForm');
    }

    processFormHookResult = normalizeErrorResult(processFormHookResult, Resource.msg('error.technical', 'checkout', null));

    if (processFormHookResult.error && processFormHookResult.fieldErrors) {
        formFieldErrors.push(processFormHookResult.fieldErrors)
    }


    if (formFieldErrors.length || processFormHookResult.serverErrors) {
        // respond with form data and errors
        res.json({
            form: paymentForm,
            fieldErrors: formFieldErrors,
            serverErrors: processFormHookResult.serverErrors || [],
            error: true
        });
        return next();
    }

    if (processFormHookResult.viewData) {
        res.setViewData(processFormHookResult.viewData);
    }

    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var HookMgr = require('dw/system/HookMgr');
        var Transaction = require('dw/system/Transaction');
        var AccountModel = require('*/cartridge/models/account');
        var OrderModel = require('*/cartridge/models/order');
        var URLUtils = require('dw/web/URLUtils');
        var Locale = require('dw/util/Locale');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();

        var billingData = res.getViewData();

        if (!currentBasket) {
            delete billingData.paymentInformation;

            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return;
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);
        if (validatedProducts.error) {
            delete billingData.paymentInformation;

            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return;
        }

        var billingAddress = currentBasket.billingAddress;
        var billingForm = server.forms.getForm('billing');
        var paymentMethodID = billingData.paymentMethod.value;

        billingForm.creditCardFields.cardNumber.htmlValue = '';
        billingForm.creditCardFields.securityCode.htmlValue = '';

        Transaction.wrap(function () {
            if (!billingAddress) {
                billingAddress = currentBasket.createBillingAddress();
            }

            billingAddress.setFirstName(billingData.address.firstName.value);
            billingAddress.setLastName(billingData.address.lastName.value);
            billingAddress.setAddress1(billingData.address.address1.value);
            billingAddress.setAddress2(billingData.address.address2.value);
            billingAddress.setCity(billingData.address.city.value);
            billingAddress.setPostalCode(billingData.address.postalCode.value);
            if (Object.prototype.hasOwnProperty.call(billingData.address, 'stateCode')) {
                billingAddress.setStateCode(billingData.address.stateCode.value);
            }
            billingAddress.setCountryCode(billingData.address.countryCode.value);
            billingAddress.setPhone(billingData.phone.value);
        });

        // if there is no selected payment option
        if (!paymentMethodID) {
            var noPaymentMethod = {};

            noPaymentMethod[billingData.paymentMethod.htmlName] =
                Resource.msg('error.no.selected.payment.method', 'payment', null);

            delete billingData.paymentInformation;

            res.json({
                form: billingForm,
                fieldErrors: [noPaymentMethod],
                serverErrors: [],
                error: true
            });
            return;
        }

        // WGACA MODIFICATION - Skip applicable payments if == Affirm
        // updated for affirm
        // Also skip for Stripe CREDIT_CARD: cardType comes from Stripe brand/metadata and
        // often fails BM applicable-card matching even for valid saved PaymentMethods.
        var paymentProcessor = getPaymentProcessorID(PaymentMgr, paymentMethodID);
        if (billingData.paymentInformation && billingData.paymentInformation.cardType && billingData.paymentInformation.cardType.value
            && paymentMethodID !== PAYMENT_METHOD.STRIPE_PAYMENT_ELEMENT
            && paymentProcessor !== PROCESSOR.STRIPE_CREDIT) {
            var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
            var paymentCard = PaymentMgr.getPaymentCard(billingData.paymentInformation.cardType.value);

            var applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
                req.currentCustomer.raw,
                req.geolocation.countryCode,
                null
            );

            if (creditCardPaymentMethod.active && !empty(applicablePaymentCards) && !empty(paymentCard) && !applicablePaymentCards.contains(paymentCard)) {
                // Invalid Payment Instrument
                var invalidPaymentMethod = Resource.msg('error.payment.not.valid', 'checkout', null);
                delete billingData.paymentInformation;
                res.json({
                    form: billingForm,
                    fieldErrors: [],
                    serverErrors: [invalidPaymentMethod],
                    error: true
                });
                return;
            }
        }
        // updated for affirm
        // END MODIFICATION

        // check to make sure there is a payment processor
        if (!paymentProcessor) {
            throw new Error(Resource.msg(
                'error.payment.processor.missing',
                'checkout',
                null
            ));
        }

        var handleResult;
        if (HookMgr.hasHook('app.payment.processor.' + paymentProcessor)) {
            handleResult = HookMgr.callHook('app.payment.processor.' + paymentProcessor,
                'Handle',
                currentBasket,
                billingData.paymentInformation
            );
        } else {
            handleResult = HookMgr.callHook('app.payment.processor.default', 'Handle');
        }

        handleResult = normalizeErrorResult(handleResult, Resource.msg('error.payment.not.valid', 'checkout', null));

        // need to invalidate credit card fields
        if (handleResult.error) {
            delete billingData.paymentInformation;

            res.json({
                form: billingForm,
                fieldErrors: handleResult.fieldErrors,
                serverErrors: handleResult.serverErrors,
                error: true
            });
            return;
        } else {
            if (handleResult.handleViewData) {
                res.json(handleResult.handleViewData);
            }
        }

        var savePaymentInformationResult = {};
        if (HookMgr.hasHook('app.payment.form.processor.' + paymentProcessor)) {
            savePaymentInformationResult = HookMgr.callHook('app.payment.form.processor.' + paymentProcessor,
                'savePaymentInformation',
                req,
                currentBasket,
                billingData
            );
        } else {
            savePaymentInformationResult = HookMgr.callHook('app.payment.form.processor.default', 'savePaymentInformation');
        }

        if (savePaymentInformationResult && savePaymentInformationResult.error) {
            res.json(savePaymentInformationResult);
            return;
        }

        // Calculate the basket
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        // Re-calculate the payments.
        var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(
            currentBasket
        );

        if (calculatedPaymentTransaction.error) {
            res.json({
                form: paymentForm,
                fieldErrors: [],
                serverErrors: [Resource.msg('error.technical', 'checkout', null)],
                error: true
            });
            return;
        }

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
            req.session.privacyCache.set('usingMultiShipping', false);
            usingMultiShipping = false;
        }

        hooksHelper('app.customer.subscription', 'subscribeTo', [paymentForm.subscribe.checked, currentBasket.customerEmail], function () {});

        var currentLocale = Locale.getLocale(req.locale.id);

        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );

        var accountModel = new AccountModel(req.currentCustomer);
        var renderedStoredPaymentInstrument = COHelpers.getRenderedPaymentInstruments(
            req,
            accountModel
        );

        delete billingData.paymentInformation;

        //TODO BEN add hook instead?
        res.json(module.exports.submitPaymentSetViewData(paymentProcessor, currentBasket));
        res.json({
            renderedPaymentInstruments: renderedStoredPaymentInstrument,
            customer: accountModel,
            order: basketModel,
            form: billingForm,
            error: false
        });

        if (billingData.immediatelyPlaceOrder) {
            placeOrder(req, res, function(){});
        }
    });

    next();
}

function doForAllPaymentInstruments(lineItemContainer, callback) {
    var result = {
        success: true
    };
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Resource = require('dw/web/Resource');
    for (var paymentInstrumentIndex in lineItemContainer.paymentInstruments) {
        var paymentProcessor = getPaymentProcessorID(PaymentMgr, lineItemContainer.paymentInstruments[paymentInstrumentIndex].paymentMethod);
        if (!paymentProcessor) {
            throw new Error(Resource.msg(
                'error.payment.processor.missing',
                'checkout',
                null
            ));
        }

        result = Object.assign(result, callback(lineItemContainer, paymentProcessor, paymentInstrumentIndex));
        if (!result.success) {
            return result;
        }
    }

    return result;
}

function placeOrderHandlePaymentResultReturnEarly(res, handlePaymentResult, interpretAuthResults, order, paymentProcessor, paymentInstrumentIndex) {
    if (handlePaymentResult[paymentProcessor]) {
        interpretAuthResults[paymentProcessor] = module.exports.placeOrderHandlePaymentResult(handlePaymentResult[paymentProcessor], order, paymentProcessor, paymentInstrumentIndex);
        var interpretAuthResult = interpretAuthResults[paymentProcessor];
        if (interpretAuthResult.error) {
            return {success: true};
        }

        // cybersource and adyen use this for continuation of checkout like 3DS
        // perform continuation before fraud call
        if (interpretAuthResult.returnEarly) {
            if (interpretAuthResult.template) {
                res.render(interpretAuthResult.template, interpretAuthResult.viewData);
            } else if (interpretAuthResult.redirectUrl) {
                res.redirect(interpretAuthResult.redirectUrl);
            } else {
                res.json(interpretAuthResult);
            }
            return {success: false};
        }
    }

    return {success: true};
}

function placeOrderInterpretAuthResultsError(res, interpretAuthResults, order, paymentProcessor, paymentInstrumentIndex) {
    var interpretAuthResult = interpretAuthResults[paymentProcessor];
    if (interpretAuthResult.error) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Resource = require('dw/web/Resource');
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        if (!interpretAuthResult.errorMessage) {
            interpretAuthResult.errorMessage = Resource.msg('error.payment.not.valid', 'checkout', null);
        }
        interpretAuthResult.errorStage = {
            stage: 'payment',
            step: 'paymentInstrument'
        };
        res.json(interpretAuthResult);
        return {success: false};
    }

    return {success: true};
}

function placeOrderSetViewData(lineItemContainer, paymentProcessor, paymentInstrumentIndex) {
    var viewData = { success: true };

    if (dw.system.Site.current.getCustomPreferenceValue('cybersourceCartridgeEnabled')) {
        //  Reset decision session variable
        session.privacy.paypalShippingIncomplete = '';
        session.privacy.paypalBillingIncomplete = '';
        session.privacy.CybersourceFraudDecision = "";
        session.privacy.SkipTaxCalculation = false;
        session.privacy.cartStateString = null;
    }

    switch (paymentProcessor) {
        case PROCESSOR.ADYEN_POS:
        case PROCESSOR.ADYEN_COMPONENT:
        case PROCESSOR.ADYEN_CREDIT: {
            var constants = require('*/cartridge/adyen/config/constants');
            var clearForms = require('*/cartridge/controllers/utils/index');
            var mainPaymentInstrument = lineItemContainer.paymentInstruments[paymentInstrumentIndex];
            session.privacy.giftCardResponse = null;
            mainPaymentInstrument && clearForms.clearForms.clearPaymentTransactionData(mainPaymentInstrument);
            mainPaymentInstrument && clearForms.clearForms.clearAdyenData(mainPaymentInstrument);
            break;
        }

        default: {
            break;
        }
    }

    return viewData;
}


function placeOrder(req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    // WGACA MODIFICATION - Additional Logging
    var Logger = require('dw/system/Logger');

    try {
        var currentBasket = BasketMgr.getCurrentBasket();
        var sfpayOrder = null;
        if (req.form.orderID && req.form.orderToken) {
            sfpayOrder = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);
        }

        if (!currentBasket && !sfpayOrder) {
            module.exports.placeOrderHandleMissingBasket();
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show')
            });
            return next();
        }

        // WGACA MODIFICATION - FlowOrder bypass
        // if (!sfpayOrder) {
        if (!sfpayOrder && !currentBasket.custom.flowOrderNo) {
            var validatedProducts = validationHelpers.validateProducts(currentBasket);
            if (validatedProducts.error) {
                res.json({
                    error: true,
                    cartError: true,
                    fieldErrors: [],
                    serverErrors: [],
                    redirectUrl: URLUtils.url('Cart-Show').toString()
                });
                return next();
            }

            if (req.session.privacyCache.get('fraudDetectionStatus')) {
                res.json({
                    error: true,
                    cartError: true,
                    redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });

                return next();
            }

            if (!module.exports.doForAllPaymentInstruments(currentBasket, module.exports.placeOrderStartPoint).success) {
                return next();
            }

            // WGACA MODIFICATION - Additional Logging
            Logger.warn('rvw_integrations_core\\checkoutServicesHelper: Validating order status for the customer {0} :', currentBasket.customerEmail);

            var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);

            // WGACA MODIFICATION - Additional Logging
            Logger.warn('rvw_integrations_core\\checkoutServicesHelper: Validating order status error for the customer {0} : {1}', currentBasket.customerEmail, validationOrderStatus.error);

            if (validationOrderStatus.error) {
                res.json(validationOrderStatus);

                // WGACA MODIFICATION - Additional Logging
                Logger.warn('rvw_integrations_core\\checkoutServicesHelper: Validating order status error for the customer {0} : {1}', currentBasket.customerEmail, validationOrderStatus.message);

                return next();
            }

            // Check to make sure there is a shipping address
            if (currentBasket.defaultShipment.shippingAddress === null || currentBasket.defaultShipment.shippingAddress.address1 === null) {
                res.json({
                    error: true,
                    errorStage: {
                        stage: 'shipping',
                        step: 'address'
                    },
                    errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
                });
                return next();
            }

            // Check to make sure billing address exists
            if (!currentBasket.billingAddress) {
                res.json({
                    error: true,
                    errorStage: {
                        stage: 'payment',
                        step: 'billingAddress'
                    },
                    errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
                });
                return next();
            }

            // Calculate the basket
            Transaction.wrap(function () {
                basketCalculationHelpers.calculateTotals(currentBasket);
            });

            // WGACA MODIFICATION - Additional Logging
            Logger.warn('rvw_integrations_core\\checkoutServicesHelper: validatePayment for the customer {0} :', currentBasket.customerEmail);

            // Re-validates existing payment instruments
            var validPayment = COHelpers.validatePayment(req, currentBasket);

            // WGACA MODIFICATION - Additional Logging
            Logger.warn('rvw_integrations_core\\checkoutServicesHelper: validatePayment for the customer {0} : {1}', currentBasket.customerEmail, validPayment.error);

            if (validPayment.error) {
                res.json({
                    error: true,
                    errorStage: {
                        stage: 'payment',
                        step: 'paymentInstrument'
                    },
                    errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
                });

                // WGACA MODIFICATION - Additional Logging
                Logger.warn('rvw_integrations_core\\checkoutServicesHelper: validatePayment failed for the customer {0} :', currentBasket.customerEmail);

                return next();
            }

            // WGACA MODIFICATION - Additional Logging
            Logger.warn('rvw_integrations_core\\checkoutServicesHelper: Calculating Payment transactional total for the customer {0} :', currentBasket.customerEmail);

            // Re-calculate the payments.
            var calculatedPaymentTransactionResult = COHelpers.calculatePaymentTransaction(currentBasket);

            // WGACA MODIFICATION - Additional Logging
            Logger.warn('rvw_integrations_core\\checkoutServicesHelper: Calculated Payment transactional total error for the customer {0} : {1}',  currentBasket.customerEmail, calculatedPaymentTransactionResult.error);

            if (calculatedPaymentTransactionResult.error) {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                return next();
            }
        }

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelpers: create order started for the customer {0} :', currentBasket.customerEmail);

        // Creates a new order.
        var order = sfpayOrder || COHelpers.createOrder(currentBasket);

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelpers: create order completed for the customer {0} :', currentBasket.customerEmail);

        if (!order) {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });

            // WGACA MODIFICATION - Additional Logging
            Logger.warn('rvw_integrations_core\\checkoutServicesHelpers: create order failed for the customer {0} :', currentBasket.customerEmail);

            return next();
        }

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelper: preAuthFraudCheckResult for the customer {0} :', currentBasket.customerEmail);

        var preAuthFraudCheckResult = module.exports.placeOrderPreAuthFraudCheck(order, currentBasket);

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelper: preAuthFraudCheckResult for the customer {0} : {1}', currentBasket.customerEmail, preAuthFraudCheckResult.error);

        if (preAuthFraudCheckResult.error) {
            // Cancel or refund the payment if necessary
            paymentHelpers.reversePaymentIfNecessary(order);

            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

            // fraud detection failed
            if (preAuthFraudCheckResult.flagFraud) {
                req.session.privacyCache.set('fraudDetectionStatus', true);
            }

            res.json(preAuthFraudCheckResult);

            // WGACA MODIFICATION - Additional Logging
            Logger.warn('rvw_integrations_core\\checkoutServicesHelper: preAuthFraudCheckResult failed for the customer {0} :', currentBasket.customerEmail);

            return next();
        }

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelper: handlePaymentResult started for the customer {0} :', currentBasket.customerEmail);

        // Handles payment authorization
        var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelper: handlePaymentResult completed for the customer {0} :', currentBasket.customerEmail);

        // Handle custom processing post authorization
        // TODO BEN Move place order handle payment result to this new sfra v5.1 hook?
        var options = {
            req: req,
            res: res
        };

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelper: postAuthCustomizations started for the customer {0} :', currentBasket.customerEmail);

        var postAuthCustomizations = hooksHelper('app.post.auth', 'postAuthorization', handlePaymentResult, order, options, require('*/cartridge/scripts/hooks/postAuthorizationHandling').postAuthorization);
        postAuthCustomizations = normalizeErrorResult(postAuthCustomizations, Resource.msg('error.technical', 'checkout', null));

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelper: postAuthCustomizations completed for the customer {0} :', currentBasket.customerEmail);

        if (postAuthCustomizations && Object.prototype.hasOwnProperty.call(postAuthCustomizations, 'error')) {
            // Cancel or refund the payment if necessary
            paymentHelpers.reversePaymentIfNecessary(order);

            res.json(postAuthCustomizations);

            // WGACA MODIFICATION - Additional Logging
            Logger.warn('rvw_integrations_core\\checkoutServicesHelper: postAuthCustomizations failed for the customer {0} :', currentBasket.customerEmail);

            return next();
        }

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelper: handlePaymentResult for the customer {0} : {1}', currentBasket.customerEmail, handlePaymentResult.error);

        if (handlePaymentResult.error) {
            // Cancel or refund the payment if necessary
            paymentHelpers.reversePaymentIfNecessary(order);

            //only triggers currently when price > 0 and no paymentInstruments
            res.json({
                error: true,
                errorStage: {
                    stage: 'payment',
                    step: 'paymentInstrument'
                },
                errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
            });

            // WGACA MODIFICATION - Additional Logging
            Logger.warn('rvw_integrations_core\\checkoutServicesHelper: handlePaymentResult.error failed for the customer {0} :', currentBasket.customerEmail);

            return next();
        }

        var interpretAuthResults = {};
        if (!module.exports.doForAllPaymentInstruments(order, module.exports.placeOrderHandlePaymentResultReturnEarly.bind(this, res, handlePaymentResult, interpretAuthResults)).success) {
            // Cancel or refund the payment if necessary
            paymentHelpers.reversePaymentIfNecessary(order);

            return next();
        }

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelper: postAuthFraudCheckResult started for the customer {0} :', currentBasket.customerEmail);

        //TODO RVW use the built in fraud hook?
        //TODO RVW many of these 3DS solutions come back through an alternative controller, make sure they are covered by fraud
        // Call fraud provider, we had a normal authorization call that isn't 3DS etc...
        var postAuthFraudCheckResult = module.exports.placeOrderPostAuthFraudCheck(order, handlePaymentResult);

        if (!module.exports.doForAllPaymentInstruments(order, module.exports.placeOrderInterpretAuthResultsError.bind(this, res, interpretAuthResults)).success) {
            // Cancel or refund the payment if necessary
            paymentHelpers.reversePaymentIfNecessary(order);

            return next();
        }

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelper: postAuthFraudCheckResult error check for the customer {0} : {1}', currentBasket.customerEmail, postAuthFraudCheckResult.error);

        //Auth must have been fine, fallback to fraud result
        if (postAuthFraudCheckResult.error) {
            // Cancel or refund the payment if necessary
            paymentHelpers.reversePaymentIfNecessary(order);

            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

            // fraud detection failed
            if (postAuthFraudCheckResult.flagFraud) {
                req.session.privacyCache.set('fraudDetectionStatus', true);
            }

            res.json(postAuthFraudCheckResult);
            return next();
        }

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelper: placeOrderResult started for the customer {0} :', currentBasket.customerEmail);

        // Places the order
        var placeOrderResult = COHelpers.placeOrder(order, postAuthFraudCheckResult);

        // WGACA MODIFICATION - Additional Logging
        Logger.warn('rvw_integrations_core\\checkoutServicesHelper: placeOrderResult completed for the customer {0} : {1}', currentBasket.customerEmail, placeOrderResult.error);

        if (placeOrderResult.error) {
            // Cancel or refund the payment if necessary
            paymentHelpers.reversePaymentIfNecessary(order);

            res.json(placeOrderResult);

            // WGACA MODIFICATION - Additional Logging
            Logger.warn('rvw_integrations_core\\checkoutServicesHelper: placeOrderResult failed for the customer {0}', currentBasket.customerEmail);

            return next();
        }

        try {
            if (req.currentCustomer.addressBook) {
                // save all used shipping addresses to address book of the logged in customer
                var allAddresses = addressHelpers.gatherShippingAddresses(order);
                allAddresses.forEach(function (address) {
                    if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses) && address.lastName !== Resource.msg('field.store.lastname', 'instorePickup', null)) {
                        addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
                    }
                });
            }
        } catch (e) {
            Transaction.wrap(function () {
                order.addNote('Failed saving customer address: ', e.message);
            });
            dw.system.Logger.error('Failed saving customer address: {0} - {1}', e.message, e.stack);
        }

        try {
            if (order.getCustomerEmail()) {
                COHelpers.sendConfirmationEmail(order, req.locale.id);
            }
        } catch (e) {
            Transaction.wrap(function () {
                order.addNote('Failed sending order confirmation email: ', e.message);
            });
            dw.system.Logger.error('Failed sending order confirmation email: {0} - {1}', e.message, e.stack);
        }

        // Reset usingMultiShip after successful Order placement
        req.session.privacyCache.set('usingMultiShipping', false);

        res.json({
            error: false,
            orderID: order.orderNo,
            orderToken: order.orderToken,
            continueUrl: URLUtils.url('Order-Confirm').toString()
        });

        var viewData = module.exports.doForAllPaymentInstruments(order, module.exports.placeOrderSetViewData);
        res.setViewData(viewData);
    } catch (e) {
        if (order) {
            // Cancel or refund the payment if necessary
            paymentHelpers.reversePaymentIfNecessary(order);

            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        }
        dw.system.Logger.error('Internal error during place order: {0} - {1}', e.message, e.stack);
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null),
            fieldErrors: [],
            serverErrors: [Resource.msg('error.technical', 'checkout', null)]
        });
    }

    next();
}

module.exports = {
    submitPayment: submitPayment,
    submitPaymentSetViewData: submitPaymentSetViewData,
    doForAllPaymentInstruments: doForAllPaymentInstruments,
    placeOrderStartPoint: placeOrderStartPoint,
    placeOrderHandleMissingBasket: placeOrderHandleMissingBasket,
    placeOrderHandlePaymentResult: placeOrderHandlePaymentResult,
    placeOrderHandlePaymentResultReturnEarly: placeOrderHandlePaymentResultReturnEarly,
    placeOrderInterpretAuthResultsError: placeOrderInterpretAuthResultsError,
    forterFraudCheck: forterFraudCheck,
    placeOrderPreAuthFraudCheck: placeOrderPreAuthFraudCheck,
    placeOrderPostAuthFraudCheck: placeOrderPostAuthFraudCheck,
    adyenFraudCheck: adyenFraudCheck,
    saveSignifydHandlePaymentResult: saveSignifydHandlePaymentResult,
    placeOrderSetViewData: placeOrderSetViewData,
    placeOrder: placeOrder
}

// WGACA MODIFICATION - Expose as export property for reference by other scripts
module.exports.PROCESSOR = PROCESSOR;
