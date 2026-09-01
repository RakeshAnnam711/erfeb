/* eslint-disable no-shadow */

'use strict';

const server = require('server');

const Transaction = require('dw/system/Transaction');
const BasketMgr = require('dw/order/BasketMgr');
const Resource = require('dw/web/Resource');
const ShippingMgr = require('dw/order/ShippingMgr');

const middleware = require('*/cartridge/scripts/paypal/middleware');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
const paypalApi = require('*/cartridge/scripts/paypal/api');
const utils = require('*/cartridge/scripts/paypal/utils');
const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');
const addressHelper = require('*/cartridge/scripts/paypal/helpers/addressHelper');
const prefs = require('*/cartridge/config/preferences');
const paypalConstants = require('*/cartridge/config/constants');
const shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');
const customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');

/**
 * Takes the shipping address from the PayPal, validates it, and return list of the applicable basket shipping methods
 */
/**
 * Paypal-ShippingCallback: The Paypal-ShippingCallback endpoint will process shipping address from the PayPal
 * @name Paypal-ShippingCallback
 * @function
 * @memberof Paypal
 * @param {middleware} - server.middleware.https
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post(
    'ShippingCallback',
    server.middleware.https,
    function(req, res, next) {
        const data = utils.tryParseJSON(req.body);

        const ShippingCallbackModel = require('~/cartridge/models/shippingCallback');

        const shippingCallbackInstance = new ShippingCallbackModel(data, req.querystring);

        delete res.viewData.action;
        delete res.viewData.locale;
        delete res.viewData.queryString;

        if (shippingCallbackInstance.addressValidationResult.error) {
            res.setStatusCode(422);
            res.json(shippingCallbackInstance.formatDeclineResponse());

            return next();
        }

        shippingCallbackInstance.updateBasketShippingAddress();
        shippingCallbackInstance.updateBasketShippingMethod();
        shippingCallbackInstance.setShippingOptions();

        res.json(shippingCallbackInstance.createResponseObject());

        return next();
    });

server.get(
    'GetPaypalOrderId',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    middleware.validateAmount,
    function(req, res, next) {
        const currentBasket = BasketMgr.currentOrNewBasket;
        const isExpressCheckout = utils.tryParseJSON(req.querystring.isExpressCheckout);

        let paymentSourceData;

        if (req.querystring.paymentSourceData) {
            paymentSourceData = utils.tryParseJSON(req.querystring.paymentSourceData);
        }

        const isBillingAddressDigitalGoods = Boolean(paymentSourceData && paymentSourceData.billingAddressDigitalGoods);
        const hasNoBillingAddress = !(currentBasket.billingAddress && currentBasket.billingAddress.address1);

        if (hasNoBillingAddress && isBillingAddressDigitalGoods && prefs.isDigitalGoodsFlowEnabled) {
            addressHelper.updateOrderBillingAddress(currentBasket, paymentSourceData.billingAddressDigitalGoods);
            addressHelper.setCustomerEmailToBasket(paymentSourceData.billingAddressDigitalGoods.email_address, currentBasket);
        }

        const purchaseUnit = paypalHelper.getPurchaseUnit(currentBasket, isExpressCheckout, paymentSourceData);

        const result = paypalApi.createOrder({
            purchaseUnit: purchaseUnit,
            lineItemCtnr: currentBasket,
            isExpressCheckout: isExpressCheckout
        }, paymentSourceData);

        if (result.err) {
            utils.createErrorLog(result.err);
            res.setStatusCode(500);
            res.json({
                error: true
            });

            return next();
        }

        const OrderDataHash = require('*/cartridge/models/orderDataHash');
        const orderDataHashInstance = new OrderDataHash();

        orderDataHashInstance.set(purchaseUnit);

        session.privacy.paypalOrderID = result.resp.id;

        res.json({ id: result.resp.id });

        return next();
    }
);

server.get(
    'OrderBillingAddress',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const AddressModel = require('*/cartridge/models/address');

        const currentBasket = BasketMgr.currentBasket;

        addressHelper.updateOrderBillingAddressForDigitalGoodsFlow(currentBasket);

        res.json({
            order: {
                orderEmail: currentBasket.customerEmail,
                billing: {
                    billingAddress: new AddressModel(currentBasket.billingAddress)
                }
            }
        });

        next();
    }
);

