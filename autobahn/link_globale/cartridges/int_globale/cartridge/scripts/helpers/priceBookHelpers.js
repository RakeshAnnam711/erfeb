/* globals session */

'use strict';

/**
 * Checks if dynamic price book is applicable
 * @param {dw.catalog.PriceBook} priceBook - Price book
 * @returns {boolean} - Is price book applicable
 */
function isDynamicPriceBookApplicable(priceBook) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');

    // check if it's cache pricebook
    if (priceBook.custom[globaleHelpers.customAttr.pricebook.geCachePriceBook]) {
        return false;
    }

    // check if applicable for the Global-e merchant ID
    if (
        priceBook.custom[globaleHelpers.customAttr.pricebook.geApplicableToMerchantId] &&
        priceBook.custom[globaleHelpers.customAttr.pricebook.geApplicableToMerchantId] !== globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsMerchantId).toString()
    ) {
        return false;
    }

    // check if it's base pricebook (could be used for fixed and dynamic pricing at the same time)
    if (priceBook.custom[globaleHelpers.customAttr.pricebook.geBasePricebook]) {
        return true;
    }

    // check if the price book is applicable for dynamic pricing coumntries
    var isApplicable = !priceBook.custom[globaleHelpers.customAttr.pricebook.geNotApplicableForDynamic];
    if (!isApplicable) {
        return false;
    }

    // check if the price book is applicable for current country and currency
    var applicableToCountries = priceBook.custom[globaleHelpers.customAttr.pricebook.geApplicableToCountries].slice();
    var applicableToCurrencies = priceBook.custom[globaleHelpers.customAttr.pricebook.geApplicableToCurrencies].slice();

    if (applicableToCountries.length > 0 && applicableToCountries.indexOf(globaleSession.get('geCountry')) === -1) {
        isApplicable = false;
    } else if (applicableToCurrencies.length > 0 && applicableToCurrencies.indexOf(globaleSession.get('geCurrency')) === -1) {
        isApplicable = false;
    }

    return isApplicable;
}

/**
 * Checks if cache price book is applicable
 * @param {dw.catalog.PriceBook} priceBook - Price book
 * @returns {boolean} - Is price book applicable
 */
function isCachePriceBookApplicable(priceBook) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');

    var isApplicable = true;

    // check if it's cache pricebook
    if (
        !priceBook.custom[globaleHelpers.customAttr.pricebook.geCachePriceBook] ||
        !priceBook.custom[globaleHelpers.customAttr.pricebook.geCachePriceBookCombinations]
    ) {
        return false;
    }

    var applicableToCombinations = priceBook.custom[globaleHelpers.customAttr.pricebook.geCachePriceBookCombinations].split(',');

    // check if applicable for the Global-e merchant ID
    if (
        priceBook.custom[globaleHelpers.customAttr.pricebook.geApplicableToMerchantId] &&
        priceBook.custom[globaleHelpers.customAttr.pricebook.geApplicableToMerchantId] !== globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsMerchantId).toString()
    ) {
        return false;
    }

    // check if the price book is applicable for current country/currency
    if (applicableToCombinations.length > 0 && applicableToCombinations.indexOf(globaleSession.get('geCountry') + globaleSession.get('geCurrency')) === -1) {
        return false;
    }

    return isApplicable;
}

/**
 * Checks if fixed price book is applicable
 * @param {dw.catalog.PriceBook} priceBook - Price book
 * @returns {boolean} - Is price book applicable
 */
