'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru();

function loadModule() {
    return proxyquire('../../../../cartridges/autobahn_client_core/cartridge/scripts/cart/cartSummaryBuilder', {
        'dw/value/Money': function (value, currencyCode) {
            this.value = value;
            this.currencyCode = currencyCode;
            this.valueOrNull = value;
        },
        'dw/util/StringUtils': {
            formatMoney: function (money) { return '$' + money.value.toFixed(2); }
        },
        'dw/util/Currency': {},
        'dw/system/Logger': { getLogger: function () { return { error: function () {} }; } },
        '*/cartridge/models/globale/session': { get: function () { return null; } },
        '*/cartridge/scripts/factories/globale/money': function (value, currencyCode) {
            return { toFormattedString: function () { return '$' + value.toFixed(2); } };
        }
    });
}

// getAdjustedPrice() is the full-quantity, adjustment-inclusive line item total - already correct on its
// own for a live selling (or any other) adjustment, with no separate adjustment lookup needed here.
function createLineItem(adjustedPriceValue) {
    return {
        getAdjustedPrice: function () { return { value: adjustedPriceValue, available: true }; }
    };
}

function createBasket(lineItems) {
    return {
        getCurrencyCode: function () { return 'USD'; },
        getAllProductLineItems: function () {
            return { toArray: function () { return lineItems; } };
        }
    };
}

describe('cartSummaryBuilder.getTotalBasePrice', function () {
    it('sums each line item\'s adjusted (final) price, already inclusive of any adjustment', function () {
        var cartSummaryBuilder = loadModule();
        var basket = createBasket([createLineItem(1050)]); // already-discounted live selling line item total

        var result = cartSummaryBuilder.getTotalBasePrice(basket);

        assert.equal(result.value, 1050);
    });

    it('sums adjusted prices across multiple line items', function () {
        var cartSummaryBuilder = loadModule();
        var basket = createBasket([
            createLineItem(1050), // live selling item, already discounted
            createLineItem(500)   // regular item, no adjustment
        ]);

        var result = cartSummaryBuilder.getTotalBasePrice(basket);

        assert.equal(result.value, 1550);
    });

    it('correctly reflects a discounted line item total at quantity 2', function () {
        var cartSummaryBuilder = loadModule();
        // 2 units @ $3750 live-priced down to $1050/unit => adjusted total 2100
        var basket = createBasket([createLineItem(2100)]);

        var result = cartSummaryBuilder.getTotalBasePrice(basket);

        assert.equal(result.value, 2100);
    });

    it('returns 0 for an empty/null basket without throwing', function () {
        var cartSummaryBuilder = loadModule();

        assert.doesNotThrow(function () {
            var result = cartSummaryBuilder.getTotalBasePrice(null);
            assert.equal(result.value, 0);
        });
    });
});
