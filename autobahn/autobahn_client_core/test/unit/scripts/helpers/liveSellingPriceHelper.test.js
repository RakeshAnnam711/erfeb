'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru();

function money(value) {
    return {
        value: value,
        available: true,
        equals: function (other) {
            return !!other && other.available !== false && this.value === other.value;
        }
    };
}

function loadHelper(priceBookMgrStub) {
    return proxyquire('../../../../cartridges/autobahn_client_core/cartridge/scripts/helpers/liveSellingPriceHelper', {
        'dw/catalog/PriceBookMgr': priceBookMgrStub
    });
}

function createProduct(priceBookPrices) {
    return {
        ID: 'Q6J0UJ44WG003',
        getPriceModel: function () {
            return {
                getPriceBookPrice: function (priceBookID) {
                    return priceBookPrices[priceBookID] || { available: false };
                }
            };
        }
    };
}

describe('liveSellingPriceHelper', function () {
    it('returns the live selling price when it is explicitly different from the parent price book', function () {
        var helper = loadHelper({
            getPriceBook: function () {
                return {
                    getParentPriceBook: function () {
                        return { getID: function () { return 'wgaca-web-pricebook'; } };
                    }
                };
            }
        });
        var product = createProduct({
            'wgaca-liveselling': money(1050),
            'wgaca-web-pricebook': money(3750)
        });

        var result = helper.getLiveSellingPrice(product);

        assert.isNotNull(result);
        assert.equal(result.value, 1050);
    });

    it('returns null when the live selling price is just inherited from the parent (never explicitly set)', function () {
        var helper = loadHelper({
            getPriceBook: function () {
                return {
                    getParentPriceBook: function () {
                        return { getID: function () { return 'wgaca-web-pricebook'; } };
                    }
                };
            }
        });
        // getPriceBookPrice walks the parent chain, so an unpriced product in wgaca-liveselling returns
        // the same value as the parent - that's the "inherited" case this helper must detect and reject.
        var product = createProduct({
            'wgaca-liveselling': money(3750),
            'wgaca-web-pricebook': money(3750)
        });

        var result = helper.getLiveSellingPrice(product);

        assert.isNull(result);
    });

    it('returns null when the price book does not exist', function () {
        var helper = loadHelper({
            getPriceBook: function () {
                return null;
            }
        });
        var product = createProduct({ 'wgaca-liveselling': money(1050) });

        assert.isNull(helper.getLiveSellingPrice(product));
    });

    it('returns null when the product has no price at all in the live selling price book', function () {
        var helper = loadHelper({
            getPriceBook: function () {
                return {
                    getParentPriceBook: function () {
                        return null;
                    }
                };
            }
        });
        var product = createProduct({});

        assert.isNull(helper.getLiveSellingPrice(product));
    });

    it('returns the live selling price when the price book has no parent at all', function () {
        var helper = loadHelper({
            getPriceBook: function () {
                return {
                    getParentPriceBook: function () {
                        return null;
                    }
                };
            }
        });
        var product = createProduct({ 'wgaca-liveselling': money(1050) });

        var result = helper.getLiveSellingPrice(product);

        assert.isNotNull(result);
        assert.equal(result.value, 1050);
    });

    it('returns null for a null product', function () {
        var helper = loadHelper({ getPriceBook: function () { return {}; } });

        assert.isNull(helper.getLiveSellingPrice(null));
    });
});