server.get(
    'GetBasketData',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const paymentHelper = require('*/cartridge/scripts/paypal/helpers/paymentHelper');
        const basket = BasketMgr.currentOrNewBasket;

        res.json({
            amount: paymentHelper.getAmountPaid(basket).getValue(),
            subtotal: basket.merchandizeTotalPrice.value,
            shipping: basket.shippingTotalPrice.value,
            tax: basket.totalTax.value,
            currencyCode: basket.currencyCode
        });

        next();
    }
);

/**
 * Handles streamlined checkout and redirects buyer directly to the order review or confirm stage.
 * In case if isStreamlinedCheckout preference is enabled buyer will be directly redirected to the Order confirm page
 * Received pages: Cart, Mini Cart, PDP, PVP. Billing page - only in case if isStreamlinedCheckout preference is enabled
 */
/**
 * Paypal-StreamlinedCheckout : The Paypal-StreamlinedCheckout endpoint will process payment, shipping, contact information
 * and buyer will be redirected directly to the order review or confirm stage
 * @name Paypal-StreamlinedCheckout
 * @function
 * @memberof Paypal
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {middleware} - csrfProtection.removeNonPaypalPayment
 * @param {middleware} - csrfProtection.validateProcessor
 * @param {middleware} - csrfProtection.validateHandleHook
 * @param {middleware} - csrfProtection.validateGiftCertificateAmount
 * @param {middleware} - csrfProtection.validateAmount
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post(
    'StreamlinedCheckout',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    middleware.removeNonPaypalPayment,
    middleware.validateProcessor,
    middleware.validateHandleHook,
    middleware.validateGiftCertificateAmount,
    middleware.validateAmount,
    function(req, res, next) {
        const HookMgr = require('dw/system/HookMgr');
        const PaymentMgr = require('dw/order/PaymentMgr');

        const currentBasket = BasketMgr.currentOrNewBasket;
        const paymentForm = server.forms.getForm('billing');
        const processorId = PaymentMgr.getPaymentMethod(paypalConstants.PAYMENT_METHOD_ID_PAYPAL).getPaymentProcessor().ID.toLowerCase();

        let paymentFormResult;

        if (HookMgr.hasHook('app.payment.form.processor.' + processorId)) {
            paymentFormResult = HookMgr.callHook('app.payment.form.processor.' + processorId,
                'processForm',
                req,
                paymentForm,
                {});
        } else {
            paymentFormResult = HookMgr.callHook('app.payment.form.processor.default_form_processor', 'processForm');
        }

        if (!paymentFormResult || paymentFormResult.error) {
            res.setStatusCode(500);
            res.print(utils.createErrorMsg());

            return next();
        }

        const processorHandle = HookMgr.callHook('app.payment.processor.' + processorId,
            'Handle',
            currentBasket,
            paymentFormResult.viewData.paymentInformation,
            {});

        if (!processorHandle || !processorHandle.success) {
            res.setStatusCode(processorHandle.statusCode || 500);
            res.print(processorHandle.serverErrors || utils.createErrorMsg(processorHandle.errorName));

            return next();
        }

        try {
            if (!prefs.isDigitalGoodsFlowEnabled) {
                const shippingAddress = processorHandle.shippingAddress;

                addressHelper.updateShippingAddress(currentBasket, shippingAddress, processorHandle.paymentInstrument);
                addressHelper.setCustomerEmailToBasket(processorHandle.shippingAddress.email_address, currentBasket);
            }

            res.json();
        } catch (error) {
            utils.createErrorLog(error);

            const paypalUrls = require('~/cartridge/config/urls');

            Transaction.wrap(function() {
                utils.addFlashMessagesCustomAttribute(currentBasket, error.message, 'danger');
            });

            res.json({
                error: true,
                redirectURL: paypalUrls.chooseShippingUrl
            });
        }

        return next();
    });

server.use(
    'DeletePaypalAccount',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const wallet = customer.profile.wallet;

        const paypalEmail = req.querystring.paypalEmail;

        if (BasketMgr.currentBasket) {
            paymentInstrumentHelper.removePayPalPaymentInstrumentByEmail(BasketMgr.currentBasket, paypalEmail);
        }

        const paymentInstruments = wallet.getPaymentInstruments(paypalConstants.PAYMENT_METHOD_ID_PAYPAL).toArray();

        const paymentInstrument = paymentInstruments.find(function(pi) {
            return paypalHelper.getCustomAttributePaypalEmail(pi) === paypalEmail;
        });

        const response = paypalApi.deletePaymentToken(paymentInstrument.creditCardToken);

        if (response && response.err) {
            res.json({
                error: true,
                message: response.err
            });

            return next();
        }

        if (paymentInstrument) {
            Transaction.wrap(function() {
                customerHelper.deletePayPalSavedCardsPaymentToken(customer.profile.custom, paymentInstrument.creditCardToken);

                wallet.removePaymentInstrument(paymentInstrument);
            });
        }

        res.json({
            error: false,
            alertMessage: Resource.msg('paypal.notification.removed', 'account', null)
        });

        return next();
    }
);

server.post(
    'FinishLPM',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    middleware.parseBody,
    function(_, res, next) {
        const OrderMgr = require('dw/order/OrderMgr');
        const Order = require('dw/order/Order');
        const Status = require('dw/system/Status');
        const URLUtils = require('dw/web/URLUtils');
        const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

        const { pmName } = res.parsedBody;
        const { currentBasket } = BasketMgr;

        paymentInstrumentHelper.removeNonPayPalPaymentInstrument(currentBasket);

        const lpmsList = prefs.enabledLPMs;

        const paymentInstrument = paymentInstrumentHelper.createPaymentInstrument(
            currentBasket, pmName);

        Transaction.wrap(function() {
            paymentInstrument.custom.paypalOrderID = session.privacy.paypalOrderID;

            paymentInstrument.custom.paymentId = pmName;
        });

        const createTransactionResponse = paypalApi.createTransaction(paymentInstrument).response;
        const transactionId = paypalHelper.getTransactionId(createTransactionResponse);
        const paymentTransaction = paymentInstrument.paymentTransaction;
        const paymentSource = createTransactionResponse.payment_source;
        const paymentSourceName = Object.keys(paymentSource)[0];

        // Fills data to the payment instrument, payment transaction from transaction response
        Transaction.wrap(function() {
            paymentInstrument.custom.paypalLpmAccountHolderName = lpmsList.indexOf(paymentSourceName) !== -1
                ? paymentSource[paymentSourceName].name : null;
            paymentInstrument.getPaymentTransaction().setTransactionID(transactionId);
            paymentInstrument.custom.paypalPaymentStatus = paypalHelper.getTransactionStatus(createTransactionResponse);
            paymentInstrument.custom.paypalRequest = JSON.stringify({});
            paymentInstrument.custom.paypalResponse = JSON.stringify(createTransactionResponse);

            paymentTransaction.custom.paypalTransactionHistory = paypalHelper.prepareTransactionHistory(paymentTransaction,
                createTransactionResponse);
        });

        // Creates a new order.
        const order = COHelpers.createOrder(currentBasket);

        if (!order) {
            res.setStatusCode(500);
            res.print(utils.createErrorMsg());

            return next();
        }

        // Places the order.
        try {
            Transaction.wrap(function() {
                const placeOrderStatus = OrderMgr.placeOrder(order);

                if (placeOrderStatus.status === Status.ERROR) {
                    throw new Error();
                }

                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                order.setExportStatus(Order.EXPORT_STATUS_READY);
                order.custom.paypalPaymentMethod = paypalConstants.PAYPAL_ORDER_INDICATOR;
                order.custom.PP_API_TransactionID = transactionId;
            });
        } catch (e) {
            Transaction.wrap(function() {
                OrderMgr.failOrder(order, true);
            });
            utils.createErrorLog(e);
            res.setStatusCode(500);
            res.print(e.message);

            return next();
        }

        res.json({
            redirectUrl: URLUtils.https('Order-Confirm', 'orderID', order.orderNo, 'orderToken', order.orderToken).toString()
        });

        return next();
    });

server.post(
    'WebHooks',
    server.middleware.https,
    function(req, res, next) {
        const WhBase = require('*/cartridge/models/whBase');
        const whHelper = require('*/cartridge/scripts/paypal/helpers/whHelper');
        const responseObject = {};

        try {
            const whEvent = JSON.parse(req.body);
            const eventType = whEvent.event_type;
            const eventResource = whEvent.resource;

            const whBase = new WhBase();

            // Check if endpoint received an appropriate event
            const isAppropriateEventType = whHelper.isAppropriateEventType(eventType);

            // Proceeds only with the appropriate event type
            if (!isAppropriateEventType) {
                return undefined;
            }

            // Verify webhook event notifications
            const verifiedResponse = whBase.verifyWhSignature(whEvent,
                req.httpHeaders,
                prefs.webHookId);

            const verificationStatus = verifiedResponse.verification_status;

            if (verificationStatus === paypalConstants.STATUS_SUCCESS) {
                // Handles different WebHook scenarios in depends of received webHook event
                switch (eventType) {
                    case paypalConstants.PAYMENT_AUTHORIZATION_VOIDED:
                    case paypalConstants.PAYMENT_CAPTURE_COMPLETED:
                    case paypalConstants.PAYMENT_CAPTURE_REFUNDED:
                        whHelper.updatePaymentOnDwSide(eventType, eventResource);

                        break;
                    case paypalConstants.VAULT_PAYMENT_TOKEN_DELETED:
                        whHelper.removePaymentMethodOnDwSide(eventResource);

                        break;
                    case paypalConstants.CUSTOMER_DISPUTE_CREATED:
                    case paypalConstants.CUSTOMER_DISPUTE_UPDATED:
                    case paypalConstants.CUSTOMER_DISPUTE_RESOLVED:
                        whHelper.disputeFlow(eventType, eventResource);

                        break;
                    default:
                        break;
                }
            } else {
                whBase.throwVerificationError(verificationStatus);
            }
        } catch (err) {
            responseObject.error = err;
            responseObject.success = false;

            res.json(responseObject);

            utils.createErrorLog(err);

            return next();
        }

        responseObject.success = true;
        res.json(responseObject);

        return next();
    }
);