function isFixedPriceBookApplicable(priceBook) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var fixedPricebook = priceBook.custom[globaleHelpers.customAttr.pricebook.geFixedPricebook];
    var applicableToCountries = priceBook.custom[globaleHelpers.customAttr.pricebook.geApplicableToCountries].slice();
    var applicableToCurrencies = priceBook.custom[globaleHelpers.customAttr.pricebook.geApplicableToCurrencies].slice();

    // check if applicable for the Global-e merchant ID
    if (
        priceBook.custom[globaleHelpers.customAttr.pricebook.geApplicableToMerchantId] &&
        priceBook.custom[globaleHelpers.customAttr.pricebook.geApplicableToMerchantId] !== globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsMerchantId).toString()
    ) {
        return false;
    }

    // check if the price book is applicable for current country/currency
    var isApplicable = true;
    if (!fixedPricebook || !priceBook.online || (applicableToCountries.length === 0 && applicableToCurrencies.length === 0)) {
        isApplicable = false;
    } else if (applicableToCountries.length > 0 && applicableToCountries.indexOf(globaleSession.get('geCountry')) === -1) {
        isApplicable = false;
    } else if (applicableToCurrencies.length > 0 && applicableToCurrencies.indexOf(globaleSession.get('geCurrency')) === -1) {
        isApplicable = false;
    }

    return isApplicable;
}

/**
 * Checks if price book is cache related
 * @param {dw.catalog.PriceBook} priceBook - Price book
 * @returns {boolean} - Is price book applicable
 */
function isCachePriceBook(priceBook) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return priceBook ? priceBook.custom[globaleHelpers.customAttr.pricebook.geCachePriceBook] : false;
}

/**
 * Returns cache price book IDs
 * @returns {Array} - IDs of cache price books
 */
function getCachePriceBooks() {
    var PriceBookMgr = require('dw/catalog/PriceBookMgr');
    var priceBooksIter = PriceBookMgr.getAllPriceBooks().iterator();
    var cachePriceBooks = [];

    if (priceBooksIter && priceBooksIter.hasNext()) {
        while (priceBooksIter.hasNext()) {
            var priceBook = priceBooksIter.next();
            if (isCachePriceBook(priceBook)) {
                cachePriceBooks.push(priceBook);
            }
        }
    }

    return cachePriceBooks;
}

/**
 * Get applicable cache price books IDS
 * @returns {Array} - IDs of fixed price books
 */
function getApplicableCachePricebooksIDs() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var CacheMgr = require('dw/system/CacheMgr');
    var cachePriceBooksCache = CacheMgr.getCache(globaleHelpers.cacheKeys.cachePriceBooks);
    var cacheKey = globaleSession.get('geCountry') + '_' + globaleSession.get('geCurrency');
    return cachePriceBooksCache.get(cacheKey, function () {
        var applicableCachePriceBookIDs = [];
        var cachePriceBooks = getCachePriceBooks();
        cachePriceBooks.forEach(function (priceBook) {
            if (isCachePriceBookApplicable(priceBook)) {
                applicableCachePriceBookIDs.push(priceBook.ID);
            }
        });

        return applicableCachePriceBookIDs;
    });
}

/**
 * Updates site applicable pricebooks
 * @param {boolean} isOperatedByGlobalE - Is current country operated by Global-e
 */
