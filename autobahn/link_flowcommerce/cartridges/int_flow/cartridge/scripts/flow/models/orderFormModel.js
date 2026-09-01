/* global empty:false, customer:false */
'use strict';

/**
 * Calculates the total Price Adjustment Amount
 * @param {dw.util.Collection} priceAdjustmentsList - The Price Adjustments for a Product Line Item
 * @returns {dw.value.Money} The total Price Adjustment for the line item
 */
function calculatePriceAdjustments(priceAdjustmentsList) {
    var Money = require('dw/value/Money');
    var collections = require('*/cartridge/scripts/util/collections');

    var promoIds = [];
    var orderDiscount;
    var price;
    var discount;

    if (priceAdjustmentsList.length > 0) {
        collections.forEach(priceAdjustmentsList, function (priceAdj) {
            price = priceAdj.getPrice();
            discount = Math.abs(price.getValue());
            orderDiscount = orderDiscount ? orderDiscount.add(new Money(discount, price.currencyCode)) : new Money(discount, price.currencyCode);
            if (priceAdj.promotionID) {
                promoIds.push(priceAdj.promotionID);
            }
        });
    }

    return {
        amount: orderDiscount ? orderDiscount.value : 0,
        promotionIds: promoIds.join(',')
    };
}

/**
 * Generates the item objects from the current basket
 * @param {dw.order.Basket} basket - Current Basket
 * @param {Object} flowOrderForm - Flow Order Form
 * @returns {Array} The item objects
 */
function getItems(basket, flowOrderForm) {
    var collections = require('*/cartridge/scripts/util/collections');

    var items = [];
    var quantity;
    var itemForm;
    var discount;

    if (basket) {
        collections.forEach(basket.giftCertificateLineItems, function (item) {
            items.push({
                number: item.giftCertificateID,
                quantity: 1,
                price: {
                    amount: item.priceValue,
                    currency: item.price.currencyCode
                }
            });
        });

        collections.forEach(basket.productLineItems, function (item) {
            quantity = item.quantity.available ? item.quantity.value : 1;

            if (quantity > 0) {
                itemForm = {
                    number: item.productID,
                    quantity: quantity,
                    price: {
                        amount: item.getPrice().divide(quantity).value,
                        currency: item.getPrice().currencyCode
                    }
                };

                discount = calculatePriceAdjustments(item.getPriceAdjustments());

                if (discount.amount > 0) {
                    itemForm.discount = {
                        amount: discount.amount,
                        currency: item.price.currencyCode
                    };

                    itemForm.attributes = {
                        sfcc_promotion_ids: discount.promotionIds
                    };
                }

                items.push(itemForm);
            }
        });
    } else if (flowOrderForm && flowOrderForm.items) {
        items = flowOrderForm.items;
    }

    return items;
}

/**
 * Generates the discount object from the current basket
 * @param {dw.order.Basket} basket - Current Basket
 * @param {Object} flowOrderForm - Flow Order Form
 * @returns {Object} Discount Object
 */
function getDiscount(basket, flowOrderForm) {
    var collections = require('*/cartridge/scripts/util/collections');

    var totalOrderDiscount = 0;
    var orderPromotionIds = '';
    var coupons = '';
    var currencyCode;
    var orderAdjs;
    var couponList = [];

    if (basket) {
        orderAdjs = calculatePriceAdjustments(basket.getPriceAdjustments());

        totalOrderDiscount = orderAdjs.amount;
        orderPromotionIds = orderAdjs.promotionIds;
        currencyCode = basket.getCurrencyCode();

        collections.forEach(basket.getCouponLineItems(), function (cli) {
            if (cli.isValid()) {
                couponList.push(cli.getCouponCode());
            }
        });

        coupons = couponList.join(',');
    } else if (flowOrderForm && flowOrderForm.discount && flowOrderForm.discount.amount) {
        totalOrderDiscount = flowOrderForm.discount.amount;
        orderPromotionIds = (flowOrderForm.attributes && flowOrderForm.attributes.sfcc_promotion_ids) ? flowOrderForm.attributes.sfcc_promotion_ids : '';
        currencyCode = flowOrderForm.discount.currencyCode;
        coupons = (flowOrderForm.attributes && flowOrderForm.attributes.sfcc_coupons) ? flowOrderForm.attributes.sfcc_coupons : '';
    }

    return {
        price: {
            amount: totalOrderDiscount,
            currency: currencyCode
        },
        promotionIds: orderPromotionIds,
        coupons: coupons
    };
}

/**
 * A Flow Order Put object
 * @param {dw.order.Basket} basket - Current Basket
 * @param {string} orderNo - Order Number if syncing Flow & SFCC Order Numbers
 * @param {Object} flowOrderForm - Flow Order Form
 * @constructor
 */
function OrderFormModel(basket, orderNo, flowOrderForm) {
    var discount = getDiscount(basket, flowOrderForm);

    this.items = getItems(basket, flowOrderForm);
    this.number = orderNo;

    if (discount.price.amount > 0) {
        this.discount = discount.price;
    }

    this.attributes = {
        sfcc_promotion_ids: discount.promotionIds,
        sfcc_coupons: discount.coupons
    };

    if (customer && customer.authenticated && customer.profile) {
        this.customer = {};

        if (!empty(customer.profile.email)) {
            this.customer.email = customer.profile.email;
        }
        if (!empty(customer.profile.firstName)) {
            this.customer.name = this.customer.name ? this.customer.name : {};
            this.customer.name.first = customer.profile.firstName;
        }
        if (!empty(customer.profile.lastName)) {
            this.customer.name = this.customer.name ? this.customer.name : {};
            this.customer.name.last = customer.profile.lastName;
        }
        if (!empty(customer.profile.phoneMobile) || !empty(customer.profile.phoneHome) || !empty(customer.profile.phoneBusiness)) {
            this.customer.phone = customer.profile.phoneMobile || customer.profile.phoneHome || customer.profile.phoneBusiness;
        }
    }
}

module.exports = OrderFormModel;
