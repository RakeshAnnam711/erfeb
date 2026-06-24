'use strict';

var server = require('server');

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var recaptcha = require('*/cartridge/scripts/middleware/recaptcha');

server.get('Purchase', server.middleware.https, consentTracking.consent, function(req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var giftCertificateForm = server.forms.getForm('giftCertificate');

    giftCertificateForm.clear();

    if (req.currentCustomer.profile) {
        giftCertificateForm.purchase.from.value = req.currentCustomer.profile.firstName + ' ' + customer.profile.lastName;
    }

    var giftCertificateQuantityInfo = getMaxGiftCertificateQuantityLimit();

    res.render('giftCertificate/giftCertificatePurchase', {
        enabled: dw.system.Site.getCurrent().getCustomPreferenceValue('giftCertificateEnabled'),
        giftCertificateForm: giftCertificateForm,
        breadcrumbs: [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            }
        ],
        maximumGiftCertificateQuantity: giftCertificateQuantityInfo.LimitPerOrder,
        maximumGiftCertificateReached: giftCertificateQuantityInfo.MaximumReached
    });

    next();
})

server.post('AddToBasket', server.middleware.https, consentTracking.consent, function(req, res, next) {
    var Resource = require('dw/web/Resource');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var giftCertificateHelper = require('*/cartridge/scripts/helpers/giftCertificateHelper');

    var giftCertificateForm = server.forms.getForm('giftCertificate');
    var giftCertificateForm = giftCertificateHelper.validateGiftCertificateForm(giftCertificateForm);

    if (!dw.system.Site.getCurrent().getCustomPreferenceValue('giftCertificateEnabled')) {
        res.json({
            success: false,
            msg: Resource.msg('giftcertificate.disabled', 'checkout', null)
        });
        return next();
    }

    // stops if gift card Quantity limit has been reached specified amount
    var giftCertificateQuantityInfo = getMaxGiftCertificateQuantityLimit();
    if (giftCertificateQuantityInfo.MaximumReached) {
        res.json({
            success: false,
            msg: dw.util.StringUtils.format(Resource.msg('giftcertificate.max.quantity.error', 'checkout', null), giftCertificateQuantityInfo.LimitPerOrder)
        });

        return next();
    }

    if (!giftCertificateForm.valid) {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(giftCertificateForm)
        });
        return next();
    }

    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();

    var giftCertificateLineItem;

    var Transaction = require('dw/system/Transaction');
    Transaction.wrap(function() {
        // never allow gift certificates to purchase other gift certificates
        var paymentInstruments = currentBasket.getPaymentInstruments();
        var iterator = paymentInstruments.iterator();
        while (iterator.hasNext()) {
            var paymentInstrument = iterator.next();
            currentBasket.removePaymentInstrument(paymentInstrument);
        }

        giftCertificateLineItem = currentBasket.createGiftCertificateLineItem(giftCertificateForm.purchase.amount.value, giftCertificateForm.purchase.recipientEmail.value)
        giftCertificateLineItem.setRecipientName(giftCertificateForm.purchase.recipient.value);
        giftCertificateLineItem.setSenderName(giftCertificateForm.purchase.from.value);
        giftCertificateLineItem.setMessage(giftCertificateForm.purchase.message.value || "");
    });

    if (!giftCertificateLineItem) {
        res.json({
            success: false,
            msg: Resource.msg('giftcertificate.checkout.error.internal', 'checkout', null)
        })
        return next();
    }

    Transaction.wrap(function() {
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // save contact id to session
    var logger = require('dw/system/Logger');
    try {
        giftCertificateHelper.modifyContactIdFromSession(giftCertificateForm.purchase.recipient.htmlValue, giftCertificateForm.purchase.recipientEmail.htmlValue)
    } catch (ex) {
        var email = giftCertificateForm.purchase.recipientEmail.htmlValue;
        logger.error("Gift Card Add to Cart - unexpected exception occurred fetching contact id with email address '" + email + "'. Error: '" + ex + "'.");
    }

    giftCertificateForm.clear();
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems) + currentBasket.giftCertificateLineItems.length;
    res.json({
        success: true,
        msg: Resource.msg('giftcertificate.purchase.addtocart.success.msg', 'checkout', null),
        quantityTotal: quantityTotal,
        minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, quantityTotal)
    })

    next();
})

