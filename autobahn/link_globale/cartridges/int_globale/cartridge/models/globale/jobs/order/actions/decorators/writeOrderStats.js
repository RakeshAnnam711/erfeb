'use strict';

/**
 * Writes Order Statistics to GLOBALE logs
 * @param {Object} stats - runtime statistics
 * @param {string} notificationName - notification name
 */
function writeOrderStats(stats, notificationName) {
    var StringUtils = require('dw/util/StringUtils');
    var Site = require('dw/system/Site');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();

    var notificationStats = [];
    notificationStats.push(StringUtils.format('Site {0},\nFound {1} Orders', Site.current.ID, stats.total));
    notificationStats.push(StringUtils.format('Processed {0} Orders', stats.processed));
    notificationStats.push(StringUtils.format('Failed {0} Orders', stats.failed));
    notificationStats.push(StringUtils.format('Orders with error: {0}', stats.errors));
    logger.info(notificationName + ':\n{0}', notificationStats.join('\n'));
}

module.exports = function (object) {
    Object.defineProperties(object, {
        writeOrderStats: {
            enumerable: true,
            value: writeOrderStats
        }
    });
};
