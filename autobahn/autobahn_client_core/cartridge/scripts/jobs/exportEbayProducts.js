'use strict';

importPackage(dw.system);
importPackage(dw.io);
var Logger = require('dw/system/Logger').getLogger(
    'custom.ebay.exportDeltaProduct'
);
var File = require('dw/io/File');
var Status = require('dw/system/Status');
var FileWriter = require('dw/io/FileWriter');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var inventoryList = ProductInventoryMgr.getInventoryList('wgaca-web');
var exportProductToEbayDelta = function (args) {
    try {
        var targetFolder = new File(
            File.IMPEX + File.SEPARATOR + 'ebay-delta-feed-products'
        );
        if (!targetFolder.exists()) {
            targetFolder.mkdirs();
        }

        var newFile = new File(
            targetFolder.fullPath + File.SEPARATOR + 'wgaca-ebay-OH-feed.json'
        );

        if (!newFile.exists()) {
            newFile.createNewFile();
        }

        var fileWriter = new FileWriter(newFile, 'UTF-8');
        // Start JSON array
        fileWriter.writeLine('[');
        var firstRecord = true;

        var catalog = CatalogMgr.getCatalog('wgaca-master-catalog');
        var products = ProductMgr.queryProductsInCatalog(catalog);

        var ebayDeltaProducts = [];

        while (products.hasNext()) {
            var product = products.next();

            if (
                ebayDeltaProducts.indexOf(product.ID) === -1 &&
                product.custom.eBayProductExport &&
                product.custom.eBayProduct_Type !== null &&
                !empty(product.custom.eBayProduct_Type)
            ) {
                var productPrice = product.getPriceModel();

                var standardPriceBook = productPrice.getPriceBookPrice(
                    'wgaca-web-pricebook'
                );
                var discountPriceBook = productPrice.getPriceBookPrice(
                    'wgaca-discount-pricebook'
                );

                var standardPrice = standardPriceBook
                    ? standardPriceBook.value
                    : '';
                var discountPrice =
                    discountPriceBook && discountPriceBook.value !== 0
                        ? discountPriceBook.value
                        : standardPrice;

                var inventoryRecord = inventoryList
                    ? inventoryList.getRecord(product.ID)
                    : null;

                var ats = inventoryRecord ? inventoryRecord.getATS().value : 0;

                ebayDeltaProducts.push(product.ID);

                var productJSON = {
                    item_sku: product.ID || '',
                    external_product_id_type: product.manufacturerName
                        ? product.manufacturerName
                        : product.UPC,
                    quantity:
                        product.online &&
                            product.availabilityModel.availabilityStatus ===
                            'IN_STOCK' &&
                            !empty(product.availabilityModel.inventoryRecord)
                            ? ats
                            : 0,
                    product_type: product.custom.eBayProduct_Type,
                    ebay_today:
                        product.custom.eBayTodayProductExport !== null &&
                            !empty(product.custom.eBayTodayProductExport) &&
                            product.custom.eBayTodayProductExport
                            ? product.custom.eBayTodayProductExport
                            : false,
                    location:
                        product.custom.location &&
                            product.custom.location.length > 0
                            ? product.custom.location[0].value
                            : '',
                    currency: 'USD',
                    standard_price: standardPrice,
                    sale_price: discountPrice
                };

                // Add comma except first record
                if (!firstRecord) {
                    fileWriter.writeLine(',');
                }

                fileWriter.write(JSON.stringify(productJSON));

                firstRecord = false;
            }
        }

        // End JSON array
        fileWriter.writeLine('');
        fileWriter.writeLine(']');
        fileWriter.close();
        Logger.info('ebay product delta job completed');
        return new Status(Status.OK);
    } catch (e) {
        Logger.error('ebay delta product feed failed ' + e);
        return new Status(Status.ERROR);
    }
};

exports.exportProductToEbayDelta = exportProductToEbayDelta;
