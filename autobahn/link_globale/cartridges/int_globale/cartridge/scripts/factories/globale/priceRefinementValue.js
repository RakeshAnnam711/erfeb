'use strict';

module.exports = function (refinementValue) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    if (
        !globaleSession.get('geOperatedCountry')
        || !refinementValue
        || ((globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED)
        && globaleSession.get('geUseFixedPricesOnly'))
    ) {
        return refinementValue;
    }
    var decorators = require('*/cartridge/models/globale/priceRefinementValue/decorators/index');
    var object = Object.create(refinementValue);
    decorators.base(object, refinementValue);
    try {
        decorators.displayValue(object);
    } catch (e) {
        object.logger.error('GLOBALE_PRICE_REFINEMENT_VALUE: {0}', object.logger.message(e));
    }
    return object;
};