server.post('CheckBalance', server.middleware.https, consentTracking.consent, recaptcha.checkRecaptchaAjax, function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var formErrors = require('*/cartridge/scripts/formErrors');

    if (!dw.system.Site.getCurrent().getCustomPreferenceValue('giftCertificateEnabled')) {
        res.json({
            success: false,
            msg: Resource.msg('giftcertificate.disabled', 'checkout', null)
        });
        return next();
    }

    var giftCertificateForm = server.forms.getForm('giftCertificate');
    if (!giftCertificateForm.valid) {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(giftCertificateForm)
        });
        return next();
    }

    var giftCertificateMgr = require('dw/order/GiftCertificateMgr');
    var giftCertificate = giftCertificateMgr.getGiftCertificateByCode(giftCertificateForm.balance.giftcertificateid.value);
    if (!giftCertificate || !giftCertificate.balance.valueOrNull || !giftCertificate.enabled || giftCertificate.status === dw.order.GiftCertificate.STATUS_PENDING
        || giftCertificate.status === dw.order.GiftCertificate.STATUS_REDEEMED) {
        giftCertificateForm.balance.giftcertificateid.valid = false;
        giftCertificateForm.balance.giftcertificateid.error = Resource.msg('giftcertificate.balance.missing', 'checkout', null);
        res.json({
            success: false,
            fields: formErrors.getFormErrors(giftCertificateForm)
        });
        return next();
    }

    if (giftCertificate.balance.currencyCode !== req.session.currency.currencyCode) {
        giftCertificateForm.balance.giftcertificateid.valid = false;
        giftCertificateForm.balance.giftcertificateid.error = dw.util.StringUtils.format(Resource.msg('giftcertificate.balance.wrongcurrency', 'checkout', null), giftCertificate.balance.currencyCode, req.session.currency.currencyCode);
        res.json({
            success: false,
            fields: formErrors.getFormErrors(giftCertificateForm)
        });
        return next();
    }

    giftCertificateForm.clear();
    res.json({
        success: true,
        balance: dw.util.StringUtils.format(Resource.msgf('giftcertificate.purchase.balancealert', 'checkout', null), giftCertificate.giftCertificateCode, dw.util.StringUtils.formatMoney(giftCertificate.balance))
    });
    next();
});

server.post('ApplyBalance', server.middleware.https, consentTracking.consent, csrfProtection.validateAjaxRequest, recaptcha.checkRecaptchaAjax, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var giftCertificateMgr = require('dw/order/GiftCertificateMgr');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var checkoutHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');

    if (!dw.system.Site.getCurrent().getCustomPreferenceValue('giftCertificateEnabled')) {
        res.json({
            success: false,
            msg: Resource.msg('giftcertificate.disabled', 'checkout', null)
        });
        return next();
    }

    var giftCertificateForm = server.forms.getForm('giftCertificate');
    if (!giftCertificateForm.valid) {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(giftCertificateForm)
        });
        return next();
    }

    var giftCertificate = giftCertificateMgr.getGiftCertificateByCode(giftCertificateForm.apply.giftcertificateid.value);

    if (!giftCertificate) {
        giftCertificateForm.apply.giftcertificateid.valid = false;
        giftCertificateForm.apply.giftcertificateid.error = Resource.msg('giftcertificate.balance.giftcertificateid.missing-error', 'forms', null);
        res.json({
            success: false,
            fields: formErrors.getFormErrors(giftCertificateForm)
        });
        return next();
    }

    if (!giftCertificate.balance.valueOrNull
        || !giftCertificate.enabled
        || giftCertificate.status === dw.order.GiftCertificate.STATUS_PENDING
        || giftCertificate.status === dw.order.GiftCertificate.STATUS_REDEEMED) {
        giftCertificateForm.apply.giftcertificateid.valid = false;
        giftCertificateForm.apply.giftcertificateid.error = Resource.msg('giftcertificate.balance.missing', 'checkout', null);
        res.json({
            success: false,
            fields: formErrors.getFormErrors(giftCertificateForm)
        });
        return next();
    }

    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            success: false,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    if (currentBasket.giftCertificateLineItems.length) {
        giftCertificateForm.apply.giftcertificateid.valid = false;
        giftCertificateForm.apply.giftcertificateid.error = Resource.msg('giftcertificate.checkout.apply.noteligible', 'checkout', null);
        res.json({
            success: false,
            fields: formErrors.getFormErrors(giftCertificateForm)
        });
        return next();
    }

    if (giftCertificate.balance.currencyCode !== currentBasket.currencyCode) {
        giftCertificateForm.apply.giftcertificateid.valid = false;
        giftCertificateForm.apply.giftcertificateid.error = dw.util.StringUtils.format(Resource.msg('giftcertificate.balance.wrongcurrency', 'checkout', null), giftCertificate.balance.currencyCode, currentBasket.currencyCode);
        res.json({
            success: false,
            fields: formErrors.getFormErrors(giftCertificateForm)
        });
        return next();
    }

    var result = checkoutHelpers.applyGiftCertificateToBasket(giftCertificate, currentBasket);
    if (!result.success) {
        giftCertificateForm.apply.giftcertificateid.valid = false;
        giftCertificateForm.apply.giftcertificateid.error = result.msg;
        res.json({
            success: false,
            fields: formErrors.getFormErrors(giftCertificateForm)
        });
        return next();
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-calculate the payments.
    var calculatedPaymentTransaction = checkoutHelpers.calculatePaymentTransaction(currentBasket);

    if (calculatedPaymentTransaction.error) {
        giftCertificateForm.apply.giftcertificateid.valid = false;
        giftCertificateForm.apply.giftcertificateid.error = result.msg;
        res.json({
            success: false,
            fields: formErrors.getFormErrors(giftCertificateForm)
        });
        return next();
    }

    var orderModel = new OrderModel(
        currentBasket,
        {
            containerView: 'basket'
        }
    );
    giftCertificateForm.clear();
    res.json({
        success: true,
        order: orderModel,
        customer: new AccountModel(req.currentCustomer),
        msg: Resource.msg('giftcertificate.balance.successfullyapplied', 'checkout', null),
        template: renderTemplateHelper.getRenderedHtml({paymentinstruments: orderModel.billing.payment.selectedPaymentInstruments}, 'checkout/billing/giftCertificatePaymentInstruments')
    });
    next();
});