server.post(
    'CreateSetupTokenForPaypal',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const paypalUrls = require('*/cartridge/config/urls');

        const preparedForm = {
            permit_multiple_payment_tokens: true,
            usage_type: 'MERCHANT',
            customer_type: 'CONSUMER',
            experience_context: {
                brand_name: prefs.merchantName,
                return_url: paypalUrls.renderAccountsUrl,
                cancel_url: paypalUrls.renderAccountsUrl,
                shipping_preference: 'GET_FROM_FILE',
                locale: 'en-US',
                vault_instruction: 'ON_CREATE_PAYMENT_TOKENS'
            }
        };

        const body = {
            payment_source: {
                paypal: preparedForm
            }
        };

        const setupTokenResponse = paypalApi.createSetupToken(body);

        if (setupTokenResponse.err) {
            res.json({
                error: true,
                message: setupTokenResponse.err
            });

            res.setStatusCode(400);

            return next();
        }

        session.privacy.setupTokenId = setupTokenResponse.id;
        session.privacy.setupTokenCustomerId = setupTokenResponse.customer.id;

        res.json({
            error: false,
            setupToken: setupTokenResponse.id
        });

        return next();
    }
);

server.post(
    'AccountAddPaypalHandler',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const customerSavedPaypalAccounts = customerHelper.getCustomerPaymentInstruments(paypalConstants.PAYMENT_METHOD_ID_PAYPAL);
        const isSaveLimitReached = prefs.paypalAccountVaultLimit !== paypalConstants.SAVE_LIMIT_UNLIMITED
            && prefs.paypalAccountVaultLimit <= customerSavedPaypalAccounts.length;

        if (isSaveLimitReached) {
            const paypalAccountLimitMessage = Resource.msg('paypal.accountslist.vaultlimitreached', 'locale', null);

            res.json({
                error: true,
                message: paypalAccountLimitMessage
            });

            res.setStatusCode(400);

            return next();
        }

        const paymentTokenResponse = paypalApi.createPaymentToken(
            session.privacy.setupTokenId,
            paypalConstants.SETUP_TOKEN_TYPE,
            session.privacy.setupTokenCustomerId
        );

        if (paymentTokenResponse.err) {
            res.json({
                error: true,
                message: paymentTokenResponse.err
            });

            res.setStatusCode(400);

            return next();
        }

        const result = paypalHelper.savePaypalToCustomerWallet(paymentTokenResponse);

        if (result.error) {
            res.json({
                error: true,
                message: result.msg,
                renderAccountsUrl: require('*/cartridge/config/urls').renderAccountsUrl
            });

            return next();
        }

        if (req.httpParameterMap.isAPMA.booleanValue) {
            const CustomerModel = require('*/cartridge/models/customer');
            const customerInstance = new CustomerModel(customer);

            Transaction.wrap(function() {
                customerInstance.addFlashMessage(
                    Resource.msg('paypal.account.paymentmethodadded.notification.msg', 'locale', null),
                    CustomerModel.FLASH_MESSAGE_SUCCESS
                );
            });
        }

        delete session.privacy.setupTokenId;
        delete session.privacy.setupTokenCustomerId;

        res.json({
            error: false,
            renderPayPalAccountsUrl: require('*/cartridge/config/urls').renderPayPalAccountsUrl
        });

        return next();
    }
);

