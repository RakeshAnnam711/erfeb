'use strict';

/**
 * Returns products iterator data based on ProductMgr search
 * @param {string} catalogId - Catalog id
 * @param {number} defaultStartPosition - Iterator default start position
 * @param {number} currentStartPosition - Iterator current start position
 * @param {number} processProductsPerRunCount - Processed products count per run
 * @return {Object} - Catalog feed iterator data
 */
function getProductsIterator(catalogId, defaultStartPosition, currentStartPosition, processProductsPerRunCount) {
    var Status = require('dw/system/Status');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var productsStartPosition = defaultStartPosition;
    var productsStartPositionNextRun = defaultStartPosition;
    var productsIterator = null;
    var productsCount = null;
    var iteratedProductsCount = null;

    try {
        // get catalog
        var catalog = catalogId ? CatalogMgr.getCatalog(catalogId) : null;
        if (!catalog) {
            throw new Error('Catalog not found!. Catalog id: ' + catalogId);
        }

        // get products iterator data
        productsIterator = ProductMgr.queryProductsInCatalog(catalog);
        productsCount = productsIterator.count;
        iteratedProductsCount = productsIterator.count;

        // shift products iterator if processProductsPerRunCount > 0
        if (productsCount > 0 && processProductsPerRunCount > 0) {
            // get start position
            productsStartPosition = currentStartPosition;
            if (productsStartPosition < 0 || productsStartPosition >= iteratedProductsCount) {
                productsStartPosition = defaultStartPosition < iteratedProductsCount ? defaultStartPosition : 0;
            }

            // shift products iterator
            var maxAvailableIterationSize = iteratedProductsCount - productsStartPosition;
            var iterationSize = Math.min(processProductsPerRunCount, maxAvailableIterationSize);
            productsIterator.forward(productsStartPosition, iterationSize);

            // get next run start position
            productsStartPositionNextRun = productsStartPosition + iterationSize;
            if (productsStartPositionNextRun >= iteratedProductsCount) {
                productsStartPositionNextRun = defaultStartPosition;
            }

            // get products iterator data
            iteratedProductsCount = iterationSize;
        }

        logger.info(
            'Iterator Data. ProductsStartPosition: {0}; ProductsStartPositionNextRun: {1}; GeneralProductsCount: {2}; IteratedProductsCount: {3}',
            productsStartPosition,
            productsStartPositionNextRun,
            productsCount,
            iteratedProductsCount
        );
    } catch (e) {
        return {
            status: new Status(Status.ERROR, '100', (e.message + '; ' + e.stack))
        };
    }

    return {
        status: new Status(Status.OK),
        productsIterator: productsIterator,
        productsStartPositionNextRun: productsStartPositionNextRun
    };
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getProductsIterator: {
            enumerable: true,
            value: getProductsIterator
        }
    });
};
