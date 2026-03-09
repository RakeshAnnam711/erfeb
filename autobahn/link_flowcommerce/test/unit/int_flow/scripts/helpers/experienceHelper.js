'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');
var collections = require('../../../../mocks/util/collections');

var taxLookup = {
    "CAN": "HST",
    "NZL": "GST",
    "USA": "Tax"
};

var countryLookup = {
    "CA": "CAN",
    "CN": "CHN",
    "MX": "MEX",
    "NZ": "NZL",
    "GB": "GBR",
    "US": "USA",
    "CAN": "CA",
    "CHN": "CN",
    "MEX": "MX",
    "NZL": "NZ",
    "GBR": "GB",
    "USA": "US"
};

var experiences = [
    {
      "id": "canada",
      "currencyCode": "CAD",
      "shippingConfigurationKey": "canada",
      "defaultLanguage": "en",
      "defaultCountry": "CAN",
      "defaultSfccLocale": "en_CA",
      "countries": [
        "CAN"
      ],
      "sfccLocales": [
        "en_CA",
        "fr_CA"
      ],
      "sfccLocalesCountryMap": {
        "CAN": [
          "en_CA",
          "fr_CA"
        ]
      }
    },
    {
      "id": "china",
      "currencyCode": "CNY",
      "shippingConfigurationKey": "canada",
      "defaultLanguage": "zh",
      "defaultCountry": "CHN",
      "defaultSfccLocale": "zh_CN",
      "countries": [
        "CHN"
      ],
      "sfccLocales": [
        "zh_CN"
      ],
      "sfccLocalesCountryMap": {
        "CHN": [
          "zh_CN"
        ]
      },
      "taxIncluded": "Includes VAT",
      'showDeliveryWindow': false
    },
    {
      "id": "mexico",
      "currencyCode": "MXN",
      "shippingConfigurationKey": "mexico",
      "defaultLanguage": "es",
      "defaultCountry": "MEX",
      "defaultSfccLocale": "es_MX",
      "countries": [
        "MEX"
      ],
      "sfccLocales": [
        "es_MX"
      ],
      "sfccLocalesCountryMap": {
        "MEX": [
          "es_MX"
        ]
      },
      "taxIncluded": "Includes VAT"
    },
    {
      "id": "new-zealand",
      "currencyCode": "NZD",
      "shippingConfigurationKey": "canada",
      "defaultLanguage": "en",
      "defaultCountry": "NZL",
      "deliveryOrigin": "NZL",
      "defaultSfccLocale": "en_NZ",
      "countries": [
        "NZL"
      ],
      "sfccLocales": [
        "en_NZ"
      ],
      "sfccLocalesCountryMap": {
        "NZL": [
          "en_NZ"
        ]
      },
      "taxIncluded": "Includes GST"
    }
  ];

global.request = {
    getLocale: function() {
        return 'en_US';
    }
};

global.session = {
    currency: {
      currencyCode: 'USD'
    },
    setCurrency: function () { return; },
    privacy: {
        flowExperienceId: 'mexico'
    }
};

global.empty = function(a) {
  return !a;
};

var setCurrencyStub = sinon.stub(session, 'setCurrency');

function setFlowExperienceId(id) {
    global.session.privacy.flowExperienceId = id;
}

