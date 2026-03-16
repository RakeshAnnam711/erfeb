'use strict';

/**
 * Calculates and returns Global-e WebStoreCode
 * @returns {string} - Global-e WebStoreCode
 */
function getWebStoreCode() {
    var Site = require('dw/system/Site');
    return Site.current.ID;
}

/**
 * Calculates and returns Global-e WebStoreInstanceCode
 * @returns {string} - Global-e WebStoreInstanceCode
 */
function getWebStoreInstanceCode() {
    var System = require('dw/system/System');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var httpHost = globaleRequest.get('httpHost');
    var result = httpHost || System.getInstanceHostname();

    // set system hostname if the request iniitialized via OCAPI/SCAPI
    if (globaleRequest.get('clientId') !== null) {
        result = System.getInstanceHostname();
    }

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getWebStoreCode: {
            value: getWebStoreCode
        },
        getWebStoreInstanceCode: {
            value: getWebStoreInstanceCode
        }
    });
};
