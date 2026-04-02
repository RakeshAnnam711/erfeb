'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');

server.append('Begin', function (req, res, next) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    COHelpers.selectDefaultPaymentMethod(res);

    var viewData = res.getViewData();
    var currentBasket = BasketMgr.getCurrentBasket();

    if ((viewData.currentStage === 'placeOrder' || viewData.currentStage === 'payment') && (!empty(currentBasket.billingAddress) && (empty(currentBasket.billingAddress.phone) || empty(currentBasket.customerEmail)))) {
        var trueform = session.forms['billing'].contactInfoFields.phone;
        trueform.invalidateFormElement();
        var billingForm = server.forms.getForm('billing');
        viewData.forms.billingForm = billingForm;
        viewData.currentStage = 'payment';
    }

    if (viewData.currentStage !== 'customer' && empty(currentBasket.customerEmail)) {
        var invalidForm = session.forms['coCustomer'].email;
        invalidForm.invalidateFormElement();
        var customerForm = server.forms.getForm('coCustomer');
        viewData.forms.guestCustomerForm = customerForm;
        viewData.currentStage = 'customer';
    }

    if (viewData.order.hideShipping && (viewData.currentStage === 'shipping' || viewData.currentStage === 'undefined')) {
        if (viewData.customer.registeredUser) {
            viewData.currentStage = 'payment';
        } else {
            viewData.currentStage = 'customer';
        }
    }

    var giftCertificateForm = server.forms.getForm('giftCertificate');
    giftCertificateForm.clear();
    viewData.giftCertificateForm = giftCertificateForm;
    viewData.currencyCode = req.session.currency.currencyCode;

    // Change Credit Card Exp Years to be 11 years
    var currentYear = new Date().getFullYear();
    var creditCardExpirationYears = [];

    for (var j = 0; j < 11; j++) {
        creditCardExpirationYears.push(currentYear + j);
    }

    var URLUtils = require('dw/web/URLUtils');
    var canonicalUrl = URLUtils.abs('Checkout-Begin', 'stage', viewData.currentStage).toString();
    viewData.canonicalUrl = canonicalUrl;

    var Resource = require('dw/web/Resource');
    var customerServiceNumber = res.viewData.abConfigs.customerServiceNumber || Resource.msg('info.phone.number','common',null);
    viewData.customerServiceNumber = customerServiceNumber;

    viewData.expirationYears = creditCardExpirationYears;
    viewData.errormessagetext = req.querystring.errormessagetext || '';

    viewData.giftCertificatePaymentMethodEnabled = false;
    if (viewData.order && viewData.order.billing && viewData.order.billing.payment && viewData.order.billing.payment.applicablePaymentMethods) {
        for (var pm of viewData.order.billing.payment.applicablePaymentMethods) {
            if (pm.ID === dw.order.PaymentInstrument.METHOD_GIFT_CERTIFICATE) {
                viewData.giftCertificatePaymentMethodEnabled = true;
                break;
            }
        }
    }

    res.setViewData(viewData);

    next();
});

module.exports = server.exports();
