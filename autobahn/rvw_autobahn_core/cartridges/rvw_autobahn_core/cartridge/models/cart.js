'use strict';

var base = module.superModule;
var Resource = require('dw/web/Resource');
var orderDecorators = require('*/cartridge/models/order/decorators/index');
var PaymentModel = require('*/cartridge/models/payment');

/**
 * @constructor
 * @classdesc CartModel class that represents the current basket
 *
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {dw.campaign.DiscountPlan} discountPlan - set of applicable discounts
 */
function CartModel(basket) {
    base.call(this, basket);
    this.resources.numberOfItem = Resource.msgf('label.number.item.in.cart', 'cart', null, this.numItems);
    this.resources.shippingDefaultLabel = Resource.msg('label.order.shipping.cost', 'confirmation', null);

    if (basket != null) {
        var Locale = require('dw/util/Locale');
        this.payment = new PaymentModel(basket, basket.customer, Locale.getLocale(request.locale).country);

        orderDecorators.giftCertificateLineItems(this, basket, 'basket');

        this.items = this.giftCertificateLineItems.items.concat(this.items);
        this.numItems = this.numItems + this.giftCertificateLineItems.totalQuantity;
        this.resources.numberOfItems = Resource.msgf('label.number.items.in.cart', 'cart', null, this.numItems);
        this.resources.minicartCountOfItems = Resource.msgf('minicart.count', 'common', null, this.numItems);

        var URLUtils = require('dw/web/URLUtils');
        this.actionUrls.showUrl = URLUtils.url('Cart-Show').toString();
        this.actionUrls.removeGiftCertificateLineItem = URLUtils.url('Cart-RemoveGiftCertificateLineItem').toString();

        orderDecorators.hideShipping(this, basket, 'basket');
    }
}

module.exports = CartModel;
