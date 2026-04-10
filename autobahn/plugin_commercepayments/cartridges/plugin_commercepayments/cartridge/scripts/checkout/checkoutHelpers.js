'use strict';

var base = module.superModule;

var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var ShippingMgr = require('dw/order/ShippingMgr');
var TaxMgr = require('dw/order/TaxMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var Money = require('dw/value/Money');
var Logger = require('dw/system/Logger');
var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');

/**
 * validates the order has payment instruments if its total is nonzero.
 * @param {dw.order.Order} order - the order object
 * @returns {Object} an error object
 */
function handleCommercePayments(order) {
    var result = {};

    var total = order.totalNetPrice;
    if (total.available && total.value !== 0.00) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            result.error = true;
        }
    }

    return result;
}

/**
 * calculates basket data and payment request options for a buy now button
 * @param {string} sku - SKU of the product to buy
 * @param {number} quantity - quantity of the product to buy
 * @param {dw.value.Money} price - price of the product to buy, inclusive of selected options
 * @param {Array=} options - array of options for the product, and their values
 * @returns {Object} object containing basket data and payment request options
 */
function calculateBuyNowData(sku, quantity, price, options) {
    var product = ProductMgr.getProduct(sku);
    var currency = price.currencyCode;
    var shippingMethod = ShippingMgr.defaultShippingMethod;
    var taxRate = TaxMgr.getTaxRate(TaxMgr.defaultTaxClassID, TaxMgr.defaultTaxJurisdictionID);

    var optionsArray;
    if (options) {
        optionsArray = options.map(function (option) {
            return {
                id: option.id,
                valueId: option.selectedValueId
            };
        });
    } else {
        optionsArray = [];
    }

    // Calculate merchandise subtotal
    var subtotal = price.multiply(quantity);

    // Calculate shipping cost
    var shipping = ShippingMgr.getShippingCost(shippingMethod, subtotal);
    var productShippingCost = ShippingMgr.getProductShippingModel(product).getShippingCost(shippingMethod);
    if (productShippingCost && productShippingCost.amount.available) {
        shipping = shipping.add(productShippingCost.amount);
    }

    // Calculate total and tax
    var total;
    var tax;
    if (TaxMgr.taxationPolicy === TaxMgr.TAX_POLICY_GROSS) {
        // Tax already included in merchandise subtotal
        total = subtotal.add(shipping);
        tax = new Money(0, currency);
    } else {
        // Tax to be added to total
        var taxable = subtotal.add(shipping);
        total = taxable.addRate(taxRate);
        tax = total.subtract(taxable);
    }

    // Calculate line items
    var displayItems = [{
        label: Resource.msg('label.item.subtotal', 'salesforcepayments', null),
        amount: subtotal.decimalValue.toString()
    }];

    if (shippingMethod && shipping.value > 0) {
        displayItems.push({
            label: shippingMethod.displayName || shippingMethod.ID,
            amount: shipping.decimalValue.toString()
        });
    }

    if (tax.value > 0) {
        displayItems.push({
            label: Resource.msg('label.item.tax', 'salesforcepayments', null),
            amount: tax.decimalValue.toString()
        });
    }

    return {
        basketData: {
            sku: sku,
            quantity: quantity,
            shippingMethod: shippingMethod.ID,
            options: optionsArray
        },
        options: {
            currency: currency,
            total: {
                label: Resource.msg('label.item.total', 'salesforcepayments', null),
                amount: total.decimalValue && total.decimalValue.toString()
            },
            displayItems: displayItems,
            shippingOptions: [{
                id: shippingMethod.ID,
                label: shippingMethod.displayName,
                detail: shippingMethod.description,
                amount: shipping.decimalValue && shipping.decimalValue.toString()
            }]
        }
    };
}

/**
 * Gets billing details from the basket.
 * @param {dw.order.Basket} basket - basket containing billing details
 * @returns {Object} object containing billing details
 */
function getBillingDetails(basket) {
    var details = {
        address: {}
    };

    if (basket.customerName) {
        details.name = basket.customerName;
    }
    if (basket.customerEmail) {
        details.email = basket.customerEmail;
    }

    if (basket.billingAddress) {
        if (basket.billingAddress.fullName) {
            // Prefer name from billing address if available
            details.name = basket.billingAddress.fullName;
        }
        if (basket.billingAddress.phone) {
            details.phone = basket.billingAddress.phone;
        }

        if (basket.billingAddress.address1) {
            details.address.line1 = basket.billingAddress.address1;
        }
        if (basket.billingAddress.address2) {
            details.address.line2 = basket.billingAddress.address2;
        }
        if (basket.billingAddress.city) {
            details.address.city = basket.billingAddress.city;
        }
        if (basket.billingAddress.stateCode) {
            details.address.state = basket.billingAddress.stateCode;
        }
        if (basket.billingAddress.postalCode) {
            details.address.postal_code = basket.billingAddress.postalCode;
        }
        if (basket.billingAddress.countryCode && basket.billingAddress.countryCode.value) {
            details.address.country = basket.billingAddress.countryCode.value;
        }
    }

    return details;
}

/**
 * calculates payment request options for a pay now button calculated from the shopper basket
 * @returns {Object} payment request options object
 */
