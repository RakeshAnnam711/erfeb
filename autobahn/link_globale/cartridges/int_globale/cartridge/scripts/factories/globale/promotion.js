'use strict';

module.exports = function (promotion) {
    var globaleSession = require('*/cartridge/models/globale/session');
    if (!globaleSession.get('geOperatedCountry') || !promotion) {
        return promotion;
    }
    var decorators = require('*/cartridge/models/globale/promotion/decorators/index');
    var object = Object.create(promotion);
    decorators.base(object, promotion);
    try {
        decorators.promotionalPrice(object);
        decorators.globalePromotion(object);
    } catch (e) {
        object.logger.error('PROMOTION: {0}', object.logger.message(e));
    }
    return object;
};
