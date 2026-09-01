'use strict';

var Logger = require('dw/system/Logger').getLogger('Custom.SaleCategoryValidation');
var Status = require('dw/system/Status');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var PriceBookMgr = require('dw/catalog/PriceBookMgr');

var removeService = require('*/cartridge/scripts/services/removeCategoryFromProduct');

var validateSaleCategory = function (args) {

    var saleCategoryID = args.SaleCategoryID;
    var salePriceBookID = args.SalePriceBookID;
    var catalogID = args.CatalogID;

    Logger.info(
        'Received Job Arguments - SaleCategoryID: {0}, SalePriceBookID: {1}, CatalogID: {2}',
        saleCategoryID,
        salePriceBookID,
        catalogID
    );

    var saleCategory = CatalogMgr.getCategory(saleCategoryID);
    var salePriceBook = PriceBookMgr.getPriceBook(salePriceBookID);

    if (!saleCategory || !salePriceBook || !catalogID) {
        Logger.error('Invalid configuration. Category, PriceBook, or Catalog missing.');
        return new Status(Status.ERROR);
    }

    var invalidProducts = [];
    var processedCount = 0;
    var removedCount = 0;

    Logger.info('Starting Sale Category Validation for Category: ' + saleCategoryID);

    var categoriesToProcess = [saleCategory];
    var subCategories = saleCategory.getOnlineSubCategories().iterator();

    while (subCategories.hasNext()) {
        categoriesToProcess.push(subCategories.next());
    }

    Logger.info('Total categories to process: ' + categoriesToProcess.length);

    categoriesToProcess.forEach(function (category) {

        var products = category.getOnlineProducts().iterator();

        while (products.hasNext()) {

            var product = products.next();
            processedCount++; 

            var priceModel = product.getPriceModel();
            if (!priceModel) {
                continue;
            }

            Logger.info(
                'Processing Product SKU: {0} in Category: {1}',
                product.getID(),
                category.getID()
            );

            var salePrice = priceModel.getPriceBookPrice(salePriceBookID);

            Logger.info(
                'Sale Price for SKU {0}: {1}',
                product.getID(),
                salePrice ? salePrice.value : 'No Sale Price'
            );

            if (!salePrice || !salePrice.available || salePrice.value === 0) {

                invalidProducts.push(product.getID());

                Logger.warn(
                    'Invalid Sale Price | SKU: {0} | Reason: {1}',
                    product.getID(),
                    (!salePrice ? 'No price in Sale PriceBook'
                        : !salePrice.available ? 'Sale price not available'
                            : 'Sale price is zero')
                );

                var retryCount = 0;
                var maxRetries = 3;
                var success = false;

                while (retryCount < maxRetries && !success) {

                    var result = removeService.call({
                        catalogID: catalogID,
                        categoryID: category.getID(),
                        productID: product.getID()
                    });

                    if (!result) {
                        Logger.error(
                            'Empty service response for SKU {0} | Attempt: {1}',
                            product.getID(),
                            retryCount + 1
                        );
                        retryCount++;
                        continue;
                    }

                    if (result.ok) {
                        removedCount++;
                        success = true;

                        Logger.info(
                            'Successfully removed SKU {0} from Category {1}',
                            product.getID(),
                            category.getID()
                        );

                    } else {
                        retryCount++;

                        Logger.error(
                            'Failed removing SKU {0} from Category {1} | Attempt: {2} | Status: {3}',
                            product.getID(),
                            category.getID(),
                            retryCount,
                            result.statusCode
                        );
                    }
                }

                if (!success) {
                    Logger.error(
                        'Exhausted retries for SKU {0} in Category {1}',
                        product.getID(),
                        category.getID()
                    );
                }
            }
        }
    });

    Logger.info('Sale Category Validation Completed.');
    Logger.info('Total Processed: ' + processedCount);
    Logger.info('Total Invalid Products: ' + invalidProducts.length);
    Logger.info('Total Removed from Sale Category: ' + removedCount);

    if (invalidProducts.length > 0) {
        Logger.info('Invalid Product IDs: ' + invalidProducts.join(', '));
    }

    return new Status(Status.OK);
};

exports.execute = validateSaleCategory;