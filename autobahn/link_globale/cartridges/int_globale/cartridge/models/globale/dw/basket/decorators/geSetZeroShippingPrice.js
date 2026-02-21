'use strict';

/**
 * Sets shipping price to zero
 */
function geSetZeroShippingPrice() {
    var Money = require('dw/value/Money');
    var shipmentFactory = require('*/cartridge/scripts/factories/globale/dw/shipment');

    var basket = this;
    var shipments = basket.getShipments().iterator();
    var taxRate = Object.create(null);
    require('*/cartridge/models/globale/price/decorators/merchantTaxRate')(taxRate);

    while (shipments.hasNext()) {
        var geShipment = shipmentFactory.get(shipments.next());
        geShipment.geSetShipmentShippingPrice(new Money(0, basket.currencyCode), 0);
    }
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geSetZeroShippingPrice: {
            value: geSetZeroShippingPrice
        }
    });
};
