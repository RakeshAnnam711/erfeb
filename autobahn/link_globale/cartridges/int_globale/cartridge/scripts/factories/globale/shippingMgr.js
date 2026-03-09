'use strict';

module.exports = function () {
    var shippingMgr = require('dw/order/ShippingMgr');
    var decorators = require('*/cartridge/models/globale/shippingMgr/decorators/index');
    var object = Object.create(shippingMgr);
    decorators.base(object, shippingMgr);
    try {
        decorators.allShippingMethods(object);
        decorators.shipmentShippingModel(object);
    } catch (e) {
        object.logger.error('GLOBALE_SHIPPING_MGR: {0}', object.logger.message(e));
    }
    return object;
};
