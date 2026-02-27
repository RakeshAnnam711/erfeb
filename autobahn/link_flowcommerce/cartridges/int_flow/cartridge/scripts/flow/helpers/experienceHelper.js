/* global request:false, session:false, empty:false, dw:false */
'use strict';

// eslint-disable-next-line no-use-before-define
var experiences = getFlowExperiences();
var countryCodeLookup = require('*/cartridge/config/countryCodeLookup');
var countryTaxLookup = require('*/cartridge/config/countryTaxLookup');

/**
 * Fetch the flow experiences based on instance type, so that production maintains a flat file
 * performance benefit, but test environments can be configured via site preference
 * @returns {Object} experiences
 */
function getFlowExperiences() {
    if (dw.system.System.instanceType === dw.system.System.PRODUCTION_SYSTEM) {
        return require('*/cartridge/config/flowExperiences');
    }

    return JSON.parse(dw.system.Site.current.getCustomPreferenceValue('flowExperiencesJSON'));
}

/**
 * Fetch the flow countries based on instance type, so that production maintains a flat file
 * performance benefit, but test environments can be configured via site preference
 * TODO: this doesnt currently get used because it would require overriding several SFRA methods that directly require the countries.json file...but if you're feeling up to it, this method is what you'd call instead
 * TODO: don't forget to add the flowCountriesJSON site preference to the flow preference group. I'm leaving it out because its not being used currently.
 * @returns {Object} countries
 */
function getFlowCountries() {
    if (dw.system.System.instanceType === dw.system.System.PRODUCTION_SYSTEM) {
        return require('*/cartridge/config/countries');
    }

    return JSON.parse(dw.system.Site.current.getCustomPreferenceValue('flowCountriesJSON'));
}

/**
 * Sets the session and basket currency to the currency defined in the experience object
 * @param {Object} experience - Flow experience object (from flowExperiences.json)
 */
function setExperience(experience) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var Currency = require('dw/util/Currency');
    var PriceBookMgr = require('dw/catalog/PriceBookMgr');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var collections = require('*/cartridge/scripts/util/collections');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    var currencyCode = experience ? experience.currencyCode : FlowHelper.defaultCurrencyCode;
    var currency = Currency.getCurrency(currencyCode);
    var priceBooks = [];
    var allPriceBooks = PriceBookMgr.getAllPriceBooks();

    if (empty(currency)) {
        FlowHelper.logger.warn('flow/experienceHelper.js - Unable to find currency {0}', currencyCode);
        return;
    }

    // Set applicable Pricebooks
    if (experience) {
        collections.forEach(allPriceBooks, function (priceBook) {
            if (priceBook.custom.flowExperienceID === experience.id && priceBook.custom.flowOrganizationID === FlowHelper.organizationId) {
                priceBooks.push(priceBook);
            }
        });

        session.custom.flowExperienceId = experience.id;
    } else {
        session.custom.flowExperienceId = null;
    }

    if (empty(priceBooks)) {
        PriceBookMgr.setApplicablePriceBooks();
    } else {
        PriceBookMgr.setApplicablePriceBooks(priceBooks);
    }

    if (FlowHelper.allowedCurrencies.indexOf(currencyCode) > -1 && session.currency.currencyCode !== currencyCode) {
        session.setCurrency(currency);
    }

    if (FlowHelper.allowedCurrencies.indexOf(currencyCode) > -1 && currentBasket && currentBasket.currencyCode !== currencyCode) {
        Transaction.wrap(function () {
            currentBasket.updateCurrency();
            basketCalculationHelpers.calculateTotals(currentBasket);
        });
    }
}

/**
 * Gets the Flow Experience by Experience Id
 * @param {string} id - Experience Id
 * @returns {Object} Flow Experience
 */
function getExperienceById(id) {
    var matches = experiences.filter(function (experience) {
        return experience.id === id;
    });

    return matches.length ? matches[0] : null;
}

/**
 * Gets the Flow Experience by Country Code
 * @param {string} countryCode - 3 Digit Country Code
 * @returns {Object} Flow Experience
 */
function getExperienceByCountry(countryCode) {
    var matches = experiences.filter(function (experience) {
        return experience.countries.indexOf(countryCode) > -1;
    });

    return matches.length ? matches[0] : null;
}

/**
 * Gets the Flow Experience by Locale Code
 * @param {string} localeCode - Locale Code
 * @returns {Object} Flow Experience
 */
function getExperienceByLocale(localeCode) {
    var matches = experiences.filter(function (experience) {
        return experience.sfccLocales.indexOf(localeCode) > -1;
    });

    return matches.length ? matches[0] : null;
}

/**
 * Gets the Flow Experience by Id or Country Code or Locale Code
 * @param {string} id - Experience Id
 * @param {string} countryCode - 3 Digit Country Code
 * @param {string} localeCode - Locale Code
 * @returns {Object} Flow Experience
 */
