'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru();
var sinon = require('sinon');

function money(value) {
    return {
        value: value,
        available: true,
        equals: function (other) {
            return !!other && other.available !== false && this.value === other.value;
        },
        subtract: function (other) {
            return money(this.value - other.value);
        },
        multiply: function (n) {
            return money(this.value * n);
        }
    };
}

function AmountDiscountMock(amount) {
    this.amount = amount;
}

function createMockLineItem(options) {
    var opts = options || {};
    var adjustments = opts.existingAdjustments || [];

    var lineItem = {
        custom: {
            isCSCHandoffLineItem: opts.isCSCHandoffLineItem,
            isLiveSellingLineItem: opts.isLiveSellingLineItem
        },
        product: opts.product || { ID: 'Q6J0UJ44WG003' },
        price: 'price' in opts ? opts.price : money(3750),
        quantityValue: 'quantity' in opts ? opts.quantity : 1,
        getPriceAdjustmentByPromotionID: sinon.stub().callsFake(function (id) {
            var found = adjustments.filter(function (a) { return a.promotionID === id; });
            return found.length ? found[0] : null;
        }),
        createPriceAdjustment: sinon.stub().callsFake(function (id) {
            var adjustment = {
                promotionID: id,
                price: null,
                setPriceValue: sinon.stub().callsFake(function (value) {
                    adjustment.price = money(value);
                })
            };
            adjustments.push(adjustment);
            return adjustment;
        }),
        removePriceAdjustment: sinon.stub().callsFake(function (adjustment) {
            var index = adjustments.indexOf(adjustment);
            if (index > -1) {
                adjustments.splice(index, 1);
            }
        })
    };

    return lineItem;
}