function updateApplicablePriceBooks(isOperatedByGlobalE) {
    var PriceBookMgr = require('dw/catalog/PriceBookMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger('GE_PRICEBOOKS');

    PriceBookMgr.setApplicablePriceBooks();

    // do not filter price books for not-operated by Global-e countries
    if (!isOperatedByGlobalE) {
        return;
    }

    try {
        // filter out not applicable dynamic price books
        var sitePriceBooksIter = PriceBookMgr.getSitePriceBooks().iterator();
        var applicablePriceBooks = [];
        if (sitePriceBooksIter && sitePriceBooksIter.hasNext()) {
            while (sitePriceBooksIter.hasNext()) {
                var sitePriceBook = sitePriceBooksIter.next();
                if (isDynamicPriceBookApplicable(sitePriceBook)) {
                    applicablePriceBooks.push(sitePriceBook);
                }
            }
        }

        // add applicable cache price books
        var cachePriceBook;
        getApplicableCachePricebooksIDs().forEach(function (priceBookId) {
            cachePriceBook = PriceBookMgr.getPriceBook(priceBookId);
            if (cachePriceBook) {
                applicablePriceBooks.push(PriceBookMgr.getPriceBook(priceBookId));
            }
        });

        if (applicablePriceBooks.length > 0) {
            PriceBookMgr.setApplicablePriceBooks.apply(PriceBookMgr.setApplicablePriceBooks, applicablePriceBooks);
        }
    } catch (e) {
        logger.error('updateApplicablePriceBooks: Was not able to update applicable price books. Error: {0}', logger.message(e));
        PriceBookMgr.setApplicablePriceBooks();
    }
}

/**
 * Get applicable fixed price books IDS
 * @returns {Array} - IDs of fixed price books
 */
function getApplicableFixedPricebooksIDs() {
    var Site = require('dw/system/Site');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var CacheMgr = require('dw/system/CacheMgr');
    var fixedPriceBooksCache = CacheMgr.getCache(globaleHelpers.cacheKeys.fixedPriceBooks);
    var cacheKey = Site.current.ID + '_' + globaleSession.get('geCountry') + '_' + globaleSession.get('geCurrency');
    return fixedPriceBooksCache.get(cacheKey, function () {
        var PriceBookMgr = require('dw/catalog/PriceBookMgr');
        var priceBooksIter = PriceBookMgr.getAllPriceBooks().iterator();
        var applicableFixedPriceBookIDs = [];

        if (priceBooksIter && priceBooksIter.hasNext()) {
            while (priceBooksIter.hasNext()) {
                var priceBook = priceBooksIter.next();
                if (isFixedPriceBookApplicable(priceBook)) {
                    applicableFixedPriceBookIDs.push(priceBook.ID);
                }
            }
        }

        return applicableFixedPriceBookIDs;
    });
}

/**
 * Apply applicable fixed price books and run callback/fallback function
 * @param {function|undefined} cbFunc - Callback function. Is used if applicable fixed price books exist
 * @param {function|undefined} fbFunc - Fallback function. Is used if applicable fixed price books don't exist
 * @returns {null|undefined|number|string|boolean|Object|Array} result - Result of callback/fallback function or null
 */
function applyFixedPriceBooks(cbFunc, fbFunc) { // eslint-disable-line no-unused-vars
    var PriceBookMgr = require('dw/catalog/PriceBookMgr');
    var Currency = require('dw/util/Currency');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var originalCurrencyCode = session.getCurrency().getCurrencyCode();
    var originalPricebooks = PriceBookMgr.getApplicablePriceBooks().toArray();
    var applicableFixedPriceBookIDs = getApplicableFixedPricebooksIDs();
    var applicablePriceBooks = applicableFixedPriceBookIDs.map(function (priceBookID) {
        return PriceBookMgr.getPriceBook(priceBookID);
    });
    var result = null;
    try {
        if (applicablePriceBooks.length === 0) {
            // Run fallback function
            if (typeof fbFunc === 'function') {
                result = fbFunc();
            }
            return result;
        }
        // Apply fixed price books and run callback function
        session.setCurrency(Currency.getCurrency(applicablePriceBooks[0].currencyCode));
        PriceBookMgr.setApplicablePriceBooks(applicablePriceBooks);
        if (typeof cbFunc === 'function') {
            result = cbFunc();
        }
        session.setCurrency(Currency.getCurrency(originalCurrencyCode));
        PriceBookMgr.setApplicablePriceBooks.apply(PriceBookMgr.setApplicablePriceBooks, originalPricebooks);
    } catch (e) {
        logger.error('applyFixedPriceBooks: Error: {0}', logger.message(e));
        session.setCurrency(Currency.getCurrency(originalCurrencyCode));
        PriceBookMgr.setApplicablePriceBooks.apply(PriceBookMgr.setApplicablePriceBooks, originalPricebooks);
    }

    return result;
}

module.exports = {
    updateApplicablePriceBooks: updateApplicablePriceBooks,
    isDynamicPriceBookApplicable: isDynamicPriceBookApplicable,
    isFixedPriceBookApplicable: isFixedPriceBookApplicable,
    getApplicableFixedPricebooksIDs: getApplicableFixedPricebooksIDs,
    getApplicableCachePricebooksIDs: getApplicableCachePricebooksIDs,
    applyFixedPriceBooks: applyFixedPriceBooks,
    isCachePriceBook: isCachePriceBook,
    getCachePriceBooks: getCachePriceBooks
};
