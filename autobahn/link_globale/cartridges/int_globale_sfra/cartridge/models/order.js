'use strict';

var base = module.superModule;

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var geOrderMgr = require('*/cartridge/scripts/factories/globale/dw/order');
    var customerDetails = require('*/cartridge/scripts/factories/globale/api/customerDetails');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    base.apply(this, Array.prototype.slice.call(arguments));

    // Global-e Order
    if (
        lineItemContainer
        && (globaleHelpers.customAttr.order.geOrderNumber in lineItemContainer.custom)
        && lineItemContainer.custom[globaleHelpers.customAttr.order.geOrderNumber]
    ) {
        this.orderNumber = lineItemContainer.custom[globaleHelpers.customAttr.order.geOrderNumber];

        var geOrder = geOrderMgr.get(lineItemContainer);
        // handle Mixed order scenario
        if (geOrder.geIsMixedMainOrder()) {
            var productLineItemsModel = new ProductLineItemsModel(geOrder.geGetOrderPlis(), options.containerView);
            this.lineItemTotal = productLineItemsModel ? productLineItemsModel.length : null;
            this.items = productLineItemsModel;
            this.productQuantityTotal = geOrder.getProductQuantityTotal() || null;
        }

        // update billing address
        if (this.billing && this.billing.billingAddress && this.billing.billingAddress.address) {
            var customerBillingAddress = customerDetails.createCustomerDetailsFromOrderByType(geOrder, customerDetails.TYPE_CUSTOMER_BILLING);
            this.billing.billingAddress.address = customerBillingAddress.toDwOrderAddressObject();
        }

        // update shipping address
        if (this.shipping && this.shipping.length > 0 && this.shipping[0].shippingAddress) {
            var customerShippingAddress = customerDetails.createCustomerDetailsFromOrderByType(geOrder, customerDetails.TYPE_CUSTOMER_SHIPPING);
            this.shipping[0].shippingAddress = customerShippingAddress.toDwOrderAddressObject();
        }
    }
}

OrderModel.prototype = Object.create(base.prototype);

module.exports = OrderModel;
