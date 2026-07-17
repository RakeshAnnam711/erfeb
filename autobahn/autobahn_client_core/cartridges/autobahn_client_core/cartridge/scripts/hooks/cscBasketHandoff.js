'use strict';

var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var agentBasketLineItemLocks = require('*/cartridge/scripts/helpers/agentBasketLineItemLocks');

function lockHandoffBasket(basket) {
    if (!basket) {
        return new Status(Status.OK);
    }

    Transaction.wrap(function () {
        agentBasketLineItemLocks.ensureLockedLineItems(basket, true);
    });

    return new Status(Status.OK);
}

module.exports = {
    afterPUT: lockHandoffBasket,
    afterPOST: lockHandoffBasket,
    modifyPUTResponse: lockHandoffBasket,
    modifyPOSTResponse: lockHandoffBasket
};
