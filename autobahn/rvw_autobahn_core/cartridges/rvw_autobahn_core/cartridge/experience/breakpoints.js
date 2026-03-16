'use strict';
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

// Associated default native sfra behavior
var base = module.superModule || require('*/cartridge/experience/breakpoints.json');
var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();

try {
    // Sanitize string
    var breakpointsJSONPreference = (abConfigs.contentImageBreakpoints || '').replace(/(\r\n|\n|\r)/gm, '');

    if (!empty(breakpointsJSONPreference)) {
        breakpointsJSONPreference = JSON.parse(breakpointsJSONPreference);

        base = breakpointsJSONPreference;
    }
} catch (err) {
    Logger.getLogger('Autobahn').error('Error processing breakpointsJSONOverride site preference: ' + JSON.stringify(err, null, 2));
}

module.exports = base;
