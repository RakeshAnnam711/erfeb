'use strict';

/**
 * Does Web Store Validation: checks geWebStoreUUID value for current instance
 * and compares it with value from request payload
 * @param {string} webStoreUUID - WebStore UUID from request payload
 */
function validateWebStore(webStoreUUID) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var currentWebStoreUUID = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geWebStoreUUID);

    if (webStoreUUID !== currentWebStoreUUID) {
        throw new Error('WebStore Validation: WebStoreUUID does not match. Current WebStoreUUID: ' + currentWebStoreUUID + '; Payload WebStoreUUID: ' + webStoreUUID + '.');
    }
}

/**
 * Generates Global-e WebStore UUID
 */
function generateWebStoreUUID() {
    var UUIDUtils = require('dw/util/UUIDUtils');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    if (!globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geWebStoreUUID)) {
        globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geWebStoreUUID, UUIDUtils.createUUID());
    }
}

module.exports = {
    validateWebStore: validateWebStore,
    generateWebStoreUUID: generateWebStoreUUID
};