server.get(
    'GetApplicableShippingOptions',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const basicHelpers = require('*/cartridge/scripts/util/basicHelpers');
        const currentBasket = BasketMgr.getCurrentBasket();

        let shipment;

        if (currentBasket) {
            shipment = currentBasket.defaultShipment;

            // Saving initial shipping method to set it, if user canceled AP/PP pop-up
            session.privacy.initialShippingMethodID = shipment.getShippingMethodID();
        }

        const paymentMethodId = req.querystring.paymentMethodId;

        const address = {
            city: decodeURIComponent(req.querystring.city),
            stateCode: req.querystring.stateCode,
            countryCode: req.querystring.countryCode,
            postalCode: req.querystring.postalCode
        };

        if (paymentMethodId === paypalConstants.PAYMENT_METHOD_ID_APPLE_PAY) {
            const applePayAddressValidation = require('*/cartridge/scripts/paypal/helpers/applePayAddressValidation');
            const validationResult = applePayAddressValidation.validateShippingAddress(address);

            if (validationResult.error) {
                res.json({
                    error: validationResult.error,
                    errors: validationResult.errors
                });

                return next();
            }
        }

        let applicableShippingMethods = shippingHelpers.getApplicableShippingMethods(shipment, address);

        const formattedShippingOptions = basicHelpers.getFormattedShippingOptions(paymentMethodId, applicableShippingMethods);

        applicableShippingMethods = formattedShippingOptions.shippingOptions;

        res.json({
            applicableShippingMethods: applicableShippingMethods,
            defaultShippingOptionId: formattedShippingOptions.defaultShippingOptionId
        });

        return next();
    }
);

