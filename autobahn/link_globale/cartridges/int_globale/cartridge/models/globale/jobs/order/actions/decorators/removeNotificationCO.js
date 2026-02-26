'use strict';

/**
 * Removes notification custom object
 * @param {dw.object.CustomObject} co - notification custom object
 */
function removeNotificationCO(co) {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');

    Transaction.wrap(function () {
        CustomObjectMgr.remove(co);
    });
}

module.exports = function (object) {
    Object.defineProperties(object, {
        removeNotificationCO: {
            enumerable: true,
            value: removeNotificationCO
        }
    });
};
