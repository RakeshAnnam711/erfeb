'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents PayByLinkCreateOrderOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function PayByLinkCreateOrderOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
PayByLinkCreateOrderOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Triggers Error
 * @param {string} errorMessage - result object
 * @throws {Error}
 */
PayByLinkCreateOrderOperation.prototype.triggerError = function (errorMessage) {
    this.operationResult.success = false;
    this.operationResult.errorMessage = errorMessage;

    throw Error(this.operationResult.errorMessage);
};

/**
 * Creates Order on Behalf of a Customer
 * @throws {Error}
 */
PayByLinkCreateOrderOperation.prototype.run = function () {
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');

    var basket = this.operationData.basket;
    // check if basket exists
    if (!basket) {
        this.triggerError('Basket does not exist');
    }

    var payByLinkConfigurations = geConfigurationMgr.getPayByLinkConfig();

    if (!payByLinkConfigurations) {
        this.triggerError('The Pay By Link Configurations do not exist');
    }

    if (!payByLinkConfigurations.isEnabled()) {
        this.triggerError('The Pay By Link feature is not enabled');
    }

    // set the flag which identifies that order is created by Pay By Link scenario
    Transaction.wrap(function () {
        basket.custom[globaleHelpers.customAttr.basket.geIsOrderCreatedPayByLinkScenario] = true;
    });

    Transaction.begin();
    try {
        this.createOrder(basket);

        if (!this.order) {
            this.triggerError('Impossible to create the order');
        }

        this.placeOrder(this.order);

        this.operationResult.success = true;
        this.operationResult.orderID = this.order.orderNo;
        this.operationResult.orderToken = this.order.orderToken;

        this.operationResult.gePayByLinkUrl = URLUtils.https('GlobalePayByLink-CheckoutShow', 'cartToken', this.operationData.geCartToken).toString();

        Transaction.commit();
    } catch (e) {
        Transaction.rollback();
        this.operationResult.success = false;
        this.triggerError('Impossible to generate a payment link: ' + e.message + '; ' + e.stack);
    }
};

module.exports = PayByLinkCreateOrderOperation;
