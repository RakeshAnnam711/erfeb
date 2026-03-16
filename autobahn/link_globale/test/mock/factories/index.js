'use strict';

module.exports = {
    models: {
        globale: {
            checkoutApplyCoupon: {
                AbstractStrategy: require('./models/globale/checkoutApplyCoupon/AbstractStrategy'),
                JWTStrategy: require('./models/globale/checkoutApplyCoupon/JWTStrategy'),
                SessionBridgeStrategy: require('./models/globale/checkoutApplyCoupon/SessionBridgeStrategy')
            },
            config: {
                AbstractConfig: require('./models/globale/config/AbstractConfig'),
                LanguageSwitcherConfig: require('./models/globale/config/LanguageSwitcherConfig'),
                ShippingSwitcherConfig: require('./models/globale/config/ShippingSwitcherConfig')
            },
            crypto: {
                RSA: require('./models/globale/crypto/RSA')
            },
            sendCart: {
                decorators: {
                    authToken: require('./models/globale/sendCart/decorators/authToken'),
                    culture: require('./models/globale/sendCart/decorators/culture'),
                    sessionId: require('./models/globale/sendCart/decorators/sessionId'),
                    webStoreCodes: require('./models/globale/sendCart/decorators/webStoreCodes')
                },
                product: {
                    decorators: {
                        productAttribute: require('./models/globale/sendCart/product/decorators/productAttribute')
                    }
                }
            },
            price: {
                decorators: {
                    productClassCoefficientRate: require('./models/globale/price/decorators/productClassCoefficientRate')
                }
            },
            culture: require('./models/globale/culture'),
            session: require('./models/globale/session'),
            request: require('./models/globale/request'),
            response: require('./models/globale/response')
        }
    },
    scripts: {
        helpers: {
            globaleHelpers: require('./scripts/helpers/globaleHelpers'),
            globaleCountryHelpers: require('./scripts/helpers/globaleCountryHelpers'),
            cacheHelpers: require('./scripts/helpers/cacheHelpers'),
            customerAddressHelpers: require('./scripts/helpers/customerAddressHelpers'),
            globaleCAPIHelpers: require('./scripts/helpers/globaleCAPIHelpers'),
            globaleProductHelpers: require('./scripts/helpers/globaleProductHelpers')
        },
        factories: {
            globale: {
                checkoutCouponCode: require('./scripts/factories/globale/checkoutCouponCode'),
                geCultureMgr: require('./scripts/factories/globale/geCultureMgr'),
                geCountryMgr: require('./scripts/factories/globale/geCountryMgr'),
                geCurrencyMgr: require('./scripts/factories/globale/geCurrencyMgr'),
                geProductClassCoefficientsMgr: require('./scripts/factories/globale/geProductClassCoefficientsMgr'),
                crypto: require('./scripts/factories/globale/crypto'),
                geAppSettingsMgr: require('./scripts/factories/globale/geAppSettingsMgr'),
                geServiceMgr: require('./scripts/factories/globale/geServiceMgr'),
                geConfigurationMgr: require('./scripts/factories/globale/geConfigurationMgr')
            }
        },
        util: {
            globale: {
                object: require('./scripts/util/globale/object'),
                validator: require('./scripts/util/globale/validator'),
                numbers: require('./scripts/util/globale/numbers'),
                collections: require('./scripts/util/globale/collections'),
                url: require('./scripts/util/globale/url'),
                values: require('./scripts/util/globale/values'),
                memoization: require('./scripts/util/globale/memoization')
            }
        }
    }
};
