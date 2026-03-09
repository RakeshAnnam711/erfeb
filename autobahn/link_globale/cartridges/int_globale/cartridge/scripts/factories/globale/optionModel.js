'use strict';

module.exports = function (optionModel) {
    var globaleSession = require('*/cartridge/models/globale/session');
    if (!globaleSession.get('geOperatedCountry') || !optionModel) {
        return optionModel;
    }
    var decorators = require('*/cartridge/models/globale/optionModel/decorators/index');
    var object = Object.create(optionModel);
    decorators.base(object, optionModel);
    try {
        decorators.price(object);
    } catch (e) {
        object.logger.error('OPTION_MODEL: {0}', object.logger.message(e));
    }
    return object;
};
