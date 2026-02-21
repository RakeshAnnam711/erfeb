'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getShipmentShippingModel: {
            value: function () {
                var globaleShipmentShippingModel = require('*/cartridge/scripts/factories/globale/shipmentShippingModel');
                var shipmentShippingModel = this.super.getShipmentShippingModel.apply(this.super, Array.prototype.slice.call(arguments));
                return globaleShipmentShippingModel(shipmentShippingModel);
            }
        }
    });
};
