"use strict";

/**
 * Overrides int_adyen_SFRA's lineItemHelper.js to fix a null-dereference on custom (non-Business-Manager)
 * price adjustments. dw.order.PriceAdjustment.getPromotion() always returns null for a price adjustment
 * created via ProductLineItem.createPriceAdjustment() with an arbitrary ID rather than a real registered
 * dw.campaign.Promotion (e.g. this org's own SubPro subscription discount, and the live selling price
 * override) - the base file's isValidLineItem()/getVatAmount() read lineItem.promotion.promotionClass
 * directly, which throws for any such adjustment. That throw propagates up through
 * createPaymentRequest -> handlePayments -> placeOrder, and surfaces to the shopper as the generic
 * "The payment you submitted is not valid" error - on any open-invoice-style payment method (Affirm,
 * PayPal, etc.) that builds itemized line item data via getAllLineItems().
 *
 * A custom, product-level price adjustment correctly has no place in this itemized-adjustments list
 * anyway - its value is already folded into the product line item's own adjustedNetPrice/adjustedTax,
 * sent separately via the isProductLineItem branches below. So null-guarding here isn't a workaround,
 * it's the actually-correct behavior the base file was already trying to express.
 */
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var __LineItemHelper = {
  getDescription: function getDescription(lineItem) {
    if (lineItem instanceof dw.order.ShippingLineItem) {
      return lineItem.getID();
    }
    if (lineItem instanceof dw.order.ProductLineItem) {
      return lineItem.productName;
    }
    if (lineItem instanceof dw.order.PriceAdjustment) {
      return 'Discount';
    }
    return null;
  },
  getId: function getId(lineItem) {
    if (lineItem instanceof dw.order.ShippingLineItem || lineItem instanceof dw.order.PriceAdjustment) {
      return lineItem.UUID;
    }
    if (lineItem instanceof dw.order.ProductLineItem) {
      return lineItem.productID;
    }
    return null;
  },
  getQuantity: function getQuantity(lineItem) {
    if (lineItem instanceof dw.order.ShippingLineItem) {
      return '1';
    }
    if (lineItem instanceof dw.order.ProductLineItem) {
      return lineItem.quantityValue.toFixed();
    }
    if (lineItem instanceof dw.order.PriceAdjustment) {
      return lineItem.quantity.toFixed();
    }
    return null;
  },
  getVatPercentage: function getVatPercentage(lineItem) {
    var vatPercentage = 0;
    if (__LineItemHelper.getVatAmount(lineItem).value !== 0) {
      vatPercentage = lineItem.getTaxRate();
    }
    return vatPercentage;
  },
  getVatAmount: function getVatAmount(lineItem) {
    if (lineItem instanceof dw.order.ProductLineItem || lineItem instanceof dw.order.ShippingLineItem) {
      return AdyenHelper.getCurrencyValueForApi(lineItem.getAdjustedTax());
    }
    if (lineItem instanceof dw.order.PriceAdjustment && lineItem.getPromotion() && lineItem.getPromotion().getPromotionClass() !== 'ORDER') {
      return AdyenHelper.getCurrencyValueForApi(lineItem.tax);
    }
    return new dw.value.Money(0, lineItem.getTax().getCurrencyCode());
  },
  getItemAmount: function getItemAmount(lineItem) {
    if (lineItem instanceof dw.order.ProductLineItem || lineItem instanceof dw.order.ShippingLineItem) {
      return AdyenHelper.getCurrencyValueForApi(lineItem.adjustedNetPrice);
    }
    if (lineItem instanceof dw.order.PriceAdjustment) {
      return AdyenHelper.getCurrencyValueForApi(lineItem.netPrice);
    }
    return new dw.value.Money(0, lineItem.getPrice().getCurrencyCode());
  },
  isProductLineItem: function isProductLineItem(lineItem) {
    return lineItem instanceof dw.order.ProductLineItem;
  },
  isBonusProductLineItem: function isBonusProductLineItem(lineItem) {
    return lineItem.bonusProductLineItem;
  },
  isShippingLineItem: function isShippingLineItem(lineItem) {
    return lineItem instanceof dw.order.ShippingLineItem;
  },
  isPriceAdjustment: function isPriceAdjustment(lineItem) {
    return lineItem instanceof dw.order.PriceAdjustment;
  },
  isValidLineItem: function isValidLineItem(lineItem) {
    return this.isProductLineItem(lineItem) && !this.isBonusProductLineItem(lineItem) || this.isShippingLineItem(lineItem) || this.isPriceAdjustment(lineItem) && !!lineItem.promotion && lineItem.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER;
  },
  getAllLineItems: function getAllLineItems(allLineItems) {
    var lineItems = [];
    // eslint-disable-next-line no-restricted-syntax
    for (var item in allLineItems) {
      if (item) {
        var lineItem = allLineItems[item];
        if (this.isValidLineItem(lineItem)) {
          lineItems.push(lineItem);
        }
      }
    }
    return lineItems;
  }
};
module.exports = __LineItemHelper;
