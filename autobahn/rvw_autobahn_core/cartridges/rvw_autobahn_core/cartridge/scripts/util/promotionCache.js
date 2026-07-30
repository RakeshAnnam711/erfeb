/* globals session */
'use strict';

var PromotionMgr = require('dw/campaign/PromotionMgr');
var collections = require('*/cartridge/scripts/util/collections');
const customPromoCache = require('dw/system/CacheMgr').getCache('customPromoCache');

var promotionCache = Object.create(null);

Object.defineProperty(promotionCache, 'promotions', {
    get: function () {
        var cacheKey = session.customer ? session.customer.ID: 'allusers';
        var promoCache = customPromoCache.get(cacheKey);
        if (promoCache) {
            return JSON.parse(promoCache);
        }
        var activePromotions = PromotionMgr.activeCustomerPromotions.getProductPromotions();
        var promoIds = collections.map(activePromotions, function (promo) {
            return promo.ID;
        });

        customPromoCache.put(cacheKey, JSON.stringify(promoIds));
        return promoIds;
    }
});

module.exports = promotionCache;