function calculatePaymentRequestOptions() {
    var basket = BasketMgr.currentBasket;

    if ('calculatePaymentRequestOptions' in SalesforcePaymentRequest) {
        try {
            return SalesforcePaymentRequest.calculatePaymentRequestOptions(basket, {});
        } catch (e) {
            Logger.error(e);
            return null;
        }
    }

    // 21.1 compatible code below
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var collections = require('*/cartridge/scripts/util/collections');

    var zero = new Money(0, basket.currencyCode);

    /**
     * Returns the given amount or zero if the amount isn't available
     * @param {dw.value.Money} amount - an amount of money
     * @return {dw.value.Money} the amount or zero money in the same currency
     */
    function amountOrZero(amount) {
        return amount && amount.available ? amount : zero;
    }

    /**
     * Returns the shipping amount after adding product-specific shipping cost
     * @param {dw.value.Money} amount - shipping amount
     * @param {dw.order.ProductLineItem} pli - product whose cost to add
     * @param {dw.order.Shipment} shipment - shipment whose cost is being calculated
     * @param {dw.order.ShippingMethod} shippingMethod - shipping method whose cost is being calculated
     * @return {dw.value.Money} shipping amount after adding product shipping cost
     */
    function addProductShippingCost(amount, pli, shipment, shippingMethod) {
        if (!pli || !pli.product || !pli.quantity || !pli.quantity.available) {
            return amount;
        }

        var cost = ShippingMgr.getProductShippingModel(pli.product).getShippingCost(shippingMethod);
        if (!cost || !cost.amount || !cost.amount.available) {
            return amount;
        }

        return amount.add(cost.amount.multiply(pli.quantity));
    }

    var shipment = basket.defaultShipment;
    var shippingMethod = shipment.shippingMethod;

    var merchandise;
    var shipping;
    var tax;
    var adjustedMerchandise;
    var adjustedShipping;
    if (TaxMgr.taxationPolicy === TaxMgr.TAX_POLICY_GROSS) {
        merchandise = amountOrZero(basket.merchandizeTotalGrossPrice);
        shipping = amountOrZero(basket.shippingTotalGrossPrice);
        tax = zero;
        adjustedMerchandise = amountOrZero(basket.adjustedMerchandizeTotalGrossPrice);
        adjustedShipping = amountOrZero(basket.adjustedShippingTotalGrossPrice);
    } else {
        merchandise = amountOrZero(basket.merchandizeTotalNetPrice);
        shipping = amountOrZero(basket.shippingTotalNetPrice);
        tax = amountOrZero(basket.totalTax);
        adjustedMerchandise = amountOrZero(basket.adjustedMerchandizeTotalNetPrice);
        adjustedShipping = amountOrZero(basket.adjustedShippingTotalNetPrice);
    }

    var discounts = adjustedMerchandise.subtract(merchandise).add(adjustedShipping).subtract(shipping);
    var total = zero.add(merchandise).add(shipping).add(tax).add(discounts);
    var displayItems = [{
        label: Resource.msg('label.item.subtotal', 'salesforcepayments', null),
        amount: merchandise.decimalValue.toString()
    }];

    if (shippingMethod && shipping.value > 0) {
        displayItems.push({
            label: shippingMethod.displayName || shippingMethod.ID,
            amount: shipping.decimalValue.toString()
        });
    }

    if (tax.value > 0) {
        displayItems.push({
            label: Resource.msg('label.item.tax', 'salesforcepayments', null),
            amount: tax.decimalValue.toString()
        });
    }

    if (discounts.value < 0) {
        displayItems.push({
            label: Resource.msg('label.item.discounts', 'salesforcepayments', null),
            amount: discounts.decimalValue.toString()
        });
    }

    var shippingOptions = [];
    var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(shipment).applicableShippingMethods;
    collections.forEach(applicableShippingMethods, function (method) {
        Transaction.begin();
        try {
            var productLineItems = basket.productLineItems;

            var methodShippingAmount;
            if (productLineItems.isEmpty()) {
                // Start with shipping method cost if basket empty
                methodShippingAmount = ShippingMgr.getShippingCost(method, basket.merchandizeTotalNetPrice);
            } else {
                // Set shipping method on shipment
                shipment.setShippingMethod(method);

                // Simulate relevant cart calculation
                PromotionMgr.applyDiscounts(basket);
                ShippingMgr.applyShippingCost(basket);
                PromotionMgr.applyDiscounts(basket);
                basket.updateTotals();

                // Start with basket shipping cost
                if (TaxMgr.taxationPolicy === TaxMgr.TAX_POLICY_GROSS) {
                    methodShippingAmount = basket.adjustedShippingTotalGrossPrice;
                } else {
                    methodShippingAmount = basket.adjustedShippingTotalNetPrice;
                }

                collections.forEach(productLineItems, function (pli) {
                    // Add line item product shipping cost
                    methodShippingAmount = addProductShippingCost(methodShippingAmount, pli, shipment, method);

                    collections.forEach(pli.optionProductLineItems, function (optionPli) {
                        // Add dependent line item product shipping cost
                        methodShippingAmount = addProductShippingCost(methodShippingAmount, optionPli, shipment, method);
                    });
                });
            }

            shippingOptions.push({
                id: method.ID,
                label: method.displayName || method.ID,
                detail: method.description,
                amount: amountOrZero(methodShippingAmount).decimalValue.toString()
            });
        } finally {
            Transaction.rollback();
        }
    });

    return SalesforcePaymentRequest.format({
        currency: basket.currencyCode,
        total: {
            label: Resource.msg('label.item.total', 'salesforcepayments', null),
            amount: total.decimalValue.toString()
        },
        displayItems: displayItems,
        shippingOptions: shippingOptions
    });
}

/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
    //SF originally deleted this, I added it back in as a no-op so we don't crash our integrated CheckoutServices
    return true;
}

module.exports = {
    handleCommercePayments: handleCommercePayments,
    calculateBuyNowData: calculateBuyNowData,
    getBillingDetails: getBillingDetails,
    calculatePaymentRequestOptions: calculatePaymentRequestOptions,
    validatePayment: validatePayment
};
Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
