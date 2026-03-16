'use strict';

module.exports = function (originShipmentShippingModel) {
    var decorators = require('*/cartridge/models/globale/shipmentShippingModel/decorators/index');
    var object = Object.create(originShipmentShippingModel || null);
    decorators.base(object, originShipmentShippingModel);
    try {
        decorators.applicableShippingMethods(object);
    } catch (e) {
        object.logger.error('GLOBALE_SHIPMENT_SHIPPING_MODEL: {0}', object.logger.message(e));
    }
    return object;
};
