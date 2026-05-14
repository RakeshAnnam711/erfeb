'use strict';

const base = module.superModule;

/**
 * Creates basket for order creation
 * @param {string} orderNo - SFCC order sequence number
 * @returns {Basket} - SFCC Basket
 */
base.handleCallback = function(orderNo) {
    var StringUtils = require('dw/util/StringUtils');
    var Transaction = require('dw/system/Transaction');
    var flowApi = require('*/cartridge/scripts/flow/api/api');
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    var flowOrder = flowApi.order.getOrder(orderNo);
    var experience;
    var basket;

    if (!flowOrder || !flowOrder.submitted_at) {
        // Flow Order was not retreived via the Flow API
        FlowHelper.logger.error(StringUtils.format('CheckoutHelper.js - Flow Order with identifier {0} not found.', orderNo));
        return null;
    }

    experience = ExperienceHelper.getExperience(flowOrder.experience.key, null, null);

    if (ExperienceHelper.useBaseCurrency(experience)) {
        ExperienceHelper.setExperience();
    } else {
        ExperienceHelper.setExperience(experience);
    }

    basket = base.assembleBasket(flowOrder);

    Transaction.wrap(function () {
        basket.custom.flowOrderNo = orderNo;
    });

    return basket;
}

module.exports = base;
