'use strict';

const util = require('~/cartridge/scripts/util/amazonUtil');
const amazonProductExportFlagService = require('~/cartridge/scripts/services/updateAmazonProductExportFlagService');
var Logger = require('dw/system/Logger').getLogger('custom.amazon.updateAmazonProductExportFlagHelpers');


/**
 * This is a description of the getSoldInventoryDetails function.
 * This is going to get inventory details that Amazon product sold from Lama
 * @param {string} inventoryDataType - This is the feed type - delta / full
 * @returns {Object} - This will return product details object with quantity
 */
const getSoldInventoryDetails = function (inventoryDataType) {
    let productDetails = null;
    try {
        const serviceId = util.getAmazonServiceId();
        const data = {
            endpoint: '/' + inventoryDataType
        };

        const result = amazonProductExportFlagService.updateAmazonProductExportFlagService(serviceId).call(data);

        if (!result.ok) {
            Logger.error("updateAmazonProductExportFlag  service - "+ JSON.stringify(result.errorMessage));
        } else {
            const response = result.object;
            if (util.SUCCESS_CODES.indexOf(response.statusCode) !== -1) {
                productDetails = JSON.parse(response.text);
            } else {
                Logger.error("Error response received amazon inventory product service - "+ JSON.stringify(result));
            }
        }
    } catch (error) {
        Logger.error('Error received while calling Inventory serive' + JSON.stringify(error));
    }

    return productDetails;
};

module.exports = {
    getSoldInventoryDetails: getSoldInventoryDetails
};