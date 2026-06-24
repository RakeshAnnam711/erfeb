/* global request:false */
'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

var currentSite = Site.getCurrent();
var version = '20.1';

/**
 * Gets the Flow Session Id from the Flow Cookie
 * @returns {string} Flow Session Id
 */
function getSessionId() {
    var cookies = request.getHttpCookies();

    if (cookies['_f60_session']) { // eslint-disable-line dot-notation
        return cookies['_f60_session'].value; // eslint-disable-line dot-notation
    }

    return null;
}

/**
 * Gets the Default Locale code for the Site, defaults to en_US
 * @returns {string} Locale code
 */
function getDefaultLocale() {
    var defaultLocaleCode = currentSite.getDefaultLocale();

    if (defaultLocaleCode === 'default') {
        defaultLocaleCode = currentSite.getCustomPreferenceValue('flowDefaultLocale') || 'en_US';
    }

    return defaultLocaleCode;
}

/**
 * Gets the amount from the Flow Price Object
 * @param {Object} price - Flow price object
 * @param {boolean} useBase - Determines whether to take amount in the Flow Order Currency or the Base Currency
 * @returns {decimal} Amount value
 */
function getFlowPriceAmount(price, useBase) {
    return (useBase || currentSite.getCustomPreferenceValue('flowUseBaseCurrency')) ? price.base.amount : price.amount;
}

/**
 * Gets the currency from the Flow Price Object
 * @param {Object} price - Flow price object
 * @param {boolean} useBase - Determines whether to take the Flow Order Currency or the Base Currency
 * @returns {string} Currency
 */
function getFlowPriceCurrency(price, useBase) {
    return (useBase || currentSite.getCustomPreferenceValue('flowUseBaseCurrency')) ? price.base.currency : price.currency;
}

/**
 * Creates a Flow Notification Custom Object
 * @param {Object} data - Oject Data
 */
function createNotificationObject(data) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');

    Transaction.wrap(function () {
        var customObject = CustomObjectMgr.createCustomObject('flowNotification', UUIDUtils.createUUID());

        customObject.custom.flowOrderId = data.flowOrderId;
        customObject.custom.sfccOrderId = data.sfccOrderId;
        customObject.custom.notification = data.notification;
        customObject.custom.data = data.data;
    });
}

/**
 * Gets the Logger instance
 * @returns {Object} Logger instance
 */
function getLogger() {
    return Logger.getLogger('Flow-' + currentSite.getID(), 'Flow');
}

module.exports = {
    isFlowEnabled: currentSite.getCustomPreferenceValue('flowEnabled'),
    disableServerSessions: currentSite.getCustomPreferenceValue('flowDisableServerSessions'),
    enableJobs: currentSite.getCustomPreferenceValue('flowEnableJobs'),
    organizationId: currentSite.getCustomPreferenceValue('flowOrganizationId'),
    imageHost: currentSite.getCustomPreferenceValue('flowImageHost'),
    autoDetectLocale: currentSite.getCustomPreferenceValue('flowAutoDetectLocale'),
    allowedCurrencies: currentSite.getAllowedCurrencies().toArray(),
    allowedLocales: currentSite.getAllowedLocales().toArray(),
    defaultCurrencyCode: currentSite.getDefaultCurrency(),
    defaultLocaleCode: getDefaultLocale(),
    siteId: currentSite.getID(),
    apiToken: currentSite.getCustomPreferenceValue('flowApiTokenKey'),
    hostedCheckoutURL: currentSite.getCustomPreferenceValue('flowHostedCheckoutURL') || 'https://checkout.flow.io/',
    useBaseCurrency: currentSite.getCustomPreferenceValue('flowUseBaseCurrency'),
    useCountryPicker: currentSite.getCustomPreferenceValue('flowUseCountryPicker'),
    excludedLocalesJSON: currentSite.getCustomPreferenceValue('flowExcludedLocalesJSON') || '{}',
    defaultLocaleExperiences: currentSite.getCustomPreferenceValue('flowDefaultLocaleExperiences') || [],
    showTaxIncluded: currentSite.getCustomPreferenceValue('flowShowTaxIncluded'),
    showPaymentMethods: currentSite.getCustomPreferenceValue('flowShowPaymentMethods'),
    showDeliveryWindow: currentSite.getCustomPreferenceValue('flowShowDeliveryWindow'),
    defaultDeliveryOrigin: currentSite.getCustomPreferenceValue('flowDefaultDeliveryOrigin') || 'USA',
    romanizeAddresses: currentSite.getCustomPreferenceValue('flowRomanizeAddresses'),
    sessionId: getSessionId(),
    logger: getLogger(),
    getFlowPriceAmount: getFlowPriceAmount,
    getFlowPriceCurrency: getFlowPriceCurrency,
    createNotificationObject: createNotificationObject,
    version: version
};
