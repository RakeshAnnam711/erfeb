'use strict';

module.exports = function (promotionPlan) {
    var globaleSession = require('*/cartridge/models/globale/session');
    if (!globaleSession.get('geOperatedCountry') || !promotionPlan) {
        return promotionPlan;
    }
    var decorators = require('*/cartridge/models/globale/promotionPlan/decorators/index');
    var object = Object.create(promotionPlan);
    decorators.base(object, promotionPlan);
    try {
        decorators.productPromotions(object);
        decorators.shippingPromotions(object);
    } catch (e) {
        object.logger.error('PROMOTION_PLAN: {0}', object.logger.message(e));
    }
    return object;
};
