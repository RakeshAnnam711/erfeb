'use strict';

/**
 * Calculates localShippingOptions for SendCart
 * @param {dw.order.Basket} basket - SFCC basket
 * @returns {Object} - Global-e SendCart.LocalShippingOptions API object.
 */
function getLocalShippingOptions(basket) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var localShippingOptions = [];
    collections.forEach(basket.shipments, function (shipment) {
        if (shipment.shippingMethod) {
            localShippingOptions.push({
                Carrier: shipment.shippingMethod.custom[globaleHelpers.customAttr.shippingMethod.geCarrier],
                CarrierName: shipment.shippingMethod.custom[globaleHelpers.customAttr.shippingMethod.geCarrierName],
                CarrierTitle: shipment.shippingMethod.custom[globaleHelpers.customAttr.shippingMethod.geCarrierTitle],
                Code: shipment.shippingMethod.getID(),
                Method: shipment.shippingMethod.getDisplayName(),
                MethodTitle: shipment.shippingMethod.getDisplayName(),
                MethodDescription: shipment.shippingMethod.getDescription(),
                Price: ((shipment.adjustedShippingTotalPrice && shipment.adjustedShippingTotalPrice.value) || 0) // decimal
            });
        }
    });

    return localShippingOptions;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getLocalShippingOptions', {
        value: getLocalShippingOptions
    });
};
