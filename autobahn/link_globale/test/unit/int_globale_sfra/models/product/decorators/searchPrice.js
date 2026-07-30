'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var stubDefaultPrice = sinon.stub();
var stubRangePrice = sinon.stub();
var stubPriceModel = sinon.stub();
var stubRootPriceBook = sinon.stub();

var noActivePromotionsMock = [];

var sessionMock = {
    get: function (param) {
        var result = null;
        switch (param) {
            case 'geOperatedCountry':
                result = true;
                break;
            case 'gePriceStrategy':
                result = 'DYNAMIC';
                break;
            case 'geUseFixedPricesOnly':
                result = false;
                break;
            default:
                break;
        }
        return result;
    }
};

var globalePriceModelMock = function (priceModel) {
    return priceModel;
};

var PromotionMgrMock = {
    getPromotion: function () {
        return {};
    },
    activeCustomerPromotions: noActivePromotionsMock
};

var pricingMock = {
    getRootPriceBook: function () {
        return 'rootPricebook';
    }
};

var globalePromotionPlanMock = function (activeCustomerPromotions) {
    var length = activeCustomerPromotions.length;
    var promotions = activeCustomerPromotions;
    return {
        getProductPromotions: function () {
            promotions.getLength = function () {
                return length;
            };
            return promotions;
        }
    };
};

var priceModelMock = {
    priceInfo: {
        priceBook: { ID: 'somePriceBook' }
    },
    minPrice: { value: 100, available: true },
    maxPrice: { value: 100, available: true },
    getPriceBookPrice: function () {
        return this.minPrice;
    }
};

var searchHitMock = {
    product: {
        ID: 'someProduct',
        priceModel: priceModelMock,
        getPriceModel: function () {
            return priceModelMock;
        },
        bundle: false,
        isBundle: function () {
            return this.bundle;
        }
    },
    firstRepresentedProduct: {
        ID: 'someProduct',
        priceModel: priceModelMock,
        getPriceModel: function () {
            return priceModelMock;
        },
        bundle: false,
        isBundle: function () {
            return this.bundle;
        }
    },
    discountedPromotionIDs: ['someID']
};

function getSearchHit() {
    return searchHitMock;
}

describe('product searchPrice decorator', function () {
    var searchPrice = proxyquire('../../../../../../cartridges/int_globale_sfra/cartridge/models/product/decorators/searchPrice', {
        'dw/campaign/PromotionMgr': PromotionMgrMock,
        '*/cartridge/scripts/helpers/pricing': pricingMock,
        '*/cartridge/models/price/default': stubDefaultPrice,
        '*/cartridge/models/price/range': stubRangePrice,
        '*/cartridge/models/globale/session': sessionMock,
        '*/cartridge/scripts/factories/globale/priceModel': globalePriceModelMock,
        '*/cartridge/scripts/factories/globale/promotionPlan': globalePromotionPlanMock,
        '*/cartridge/scripts/helpers/globaleHelpers': require('../../../../../mock/factories/scripts/helpers/globaleHelpers')
    });

    afterEach(function () {
        stubRangePrice.reset();
        stubDefaultPrice.reset();
    });

    it('should create a property on the passed in object called price with no active promotions', function () {
        var object = {};
        stubPriceModel.returns(priceModelMock);
        stubRootPriceBook.returns(pricingMock);
        searchPrice(object, searchHitMock, noActivePromotionsMock, getSearchHit);

        assert.isTrue(stubDefaultPrice.withArgs({ value: 100, available: true }).calledOnce);
    });

    it('should create a property on the passed in object called price', function () {
        var object = {};
        stubPriceModel.returns(priceModelMock);
        stubRootPriceBook.returns(pricingMock);
        priceModelMock.maxPrice.value = 200;
        searchPrice(object, searchHitMock, noActivePromotionsMock, getSearchHit);

        assert.isTrue(stubRangePrice.withArgs({ value: 100, available: true }, { value: 200, available: true }).calledOnce);
    });
});
