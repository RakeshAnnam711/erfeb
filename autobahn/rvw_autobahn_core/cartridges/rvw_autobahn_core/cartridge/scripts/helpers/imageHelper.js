'use strict';

var Logger = require('dw/system/Logger');

/**
 * Returns the DIS configuration.
 *
 * @returns {Object} - The DIS configuration object.
 */
function getDisConfiguration() {
    var disConfiguration;
    try {
        disConfiguration = JSON.parse(dw.system.Site.getCurrent().getCustomPreferenceValue('disConfiguration'));
    } catch(exception) {
        Logger.error("Error parsing JSON for the disConfiguration preference.")
    }

    return disConfiguration;
}

exports.GetDisConfiguration = getDisConfiguration;