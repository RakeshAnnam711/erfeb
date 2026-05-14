'use strict';

/**
 * Retrieves product's Class/Group/Brand Coefficient Rate
 * @returns {number|null} - Coefficient Rate or null
 */
function getProductClassCoefficientRate() {
    try {
        if (!this.discount) {
            var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
            var globaleSession = require('*/cartridge/models/globale/session');
            var geProductClassCoefficientsMgr = require('*/cartridge/scripts/factories/globale/geProductClassCoefficientsMgr');
            var objectUtils = require('*/cartridge/scripts/util/globale/object');
            var productClassCode;
            var productCoefficientCo;
            var productClassCodePropName = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geProductClassCodePropName);
            if (this.product && productClassCodePropName !== null) {
                productClassCode = objectUtils.getValueByPath(this.product, productClassCodePropName, null);
                if (productClassCode) {
                    productCoefficientCo = geProductClassCoefficientsMgr.getGEProductClassCoefficient(
                        productClassCode + '_' + globaleSession.get('geCountry')
                    );
                    if (productCoefficientCo) {
                        return productCoefficientCo.custom.rate;
                    }
                }
            }
        }
    } catch (e) {
        this.logger.error('getProductClassCoefficientRate: {0}', this.logger.message(e));
    }
    return null;
}

module.exports = function (object) {
    Object.defineProperty(object, 'productClassCoefficientRate', {
        enumerable: true,
        value: getProductClassCoefficientRate.call(object)
    });
};
