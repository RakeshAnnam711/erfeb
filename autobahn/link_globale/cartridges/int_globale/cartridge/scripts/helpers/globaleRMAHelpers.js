'use strict';

/**
 * Returns pending RMA notifications
 * @returns {dw.util.SeekableIterator} - RMA notification iterator
 */
function getPendingRMANotifications() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var coIter = CustomObjectMgr.queryCustomObjects(
        globaleHelpers.customObjectKeys.coOrderNotification,
        'custom.geNotificationType = {0}',
        'creationDate asc',
        globaleHelpers.consts.notificationOrderRMACreate
    );

    return coIter;
}

/**
 * Initiates RMA update (SFCC to GE)
 * @param {dw.object.CustomObject} co - notification CO
 * @param {Object} payload - notification payload {OrderId:'GE10084013107GB',MerchantOrderId:'00042703',RMANumber:'277145',MerchantRMANumber:'RMA277145'}
 * @returns {boolean} - result
 */
function updateRMA(co, payload) {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var validator = require('*/cartridge/scripts/util/globale/validator');

    var logger = globaleHelpers.getLogger();
    var result = true;
    var coInfo = {};

    try {
        // check CO
        if (!co) {
            throw Error('Notification CO is not valid.');
        }

        // validate payload
        var validation = validator.validate(payload, {
            MerchantOrderId: { required: true },
            OrderId: { required: true },
            RMANumber: { required: true },
            MerchantRMANumber: { required: true }
        });
        if (!validation.valid) {
            throw new Error('Invalid payload:' + JSON.stringify(validation));
        }

        coInfo = { coId: co.custom.ID, orderId: co.custom.geOrderId };

        // initiate RMA update (SFCC to GE)
        globaleHooksHelper.invokeCustomHook(
            globaleHelpers.hooks.jobs.outboundOrderRMAUpdate,
            payload.OrderId,
            payload
        );

        // Remove notification CO
        Transaction.wrap(function () {
            CustomObjectMgr.remove(co);
        });
    } catch (e) {
        logger.error(
            'UpdateRMA initiation failed: CO ID: {0}, Order ID: {1}, {2}',
            coInfo.coId,
            coInfo.orderId,
            e.message + '; ' + e.stack
        );
        result = false;
    }

    return result;
}

module.exports = {
    getPendingRMANotifications: getPendingRMANotifications,
    updateRMA: updateRMA
};
