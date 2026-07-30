'use strict';

var logger = require('dw/system/Logger');
var velocity = require('dw/template/Velocity');

/**
 * Implementation of the 'app.template.beforeHeader' hook that executes before the header is completely rendered,
 * This calls a remote include to the Marketing-BeforeHeader controller-route, passing the Account Id (MID)
 * so that it can be cached by account (for when a site has multiple brands/accountIds).
 * This could be called step 1 of the process that loads SFMC related metadata on to the page.
 */
function beforeHeader (pdict) {
    var currentSite = dw.system.Site.getCurrent();
    var accountId = '';
    var metadata = {};

    try {
        if (currentSite.getCustomPreferenceValue('MarketingCloudCollectJsEnabled')) {
            var marketingHelper = require('*/cartridge/scripts/helpers/MarketingHelper');
            accountId = marketingHelper.GetAccountId();
            var collectHelper = require('*/cartridge/scripts/helpers/CollectHelper');
            var currentRequest = request;
            metadata = collectHelper.GetMetadata(pdict, currentRequest, accountId);
            if (dw.system.System.getInstanceType() !== dw.system.System.PRODUCTION_SYSTEM) {
                metadata.debug = true;
            }
        }
    } catch(err) {
        logger.error('Error in beforeHeader function for SFMC hooks: {0}: Details: {1} >> {2}:{3}', err.message, err.toString(), err.fileName, err.lineNumber);
    }

    velocity.render("$velocity.remoteInclude('Marketing-BeforeHeader', 'accountId', $accountId, 'metadata', $metadata)", {
        velocity: velocity,
        accountId: accountId,
        metadata: JSON.stringify(metadata)
    });
}

module.exports = {
    beforeHeader: beforeHeader
}
