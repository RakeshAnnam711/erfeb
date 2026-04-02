'use strict';

exports.getHubId = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geHubDetailsMgr = require('*/cartridge/scripts/factories/globale/geHubDetailsMgr');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');

    var hubId = null;
    if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccSendCartSendHubId, false, 'boolean')) {
        var activeHub = geHubDetailsMgr.getActiveHubDetails();
        hubId = activeHub ? activeHub.custom.hubID : null;
    }

    return hubId;
};
