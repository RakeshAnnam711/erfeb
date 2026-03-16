'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Logger = require('dw/system/Logger');

/**
 * Places an order for the current basket.
 * @param {Object} req - The request object for the current controller request
 * @param {Object} res - The response object for the current controller request
 * @param {Function} next - Executes the next step in the controller chain
 * @return {Object} The result of executing the next step in the controller chain
 */
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

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

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

    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Validating order status for customer "+currentBasket.customerEmail+" :");
    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Validating order status error for customer "+currentBasket.customerEmail+" : "+validationOrderStatus.error+"");
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Validating order status error for customer "+currentBasket.customerEmail+" : "+validationOrderStatus.message+"");
        return next();
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
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

    // Re-calculate the payments.
    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Calculating Payment transactional total for customer "+currentBasket.customerEmail+" :");
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Calculated Payment transactional total error for customer "+currentBasket.customerEmail+" : "+calculatedPaymentTransactionTotal.error+"");
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // Creates a new order.
    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Order creation started for customer "+currentBasket.customerEmail+" :");
    var order = COHelpers.createOrder(currentBasket);
    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Order creation completed for customer "+currentBasket.customerEmail+" :");
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Order creation failed for customer "+currentBasket.customerEmail+" :");
        return next();
    }

    // Handles payment authorization
    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Handles payment authorization started for customer "+currentBasket.customerEmail+" :");
    var handlePaymentResult = COHelpers.handleCommercePayments(order, order.orderNo);
    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Handles payment authorization completed for customer "+currentBasket.customerEmail+" :");
    if (handlePaymentResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Handles payment authorization completed for customer "+currentBasket.customerEmail+" : "+handlePaymentResult.error+"");
        return next();
    }

    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Fraud Detection started for customer "+currentBasket.customerEmail+" :");
    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Fraud Detection Completed for customer "+currentBasket.customerEmail+" : "+fraudDetectionStatus.status+"");
    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);

        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Fraud Detection failed for customer "+currentBasket.customerEmail+" :");
        return next();
    }

    // Places the order
    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Place Order Started for customer "+currentBasket.customerEmail+" :");
    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Place Order Completed for customer "+currentBasket.customerEmail+" :"+placeOrderResult.error+"");
    if (placeOrderResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: Place Order Failed for customer "+currentBasket.customerEmail+" :");
        return next();
    }

    if (req.currentCustomer.addressBook) {
        // save all used shipping addresses to address book of the logged in customer
        var allAddresses = addressHelpers.gatherShippingAddresses(order);
        allAddresses.forEach(function (address) {
            if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
            }
        });
    }
    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: send order confirmation email started for customer "+currentBasket.customerEmail+" :");
    if (order.getCustomerEmail()) {
        COHelpers.sendConfirmationEmail(order, req.locale.id);
    }

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);

    // TODO: Exposing a direct route to an Order, without at least encoding the orderID
    //  is a serious PII violation.  It enables looking up every customers orders, one at a
    //  time.
    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });

    return next();
}

/**
 * Get current cart if there is one
 */
server.get(
    'GetCart',
    server.middleware.https,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Resource = require('dw/web/Resource');
        var CartModel = require('*/cartridge/models/cart');
        var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            // No basket, can't create cart model
            res.json({
                cart: {
                    numItems: 0
                }
            });
            return next();
        }

        var cartModel = new CartModel(currentBasket);
        var reportingURL = cartHelper.getReportingUrlAddToCart(currentBasket, null);
        var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
        var pliUUID = cartModel.items && cartModel.items[0] ? cartModel.items[0].UUID : null;

        res.json({
            reportingURL: reportingURL,
            quantityTotal: quantityTotal,
            message: Resource.msg('text.alert.addedtobasket', 'product', null),
            cart: cartModel,
            newBonusDiscountLineItem: {},
            pliUUID: pliUUID,
            minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, quantityTotal)
        });
        return next();
    }
);

/**
 *  Handle Ajax billing form submission
 */
