'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        applyTaxVATCoefficients: {
            value: function (price) {
                var newPrice = price;
                try {
                    var TaxMgr = require('dw/order/TaxMgr');
                    var globaleSession = require('*/cartridge/models/globale/session');
                    var countryCoefficientIncludeVAT = globaleSession.get('geCountryCoefficientIncludeVAT');
                    var useCountryVAT = globaleSession.get('geUseCountryVAT');
                    // if product price = NET price (does not include local VAT)
                    // - add countryVATRate before calculate end-customer price
                    if (TaxMgr.getTaxationPolicy() === TaxMgr.TAX_POLICY_NET) {
                        if (['2', '4', '6'].indexOf(String(countryCoefficientIncludeVAT)) !== -1) {
                            newPrice += (newPrice * this.countryVATRate);
                        }
                    // if product price = GROSS price (includes local VAT)
                    // - deduct VAT before calculate end-customer price
                    } else if (
                        ['0', '8'].indexOf(String(countryCoefficientIncludeVAT)) !== -1
                        || (countryCoefficientIncludeVAT === 6 && useCountryVAT)
                    ) {
                        newPrice /= (1 + (this.merchantTaxRate / 100));
                        // add countryVATRate before calculate end-customer price
                        if (countryCoefficientIncludeVAT === 6) {
                            newPrice += (newPrice * this.countryVATRate);
                        }
                    }
                } catch (e) {
                    this.logger.error('applyTaxVATCoefficients: {0}', this.logger.message(e));
                }
                return newPrice;
            }
        }
    });
};
