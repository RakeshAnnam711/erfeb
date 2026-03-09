/**
 * Job Step Type that moves (or copies) files from folder A to folder B
 */

'use strict';

var Logger = require('dw/system/Logger').getLogger('custom.amazon.updateAmazonProductExportFlag');
const Transaction = require('dw/system/Transaction');
const inventoryServiceHelper = require('~/cartridge/scripts/helpers/updateAmazonProductExportFlagHelpers');
var ProductMgr = require('dw/catalog/ProductMgr');
var Status = require('dw/system/Status');

/**
 * Bootstrap function for the Job
 *
 * @return {dw.system.Status} Exit status for a job run
 */
var updateAmazonProductExportFlag = function (args) {
    var inventoryDataType = args.InventoryDataType;

    if (inventoryDataType == null || inventoryDataType == 0) {
        return '';
    }
    try {
        const productDetails = inventoryServiceHelper.getSoldInventoryDetails(inventoryDataType, {});
        Logger.info('Product List count =' +productDetails.length);
        for (let i = 0; i < productDetails.length; i++) {
            let product = ProductMgr.getProduct(productDetails[i].sku);
            if (product) {
                let amazonProductExport = product.custom.amazonProductExport;
                Logger.info('Product ID = '+ productDetails[i].sku +' and amazonProductexport status = ' + amazonProductExport);
                if (amazonProductExport ==  true || amazonProductExport == 'true') {
                    Logger.info('Condition inside Product ID = '+ productDetails[i].sku +' and amazonProductexport status = ' + amazonProductExport);
                    Transaction.wrap(function () {
                        product.custom.amazonProductExport = false;
                    });
                }
            }
        }
        Logger.info('Product List Updated');
        return new Status(Status.OK);
    } catch (error) {
        Logger.error('Error during updateAmazonProductExportFlag job execution at:: ' + new Date());
        Logger.error('Error during updateAmazonProductExportFlag job execution:: ' + JSON.stringify(error));
        return new Status(Status.ERROR);
    }
}

exports.updateAmazonProductExportFlag = updateAmazonProductExportFlag;
