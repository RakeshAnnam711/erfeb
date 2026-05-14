'use strict';

module.exports = {
    get: function (shipment) {
        if (!shipment) {
            throw Error('shipment shouldn\'t be null');
        }

        var geShipment = Object.create(shipment);
        var shipmentDecorators = require('*/cartridge/models/globale/dw/shipment/decorators/index');
        shipmentDecorators.geSetShipmentShippingPrice(geShipment);

        return geShipment;
    }
};
