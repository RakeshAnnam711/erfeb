'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru();

// This file (int_adyen_SFRA's original, and this override) reads dw.* classes as SFCC script-runtime
// globals rather than via require() - stubbing that global here so the module can load in plain Node.
function FakeProductLineItem() {}
function FakeShippingLineItem() {}
function FakePriceAdjustment() {}
function FakePromotion() {}
FakePromotion.PROMOTION_CLASS_ORDER = 'ORDER';

function withDwGlobal(fn) {
    var previousDw = global.dw;
    global.dw = {
        order: {
            ProductLineItem: FakeProductLineItem,
            ShippingLineItem: FakeShippingLineItem,
            PriceAdjustment: FakePriceAdjustment
        },
        campaign: {
            Promotion: FakePromotion
        },
        value: {
            Money: function (value, currency) {
                this.value = value;
                this.currency = currency;
            }
        }
    };

    try {
        fn();
    } finally {
        global.dw = previousDw;
    }
}

function loadHelper() {
    return proxyquire('../../../../cartridges/autobahn_client_core/cartridge/adyen/utils/lineItemHelper', {
        '*/cartridge/adyen/utils/adyenHelper': {
            getCurrencyValueForApi: function (money) { return money; }
        }
    });
}

function createCustomPriceAdjustment(overrides) {
    var adjustment = Object.create(FakePriceAdjustment.prototype);
    adjustment.promotion = null; // real SFCC behavior: getPromotion() is always null for a custom adjustment
    adjustment.getPromotion = function () { return null; };
    adjustment.getTax = function () { return { getCurrencyCode: function () { return 'USD'; } }; };
    Object.assign(adjustment, overrides);
    return adjustment;
}

function createOrderClassPriceAdjustment(overrides) {
    var promotion = { promotionClass: 'ORDER', getPromotionClass: function () { return 'ORDER'; } };
    var adjustment = Object.create(FakePriceAdjustment.prototype);
    adjustment.promotion = promotion;
    adjustment.getPromotion = function () { return promotion; };
    Object.assign(adjustment, overrides);
    return adjustment;
}

describe('adyen/utils/lineItemHelper (autobahn_client_core override)', function () {
    describe('isValidLineItem', function () {
        it('does not throw for a custom price adjustment with no real Promotion (getPromotion() === null)', function () {
            withDwGlobal(function () {
                var helper = loadHelper();
                var adjustment = createCustomPriceAdjustment();

                assert.doesNotThrow(function () {
                    helper.isValidLineItem(adjustment);
                });
            });
        });

        it('excludes a custom price adjustment (it is not order-class, and has no promotion at all)', function () {
            withDwGlobal(function () {
                var helper = loadHelper();
                var adjustment = createCustomPriceAdjustment();

                assert.isFalse(helper.isValidLineItem(adjustment));
            });
        });

        it('includes a real order-class promotion price adjustment', function () {
            withDwGlobal(function () {
                var helper = loadHelper();
                var adjustment = createOrderClassPriceAdjustment();

                assert.isTrue(helper.isValidLineItem(adjustment));
            });
        });

        it('getAllLineItems filters out custom adjustments without throwing, alongside normal line items', function () {
            withDwGlobal(function () {
                var helper = loadHelper();
                var productLineItem = Object.create(FakeProductLineItem.prototype);
                productLineItem.bonusProductLineItem = false;
                var customAdjustment = createCustomPriceAdjustment();
                var orderAdjustment = createOrderClassPriceAdjustment();

                var result;
                assert.doesNotThrow(function () {
                    result = helper.getAllLineItems([productLineItem, customAdjustment, orderAdjustment]);
                });

                assert.equal(result.length, 2);
                assert.include(result, productLineItem);
                assert.include(result, orderAdjustment);
                assert.notInclude(result, customAdjustment);
            });
        });
    });

    describe('getVatAmount', function () {
        it('does not throw for a custom price adjustment with no real Promotion', function () {
            withDwGlobal(function () {
                var helper = loadHelper();
                var adjustment = createCustomPriceAdjustment();

                assert.doesNotThrow(function () {
                    helper.getVatAmount(adjustment);
                });
            });
        });

        it('returns zero tax for a custom price adjustment (falls through to the default branch)', function () {
            withDwGlobal(function () {
                var helper = loadHelper();
                var adjustment = createCustomPriceAdjustment();

                var result = helper.getVatAmount(adjustment);

                assert.equal(result.value, 0);
                assert.equal(result.currency, 'USD');
            });
        });
    });
});
