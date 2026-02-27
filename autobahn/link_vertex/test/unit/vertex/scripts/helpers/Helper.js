'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

require.extensions['.ds'] = require.extensions['.js'];
require('../../../../dw-api-mock/demandware-globals');

var date = new Date();
var random = Math.floor(Math.random() * Math.floor(10));

var message = sinon.stub();
var format = sinon.stub();
var nextInt = sinon.stub();

describe('Helper', function () {
    var Helper = proxyquire('../../../../../cartridges/int_vertex/cartridge/scripts/helper/helper', {
        'dw/web/Resource': {
            msg: message
        },
        'dw/crypto/SecureRandom': function () {
            this.nextInt = nextInt;
        },
        'dw/util/StringUtils': {
            format: format
        }
    });


    beforeEach(function () {
        message.reset();
        message.returns('true');

        nextInt.reset();
        nextInt.returns(random);
        format.reset();
        format.withArgs('{0}-{1}-{2}', date.getFullYear().toString(), Helper.insertLeadingZero(date.getMonth() + 1), Helper.insertLeadingZero(date.getDate())).returns(date.getFullYear().toString() + '-' + Helper.insertLeadingZero(date.getMonth() + 1) + '-' + Helper.insertLeadingZero(date.getDate()));
    });

    it('getFormattedDate should return a current formatted date separated by "-" ', function () {
        assert.equal(Helper.getFormattedDate(), date.getFullYear().toString() + '-' + Helper.insertLeadingZero(date.getMonth() + 1) + '-' + Helper.insertLeadingZero(date.getDate()));
    });

    it('insertLeadingZero should insert a zero before digit under 10', function () {
        assert.equal(Helper.insertLeadingZero(1), '01');
        assert.equal(Helper.insertLeadingZero(5), '05');
        assert.equal(Helper.insertLeadingZero(70), '70');
        assert.equal(Helper.insertLeadingZero(10), '10');
    });

    it('beautifyAddresses should return array of addresses', function () {
        var mockForm = { address1: { value: '1 test street' } };
        var addresses = [
            {
                city: 'City1',
                postalCode: '111111',
                country: 'US',
                mainDivision: 'Texas',
                streetAddress1: null
            },
            {
                city: 'City2',
                postalCode: '222222',
                country: 'UK',
                mainDivision: 'London',
                streetAddress1: '221 Baker street'
            }
        ];
        var expectedArraytoString = '[{"UUID":' + random + ',"ID":"City1","key":"111111TexasnullundefinedCity1US","countryCode":"u","postalCode":"111111","stateCode":"Texas","address1":"1 test street","displayValue":"City1","city":"City1"},{"UUID":' + random + ',"ID":"City2","key":"222222London221 Baker streetundefinedCity2UK","countryCode":"u","postalCode":"222222","stateCode":"London","address1":"221 Baker street","displayValue":"City2","city":"City2"}]';
        var responseString = JSON.stringify(Helper.beautifyAddresses(mockForm, addresses));
        assert.equal(responseString, expectedArraytoString);
    });

    it('beautifyAddresses should return empty aaray if there is no addresses', function () {
        var mockForm = { address1: { value: '1 test street' } };
        var addresses = [];
        var expectedArraytoString = '[]';
        var responseString = JSON.stringify(Helper.beautifyAddresses(mockForm, addresses));
        assert.equal(responseString, expectedArraytoString);
    });

    it('getCurrentNormalizedAddress should return expected formatted address', function () {
        var responseObj = Helper.getCurrentNormalizedAddress();
        var expectedObj = {
            "UUID":"TEST UUID",
            "ID":"London",
            "key":"true",
            "address1":"221 Baker st",
            "address2":"222 Baker st",
            "city":"London",
            "postalCode":"111111",
            "stateCode":"MN",
            "countryCode":"uk",
            "displayValue":"London"
        };
        assert.deepEqual(responseObj, expectedObj);
    });

    it('getCurrentNormalizedAddress should return expected formatted address for multishipping', function () {
        request.httpParameterMap = { multishipping: { value: true } };
        var responseObj = Helper.getCurrentNormalizedAddress();
        var expectedObj = {
            "UUID":"TEST UUID",
            "ID":"London",
            "key":"true",
            "address1":"221 Baker st",
            "address2":"222 Baker st",
            "city":"London",
            "postalCode":"111111",
            "stateCode":"MN",
            "countryCode":"uk",
            "displayValue":"London"
        };
        assert.deepEqual(responseObj, expectedObj);
    });
    it('getCurrentNormalizedAddress should return expected formatted address for singleshipping', function () {
        request.httpParameterMap = { multishipping: { value: false } };
        var responseObj = Helper.getCurrentNormalizedAddress();
        var expectedObj = {
            "UUID":"TEST UUID",
            "ID":"London",
            "key":"true",
            "address1":"221 Baker st",
            "address2":"222 Baker st",
            "city":"London",
            "postalCode":"111111",
            "stateCode":"MN",
            "countryCode":"uk",
            "displayValue":"London"
        };
        assert.deepEqual(responseObj, expectedObj);
    });

    it('isEqualAddresses should return boolean', function () {
        var testObj = Helper.getCurrentNormalizedAddress();
        assert.isBoolean(Helper.isEqualAddresses(testObj));
    });

    it('isEqualAddresses should return true', function () {
        var testObj = Helper.getCurrentNormalizedAddress();
        assert.isTrue(Helper.isEqualAddresses([testObj]));
    });

    it('isEqualAddresses should return false', function () {
        var testObj = Helper.getCurrentNormalizedAddress();
        testObj.postalCode = '12345';
        assert.isFalse(Helper.isEqualAddresses([testObj]));
    });

    it('getProductClass should return string test', function () {
        var product = {
            product:
            {
                classificationCategory:
                {
                    ID: 'test'
                }
            }
        };
        assert.equal(Helper.getProductClass(product), 'test');
    });

    it('getProductClass should return string "MPtest"', function () {
        var product = {
            product: {
                variant: true,
                masterProduct:
                {
                    classificationCategory:
                    {
                        ID: 'MPtest'
                    }
                }
            }
        };
        assert.equal(Helper.getProductClass(product), 'MPtest');
    });

    it('getProductClass should return string "primaryCatTest"', function () {
        var product = {
            product: {
                variant: true,
                masterProduct:
                {
                    primaryCategory:
                    {
                        ID: 'primaryCatTest'
                    }
                }
            }
        };
        assert.equal(Helper.getProductClass(product), 'primaryCatTest');
    });


    it('prepareCart is void', function () {
        var cart = require('dw/order/BasketMgr').getCurrentBasket();
        assert.isUndefined(Helper.prepareCart(cart));
    });

    it('prepareCart should change Basket object', function () {
        var ArrayList = require('dw/util/Collection');
        var LineItem = require('dw/order/LineItem');

        var item1 = new LineItem();
        item1.updateTax(10);

        var item2 = new LineItem();
        item2.updateTax(20);

        var basket = {
            giftCertificateLineItems: new ArrayList([item1, item2]),

            getGiftCertificateLineItems: function () {
                return this.giftCertificateLineItems;
            },

            getAllProductLineItems: function () {
                return new ArrayList([]);
            },

            getAllLineItems: function () {
                return new ArrayList([]);
            }
        };
        Helper.prepareCart(basket);
        assert.equal(basket.getGiftCertificateLineItems().toArray()[0].tax, 0);
        assert.equal(basket.getGiftCertificateLineItems().toArray()[1].tax, 0);
    });
});
