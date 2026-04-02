'use strict';

var base = module.superModule;

/**
 * @constructor
 * @classdesc Model that represents shipping information
 *
 * @param {dw.order.Shipment} shipment - the default shipment of the current basket
 * @param {Object} address - the address to use to filter the shipping method list
 * @param {Object} customer - the current customer model
 * @param {string} containerView - the view of the product line items (order or basket)
 */
function ShippingModel(shipment, address, customer, containerView) {
    var orderDecorators = require('*/cartridge/models/order/decorators/index');
    var shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');

    base.call(this, shipment, address, customer, containerView);
    orderDecorators.giftCertificateLineItems(this, shipment, containerView);
    this.shippingLineItems = shippingHelpers.getShippingLineItemModels(shipment);
}

module.exports = ShippingModel;
