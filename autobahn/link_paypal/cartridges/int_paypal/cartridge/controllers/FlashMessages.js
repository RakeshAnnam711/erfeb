'use strict';

/**
 * @namespace FlashMessages
 */

const server = require('server');

server.get('Get',
    server.middleware.include,
    function(req, res, next) {
        const BasketMgr = require('dw/order/BasketMgr');
        const Transaction = require('dw/system/Transaction');

        const utils = require('*/cartridge/scripts/paypal/utils');
        const CustomerModel = require('*/cartridge/models/customer');

        let flashMessages = [];

        if (customer.authenticated && customer.registered) {
            const customerInstance = new CustomerModel(customer);

            Transaction.wrap(function() {
                flashMessages = customerInstance.pullFlashMessages();
            });
        }

        const currentBasket = BasketMgr.currentBasket;

        if (currentBasket && currentBasket.custom.flashMessages) {
            flashMessages = utils.tryParseJSON(currentBasket.custom.flashMessages);

            Transaction.wrap(function() {
                currentBasket.custom.flashMessages = '';
            });
        }

        res.render('components/footer/flashMessages', {
            flashMessages: flashMessages
        });

        next();
    }
);

module.exports = server.exports();
