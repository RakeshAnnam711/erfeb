/* global customer:false */
'use strict';

var page = module.superModule;
var server = require('server');

server.extend(page);

/**
 * Redirect customer to Flow Hosted Checkout if they have an active experience
 */
server.prepend('Begin', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var CheckoutHelper = require('*/cartridge/scripts/flow/helpers/checkoutHelper');
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var experience = ExperienceHelper.getCurrentExperience();
    var flowUrl;

    // Use this hook to change the default behaviour
    var doHostedCheckout = hooksHelper('flow.checkout.doHostedCheckout', 'doHostedCheckout', experience, function (flowExperience) {
        var PaymentMgr = require('dw/order/PaymentMgr');
        var BasketHelper = require('*/cartridge/scripts/flow/helpers/basketHelper');

        var paymentMethod = PaymentMgr.getPaymentMethod('FLOW_HOSTED_CHECKOUT');
        var basket = BasketHelper.getBasket();

        return flowExperience && FlowHelper.isFlowEnabled && paymentMethod.isApplicable(customer,
            ExperienceHelper.convertCountryCode(flowExperience.defaultCountry),
            basket.getTotalGrossPrice().value);
    });

    if (doHostedCheckout) {
        // Creates the Flow Order and sets the identifier to the Basket UUID. Returns the Hosted Checkout Url.
        flowUrl = CheckoutHelper.prepareHostedCheckout(experience.id);

        if (flowUrl) {
            res.redirect(flowUrl);
        } else {
            FlowHelper.logger.error('Checkout.js - Error generating Hosted Checkout URL');
            res.redirect(URLUtils.https('Error-ErrorCode', 'err', '01'));
        }
    }

    next();
});

module.exports = server.exports();
