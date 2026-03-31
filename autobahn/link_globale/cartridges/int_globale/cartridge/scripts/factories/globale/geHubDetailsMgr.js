'use strict';

/**
 * Returns Global-E ActiveHubDetails object
 * @returns {dw.object.CustomObject|Object} - ActiveHubDetails object
 */
function getActiveHubDetails() {
    var Logger = require('dw/system/Logger');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geObjectDataProvider = require('*/cartridge/scripts/factories/globale/geObjectDataProvider');
    var result = null;

    try {
        var provider = geObjectDataProvider.createDataProvider(
            require('*/cartridge/scripts/globale/cache/hubDetailsCacheMgr'),
            globaleHelpers.customObjectKeys.coHubDetails
        );
        result = provider.getGEObject(globaleHelpers.consts.hubKey);
    } catch (e) {
        Logger.getLogger('GLOBALE').error('geHubDetailsMgr: was not able to get Global-E object. Error: ' + e.message);
        throw e;
    }

    return result;
}

module.exports = {
    getActiveHubDetails: getActiveHubDetails
};
