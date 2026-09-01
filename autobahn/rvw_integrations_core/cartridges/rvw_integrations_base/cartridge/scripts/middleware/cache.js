'use strict';

var base = module.superModule;

var System = require('dw/system/System');
var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');

/**
 * Applies the inventory sensitive dynamic page cache.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @param {Function} baseFn - Next call in the middleware chain
 * @returns {void}
*/
function applyDynamicCacheExtension(baseFn) {
    if (typeof baseFn !== 'function') throw new Error('Base cache function does not exist or is incorrectly passed.');

    return function (req, res, next) {
        baseFn.call(this, req, res, function () {
            var viewData = res.getViewData();
            var params = req.querystring;
            var pid = viewData.product && viewData.product.id || params.pid;
            var Product = !empty(pid) && ProductMgr.getProduct(pid);
            var availabilityModel = Product && Product.availabilityModel;
            var inventoryRecord = availabilityModel && availabilityModel.inventoryRecord;
            var hoursToOutOfStock = availabilityModel && availabilityModel.timeToOutOfStock;

            // if timeToOutOfStock is 0, no change
            if (hoursToOutOfStock > 0 && inventoryRecord && !inventoryRecord.perpetual) {
                res.cachePeriodUnit = 'minutes';
                // Cut minutes by half
                res.cachePeriod = Math.round((hoursToOutOfStock * 60) / 2);
            }

            next();
        });
    };
}

// Override/Extend applyInventorySensitiveCache
base.applyDynamicInventorySensitiveCache = applyDynamicCacheExtension(base.applyInventorySensitiveCache);
base.applyDynamicPromotionSensitiveCache = applyDynamicCacheExtension(base.applyPromotionSensitiveCache);
base.applyDynamicShortPromotionSensitiveCache = applyDynamicCacheExtension(base.applyShortPromotionSensitiveCache);

module.exports = base;

Object.keys(base).forEach(function (prop) {
    if (module.exports.hasOwnProperty(prop) && typeof module.exports[prop] === 'function') {
        var originalMiddlewareMethod = module.exports[prop];

        module.exports[prop] = function (req, res, next) {
            originalMiddlewareMethod.call(module.exports, req, res, function () {
                if (System.getInstanceType() !== System.PRODUCTION_SYSTEM) {
                    res.setHttpHeader('X-SF-CC-CACHE', [prop, res.cachePeriod || 'Unknown', res.cachePeriodUnit || 'Unknown', (res.personalized ? 'Personalized' : 'Not_Personalized')].join('_'));
                }

                next();
            })
        };
    }
});
