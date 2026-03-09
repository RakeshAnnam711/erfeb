'use strict';

/**
 * Retrieves Global-e custom site preferences
 * @returns {Object} - Global-e custom site preferences object
 */
function getPreferences() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var prefs = {};
    for (var key in globaleHelpers.preferenceKeys) { // eslint-disable-line guard-for-in, no-restricted-syntax
        prefs[key] = globaleHelpers.getPreference(key);
    }
    return prefs;
}

/**
 * Retrieves a product's Global-e custom attributes and price information
 * @param {string} productId - SFCC Product Id
 * @returns {Object} - Global-e custom site preferences object
 */
function getProductAttributes(productId) {
    var ProductMgt = require('dw/catalog/ProductMgr');
    var TaxMgr = require('dw/order/TaxMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var product = ProductMgt.getProduct(productId);

    var taxClassId = product.taxClassID;
    var defaultTaxJurisdictionID = TaxMgr.getDefaultTaxJurisdictionID();
    var taxJurisdictionId = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geTaxJurisdictionId) || defaultTaxJurisdictionID;
    var taxRate = TaxMgr.getTaxRate(taxClassId, taxJurisdictionId) !== null ? TaxMgr.getTaxRate(taxClassId, taxJurisdictionId) : TaxMgr.getTaxRate(taxClassId, defaultTaxJurisdictionID);

    if (taxRate === null) {
        taxRate = TaxMgr.getTaxRate(TaxMgr.getDefaultTaxClassID(), defaultTaxJurisdictionID);
    }

    return {
        geRestrictedCountries: product.custom.geRestrictedCountries,
        geIsForbidden: product.custom.geIsForbidden,
        geVatRates: product.custom.geVatRates,
        basePrice: product.priceModel.minPrice.value,
        taxClassID: taxClassId,
        taxProductRate: taxRate,
        defaultTaxRate: TaxMgr.getTaxRate(TaxMgr.getDefaultTaxClassID(), TaxMgr.getDefaultTaxJurisdictionID())
    };
}

/**
 * Retrieves a SendCart request payload
 * @returns {Object} - SendCart request payload
 */
function getSendCartData() {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var result;
    if (!currentBasket) {
        result = { error: 'basket not found' };
    } else {
        var decorators = require('*/cartridge/models/globale/checkout/actions/decorators/index');
        var object = Object.create(null);
        decorators.getSendCartData(object);
        result = object.getSendCartData(currentBasket);
    }

    return result;
}

/**
 * Executes GE job
 * @param {string} jobName - SFCC job name
 * @returns {Object} - result
 */
function runGlobaleJob(jobName) {
    var System = require('dw/system/System');
    var Pipelet = require('dw/system/Pipelet');

    var allowedJobs = [
        'GlobaleSettings',
        'GlobaleProducts',
        'GlobaleOrderNotifications',
        'GlobaleCatalogFeed',
        'GlobaleRestrictedItemsFeed',
        'GlobaleCachePriceBooks'
    ];
    var result = { success: false, error: null };

    try {
        if (
            System.getInstanceType() !== System.PRODUCTION_SYSTEM &&
            !empty(jobName) &&
            (allowedJobs.indexOf(jobName) !== -1)
        ) {
            var jobExecutionResult = new Pipelet('RunJobNow').execute({
                JobName: jobName
            });
            result.success = jobExecutionResult.result === 1;
        }
    } catch (e) {
        result.success = false;
        result.error = (e.message + '; ' + e.stack);
    }

    return result;
}

module.exports = {
    getPreferences: getPreferences,
    getProductAttributes: getProductAttributes,
    getSendCartData: getSendCartData,
    runGlobaleJob: runGlobaleJob
};