function getExperience(id, countryCode, localeCode) {
    return getExperienceById(id) || getExperienceByCountry(countryCode) || getExperienceByLocale(localeCode);
}

/**
 * Gets the Current Flow Experience using the request object
 * @returns {Object} Flow Experience
 */
function getCurrentExperience() {
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var Locale = require('dw/util/Locale');

    var locale = Locale.getLocale(request.getLocale()) || Locale.getLocale(FlowHelper.defaultLocaleCode);
    var countryCode = locale.getISO3Country();
    var localeCode = locale.ID;

    return getExperience(session.privacy.flowExperienceId || null, countryCode, localeCode);
}

/**
 * Determines whether to use the Base Currency for a Flow Experience
 * @param {Object} experience - Flow Experience
 * @returns {boolean} Flag indicating whether to use the Base Currency
 */
function useBaseCurrency(experience) {
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    return hooksHelper('flow.experience.useBaseCurrency', 'useBaseCurrency', experience, function () {
        return FlowHelper.useBaseCurrency;
    });
}

/**
 * Converts a 2 digit country code to 3 digits or 3 digit country code to 2 digits
 * @param {string} id - Country Code
 * @returns {string} Country Code
 */
function convertCountryCode(id) {
    return countryCodeLookup[id];
}

/**
 * Gets the Tax Type for a given 3 digit country
 * @param {string} id - Country Code
 * @returns {string} Tax Type - Defaults to VAT
 */
function getCountryTax(id) {
    return countryTaxLookup[id] || 'VAT';
}

/**
 * Gets the Tax Included Text for the current experience
 * @returns {string} Tax Included text or empty string
 */
function getTaxIncluded() {
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    var experience = getCurrentExperience();
    var taxIncluded = '';

    if (FlowHelper.isFlowEnabled && FlowHelper.showTaxIncluded && experience && experience.taxIncluded) {
        taxIncluded = experience.taxIncluded;
    }

    return taxIncluded;
}

/**
 * Gets the delivery window for the current experience
 * @returns {DeliveryWindowModel} Delivery Window Model
 */
function getDeliveryWindow() {
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var flowApi = require('*/cartridge/scripts/flow/api/api');

    var experience = getCurrentExperience();
    var origin = null;
    var deliveryWindow = null;

    if (experience && experience.showDeliveryWindow !== false) {
        origin = experience.deliveryOrigin || FlowHelper.defaultDeliveryOrigin;
    }

    if (FlowHelper.isFlowEnabled && FlowHelper.showDeliveryWindow && origin && experience) {
        deliveryWindow = flowApi.shipping.getDeliveryWindow(origin, experience.defaultCountry);
    }

    return deliveryWindow;
}

/**
 * Gets the payment methods for the current experience
 * @returns {Array} Array of payment method objects
 */
function getPaymentMethods() {
    var flowApi = require('*/cartridge/scripts/flow/api/api');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    var experience = getCurrentExperience();
    var paymentMethods = null;

    if (FlowHelper.isFlowEnabled && FlowHelper.showPaymentMethods && experience) {
        paymentMethods = flowApi.experience.getPaymentMethods(experience.id);
    }

    return paymentMethods;
}

/**
 * Gets the experience config required by the client Flow.js script
 * @returns {Object} Map of configuration values
 */
function getExperienceJSConfig() {
    var Locale = require('dw/util/Locale');
    var URLAction = require('dw/web/URLAction');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    var locale = Locale.getLocale(request.locale);
    var defaultLocale = Locale.getLocale(FlowHelper.defaultLocaleCode);

    var countryCode = locale.getISO3Country();
    var languageCode = locale.language;
    var experienceId = '';
    var currencyCode = '';

    var experience = getCurrentExperience();

    if (experience) {
        experienceId = experience.id;
        currencyCode = experience.currencyCode;
        if (experience.countries.indexOf(countryCode) < 0) {
            countryCode = experience.defaultCountry;
        }
    } else {
        languageCode = currencyCode = countryCode = '';
    }

    return {
        experience: experienceId,
        country: countryCode,
        language: languageCode,
        currency: currencyCode,
        sessionCurrency: session.currency.currencyCode,
        defaultCountryCode: defaultLocale.getISO3Country(),
        urlAction: new URLAction('Home-Show', FlowHelper.siteId, FlowHelper.defaultLocaleCode)
    };
}

module.exports = {
    setExperience: setExperience,
    getExperience: getExperience,
    getCurrentExperience: getCurrentExperience,
    useBaseCurrency: useBaseCurrency,
    convertCountryCode: convertCountryCode,
    getCountryTax: getCountryTax,
    taxIncluded: getTaxIncluded(),
    getDeliveryWindow: getDeliveryWindow,
    getPaymentMethods: getPaymentMethods,
    getExperienceJSConfig: getExperienceJSConfig,
    getFlowExperiences: getFlowExperiences,
    getFlowCountries: getFlowCountries
};
