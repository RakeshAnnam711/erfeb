/**
 * Job Step Type that moves (or copies) files from folder A to folder B
 */

'use strict';

importPackage(dw.system);
importPackage(dw.io);
var Logger = require('dw/system/Logger').getLogger('Custom.eBay.Exportproduct');
var File = require('dw/io/File');
var Status = require('dw/system/Status');
var FileWriter = require('dw/io/FileWriter');
var Site = require("dw/system/Site");
var HTTPClient = require('dw/net/HTTPClient');
const Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var storefrontBaseUrl = Site.getCurrent().getCustomPreferenceValue('storefrontBaseUrl');
/**
 * Bootstrap function for the Job
 *
 * @return {dw.system.Status} Exit status for a job run
*/
var exportEbayProductsMasterFeed = function (args) {

    var products : dw.util.SeekableIterator = dw.catalog.ProductMgr.queryAllSiteProducts();
    if (products) {
        var eBayProducts = [];
        var eBayProductsList = [];
        var skipProductList = [];
       

    while (products.hasNext()) {
        var product : dw.catalog.Product = products.next();
        if (eBayProducts.indexOf(product.ID) == -1 && product.custom.eBayProductExport && product.online) {
            Logger.info("Processing SKU : " + product.ID);
            var loaHelpers = require('*/cartridge/scripts/helpers/loaHelpers');
            var service = loaHelpers.loaService();
            var response = service.call(product.ID);
            var responseObject = response.object;
            var loaResponse = !empty(responseObject) && responseObject.text ? JSON.parse(responseObject.text) : '';
            Logger.info("loaResponse eBay product id before" + JSON.stringify(loaResponse));
            eBayProducts.push(product.ID);
            var productURL = URLUtils.url('Product-Show', 'pid', product.ID).toString();
            var fullProductURL = storefrontBaseUrl + productURL;
            Logger.info("Product URL: " + fullProductURL);
            var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
            var inventoryList = ProductInventoryMgr.getInventoryList('wgaca-web');
            var inventoryRecord = inventoryList ? inventoryList.getRecord(product.ID) : null;
            var ats = inventoryRecord ? inventoryRecord.getATS().value : 0;
            var images = {};
            images.large = [];
            var largeImages = product.getImages('large');
            if (largeImages.length > 0) {
                for (var i = 0; i < largeImages.length; i++) {
                    images.large.push({
                        url: 'https://www.whatgoesaroundnyc.com' + largeImages[i].url
                    });
                }
            }
            var headlineDescription = product.custom.headlineDescription;
            var condition = '';
            if (headlineDescription && headlineDescription.markup) {
                if (headlineDescription.markup.toLowerCase().indexOf('flawed gem condition') !== -1) {
                    condition = 'Flawed Gem';
                } else if (headlineDescription.markup.toLowerCase().indexOf('pristine condition') !== -1) {
                    condition = 'Pristine';
                } else if (headlineDescription.markup.toLowerCase().indexOf('excellent condition') !== -1) {
                    condition = 'Excellent';
                } else if (headlineDescription.markup.toLowerCase().indexOf('very good condition') !== -1) {
                    condition = 'Very Good';
                } else if (headlineDescription.markup.toLowerCase().indexOf('good condition') !== -1) {
                    condition = 'Good';
                }
            }
            var productPrice = product.getPriceModel();
            var webPricebook = 'wgaca-web-pricebook';
            var standardPrice = productPrice.getPriceBookPrice(webPricebook);
            var color_name;
            var style;
            var size_name;
            var country_as_labeled;
            var country_of_origin;
            var outer_material_type1;
            var material_composition;
            var serial = '';
            var year = '';
            var category = '';
            var subCategory = '';
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
                color_name = product.custom.color ? product.custom.color : '';
                style = product.custom.styleNumber ? product.custom.styleNumber : '';
                size_name = product.custom.sizing ? product.custom.sizing : '';
                country_as_labeled = product.custom.country_of_origin ? product.custom.country_of_origin : '';
                outer_material_type1 = product.custom.material ? product.custom.material : '';
                material_composition = product.custom.fdxComposition ? product.custom.fdxComposition : '';
                serial = product.custom.serial;
            }
            Logger.info("eBay product id before" + product.ID);
            if (product.custom.eBayProduct_Type == null) {
                Transaction.wrap(function () {
                    product.custom.eBayProduct_Type = !empty(loaResponse) ? loaResponse.results.category : '';
                });
            }
            if (product.ID && product.brand && product.UPC && condition && standardPrice && color_name && product.custom.country_of_origin && material_composition && product.shortDescription && product.shortDescription.source && category && subCategory) {
                if (subCategory == 'Earrings' && product.custom.eBayEarring_Design && (product.custom.eBayEarring_Design.value == null || empty(product.custom.eBayEarring_Design.value))) {
                    skipProductList.push({
                        item_sku: product.ID ? product.ID : '',
                        brand_name: product.brand ? product.brand : '',
                        item_name: product.name ? product.name : '',
                        external_product_id: product.UPC ? product.UPC : '',
                        condition: condition ? condition : '',
                        external_product_id_type: 'upc',
                        currency: 'USD',
                        standard_price: standardPrice ? standardPrice.value : '',
                        quantity: ats,
                        color_name: color_name,
                        style: style,
                        size_name: size_name,
                        country_as_labeled: country_as_labeled,
                        country_of_origin: product.custom.country_of_origin ? product.custom.country_of_origin : '',
                        outer_material_type1: outer_material_type1,
                        material_composition: material_composition,
                        mfn: serial,
                        year: year,
                        model_name: (product.shortDescription && product.shortDescription.source) ? product.shortDescription.source : '',
                        manufacturer: product.manufacturerName ? product.manufacturerName : product.brand,
                        closure: product.custom.closure ? product.custom.closure : '',
                        location: (product.custom.location && product.custom.location.length > 0) ? product.custom.location[0].value : '',
                        feed_product_type: category,
                        item_type: subCategory,
                        department_name: 'Womens',
                        age_range_description: 'Adult',
                        targetgender: 'female',
                        size_map: 'One Size',
                        care_instructions: 'Not Applicable',
                        product_description: '\'' + headlineDescription + '\'',
                        item_width: product.custom.width ? product.custom.width : '',
                        item_height: product.custom.height ? product.custom.height : '',
                        item_length: product.custom.length ? product.custom.length : '',
                        item_depth: product.custom.depth ? product.custom.depth : '',
                        fabric_type: product.custom.lining ? product.custom.lining : '',
                        item_weight: product.custom.weight ? product.custom.weight : '',
                        earring_design: product.custom.eBayEarring_Design.value ? product.custom.eBayEarring_Design.value : '',
                        eBay_today: (product.custom.eBayTodayProductExport !== null && !empty(product.custom.eBayTodayProductExport) && product.custom.eBayTodayProductExport) ? product.custom.eBayTodayProductExport : false,
                        image: images
                    });
                } else {
                    eBayProductsList.push({
                        item_sku: product.ID ? product.ID : '',
                        brand_name: product.brand ? product.brand : '',
                        item_name: product.name ? product.name : '',
                        external_product_id: product.UPC ? product.UPC : '',
                        condition: condition ? condition : '',
                        external_product_id_type: 'upc',
                        currency: 'USD',
                        standard_price: standardPrice ? standardPrice.value : '',
                        quantity: ats,
                        color_name: color_name,
                        style: style,
                        size_name: size_name,
                        country_as_labeled: country_as_labeled,
                        country_of_origin: product.custom.country_of_origin ? product.custom.country_of_origin : '',
                        outer_material_type1: outer_material_type1,
                        material_composition: material_composition,
                        mfn: serial,
                        year: year,
                        model_name: (product.shortDescription && product.shortDescription.source) ? product.shortDescription.source : '',
                        manufacturer: product.manufacturerName ? product.manufacturerName : product.brand,
                        closure: product.custom.closure ? product.custom.closure : '',
                        location: (product.custom.location && product.custom.location.length > 0) ? product.custom.location[0].value : '',
                        feed_product_type: category,
                        item_type: subCategory,
                        department_name: 'Womens',
                        age_range_description: 'Adult',
                        targetgender: 'female',
                        size_map: 'One Size',
                        care_instructions: 'Not Applicable',
                        product_description: '\'' + headlineDescription + '\'',
                        item_width: product.custom.width ? product.custom.width : '',
                        item_height: product.custom.height ? product.custom.height : '',
                        item_length: product.custom.length ? product.custom.length : '',
                        item_depth: product.custom.depth ? product.custom.depth : '',
                        fabric_type: product.custom.lining ? product.custom.lining : '',
                        item_weight: product.custom.weight ? product.custom.weight : '',
                        earring_design: product.custom.eBayEarring_Design.value ? product.custom.eBayEarring_Design.value : '',
                        eBay_today: (product.custom.eBayTodayProductExport !== null && !empty(product.custom.eBayTodayProductExport) && product.custom.eBayTodayProductExport) ? product.custom.eBayTodayProductExport : false,
                        image: images,
                        product_url: fullProductURL
                    });
                }
            } else {
                skipProductList.push({
                    item_sku: product.ID ? product.ID : '',
                    brand_name: product.brand ? product.brand : '',
                    item_name: product.name ? product.name : '',
                    external_product_id: product.UPC ? product.UPC : '',
                    condition: condition ? condition : '',
                    external_product_id_type: 'upc',
                    currency: 'USD',
                    standard_price: standardPrice ? standardPrice.value : '',
                    quantity: ats,
                    color_name: color_name,
                    style: style,
                    size_name: size_name,
                    country_as_labeled: country_as_labeled,
                    country_of_origin: product.custom.country_of_origin ? product.custom.country_of_origin : '',
                    outer_material_type1: outer_material_type1,
                    material_composition: material_composition,
                    mfn: serial,
                    year: year,
                    model_name: (product.shortDescription && product.shortDescription.source) ? product.shortDescription.source : '',
                    manufacturer: product.manufacturerName ? product.manufacturerName : product.brand,
                    closure: product.custom.closure ? product.custom.closure : '',
                    location: (product.custom.location && product.custom.location.length > 0) ? product.custom.location[0].value : '',
                    feed_product_type: category,
                    item_type: subCategory,
                    department_name: 'Womens',
                    age_range_description: 'Adult',
                    targetgender: 'female',
                    size_map: 'One Size',
                    care_instructions: 'Not Applicable',
                    product_description: '\'' + headlineDescription + '\'',
                    item_width: product.custom.width ? product.custom.width : '',
                    item_height: product.custom.height ? product.custom.height : '',
                    item_length: product.custom.length ? product.custom.length : '',
                    item_depth: product.custom.depth ? product.custom.depth : '',
                    fabric_type: product.custom.lining ? product.custom.lining : '',
                    item_weight: product.custom.weight ? product.custom.weight : '',
                    earring_design: product.custom.eBayEarring_Design ? product.custom.eBayEarring_Design : '',
                    eBay_today: (product.custom.eBayTodayProductExport !== null && !empty(product.custom.eBayTodayProductExport) && product.custom.eBayTodayProductExport) ? product.custom.eBayTodayProductExport : false,
                    image: images
                });
            }

            Logger.info("eBay product id after" + product.ID);
            if (!empty(product.availabilityModel.inventoryRecord) && product.availabilityModel.inventoryRecord.allocation.value === 0) {
                Logger.info('Out-of-stock SKU included: ' + product.ID);
            }
            
        }
    }

        Logger.info("eBay product =" + eBayProducts.length);
        Logger.info("skipped product length =" + skipProductList.length);
        //Logger.info("skipped product list" + JSON.stringify(skipProductList));
        try {
            var targetFolder = new File(File.IMPEX + File.SEPARATOR + 'ebay-feed-products');
            var siteId = Site.getCurrent().ID;
            if (!targetFolder.exists()) {
                targetFolder.mkdirs();
            }

            var newFile = new File(targetFolder.fullPath + File.SEPARATOR + siteId + '-ebay-products.json');

            if (!newFile.exists()) {
                newFile.createNewFile();
            }

            var fileWriter = new FileWriter(newFile, 'UTF-8');
            var data = JSON.stringify(eBayProductsList);
            fileWriter.writeLine(data);
            fileWriter.close();
        } catch (e) {
            Logger.error("eBay failed " + e);
            return new Status(Status.ERROR);
        }

        if (skipProductList.length > 0) {
            generateCsvForSkippedProducts(skipProductList)
        }

        return new Status(Status.OK);
    }
}

