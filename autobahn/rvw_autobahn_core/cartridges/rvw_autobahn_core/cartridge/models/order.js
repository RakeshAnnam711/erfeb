'use strict';

var base = module.superModule;
var orderDecorators = require('*/cartridge/models/order/decorators/index');
var paymentDecorators = require('*/cartridge/models/payment/decorators/index');

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    base.call(this, lineItemContainer, options);

    if (lineItemContainer) {
      orderDecorators.orderUUID(this, lineItemContainer);
      orderDecorators.orderEmail(this, lineItemContainer);
      orderDecorators.productQuantityTotal(this, lineItemContainer);
      orderDecorators.giftCertificateLineItems(this, lineItemContainer, 'order')
      orderDecorators.hideShipping(this, lineItemContainer, 'order');
      paymentDecorators.currencyCode(this, lineItemContainer);
    }

    var Resource = require('dw/web/Resource');
    this.resources.giftCertificateLabel = Resource.msg('giftcertificate.purchase.giftcertificate', 'checkout', null);
    this.resources.giftCertificateAmountLabel = Resource.msg('giftcertificate.purchase.amount', 'checkout', null);
    this.resources.giftCertificateRemainingBalanceLabel = Resource.msg('giftcertificate.checkout.remainingbalance', 'checkout', null);
    this.resources.shippingMethod = Resource.msg('heading.shipping.method', 'checkout', null);
}

module.exports = OrderModel;