server.post(
    'SubmitBilling',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');
        var Locale = require('dw/util/Locale');
        var OrderModel = require('*/cartridge/models/order');

        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

        var viewData = {};
        var paymentForm = server.forms.getForm('billing');

        // verify billing form data
        var billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);
        var contactInfoFormErrors = COHelpers.validateFields(paymentForm.contactInfoFields);

        var formFieldErrors = [];
        if (Object.keys(billingFormErrors).length) {
            formFieldErrors.push(billingFormErrors);
        } else {
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
        }

        if (Object.keys(contactInfoFormErrors).length) {
            formFieldErrors.push(contactInfoFormErrors);
        } else {
            viewData.phone = { value: paymentForm.contactInfoFields.phone.value };
        }

        if (formFieldErrors.length) {
            // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: formFieldErrors,
                serverErrors: [],
                error: true
            });
            return next();
        }

        var currentBasket = BasketMgr.getCurrentBasket();

        var billingData = viewData;

        if (!currentBasket) {
            delete billingData.paymentInformation;

            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }

        var billingAddress = currentBasket.billingAddress;

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

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
            req.session.privacyCache.set('usingMultiShipping', false);
            usingMultiShipping = false;
        }

        var currentLocale = Locale.getLocale(req.locale.id);
        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );
        var billingDetails = COHelpers.getBillingDetails(currentBasket);

        delete billingData.paymentInformation;

        res.json({
            order: basketModel,
            billingDetails: billingDetails,
            error: false
        });

        return next();
    }
);

/**
 *  Handle Ajax payment form submit
 */
server.post(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var HookMgr = require('dw/system/HookMgr');
        var Transaction = require('dw/system/Transaction');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');

        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

        var viewData = {};
        var paymentForm = server.forms.getForm('billing');

        var formFieldErrors = [];
        var paymentFormResult;
        if (HookMgr.hasHook('app.payment.form.processor.salesforce_payments')) {
            paymentFormResult = HookMgr.callHook('app.payment.form.processor.salesforce_payments',
                'processForm',
                req,
                paymentForm,
                viewData
            );
        } else {
            paymentFormResult = HookMgr.callHook('app.payment.form.processor.default_form_processor', 'processForm');
        }

        if (paymentFormResult.error && paymentFormResult.fieldErrors) {
            formFieldErrors.push(paymentFormResult.fieldErrors);
        }

        if (formFieldErrors.length || paymentFormResult.serverErrors) {
            // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: formFieldErrors,
                serverErrors: paymentFormResult.serverErrors ? paymentFormResult.serverErrors : [],
                error: true
            });
            return next();
        }

        var currentBasket = BasketMgr.getCurrentBasket();

        var billingData = paymentFormResult.viewData;

        if (!currentBasket) {
            delete billingData.paymentInformation;

            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
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
            return next();
        }

        var billingForm = server.forms.getForm('billing');
        var result;

        if (HookMgr.hasHook('app.payment.processor.salesforce_payments')) {
            result = HookMgr.callHook('app.payment.processor.salesforce_payments',
                'Handle',
                currentBasket,
                billingData.paymentInformation
            );
        } else {
            result = HookMgr.callHook('app.payment.processor.default', 'Handle');
        }

        if (result.error) {
            delete billingData.paymentInformation;

            res.json({
                form: billingForm,
                fieldErrors: result.fieldErrors,
                serverErrors: result.serverErrors,
                error: true
            });
            return next();
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
            return next();
        }

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
            req.session.privacyCache.set('usingMultiShipping', false);
            usingMultiShipping = false;
        }

        hooksHelper('app.customer.subscription', 'subscribeTo', [paymentForm.subscribe.checked, currentBasket.customerEmail], function () {});

        delete billingData.paymentInformation;

        Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: SubmitPayment - PlaceOrder call for customer "+currentBasket.customerEmail+"");
        return placeOrder(req, res, next);
    }
);

server.post('PlaceOrder', server.middleware.https, function (req, res, next) {
    Logger.warn("plugin_commercepayments\CommercePaymentsCheckoutServices: PlaceOrder - PlaceOrder call");
    return placeOrder(req, res, next);
});

module.exports = server.exports();
