'use strict';

/**
 * Inits default shipping method for Basket
 * @param {boolean} isGeBasket - is Global-e basket
 * @transactional
 */
function geInitShippingMethod(isGeBasket) {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    if (
        isGeBasket &&
        this.defaultShipment &&
        (
            !this.defaultShipment.shippingMethod ||
            !this.defaultShipment.shippingMethod.custom[globaleHelpers.customAttr.shippingMethod.isGeShippingMethod]
        )
    ) {
        this.geSetDefaultShippingMethod();
    } else if (
        !isGeBasket &&
        this.defaultShipment &&
        this.defaultShipment.shippingMethod &&
        this.defaultShipment.shippingMethod.custom[globaleHelpers.customAttr.shippingMethod.isGeShippingMethod]
    ) {
        Transaction.begin();
        this.defaultShipment.setShippingMethod(null);
        Transaction.commit();
    }
}

/**
 * Sets default shipping method for Basket
 * @transactional
 */
function geSetDefaultShippingMethod() {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var shippingMgr = (require('*/cartridge/scripts/factories/globale/shippingMgr'))();
    if (!this.defaultShipment.shippingMethod ||
        !this.defaultShipment.shippingMethod.custom[globaleHelpers.customAttr.shippingMethod.isGeShippingMethod] ||
        (this.defaultShipment.shippingMethod && this.defaultShipment.shippingMethod.currencyCode !== this.currencyCode)) {
        var allShippingMethods = shippingMgr.getAllShippingMethods(true);
        var globaleShippingMethodId = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geDefaultShippingMethod);
        if (this.currencyCode !== globaleHelpers.getMerchantBaseCurrencyCode()) {
            globaleShippingMethodId += ('_' + this.currencyCode);
        }
        var globaleShipingMethod = collections.find(allShippingMethods, function (shippingMethod) {
            return (shippingMethod.ID === globaleShippingMethodId);
        });
        if (!globaleShipingMethod) {
            throw new Error('Can\'t find Shipping Method with ID: ' + globaleShippingMethodId);
        }
        Transaction.begin();
        this.defaultShipment.setShippingMethod(globaleShipingMethod);
        Transaction.commit();
    }
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geInitShippingMethod: {
            value: geInitShippingMethod
        },
        geSetDefaultShippingMethod: {
            value: geSetDefaultShippingMethod
        }
    });
};
