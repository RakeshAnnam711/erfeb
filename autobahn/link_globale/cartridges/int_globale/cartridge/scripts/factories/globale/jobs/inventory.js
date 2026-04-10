'use strict';

var Status = require('dw/system/Status');

/**
 * This Job processes GLOBALE_INVENTORY_NOTIFICATION custom objects (async processing)
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function voidReservation(args) {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // search for GLOBALE_INVENTORY_NOTIFICATION custom objects
        var notificationCo;
        var notificationData;
        var coIter = CustomObjectMgr.queryCustomObjects(
            globaleHelpers.customObjectKeys.coInventoryNotification,
            'custom.geNotificationType = {0}',
            'creationDate asc',
            globaleHelpers.consts.notificationInventoryVoidReservation
        );

        // process GLOBALE_INVENTORY_NOTIFICATION custom objects
        while (coIter.hasNext()) {
            notificationCo = coIter.next();
            try {
                notificationData = JSON.parse(notificationCo.custom.geNotificationPayload);
                if (globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.inventory.onAfterVoidReservation, notificationData) === true) {
                    // remove GLOBALE_INVENTORY_NOTIFICATION custom object if it was processed successfully
                    Transaction.wrap(function () { // eslint-disable-line no-loop-func
                        CustomObjectMgr.remove(notificationCo);
                    });
                }
            } catch (e) {
                logger.error('GlobaleInventoryVoidReservationJobStep: {0}', (notificationCo && notificationCo.ID) + '; ' + e.message + '; ' + e.stack);
            }
        }
    } catch (e) {
        logger.error('GlobaleInventoryVoidReservationJobStep: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

module.exports = {
    VoidReservation: voidReservation
};
