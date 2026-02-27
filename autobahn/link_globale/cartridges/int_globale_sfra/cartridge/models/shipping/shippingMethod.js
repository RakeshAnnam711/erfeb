'use strict';

var base = module.superModule;

/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.ShippingMethod} shippingMethod - the default shipment of the current basket
 * @param {dw.order.Shipment} [shipment] - a Shipment
 */
function ShippingMethodModel(shippingMethod, shipment) {
    base.call(this, shippingMethod, shipment);
    var Order = require('dw/order/Order');
    var Resource = require('dw/web/Resource');
    var collections = require('*/cartridge/scripts/util/collections');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geOrderMgr = require('*/cartridge/scripts/factories/globale/dw/order');
    var order = null;
    var isGlobaleOrder = false;
    if (shipment && shipment.productLineItems.length > 0) {
        collections.find(shipment.productLineItems, function (lineItem) {
            if (lineItem.lineItemCtnr && (lineItem.lineItemCtnr instanceof Order)) {
                order = lineItem.lineItemCtnr;
                return true;
            }
            return false;
        });
    }
    if (
        order
        && (globaleHelpers.customAttr.order.geOrderNumber in order.custom)
        && order.custom[globaleHelpers.customAttr.order.geOrderNumber]
    ) {
        isGlobaleOrder = true;
    }
    if (shippingMethod.custom[globaleHelpers.customAttr.shippingMethod.isGeShippingMethod] && order && isGlobaleOrder) {
        var geOrder = geOrderMgr.get(order);
        if ((globaleHelpers.customAttr.order.geShippingMethodName in order.custom) && order.custom[globaleHelpers.customAttr.order.geShippingMethodName]) {
            this.shippingMethodName = order.custom[globaleHelpers.customAttr.order.geShippingMethodName];
        }
        if ((globaleHelpers.customAttr.order.geShippingMethodTypeName in order.custom) && order.custom[globaleHelpers.customAttr.order.geShippingMethodTypeName]) {
            this.displayName = order.custom[globaleHelpers.customAttr.order.geShippingMethodTypeName];
            this.shippingMethodType = order.custom[globaleHelpers.customAttr.order.geShippingMethodTypeName];
        }
        var deliveryTime = ['order.deliveryfromto', 'globale', null];
        if ((globaleHelpers.customAttr.order.geDeliveryDaysFrom in order.custom) && order.custom[globaleHelpers.customAttr.order.geDeliveryDaysFrom]) {
            deliveryTime.push(order.custom[globaleHelpers.customAttr.order.geDeliveryDaysFrom]);
        }
        if ((globaleHelpers.customAttr.order.geDeliveryDaysTo in order.custom) && order.custom[globaleHelpers.customAttr.order.geDeliveryDaysTo]) {
            deliveryTime.push(order.custom[globaleHelpers.customAttr.order.geDeliveryDaysTo]);
        }
        if (deliveryTime) {
            this.estimatedArrivalTime = Resource.msgf.apply(Resource, deliveryTime);
        }
        if ((globaleHelpers.customAttr.order.geTotalDiscountedShippingPrice in order.custom) && order.custom[globaleHelpers.customAttr.order.geTotalDiscountedShippingPrice] !== null) {
            this.shippingCost = geOrder.geGetOrderShippingCost();
        }
    }
}

ShippingMethodModel.prototype = Object.create(base.prototype);

module.exports = ShippingMethodModel;
