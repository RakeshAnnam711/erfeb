'use strict';

/**
 * Returns cart token
 * @param {Object} sendCartData - SendCart data
 * @returns {string} - cart token
 */
function getCartToken(sendCartData) { // eslint-disable-line no-unused-vars
    var service = require('*/cartridge/scripts/factories/globale/geServiceMgr').getSendCartService();
    var serviceResponse = service.call(JSON.stringify(sendCartData));

    // check service response
    if (!serviceResponse.isOk()) {
        throw new Error(serviceResponse.msg);
    }

    // check CartToken
    var responseObject = JSON.parse(serviceResponse.object.text);
    if (!('CartToken' in responseObject) || !responseObject.CartToken) {
        throw new Error('No CartToken in Global-e API response!');
    }

    return responseObject.CartToken;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getCartToken: {
            value: getCartToken
        }
    });
};
