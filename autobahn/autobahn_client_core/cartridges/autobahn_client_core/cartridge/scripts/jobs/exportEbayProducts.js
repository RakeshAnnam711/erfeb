/**
 * Job Step Type that moves (or copies) files from folder A to folder B
 */

'use strict';

importPackage(dw.system);
importPackage(dw.io);
var Logger = require('dw/system/Logger').getLogger('custom.ebay.exportDeltaProduct');
var File = require('dw/io/File');
var Status = require('dw/system/Status');
var FileWriter = require('dw/io/FileWriter');
var Site = require("dw/system/Site");
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var inventoryList = ProductInventoryMgr.getInventoryList('wgaca-web');
/**
 * Bootstrap function for the Job
 *
 * @return {dw.system.Status} Exit status for a job run
 */
var exportProductToEbayDelta = function (args) {
    var products : dw.util.SeekableIterator = dw.catalog.ProductMgr.queryAllSiteProducts();  
    if (products) {
        var ebayDeltaProducts = [];
        var ebayDeltaProductsList = [];
	    while(products.hasNext()) {
		    var product : dw.catalog.Product = products.next();
            if (ebayDeltaProducts.indexOf(product.ID) == -1 && product.custom.eBayProductExport && product.custom.eBayProduct_Type !== null && !empty(product.custom.eBayProduct_Type)) {
                var productPrice = product.getPriceModel();
                var standardPriceBook = productPrice.getPriceBookPrice('wgaca-web-pricebook');
                var discountPriceBook = productPrice.getPriceBookPrice('wgaca-discount-pricebook');
                var standardPrice = standardPriceBook ? standardPriceBook.value : '';
                var discountPrice = discountPriceBook && discountPriceBook.value != 0 ? discountPriceBook.value : standardPrice;
                var inventoryRecord = inventoryList ? inventoryList.getRecord(product.ID) : null;
                var ats = inventoryRecord ? inventoryRecord.getATS().value : 0;
                ebayDeltaProducts.push(product.ID);
                ebayDeltaProductsList.push({
                    item_sku : product.ID ? product.ID : '',
                    external_product_id_type: product.manufacturerName ? product.manufacturerName : product.UPC,
                    quantity: (product.online && product.availabilityModel.availabilityStatus == 'IN_STOCK' && !empty(product.availabilityModel.inventoryRecord)) ? ats : 0,
                    product_type: product.custom.eBayProduct_Type,
                    ebay_today: (product.custom.eBayTodayProductExport !== null && !empty(product.custom.eBayTodayProductExport) && product.custom.eBayTodayProductExport) ? product.custom.eBayTodayProductExport : false,
                    location: (product.custom.location && product.custom.location.length > 0) ? product.custom.location[0].value : '',
                    currency: 'USD',
                    standard_price: standardPrice,
                    sale_price: discountPrice,
                });
            }
        }
        Logger.info("ebay product delta job "+ ebayDeltaProducts.length);
        try {
            var targetFolder = new File(File.IMPEX + File.SEPARATOR + 'ebay-delta-feed-products');
            if (!targetFolder.exists()) {
                targetFolder.mkdirs();
            }

            var newFile = new File(targetFolder.fullPath + File.SEPARATOR + 'wgaca-ebay-OH-feed.json');

            if (!newFile.exists()) {
                newFile.createNewFile();
            }

            var fileWriter = new FileWriter(newFile, 'UTF-8');
            var data = JSON.stringify(ebayDeltaProductsList);
            fileWriter.writeLine(data);
            fileWriter.close();
            return new Status(Status.OK);
        } catch (e) {
            Logger.error("ebay delta product feed failed " + e);
            return new Status(Status.ERROR);
        }
    };
}

exports.exportProductToEbayDelta = exportProductToEbayDelta;