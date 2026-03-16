'use strict';

importPackage(dw.system);
importPackage(dw.io);

var Logger = require('dw/system/Logger').getLogger('Custom.Zeta.ExportProducts');
var File = require('dw/io/File');
var Status = require('dw/system/Status');
var FileWriter = require('dw/io/FileWriter');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var ProductMgr = require('dw/catalog/ProductMgr');
var URLUtils = require('dw/web/URLUtils');

/* ---------------- SNAKE CASE HELPER ---------------- */

function toSnakeCase(str) {

    if (!str) return "";

    return str
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();
}

/* ---------------- MAIN JOB ---------------- */

var exportZetaProductsFeed = function () {

    Logger.info("Zeta Product Export Started");

    var products = ProductMgr.queryAllSiteProducts();

    var targetFolder = new File(File.IMPEX + File.SEPARATOR + 'zeta-product-feed');

    if (!targetFolder.exists()) {
        targetFolder.mkdirs();
    }

    var csvFile = new File(targetFolder.fullPath + File.SEPARATOR + 'zeta-products.csv');

    if (csvFile.exists()) {
        csvFile.remove();
    }

    csvFile.createNewFile();

    var fileWriter = new FileWriter(csvFile, "UTF-8");
    var csvWriter = new CSVStreamWriter(fileWriter);

    /* ---------------- CSV HEADER ---------------- */

    csvWriter.writeNext([
        "resource_id",
        "resource-type",
        "url",
        "title",
        "thumbnail",
        "product_activation_date",
        "product_name",
        "is_available",
        "Product_description",
        "image_url",
        "product_url",
        "product_code",
        "regular_price",
        "sale_price",
        "c__pCategory",
        "c__pSubCategory",
        "brand"
    ]);

    while (products.hasNext()) {

        var product = products.next();

        try {

            if (!product || !product.online) {
                continue;
            }

            Logger.info("Processing product: " + product.ID);

            /* ---------------- PRODUCT URL ---------------- */

            var productURL = URLUtils.abs('Product-Show', 'pid', product.ID).toString();

            /* ---------------- IMAGE ---------------- */

            var imageUrl = "";
            var images = product.getImages('large');

            if (images.length > 0) {
                imageUrl = images[0].absURL.toString();
            }

            /* ---------------- CATEGORY ---------------- */

            var category = "";
            var subCategory = "";

            if (product.primaryCategory) {

                category = product.primaryCategory.displayName;

                if (product.primaryCategory.parent) {
                    subCategory = product.primaryCategory.parent.displayName;
                }
            }

            /* ---------------- PRICEBOOK LOGIC ---------------- */

            var priceModel = product.getPriceModel();

            var regularPrice = "";
            var salePrice = "";

            var webPrice = priceModel.getPriceBookPrice("wgaca-web-pricebook");
            var discountPrice = priceModel.getPriceBookPrice("wgaca-discount-pricebook");

            if (webPrice && webPrice.available) {
                regularPrice = webPrice.value;
            }

            if (discountPrice && discountPrice.available) {
                salePrice = discountPrice.value;
            }

            /* ---------------- DESCRIPTION ---------------- */

            var description = "";

            if (product.shortDescription && product.shortDescription.source) {
                description = product.shortDescription.source;
            }

            /* ---------------- BRAND ---------------- */

            var brand = product.brand ? product.brand : "";

            /* ---------------- DATE ---------------- */

            var activationDate = new Date().toISOString();

            /* ---------------- AVAILABILITY ---------------- */

            var isAvailable = product.availabilityModel.inStock;

            /* ---------------- CSV ROW ---------------- */

            var row = [];

            row.push(product.ID.toLowerCase());
            row.push("product");
            row.push(productURL);
            row.push(toSnakeCase(product.name));
            row.push(imageUrl);
            row.push(activationDate);
            row.push(toSnakeCase(product.name));
            row.push(isAvailable);
            row.push(toSnakeCase(description));
            row.push(imageUrl);
            row.push(productURL);
            row.push(product.ID.toLowerCase());
            row.push(regularPrice);
            row.push(salePrice);
            row.push(toSnakeCase(category));
            row.push(toSnakeCase(subCategory));
            row.push(toSnakeCase(brand));

            csvWriter.writeNext(row);

        } catch (e) {

            Logger.error("Error processing product " + product.ID + " : " + e);

        }
    }

    csvWriter.close();
    fileWriter.close();

    Logger.info("Zeta Product Export Completed");

    return new Status(Status.OK);
};

exports.exportZetaProductsFeed = exportZetaProductsFeed;