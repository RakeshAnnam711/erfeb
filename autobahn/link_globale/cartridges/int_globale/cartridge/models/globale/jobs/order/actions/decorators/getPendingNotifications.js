'use strict';

/**
 * Returns pending notification custom objects
 * @throws {Error}
 * @param {string} type - notification type
 * @returns {dw.util.SeekableIterator} - notification iterator
 */
function getPendingNotifications(type) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var coIter = CustomObjectMgr.queryCustomObjects(
        globaleHelpers.customObjectKeys.coOrderNotification,
        'custom.geNotificationType = {0}',
        'creationDate asc',
        type
    );

    return coIter;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getPendingNotifications: {
            enumerable: true,
            value: getPendingNotifications
        }
    });
};
