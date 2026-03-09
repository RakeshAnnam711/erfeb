'use strict';

/**
 * Stores the JSON Payload received from Global-e
 * to the custom attribute of SFCC Order, if configured so in Site Preferences.
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Order or Basket
 * @param {string} orderJsonCustomAttribute - Custom attribute of Order/Basket where the Payload will be stored.
 * @param {Object|undefined|null} payloadData - If not empty - this JSON will be stored to custom attribute of SFCC Order
 */
function storeJsonPayload(lineItemCtnr, orderJsonCustomAttribute, payloadData) {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    if (lineItemCtnr && (orderJsonCustomAttribute in globaleHelpers.customAttr.order)) {
        var jsonRecords = [];
        try {
            jsonRecords = JSON.parse(lineItemCtnr.custom[globaleHelpers.customAttr.order[orderJsonCustomAttribute]]);
            if (jsonRecords) {
                if (Object.prototype.toString.call(jsonRecords) !== '[object Array]') {
                    jsonRecords = [{ datetime: '0000-00-00T00:00:00.000Z', payload: jsonRecords }];
                }
            } else {
                jsonRecords = [];
            }
        } catch (e) {
            jsonRecords = [];
        }
        jsonRecords.push({ datetime: (new Date()).toISOString(), payload: payloadData });

        var stringifiedJsonRecords = JSON.stringify(jsonRecords);

        while (stringifiedJsonRecords.length > globaleHelpers.consts.JSONStringLength) {
            jsonRecords.shift();
            stringifiedJsonRecords = JSON.stringify(jsonRecords);
        }

        // update the custom attribute
        Transaction.wrap(function () {
            lineItemCtnr.custom[globaleHelpers.customAttr.order[orderJsonCustomAttribute]] = stringifiedJsonRecords; // eslint-disable-line no-param-reassign
        });
    }
}

module.exports = function (object) {
    Object.defineProperty(object, 'storeJsonPayload', {
        value: storeJsonPayload
    });
};
