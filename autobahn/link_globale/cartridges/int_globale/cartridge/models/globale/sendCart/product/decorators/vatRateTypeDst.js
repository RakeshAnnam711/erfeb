'use strict';

/**
 * Returns Global-e Product.VatRateType API.
 * @returns {array} - Global-e Product.VatRateType API
 */
function getVatRateTypeDst() {
    const Transaction = require('dw/system/Transaction');
    const globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    const globaleSession = require('*/cartridge/models/globale/session');
    const geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');
    const globaleCountryCoefficient = require('*/cartridge/models/globale/countryCoefficient');
    const geProductMgr = require('*/cartridge/scripts/factories/globale/dw/product');
    const numbers = require('*/cartridge/scripts/util/globale/numbers');

    const pli = this.productLineItem;
    const countryCode = globaleSession.get('geCountry');
    const geProduct = geProductMgr.get(pli.product || pli.parent.product);
    const geUseCountryVAT = geCountryMgr.getUseCountryVAT(countryCode);
    const countryCoefficientIncludeVAT = globaleCountryCoefficient.getIncludeVAT(countryCode);

    var countryVATRate = 0;
    var vatRateTypeName = 'ZeroVATRate-' + countryCode;

    if (geUseCountryVAT) {
        let productCountryVATRate = geProduct.geGetVatRate(countryCode);
        let defaultCountryVATRate = geCountryMgr.getCountryVATRate(countryCode);

        if (productCountryVATRate !== null) {
            countryVATRate = productCountryVATRate;
            vatRateTypeName = 'ProductVATRate-' + countryCode;
        } else if (defaultCountryVATRate !== null) {
            countryVATRate = defaultCountryVATRate;
            vatRateTypeName = 'CountryVATRate-' + countryCode;
        }
    } else if (!geUseCountryVAT && countryCoefficientIncludeVAT === 6) {
        countryVATRate = numbers.round((pli.taxRate * 100), 2);
        vatRateTypeName = 'MerchantVATRate-' + countryCode;
    }

    // set geVatRate on PLI level, to be used for discounts
    Transaction.wrap(function () {
        pli.custom[globaleHelpers.customAttr.productLineItem.geVatRate] = countryVATRate;
    });

    return {
        VATRateTypeCode: countryCode,
        Name: vatRateTypeName,
        Rate: countryVATRate // decimal
    };
}

module.exports = function (object) {
    Object.defineProperty(object, 'getVatRateTypeDst', {
        value: getVatRateTypeDst
    });
};