function getExperienceHelper(locale) {
    var usLocale = locale || { 
        ID: 'en_US',
        country: 'US',
        getISO3Country: function() { return 'USA'; } 
    };

    var experienceHelper = proxyquire('../../../../../cartridges/int_flow/cartridge/scripts/flow/helpers/experienceHelper', {
        '*/cartridge/config/flowExperiences': experiences,
        '*/cartridge/config/countryCodeLookup': countryLookup,
        '*/cartridge/config/countryTaxLookup': taxLookup,
        '*/cartridge/scripts/helpers/hooks': function(a, b, c, cb) { return cb(); },
        '*/cartridge/scripts/helpers/basketCalculationHelpers': {
          calculateTotals: function() {}
        },
        '*/cartridge/scripts/flow/helpers/flowHelper': {
            'isFlowEnabled': true,
            'showTaxIncluded': true,
            'useBaseCurrency': true,
            'defaultDeliveryOrigin': 'USA',
            'allowedCurrencies': ['USD', 'CNY', 'NZD']
        },
        'dw/util/Locale': {
            getLocale: function () {
                return usLocale;
            }
        },
        'dw/util/Currency': {
            getCurrency: function () {
                return 'USD';
            }
        },
        'dw/order/BasketMgr': {
          getCurrentBasket: function() {
            return {
              updateCurrency: function () { return; },
              currencyCode: 'USD'
            };
          }
        },
        'dw/system/Transaction': {
          wrap: function(cb) {
            cb();
          }
        },
        'dw/catalog/PriceBookMgr': {
          getAllPriceBooks: function() {
            return [{custom: {flowExperienceID: 'new-zealand'}}, {custom: {flowExperienceID: 'china'}}];
          },
          setApplicablePriceBooks: function(pb) {
            return;
          }
        },
        '*/cartridge/scripts/util/collections': collections
    });

    return experienceHelper;
}

describe('experienceHelper', function() {
    describe('getCurrentExperience', function () {
        it('should return mexico', function () {
            setFlowExperienceId('mexico');
            var experienceHelper = getExperienceHelper();
            var experience = experienceHelper.getCurrentExperience();

            assert.equal(experience.id, 'mexico');
        });

        it('should return new-zealand', function () {
            setFlowExperienceId(null);
            var experienceHelper = getExperienceHelper({ 
                ID: 'en_NZ',
                country: 'NZ',
                getISO3Country: function() { return 'NZL'; } 
            });
        
            var experience = experienceHelper.getCurrentExperience();

            assert.equal(experience.id, 'new-zealand');
        });

        it('should return null', function () {
            setFlowExperienceId(null);
            var experienceHelper = getExperienceHelper();
            var experience = experienceHelper.getCurrentExperience();

            assert.isNull(experience);
        });
    });

    describe('getExperience', function () {
      it('should return mexico', function () {
          var experienceHelper = getExperienceHelper();
          var experience = experienceHelper.getExperience('mexico', 'NZL', 'en_NZ');

          assert.equal(experience.id, 'mexico');
      });

      it('should return new-zealand', function () {
          var experienceHelper = getExperienceHelper();
      
          var experience = experienceHelper.getExperience(null, 'NZL', 'en_NZ');

          assert.equal(experience.id, 'new-zealand');
      });

      it('should return null', function () {
          var experienceHelper = getExperienceHelper();
          var experience = experienceHelper.getExperience(null, 'USA', 'en_US');

          assert.isNull(experience);
      });
  });

  describe('useBaseCurrency', function () {
    it('should return true', function () {
        var experienceHelper = getExperienceHelper();
        assert.isTrue(experienceHelper.useBaseCurrency('dummy'));
    });
  });

  describe('convertCountryCode', function () {
    it('should return USA', function () {
        var experienceHelper = getExperienceHelper();
        assert.equal(experienceHelper.convertCountryCode('US'), 'USA');
    });
  });

  describe('getCountryTax', function () {
    it('should return GST', function () {
        var experienceHelper = getExperienceHelper();
        assert.equal(experienceHelper.getCountryTax('NZL'), 'GST');
    });

    it('should return VAT', function () {
      var experienceHelper = getExperienceHelper();
      assert.equal(experienceHelper.getCountryTax('TEST'), 'VAT');
  });
  });

  describe('getTaxIncluded', function () {
    it('should return GST Included', function () {
        setFlowExperienceId('new-zealand');
        var experienceHelper = getExperienceHelper();

        assert.equal(experienceHelper.taxIncluded, 'Includes GST');
    });
  });

  describe('setExperience', function() {
    it('should call session.setCurrency()', function() {
      var experienceHelper = getExperienceHelper();
      experienceHelper.setExperience(experiences[1]); // China
      assert.isTrue(setCurrencyStub.calledOnce);
    });
  });
});