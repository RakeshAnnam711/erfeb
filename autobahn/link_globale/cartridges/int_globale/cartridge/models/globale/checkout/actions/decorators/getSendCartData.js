/* eslint-disable no-param-reassign */

'use strict';

/**
 * Returns SendCart data
 * @param {dw.order.Basket} basket - SFCC basket
 * @returns {Object} - SendCart data
 */
function getSendCartData(basket) { // eslint-disable-line no-unused-vars
    var decorators = require('*/cartridge/models/globale/sendCart/decorators/index');
    var SendCartData = require('*/cartridge/models/globale/sendCart/SendCartData');
    var sendCartDataInstance = new SendCartData(basket);

    Object.keys(decorators).forEach(function (decorator) {
        decorators[decorator](sendCartDataInstance);
    });

    return sendCartDataInstance.getData();
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getSendCartData: {
            value: getSendCartData
        }
    });
};
