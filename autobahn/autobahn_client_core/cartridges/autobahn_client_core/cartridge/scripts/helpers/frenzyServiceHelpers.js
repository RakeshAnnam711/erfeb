'use strict';

const FrenzyServiceWrapper = require('~/cartridge/scripts/services/frenzyService');
var Logger = require('dw/system/Logger').getLogger('custom.amazon.frenzyServiceHelpers');
var System = require('dw/system/System');

/**
 * This is a description of the postFrenzyServiceWrapper function.
 * This is service wrapper function
 * @param {object} params - This is the feed type - delta / full
 * @returns {Object} - This will return product details object with quantity
 */
const postFrenzyServiceWrapper = function (params) {
    try {
        const serviceId = 'FrenzyAIService';
        var result = FrenzyServiceWrapper.frenzyService(serviceId).call(params);
        var localeOverride = (request.locale || 'en-us').toLowerCase().replace('_','-');

        if (!result.ok) {
            Logger.error("FrenzyServicehelpers  service - "+ JSON.stringify(result.errorMessage));
        } else {
            var object = result.object;
            if (!empty(object.matching_products)) {
                object.matching_products = object.matching_products.map(product => {
                    product.org_prod_url = System.getInstanceType() !== System.PRODUCTION_SYSTEM ? product.org_prod_url.replace(/.*\/\/.*\.com\//gi,'/') : product.org_prod_url;
                    product.org_prod_url = product.org_prod_url.replace('en-us', localeOverride);
                    return product;
                });
            };

            const response = object;
        }
    } catch (error) {
        Logger.error('error FrenzyServicehelpers service' + JSON.stringify(error));
    }

    return response;
};

module.exports = {
    postFrenzyServiceWrapper: postFrenzyServiceWrapper
};
