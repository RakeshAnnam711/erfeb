'use strict';
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

// Associated default native sfra behavior
var base = module.superModule || require('*/cartridge/config/countries.json');

try {
    // Sanitize string
    var countriesJSONPreference = (Site.current.getCustomPreferenceValue('countriesJSONOverride') || '').replace(/(\r\n|\n|\r)/gm, '');

    if (!empty(countriesJSONPreference)) {
        countriesJSONPreference = JSON.parse(countriesJSONPreference);

        base = countriesJSONPreference;
    }
} catch (err) {
    Logger.getLogger('Autobahn').error('Error processing countriesJSONOverride site preference: ' + JSON.stringify(err, null, 2));
}

module.exports = base;
