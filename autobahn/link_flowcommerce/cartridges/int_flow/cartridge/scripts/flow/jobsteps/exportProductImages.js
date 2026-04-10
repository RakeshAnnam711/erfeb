/* global empty:false */
'use strict';

/**
 * Exports the catalog Product Images as a CSV File
 * @param {Object} options - Job options
 * @returns {dw.system.Status} Status Code
 */
function exportProductImages(options) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Status = require('dw/system/Status');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var JobHelper = require('*/cartridge/scripts/flow/helpers/jobHelper');

    var productImageSize = options.productImageSize;
    var productCount = 0;
    var products;
    var product;
    var image;
    var imageUrl;
    var csv;

    if (!FlowHelper.isFlowEnabled && !FlowHelper.enableJobs) {
        return new Status(Status.OK, null, 'Flow is disabled');
    }

    try {
        JobHelper.createFolders();
        products = ProductMgr.queryAllSiteProducts();
        csv = JobHelper.createCSVFile(JobHelper.paths.EXPORT_FOLDER + '/' + FlowHelper.organizationId + '_images.csv');
        csv.row(['number', 'images[0][url]']);

        while (products.hasNext()) {
            product = products.next();

            if (!product.master && !product.productSet) {
                image = product.getImage(productImageSize);

                if (!empty(image)) {
                    imageUrl = FlowHelper.imageHost ? image.httpsURL.host(FlowHelper.imageHost) : image.httpsURL;
                    csv.row([product.ID, imageUrl]);
                    productCount++;
                }
            }
        }
    } catch (e) {
        FlowHelper.logger.error('exportJobSteps.js - exportProductImages error message: ' + e.message);
        return new Status(Status.ERROR, null, 'An error happened while trying to export images for Flow: ' + e.message);
    } finally {
        if (csv) {
            csv.close();
        }
    }

    return new Status(Status.OK, null, productCount + ' products images ready to send to Flow.');
}

exports.exportProductImages = exportProductImages;
