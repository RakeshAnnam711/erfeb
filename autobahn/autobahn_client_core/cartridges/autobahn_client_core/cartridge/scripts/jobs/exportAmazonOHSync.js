'use strict';

var Logger = require('dw/system/Logger').getLogger(
    'custom.amazon.manualSkuSync'
);

var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');

var Status = require('dw/system/Status');

var ProductMgr = require('dw/catalog/ProductMgr');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');

var Site = require('dw/system/Site');

var OUTPUT_FOLDER = File.IMPEX + File.SEPARATOR + 'amazon-delta-feed-products';

var OUTPUT_FILE_NAME = 'wgaca-amazon-OH-feed.json';

function getSkuList() {
    var skuString = Site.getCurrent().getCustomPreferenceValue(
        'amazonManualSyncSKUs'
    );

    if (!skuString) {
        Logger.error('Custom Preference amazonManualSyncSKUs is empty');

        return [];
    }

    var skuList = skuString
        .split(',')
        .map(function (sku) {
            return sku.trim();
        })
        .filter(function (sku) {
            return sku;
        });

    Logger.info('Total SKUs loaded from custom preference: ' + skuList.length);

    return skuList;
}


function isDisabledInAnyCatalog(product) {
    if (!product) {
        return false;
    }

    var categories = product.getAllCategories().iterator();

    while (categories.hasNext()) {
        var cat = categories.next();

        if (cat.ID === 'disabled-skus') {
            return true;
        }
    }

    return false;
}

function exportManualSkuSync(args) {
    try {

        var inventoryList = ProductInventoryMgr.getInventoryList(
            args.InventoryID
        );

        var skuList = getSkuList();

        if (!skuList.length) {
            Logger.error('No SKUs available for manual sync');

            return new Status(Status.ERROR);
        }

        var outputFolder = new File(OUTPUT_FOLDER);

        if (!outputFolder.exists()) {
            outputFolder.mkdirs();
        }

        var outputFile = new File(
            outputFolder.fullPath + File.SEPARATOR + OUTPUT_FILE_NAME
        );

        if (!outputFile.exists()) {
            outputFile.createNewFile();
        }

        var writer = new FileWriter(outputFile, 'UTF-8');

        writer.writeLine('[');

        var first = true;

        var count = 0;


        for (var i = 0; i < skuList.length; i++) {
            var sku = skuList[i];

            try {
                var product = ProductMgr.getProduct(sku);

                if (!product || !product.isProduct()) {
                    Logger.warn('Product not found: ' + sku);

                    continue;
                }

                var inventoryRecord = inventoryList
                    ? inventoryList.getRecord(product.ID)
                    : null;

                var ats = inventoryRecord ? inventoryRecord.getATS().value : 0;

                var priceModel = product.getPriceModel();

                var standardPrice = priceModel.getPriceBookPrice(
                    args.StandardPriceBookID
                );

                var discountPrice = priceModel.getPriceBookPrice(
                    args.DiscountPriceBookID
                );

                var std = standardPrice ? standardPrice.value : '';

                var sale =
                    discountPrice && discountPrice.value !== 0
                        ? discountPrice.value
                        : std;

                var isDisabled = isDisabledInAnyCatalog(product);

                var searchable = product.isOnline();

                var quantity = isDisabled && !searchable ? 0 : ats;

                var row = {
                    item_sku: product.ID,

                    external_product_id_type:
                        product.manufacturerName || product.UPC,

                    quantity: quantity,

                    product_type: product.custom.amazonProduct_Type || '',

                    amazon_today:
                        product.custom.amazonTodayProductExport || false,

                    location:
                        product.custom.location &&
                        product.custom.location.length > 0
                            ? product.custom.location[0].value
                            : '',

                    currency: 'USD',

                    standard_price: std,

                    sale_price: sale
                };

                if (!first) {
                    writer.writeLine(',');
                }

                writer.write(JSON.stringify(row));

                first = false;

                count++;
            } catch (e) {
                Logger.error(
                    'Error processing SKU: ' + sku + ' Error: ' + e.message
                );
            }
        }

        writer.writeLine('');

        writer.writeLine(']');

        writer.close();

        Logger.info('Manual SKU sync completed. Count: ' + count);

        return new Status(Status.OK);
    } catch (e) {
        Logger.error('Manual SKU sync failed: ' + e.message);

        return new Status(Status.ERROR);
    }
}

exports.exportManualSkuSync = exportManualSkuSync;
