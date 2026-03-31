/* global session:false, empty:false */
'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');

/**
 * Handles the return from Flow Hosted Checkout
 * Recreates the Basket based on the Flow values
 * Creates the SFCC Order
 */
server.get('ConfirmHostedCheckout', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var CheckoutHelper = require('*/cartridge/scripts/flow/helpers/checkoutHelper');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var orderNo = req.querystring.oid;
    var url = URLUtils.https('Error-ErrorCode', 'err', '01');
    var order;

    if (FlowHelper.isFlowEnabled) {
        order = orderNo ? CheckoutHelper.createSFCCOrder(orderNo) : null;

        if (order) {
            COHelpers.sendConfirmationEmail(order, req.locale.id);
            url = URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken);
        }
    } else {
        url = URLUtils.url('Error-Forbidden');
    }

    res.redirect(url);
    next();
});

/**
 * Creates the client side check to update the experience on the Flow Session using flow.js
 */
server.get('FlowJS', server.middleware.include, server.middleware.https, function (req, res, next) {
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    res.render('/flow/flowjs', {
        sessionId: session.privacy.flowSessionId,
        storedSessionId: FlowHelper.sessionId
    });

    next();
});

/**
 * Creates the client side check to update the experience on the Flow Session using flow.js
 */
server.get('CheckExperienceJS', server.middleware.include, server.middleware.https, cache.applyPromotionSensitiveCache, function (req, res, next) {
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');
    var experienceJS = ExperienceHelper.getExperienceJSConfig();

    res.render('/flow/checkExperienceJS', experienceJS);
    next();
});

/**
 * Checks for the delivery window for the current experience and returns the json response
 */
server.get('GetDeliveryWindow', server.middleware.include, server.middleware.https, cache.applyShortPromotionSensitiveCache, function (req, res, next) {
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');
    var deliveryWindow = ExperienceHelper.getDeliveryWindow();

    res.render('/flow/deliveryWindow', {
        deliveryWindow: deliveryWindow
    });

    next();
});

/**
 * Renders the display payment methods icons for the current experience
 */
server.get('GetPaymentMethods', server.middleware.include, server.middleware.https, cache.applyPromotionSensitiveCache, function (req, res, next) {
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');
    var paymentMethods = ExperienceHelper.getPaymentMethods();

    res.render('/flow/paymentMethods', {
        paymentMethods: paymentMethods
    });

    next();
});

/**
 * Does a inventory check for the requested sku's and quantities
 */
server.post('InventoryCheck', server.middleware.post, server.middleware.https, function (req, res, next) {
    var CheckoutHelper = require('*/cartridge/scripts/flow/helpers/checkoutHelper');
    var result;

    if (req.body) {
        result = CheckoutHelper.inventoryCheck(req.body);
    }

    if (!result || !result.length) {
        res.setStatusCode(422);
        res.json({ error: 'Inventory check error' });
    } else {
        res.json({ items: result });
    }

    next();
});

/**
 * Returns the country picker options JSON, caches for 24 hours
 */
server.get('CountryPickerOptions', server.middleware.https, cache.applyDefaultCache, function (req, res, next) {
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var countryPickerOptions = hooksHelper('flow.config.countryPickerOptions', 'countryPickerOptions', null, function () {
        return require('*/cartridge/config/countryPickerOptions');
    });

    res.json({ options: countryPickerOptions });
    next();
});

/**
 * Returns the current version information
 */
server.get('GetVersion', server.middleware.https, cache.applyDefaultCache, function (req, res, next) {
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    res.json({ version: FlowHelper.version });
    next();
});

/**
 * Sets the current Flow experience on the SFCC session
 */
server.post('SetExperience', server.middleware.https, function (req, res, next) {
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');
    var key = req.querystring.experience;
    var experience = ExperienceHelper.getExperience(key, null, null);

    ExperienceHelper.setExperience(experience);

    res.json({ success: true });
    next();
});

module.exports = server.exports();