server.post(
    'GetAmountForShippingOption',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const basket = BasketMgr.getCurrentBasket();
        const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        const shippingOptionID = req.body;
        const shipment = basket.defaultShipment;
        const allShippingMethods = ShippingMgr.getAllShippingMethods().toArray();
        const shippingOption = allShippingMethods.find(function(shippingMethod) {
            return shippingMethod.ID === shippingOptionID;
        });

        Transaction.wrap(function() {
            shipment.setShippingMethod(shippingOption);
            basketCalculationHelpers.calculateTotals(basket);
        });

        res.json({
            amount: basket.getTotalGrossPrice().value.toString(),
            totalTax: basket.totalTax.value.toString(),
            currencyCode: basket.currencyCode
        });

        next();
    }
);

/**
 * Sets the initial shipping option for the current basket.
 * This method retrieves all available shipping methods and assigns the one stored in session privacy.
 * It then recalculates the basket totals after setting the shipping method.
 *
 * @name Paypal-SetInitialShippingOption
 * @function
 * @memberof Paypal
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the chain.
 */
server.post(
    'SetInitialShippingOption',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

        const currentBasket = BasketMgr.getCurrentBasket();
        const allShippingMethods = ShippingMgr.getAllShippingMethods().toArray();

        const initialShippingMethod = allShippingMethods.find(function(method) {
            return method.ID === session.privacy.initialShippingMethodID;
        });

        if (currentBasket && initialShippingMethod) {
            Transaction.wrap(function() {
                currentBasket.defaultShipment.setShippingMethod(initialShippingMethod);
                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        }

        res.json({});

        next();
    }
);

server.get(
    'RenderAccountsList',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        res.render('account/paypal/paypalAccountsLoop', {
            paypal: {
                getPaypalEmail: paypalHelper.getCustomAttributePaypalEmail,
                savedPpAccounts: customerHelper.getCustomerPaymentInstruments(paypalConstants.PAYMENT_METHOD_ID_PAYPAL)
            }
        });

        next();
    }
);

module.exports = server.exports();