/**
 * Generate csv for skipped products
 *
 * @param skippedProductList
 * @returns {*}
 */
function generateCsvForSkippedProducts(skippedProductList) {
    try {
        var CSVStreamWriter = require('dw/io/CSVStreamWriter');
        var targetFolder = new File(File.IMPEX + File.SEPARATOR + 'ebay-feed-products');
        if (!targetFolder.exists()) {
            targetFolder.mkdirs();
        }

        var siteId = Site.getCurrent().ID;
        var csvFile = new File(targetFolder.fullPath + File.SEPARATOR + siteId + '-skipped-ebay-products.csv');
        if (!csvFile.exists()) {
            csvFile.createNewFile();
        }

        var fileWriter = new FileWriter(csvFile);
        var csvStreamWriter = new CSVStreamWriter(fileWriter, ',');

        var csvHeader = [
            'sku',
            'brand',
            'upc',
            'condition',
            'standard_price',
            'color_name',
            'country_of_origin',
            'material_composition',
            'model_name',
            'category',
            'sub_category',
            'eBay_earring_design',
        ];

        // Generate CSV header row
        csvStreamWriter.writeNext(csvHeader);
        var productCount = skippedProductList.length;

        for (var i = 0; i < productCount; i++) {
            csvStreamWriter.writeNext([
                skippedProductList[i].item_sku,
                skippedProductList[i].brand_name,
                skippedProductList[i].external_product_id,
                skippedProductList[i].condition,
                skippedProductList[i].standard_price,
                skippedProductList[i].color_name,
                skippedProductList[i].country_of_origin,
                skippedProductList[i].material_composition,
                skippedProductList[i].model_name,
                skippedProductList[i].feed_product_type,
                skippedProductList[i].item_type,
                skippedProductList[i].earring_design,
            ])
        }
        fileWriter.flush();
        csvStreamWriter.close();
        fileWriter.close();
    } catch (e) {
        Logger.error("Failed to generate CSV for skipped product list " + e);
        return new Status(Status.ERROR);
    }
}

exports.exportEbayProductsMasterFeed = exportEbayProductsMasterFeed;
