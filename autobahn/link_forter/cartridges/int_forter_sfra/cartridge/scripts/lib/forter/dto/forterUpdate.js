'use strict';
/**
 * ForterUpdate class is the DTO object for request.
 *
 * To include this script use:
 * var ForterUpdate = require('~/cartridge/scripts/lib/forter/dto/forterUpdate');
 */
var Transaction = require('dw/system/Transaction');

function ForterUpdate(order) {
    this.orderId = order.orderNo;
    this.eventTime = new Date().getTime();

    Transaction.wrap(function () {
        order.custom.forterRemoteStatusRequest = order.status.value; // eslint-disable-line
    });

    this.updatedStatus = order.custom.forterRemoteStatusRequest.displayValue;
    this.updatedMerchantStatus = order.status.displayValue;
    this.updatedTotalAmount = {};
    this.updatedTotalAmount.currency = order.totalGrossPrice.currencyCode;
    this.updatedTotalAmount.amountLocalCurrency = order.totalGrossPrice.value.toFixed(2);
}

module.exports = ForterUpdate;