describe('liveSellingPriceAdjustmentHelper', function () {
    var liveSellingPriceHelperStub;

    function loadHelper(liveSellingPrice) {
        liveSellingPriceHelperStub = {
            getLiveSellingPrice: sinon.stub().returns(liveSellingPrice)
        };

        return proxyquire('../../../../cartridges/autobahn_client_core/cartridge/scripts/helpers/liveSellingPriceAdjustmentHelper', {
            'dw/campaign/AmountDiscount': AmountDiscountMock,
            '*/cartridge/scripts/helpers/liveSellingPriceHelper': liveSellingPriceHelperStub
        });
    }

    describe('isEligibleForOverride', function () {
        it('is true only when both isCSCHandoffLineItem and isLiveSellingLineItem are explicitly true', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({ isCSCHandoffLineItem: true, isLiveSellingLineItem: true });

            assert.isTrue(helper.isEligibleForOverride(lineItem));
        });

        it('is false when isCSCHandoffLineItem is true but isLiveSellingLineItem is false', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({ isCSCHandoffLineItem: true, isLiveSellingLineItem: false });

            assert.isFalse(helper.isEligibleForOverride(lineItem));
        });

        it('is false when isLiveSellingLineItem is unset (undefined)', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({ isCSCHandoffLineItem: true });

            assert.isFalse(helper.isEligibleForOverride(lineItem));
        });

        it('is false when isCSCHandoffLineItem is false, even if isLiveSellingLineItem is true', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({ isCSCHandoffLineItem: false, isLiveSellingLineItem: true });

            assert.isFalse(helper.isEligibleForOverride(lineItem));
        });
    });

    describe('syncLiveSellingPriceAdjustment', function () {
        it('creates a new adjustment for an explicit CSC live selling item with a valid live selling price', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(3750),
                quantity: 1
            });

            var changed = helper.syncLiveSellingPriceAdjustment(lineItem);

            assert.isTrue(changed);
            assert.isTrue(lineItem.createPriceAdjustment.calledOnce);
            assert.isTrue(lineItem.createPriceAdjustment.calledWith(helper.ADJUSTMENT_ID));
            var adjustment = lineItem.createPriceAdjustment.returnValues[0];
            assert.equal(adjustment.price.value, -2700); // (1050 - 3750) * 1
        });

        // lineItem.price is the TOTAL for the full line item quantity, not a unit price - these three
        // cases use a consistent $3750/unit item at increasing quantities, with price set to the real
        // total each time (unit * quantity), matching how SFCC actually represents it. Getting the unit-
        // vs-total distinction wrong is invisible at quantity 1 (total and unit are numerically the same
        // value) and only produces a wrong discount at quantity 2+.
        it('computes the correct adjustment at quantity 1 (unit price === line item total)', function () {
            var helper = loadHelper(money(1050)); // unit live selling price
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(3750), // 1 unit @ $3750 = $3750 total
                quantity: 1
            });

            helper.syncLiveSellingPriceAdjustment(lineItem);

            var adjustment = lineItem.createPriceAdjustment.returnValues[0];
            assert.equal(adjustment.price.value, -2700); // target 1050 - current 3750
        });

        it('computes the correct adjustment at quantity 2 (matches the worked example in the spec)', function () {
            var helper = loadHelper(money(1050)); // unit live selling price
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(7500), // 2 units @ $3750 = $7500 total
                quantity: 2
            });

            helper.syncLiveSellingPriceAdjustment(lineItem);

            var adjustment = lineItem.createPriceAdjustment.returnValues[0];
            assert.equal(adjustment.price.value, -5400); // target 2100 (1050*2) - current 7500
        });

        it('computes the correct adjustment at quantity 3', function () {
            var helper = loadHelper(money(1050)); // unit live selling price
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(11250), // 3 units @ $3750 = $11250 total
                quantity: 3
            });

            helper.syncLiveSellingPriceAdjustment(lineItem);

            var adjustment = lineItem.createPriceAdjustment.returnValues[0];
            assert.equal(adjustment.price.value, -8100); // target 3150 (1050*3) - current 11250
        });

        it('does not create an adjustment when the live selling price is missing/unavailable', function () {
            var helper = loadHelper(null);
            var lineItem = createMockLineItem({ isCSCHandoffLineItem: true, isLiveSellingLineItem: true });

            var changed = helper.syncLiveSellingPriceAdjustment(lineItem);

            assert.isFalse(changed);
            assert.isFalse(lineItem.createPriceAdjustment.called);
        });

        it('does not create an adjustment when the checkbox is false', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({ isCSCHandoffLineItem: true, isLiveSellingLineItem: false });

            var changed = helper.syncLiveSellingPriceAdjustment(lineItem);

            assert.isFalse(changed);
            assert.isFalse(lineItem.createPriceAdjustment.called);
        });

        it('does not create an adjustment when the checkbox is unset', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({ isCSCHandoffLineItem: true });

            var changed = helper.syncLiveSellingPriceAdjustment(lineItem);

            assert.isFalse(changed);
            assert.isFalse(lineItem.createPriceAdjustment.called);
        });

        it('updates an existing adjustment in place instead of creating a duplicate when the base price changes', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(3750),
                quantity: 1
            });

            var firstChanged = helper.syncLiveSellingPriceAdjustment(lineItem);
            assert.isTrue(firstChanged);
            assert.equal(lineItem.createPriceAdjustment.callCount, 1);

            // Simulate Global-e resetting the base price back to default on the next recalculation pass.
            lineItem.price = money(3750);
            var secondChanged = helper.syncLiveSellingPriceAdjustment(lineItem);

            // Same base price, same live selling price -> adjustment value is unchanged -> no-op, no duplicate.
            assert.isFalse(secondChanged);
            assert.equal(lineItem.createPriceAdjustment.callCount, 1, 'should not create a second adjustment');
        });

        it('updates the existing adjustment value when the base price actually differs from last sync', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(3750),
                quantity: 1
            });

            helper.syncLiveSellingPriceAdjustment(lineItem);
            var adjustment = lineItem.createPriceAdjustment.returnValues[0];
            assert.equal(adjustment.price.value, -2700);

            // Base price drifted to something else (e.g. a promotion applied on top) - adjustment should
            // recompute against the new base price, not just leave the old value in place.
            lineItem.price = money(4000);
            var changed = helper.syncLiveSellingPriceAdjustment(lineItem);

            assert.isTrue(changed);
            assert.equal(lineItem.createPriceAdjustment.callCount, 1, 'should update, not duplicate');
            assert.equal(adjustment.setPriceValue.callCount, 2);
            assert.equal(adjustment.price.value, -2950); // (1050 - 4000) * 1
        });

        it('removes the adjustment when the checkbox flips from true to false', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(3750),
                quantity: 1
            });

            helper.syncLiveSellingPriceAdjustment(lineItem);
            assert.equal(lineItem.createPriceAdjustment.callCount, 1);

            lineItem.custom.isLiveSellingLineItem = false;
            var changed = helper.syncLiveSellingPriceAdjustment(lineItem);

            assert.isTrue(changed);
            assert.isTrue(lineItem.removePriceAdjustment.calledOnce);
        });

        it('removes the adjustment when the item is no longer a CSC handoff item', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(3750),
                quantity: 1
            });

            helper.syncLiveSellingPriceAdjustment(lineItem);

            lineItem.custom.isCSCHandoffLineItem = false;
            var changed = helper.syncLiveSellingPriceAdjustment(lineItem);

            assert.isTrue(changed);
            assert.isTrue(lineItem.removePriceAdjustment.calledOnce);
        });

        it('removes the adjustment when the live selling price becomes unavailable', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(3750),
                quantity: 1
            });

            helper.syncLiveSellingPriceAdjustment(lineItem);

            liveSellingPriceHelperStub.getLiveSellingPrice.returns(null);
            var changed = helper.syncLiveSellingPriceAdjustment(lineItem);

            assert.isTrue(changed);
            assert.isTrue(lineItem.removePriceAdjustment.calledOnce);
        });

        it('is a no-op when not eligible and no adjustment exists', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({ isCSCHandoffLineItem: false });

            var changed = helper.syncLiveSellingPriceAdjustment(lineItem);

            assert.isFalse(changed);
            assert.isFalse(lineItem.removePriceAdjustment.called);
        });
    });

    describe('isAdjustmentCorrect', function () {
        it('never mutates the line item - read-only, safe to call after payment authorization', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(3750),
                quantity: 1
            });

            helper.isAdjustmentCorrect(lineItem);

            assert.isFalse(lineItem.createPriceAdjustment.called);
            assert.isFalse(lineItem.removePriceAdjustment.called);
        });

        it('returns true when the existing adjustment already matches what it should be', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(3750),
                quantity: 1
            });
            helper.syncLiveSellingPriceAdjustment(lineItem);

            assert.isTrue(helper.isAdjustmentCorrect(lineItem));
        });

        it('correctly validates a matching adjustment at quantity 2 (unit-vs-total regression check)', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(7500), // 2 units @ $3750 = $7500 total
                quantity: 2
            });
            helper.syncLiveSellingPriceAdjustment(lineItem);

            assert.isTrue(helper.isAdjustmentCorrect(lineItem));
        });

        it('returns false when eligible but no adjustment exists yet', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(3750),
                quantity: 1
            });

            assert.isFalse(helper.isAdjustmentCorrect(lineItem));
        });

        it('returns false when the existing adjustment is stale relative to the current base price', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(3750),
                quantity: 1
            });
            helper.syncLiveSellingPriceAdjustment(lineItem);

            lineItem.price = money(4000); // base price drifted since the adjustment was set

            assert.isFalse(helper.isAdjustmentCorrect(lineItem));
        });

        it('returns true when not eligible and correctly has no adjustment', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({ isCSCHandoffLineItem: false });

            assert.isTrue(helper.isAdjustmentCorrect(lineItem));
        });

        it('returns false when not eligible but a stale adjustment is still present', function () {
            var helper = loadHelper(money(1050));
            var lineItem = createMockLineItem({
                isCSCHandoffLineItem: true,
                isLiveSellingLineItem: true,
                price: money(3750),
                quantity: 1
            });
            helper.syncLiveSellingPriceAdjustment(lineItem);

            lineItem.custom.isLiveSellingLineItem = false;

            assert.isFalse(helper.isAdjustmentCorrect(lineItem));
        });
    });
});
