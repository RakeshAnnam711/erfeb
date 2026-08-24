'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru();
var sinon = require('sinon');

function loadModule(syncStub, hookMgrStub) {
    return proxyquire('../../../../../cartridges/autobahn_client_core/cartridge/scripts/hooks/cart/calculate', {
        'dw/system/HookMgr': hookMgrStub,
        '*/cartridge/scripts/util/collections': {
            forEach: function (list, fn) {
                (list || []).forEach(fn);
            }
        },
        '*/cartridge/scripts/helpers/liveSellingPriceAdjustmentHelper': {
            syncLiveSellingPriceAdjustment: syncStub
        }
    });
}

function createMockBasket(lineItems) {
    return {
        allProductLineItems: lineItems,
        updateTotals: sinon.stub()
    };
}

// module.superModule is an SFCC-runtime concept with no plain-Node equivalent, so exports.calculate
// itself (the thin base.calculate + applyLiveSellingAdjustments glue) isn't exercised here - the actual
// logic under test, applyLiveSellingAdjustments, is extracted specifically so it doesn't depend on it.
describe('cart/calculate hook - applyLiveSellingAdjustments', function () {
    it('recalculates tax and totals when at least one line item adjustment changed (normal calculation path)', function () {
        var syncStub = sinon.stub();
        syncStub.onCall(0).returns(true);
        syncStub.onCall(1).returns(false);
        var hookMgrStub = { callHook: sinon.stub() };
        var mod = loadModule(syncStub, hookMgrStub);
        var basket = createMockBasket([{ id: 'live-selling-item' }, { id: 'regular-item' }]);

        var changed = mod.applyLiveSellingAdjustments(basket);

        assert.isTrue(changed);
        assert.equal(syncStub.callCount, 2);
        assert.isTrue(hookMgrStub.callHook.calledOnceWith('dw.order.calculateTax', 'calculateTax', basket));
        assert.isTrue(basket.updateTotals.calledOnce);
    });

    it('does not recalculate tax/totals when nothing changed (e.g. Global-e path where the adjustment already matched)', function () {
        var syncStub = sinon.stub().returns(false);
        var hookMgrStub = { callHook: sinon.stub() };
        var mod = loadModule(syncStub, hookMgrStub);
        var basket = createMockBasket([{ id: 'live-selling-item' }]);

        var changed = mod.applyLiveSellingAdjustments(basket);

        assert.isFalse(changed);
        assert.isFalse(hookMgrStub.callHook.called);
        assert.isFalse(basket.updateTotals.called);
    });

    it('never calls dw.order.calculate itself - only dw.order.calculateTax - to avoid recursively re-entering this same hook', function () {
        var syncStub = sinon.stub().returns(true);
        var hookMgrStub = { callHook: sinon.stub() };
        var mod = loadModule(syncStub, hookMgrStub);
        var basket = createMockBasket([{ id: 'live-selling-item' }]);

        mod.applyLiveSellingAdjustments(basket);

        hookMgrStub.callHook.getCalls().forEach(function (call) {
            assert.notEqual(call.args[0], 'dw.order.calculate');
        });
    });

    it('handles a basket with no line items without error', function () {
        var syncStub = sinon.stub();
        var hookMgrStub = { callHook: sinon.stub() };
        var mod = loadModule(syncStub, hookMgrStub);
        var basket = createMockBasket([]);

        var changed = mod.applyLiveSellingAdjustments(basket);

        assert.isFalse(changed);
        assert.isFalse(syncStub.called);
    });

    it('handles a null/undefined basket without throwing', function () {
        var syncStub = sinon.stub();
        var hookMgrStub = { callHook: sinon.stub() };
        var mod = loadModule(syncStub, hookMgrStub);

        assert.doesNotThrow(function () {
            mod.applyLiveSellingAdjustments(null);
        });
    });
});