server.post('RemoveGiftCertificatePaymentInstrument', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var giftCertificateMgr = require('dw/order/GiftCertificateMgr');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var checkoutHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');

    if (!req.form.giftCertificateCode || !req.form.giftCertificateCode.length) {
        res.json({
            success: false,
            msg: Resource.msg('giftcertificate.checkout.remove.doesnotexist', 'checkout', null)
        });
        return next();
    }

    var currentBasket = BasketMgr.getCurrentBasket();
    var giftCertificate = giftCertificateMgr.getGiftCertificateByCode(req.form.giftCertificateCode);
    var removeResult = checkoutHelpers.removeGiftCertificatePaymentInstrument(giftCertificate, currentBasket);

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-calculate the payments.
    var calculatedPaymentTransaction = checkoutHelpers.calculatePaymentTransaction(currentBasket);

    if (calculatedPaymentTransaction.error) {
        res.json({
            success: false,
            msg: Resource.msg('giftcertificate.checkout.error.internal.remove', 'checkout', null)
        });
        return next();
    }

    if (removeResult.success) {
        var orderModel = new OrderModel(
            currentBasket,
            {
                containerView: 'basket'
            }
        );
        removeResult.customer = new AccountModel(req.currentCustomer),
        removeResult.order = orderModel;
        removeResult.msg = Resource.msg('giftcertificate.checkout.remove.success', 'checkout', null),
        removeResult.template = renderTemplateHelper.getRenderedHtml({paymentinstruments: orderModel.billing.payment.selectedPaymentInstruments}, 'checkout/billing/giftCertificatePaymentInstruments')
    }

    res.json(removeResult);
    next();
});

function getMaxGiftCertificateQuantityLimit() {
    var giftCertificateQuantityInfo = {
        LimitPerOrder: dw.system.Site.getCurrent().getCustomPreferenceValue('GiftCertificateQuantityLimitPerOrder'),
        MaximumReached: false
    }

    var currentBasket = dw.order.BasketMgr.getCurrentOrNewBasket();
    var currentGiftCertificatesInCart = currentBasket.getGiftCertificateLineItems().length;
    if (currentGiftCertificatesInCart >= giftCertificateQuantityInfo.LimitPerOrder) {
        giftCertificateQuantityInfo.MaximumReached = true;
    }

    return giftCertificateQuantityInfo;
}

module.exports = server.exports();
