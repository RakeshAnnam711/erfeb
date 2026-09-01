'use strict';

/**
 * OnRequest hook for Global-e.
 * @returns {dw.system.Status} Status
 */
exports.onRequest = function () {
    var Status = require('dw/system/Status');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var onRequestHelpers = require('*/cartridge/scripts/helpers/onRequestHelpers');
    // handle only storefront requests (including Customer Support)
    if (
        !globaleRequest.get('includeRequest') &&
        // ((globaleRequest.get('httpPath').indexOf('/on/demandware.store/Sites-Site/') === -1)) &&
        onRequestHelpers.forceGlobaleInit()
    ) {
        (require('*/cartridge/scripts/globale/globaleInit'))();
    }
    return new Status(Status.OK);
};
