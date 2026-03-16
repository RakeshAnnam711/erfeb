'use strict';

var Logger = require('dw/system/Logger').getLogger('Custom.Amazon.Exportproduct');
var File = require('dw/io/File');
var Status = require('dw/system/Status');
var FileWriter = require('dw/io/FileWriter');
var Site = require("dw/system/Site");
var URLUtils = require('dw/web/URLUtils');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var loaHelpers = require('*/cartridge/scripts/helpers/loaHelpers');
var UUIDUtils = require('dw/util/UUIDUtils');
var catalog = CatalogMgr.getCatalog('storefront-catalog-wgaca');
var storefrontBaseUrl = Site.getCurrent().getCustomPreferenceValue('storefrontBaseUrl');
var adpxService = require('*/cartridge/scripts/services/adpxService');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var exportProductsUp = function () {
    var products = ProductMgr.queryProductsInCatalog(catalog);
    Logger.info("Exporting products from catalog: " + catalog.ID);
    Logger.info("Total products in catalog '" + catalog.ID + "': " + products.getCount());

    var amazonProductsList = [];
    var processedCount = 0;
    var batchSize = 10000;
    var batchIndex = 1;
    var targetFolder = new File(File.IMPEX + File.SEPARATOR + 'adpx-feed');
    if (!targetFolder.exists()) targetFolder.mkdirs();

    var removeHashCode = function(url) {
        // Regex pattern to detect default/<hash>/images
        var pattern = /([a-zA-Z_-]+)\/(dw[a-zA-Z0-9]+|v\d+)(\/+images)/;
        return url.replace(pattern, '$1$3');
    };

    try {
        while (products.hasNext()) {
            var product = products.next();
            var isOnline = product.online;
            var creationDate = product.creationDate;
            var now = new Date();

            var daysAgo365 = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
            var isCreatedInLast365Days = creationDate.getTime() >= daysAgo365.getTime();

            var shouldInclude = isOnline || (!isOnline && isCreatedInLast365Days);

            if (!shouldInclude) {
                Logger.debug('Skipping product ' + product.ID);
                continue;
            }
         
            Logger.info("Processing SKU: " + product.ID);

            var loaResponse = {};
            try {
                var service = loaHelpers.loaService();
                var response = service.call(product.ID);
                var responseObject = response.object;
                if (response.ok && responseObject && responseObject.text) {
                    loaResponse = JSON.parse(responseObject.text);
                }
            } catch (e) {
                Logger.warn("Failed to parse LOA response for " + product.ID + ": " + e.message);
            }

            var productURL = URLUtils.url('Product-Show', 'pid', product.ID).toString();
            var fullProductURL = storefrontBaseUrl + productURL;

            var images = { large: [] };
            var largeImages = product.getImages('large');
            for (var i = 0; i < largeImages.length; i++) {
                images.large.push({
                    url: removeHashCode(storefrontBaseUrl + largeImages[i].url)
                });
            }

            var headlineDescription = product.custom.headlineDescription;
            var condition = '';
            if (headlineDescription && headlineDescription.markup) {
                var htmlContent = headlineDescription.markup.toLowerCase();
                if (htmlContent.indexOf('flawed gem condition') !== -1) condition = 'Flawed Gem';
                else if (htmlContent.indexOf('pristine condition') !== -1) condition = 'Pristine';
                else if (htmlContent.indexOf('excellent condition') !== -1) condition = 'Excellent';
                else if (htmlContent.indexOf('very good condition') !== -1) condition = 'Very Good';
                else if (htmlContent.indexOf('good condition') !== -1) condition = 'Good';
            }

            var productPrice = product.getPriceModel();
            var standardPrice = productPrice.getPriceBookPrice('wgaca-web-pricebook');
            var discountPrice = productPrice.getPriceBookPrice('wgaca-discount-pricebook');

            var color_name, style, size_name, country_as_labeled, outer_material_type1, material_composition;
            var serial = '', year = '', category = '', subCategory = '';

            if (loaResponse.results && !empty(loaResponse.results)) {
                color_name = loaResponse.results.color;
                style = loaResponse.results.style;
                size_name = loaResponse.results.size;
                country_as_labeled = loaResponse.results.origin;
                outer_material_type1 = loaResponse.results.material;
                material_composition = loaResponse.results.material;
                serial = loaResponse.results.serial;
                year = loaResponse.results.year;
                category = loaResponse.results.category;
                subCategory = loaResponse.results.subcategory;
            } else {
                color_name = product.custom.color || '';
                style = product.custom.styleNumber || '';
                size_name = product.custom.sizing || '';
                country_as_labeled = product.custom.country_of_origin || '';
                outer_material_type1 = product.custom.material || '';
                material_composition = product.custom.fdxComposition || '';
                serial = product.custom.serial;
            }

            var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
            var inventoryList = ProductInventoryMgr.getInventoryList('wgaca-web');
            var inventoryRecord = inventoryList ? inventoryList.getRecord(product.ID) : null;
            var ats = inventoryRecord ? inventoryRecord.getATS().value : 0;

            amazonProductsList.push({
                item_sku: product.ID,
                brand_name: product.brand || '',
                item_name: product.name || '',
                external_product_id: product.UPC || '',
                condition: condition,
                external_product_id_type: 'upc',
                currency: 'USD',
                standard_price: standardPrice ? standardPrice.value : '',
                discount_price: discountPrice ? discountPrice.value : '',
                quantity: ats,
                color_name: color_name,
                style: style,
                size_name: size_name,
                country_as_labeled: country_as_labeled,
                country_of_origin: product.custom.fdxCountryOfOrigin || '',
                outer_material_type1: outer_material_type1,
                material_composition: material_composition,
                mfn: serial,
                year: year,
                model_name: product.shortDescription && product.shortDescription.source ? product.shortDescription.source : '',
                manufacturer: product.manufacturerName || product.brand,
                closure: product.custom.closure || '',
                location: (product.custom.location && product.custom.location.length > 0) ? product.custom.location[0].value : '',
                feed_product_type: category,
                item_type: subCategory,
                department_name: 'Womens',
                age_range_description: 'Adult',
                targetgender: 'female',
                size_map: 'One Size',
                care_instructions: 'Not Applicable',
                product_description: '\'' + headlineDescription + '\'',
                item_width: product.custom.width || '',
                item_height: product.custom.height || '',
                item_length: product.custom.length || '',
                item_depth: product.custom.depth || '',
                fabric_type: product.custom.lining || '',
                item_weight: product.custom.weight || '',
                earring_design: product.custom.amazonEarring_Design && product.custom.amazonEarring_Design.value || '',
                amazon_today: product.custom.amazonTodayProductExport,
                image: images,
                product_url: fullProductURL,
                amazon_export: product.custom.amazonProductExport,
                skip_new_arrivals: product.custom.skip_new_arrivals,
                best_seller: product.custom.best_seller,
                online:isOnline
            });

            processedCount++;

            if (amazonProductsList.length === batchSize) {
                var fileName = 'adpx-feed-batch' + batchIndex + '.json';
                var newFile = new File(targetFolder.fullPath + File.SEPARATOR + fileName);
                if (!newFile.exists()) {
                    newFile.createNewFile();
                }

                var fileWriter = new FileWriter(newFile, 'UTF-8');
                fileWriter.writeLine(JSON.stringify(amazonProductsList));
                fileWriter.close();

                Logger.info('Batch ' + batchIndex + ' JSON file created: ' + fileName);
                var response = adpxService.sendFeedUpdate({
                    event_id: UUIDUtils.createUUID(),
                    batch_id: 'batch' + batchIndex,
                    updated_at: new Date().toISOString()
                });
                
                if (response) {
                    Logger.info('ADPX feed update successful for batch ' + batchIndex);
                } else {
                    Logger.error('ADPX feed update failed for batch ' + batchIndex);
                }
                
                batchIndex++;
                amazonProductsList.length = 0; // Reset for next batch
            }
        }

        // Final batch write
        if (amazonProductsList.length > 0) {
            var finalFileName = 'adpx-feed-batch' + batchIndex + '.json';
            var finalFile = new File(targetFolder.fullPath + File.SEPARATOR + finalFileName);
            if (!finalFile.exists()) {
                finalFile.createNewFile();
            }

            var finalWriter = new FileWriter(finalFile, 'UTF-8');
            finalWriter.writeLine(JSON.stringify(amazonProductsList));
            finalWriter.close();

            Logger.info('Final batch ' + batchIndex + ' JSON file created: ' + finalFileName);
            var response = adpxService.sendFeedUpdate({
                event_id: UUIDUtils.createUUID(),
                batch_id: 'batch' + batchIndex,
                updated_at: new Date().toISOString()
            });
            
            if (response) {
                Logger.info('ADPX feed update successful for batch ' + batchIndex);
            } else {
                Logger.error('ADPX feed update failed for batch ' + batchIndex);
            }
        }

        Logger.info("Total Products Processed: " + processedCount);
    } finally {
        products.close(); // Ensures system resources are cleaned up
    }

    return new Status(Status.OK);
};

exports.exportProductsUp = exportProductsUp;



