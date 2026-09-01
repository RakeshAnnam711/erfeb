'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var ArrayList = require('../../../../../mock/dw/util/Collection');
var collections = proxyquire('../../../../../../cartridges/int_globale/cartridge/scripts/util/globale/collections', {
    'dw/util/ArrayList': ArrayList
});

var currentBasketMock = {
    getBonusDiscountLineItems: function () {
        return new ArrayList([
            {
                custom: { bonusProductLineItemUUID: 'someUUID' },
                getBonusProductPrice: function () {
                    return {
                        toFormattedString: function () {
                            return 'someFormattedString';
                        }
                    };
                }
            }
        ]);
    }
};

var lineItemMock = {
    custom: {
        bonusProductLineItemUUID: 'someUUID'
    }
};

var otherLineItemMock = {
    custom: {
        bonusProductLineItemUUID: 'someOtherUUID'
    }
};

var productMock = {};

describe('bonus product unit price', function () {
    var bonusUnitPrice = proxyquire('../../../../../../cartridges/int_globale_sfra/cartridge/models/productLineItem/decorators/bonusUnitPrice', {
        'dw/order/BasketMgr': {
            getCurrentBasket: function () {
                return currentBasketMock;
            }
        },
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/factories/globale/price': function () {
            return {
                toFormattedString: function () {
                    return 'someFormattedString';
                }
            };
        }
    });

    it('should create a property on the passed in object called bonusUnitPrice', function () {
        var object = {};

        bonusUnitPrice(object, lineItemMock, productMock);

        assert.equal(object.bonusUnitPrice, 'someFormattedString');
    });

    it('should create a property on the passed in object called bonusUnitPrice when UUIDs do not match', function () {
        var object = {};
        bonusUnitPrice(object, otherLineItemMock, productMock);

        assert.equal(object.bonusUnitPrice, '');
    });

    it('should create a property on the passed in object called bonusUnitPrice when no current basket', function () {
        var object = {};
        currentBasketMock = null;
        bonusUnitPrice(object, lineItemMock, productMock);

        assert.equal(object.bonusUnitPrice, '');
    });
});
