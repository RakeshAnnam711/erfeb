'use strict';

var server = require('server');

/**
 * SFCC end point for Global-e Cache includes
 * @returns {undefined} - next()
 */
server.get('Cache', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var globaleSession = require('*/cartridge/models/globale/session');
    var params = { remoteIncludeUrl: null };
    var requestParams = req.querystring.toString();
    if (('globaletemplate' in req.querystring) && req.querystring.globaletemplate) {
        if (!('globalecache' in req.querystring) || (req.querystring.globalecache !== 'true')) {
            res.render(req.querystring.globaletemplate);
            return next();
        }
        params.remoteIncludeUrl = URLUtils.url('Globale-Cache', 'globaletemplate', req.querystring.globaletemplate);
        requestParams = requestParams.replace('&globalecache=' + req.querystring.globalecache, '');
    } else if (('remoteIncludeUrl' in req.querystring) && req.querystring.remoteIncludeUrl) {
        params.remoteIncludeUrl = URLUtils.url(req.querystring.remoteIncludeUrl);
        requestParams = requestParams.replace('&remoteIncludeUrl=' + req.querystring.remoteIncludeUrl, '');
    }
    if (req.querystring.ajax) {
        requestParams = requestParams.replace('&ajax=' + req.querystring.ajax, '');
        params.ajax = 'true';
    }
    params.remoteIncludeUrl.append('geCountry', globaleSession.get('geCountry'));
    params.remoteIncludeUrl.append('geCurrency', globaleSession.get('geCurrency'));
    params.remoteIncludeUrl = (params.remoteIncludeUrl.toString() + '&' + requestParams);
    res.render('components/globale/remoteinclude', params);
    return next();
});

/**
 * SFCC end point for Global-e country selector
 */
server.get(
    'CountrySelector',
    server.middleware.include,
    function (req, res, next) {
        res.render('components/globale/countrySwitcher');
        next();
    }
);

/**
 * SFCC end point for Global-e Client JS SDK script loader
 */
server.get('ScriptLoaderData', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');
    var globaleSession = require('*/cartridge/models/globale/session');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');
    var clientJsMerchantId = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsMerchantId);
    var clientJsBaseUrl = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsBaseUrl);
    var clientJsSource = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsSource).replace('{merchantId}', clientJsMerchantId);
    var geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');
    var globaleCountryHelpers = require('*/cartridge/scripts/helpers/globaleCountryHelpers');
    var geoLocationCountryCode = globaleCountryHelpers.getCountryCodeFromLocation();
    var siteId = Site.getCurrent().getID();
    var localeId = globaleRequest.get('locale');

    // get Language Switcher Configuration
    var languageSwitcherConfig = geConfigurationMgr.getLanguageSwitcherConfig();
    var languageSwitcherConfigOutputData = languageSwitcherConfig.getConfigOutputData(siteId);
    languageSwitcherConfigOutputData.selectedLanguage = localeId;

    // get Shipping Switcher Configuration
    var shippingSwitcherConfig = geConfigurationMgr.getShippingSwitcherConfig();
    var shippingSwitcherConfigOutputData = shippingSwitcherConfig.getConfigOutputData(siteId, localeId);

    res.json({
        clientJsUrl: (clientJsBaseUrl + clientJsSource),
        apiVersion: globaleSession.get('geApiVersion'),
        clientJsMerchantId: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsMerchantId),
        clientSettings: globaleHelpers.getClientSettings(),
        clientJsDomain: clientJsBaseUrl,
        cookieDomain: globaleHelpers.getCookieDomain(),
        globaleOperatedCountry: globaleSession.get('geOperatedCountry'),
        locationRedirectUrl: URLUtils.https('Globale-LocationRedirect').toString(),
        getRedirectLocationUrl: URLUtils.https('Globale-GetRedirectLocationURL').toString(),
        globaleConvertPriceUrl: URLUtils.https('Globale-ConvertPrice').toString(),
        globaleCartTokenUrl: URLUtils.https('Globale-GetCartToken').toString(),
        geoLocationCountry: {
            countryCode: geoLocationCountryCode,
            isCountryExists: (geoLocationCountryCode ? geCountryMgr.isCountryExists(geoLocationCountryCode) : false)
        },
        siteId: siteId,
        country: globaleSession.get('geCountry'),
        currency: globaleSession.get('geCurrency'),
        culture: globaleSession.get('geCulture'),
        locale: localeId,
        languageSwitcher: languageSwitcherConfigOutputData,
        shippingSwitcher: shippingSwitcherConfigOutputData,
        allowedCurrencies: geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccAllowedCurrencies, {}, 'json')
    });
    next();
});

/**
 * SFCC end point for location redirect
 */
server.get(
    'LocationRedirect',
    server.middleware.https,
    function (req, res, next) {
        var globaleResponse = require('*/cartridge/models/globale/response');
        globaleResponse.setExpires(new Date(Date.now() + (1 * 60 * 60 * 1000))); // set 1 hour cache of response
        res.redirect(require('*/cartridge/scripts/helpers/globaleCountryHelpers').getRedirectUrl());
        next();
    }
);

/**
 * Main entry point for Global-e Checkout
 */
server.get(
    'CheckoutShow',
    server.middleware.include,
    function (req, res, next) {
        var checkoutData = require('*/cartridge/scripts/factories/globale/checkout/checkoutShow')();
        var reportingURLs = checkoutData.success ? require('*/cartridge/scripts/reportingUrls')
            .getCheckoutReportingURLs(checkoutData.basket.UUID, 2, 'Shipping') : null;

        res.render('globale/checkout/iframe', {
            checkoutData: checkoutData,
            reportingURLs: reportingURLs
        });
        next();
    }
);

/**
 * This end point allows to keep the SFCC session alive on Global-e Checkout page
 */
server.get(
    'KeepAlive',
    server.middleware.https,
    function (req, res, next) {
        res.json(require('*/cartridge/scripts/factories/globale/checkout/keepAlive')());
        next();
    }
);

/**
 * SFCC end point for Global-e PSP Redirect API
 */
server.get(
    'PaymentRedirect',
    server.middleware.https,
    function (req, res, next) {
        var paymentRedirectData = require('*/cartridge/scripts/factories/globale/checkout/paymentRedirect')();

        res.render('globale/checkout/iframe', {
            checkoutData: paymentRedirectData
        });
        next();
    }
);

/**
 * SFCC end point for Global-e OrderClientCreate API
 */
server.post(
    'OrderCreate',
    server.middleware.https,
    function (req, res, next) {
        res.json(require('*/cartridge/scripts/factories/globale/order/orderClientCreate')());
        next();
    }
);

/**
 * SFCC end point for server-to-server Global-e OrderCreate API
 */
server.post(
    'OrderCreateV2',
    server.middleware.https,
    function (req, res, next) {
        res.json(require('*/cartridge/scripts/factories/globale/order/orderCreate')());
        next();
    }
);

/**
 * This end point is designed for backend SFCC analytics.
 *
 * Merchant Customization: If you would like to include SFCC analytics, add SFCC analytic reporting
 * code for each step as you see fit. See example code taken from SFCC below for data.Steps.CONFIRMATION.
 * @example
 * var reportingUrlsHelper = require('{@literal *}/cartridge/scripts/reportingUrls'); // Instantiate helper module
 * var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);   // Call helper method
 * res.render('checkout/confirmation/confirmation', {  // Rendering template includes
 *    order: orderModel,                               // the reportingUrls.isml template
 *    returningCustomer: true,
 *    reportingURLs: reportingURLs                     // Pass in URL array
 * });
 */
server.post('Analytics', server.middleware.https, function (req, res, next) {
    var data = null;
    try {
        data = JSON.parse(req.body);
        if (!('StepId' in data) || (data.StepId === null)) {
            throw new Error('StepId is missing!');
        }
        if (!('Steps' in data) || !data.Steps) {
            throw new Error('Steps is missing!');
        }
        // There is no Basket any more in session!
        switch (data.StepId) {
            case data.Steps.LOADED:
                break;
            case data.Steps.CONFIRMATION:
                if (!data.IsSuccess || !('MerchantOrderId' in data.details) || !data.details.MerchantOrderId) {
                    throw new Error('IsSuccess = false or can not find Merchant Order Id in data object!');
                }
                break;
            default:
                break;
        }
    } catch (e) {
        // handle error exceptions
    }
    res.json({ success: true, data: data });
    next();
});

/**
 * SFCC end point for Global-e SendOrderToMerchant API
 */
server.post(
    'OrderSendToMerchant',
    server.middleware.https,
    function (req, res, next) {
        var orderSendToMerchantResponse = require('*/cartridge/scripts/factories/globale/order/orderSendToMerchant')();
        res.json(orderSendToMerchantResponse.getPayload());

        // SFCC analytics
        try {
            this.on('route:Complete', function (req, res) { // eslint-disable-line no-shadow, no-unused-vars
                if (orderSendToMerchantResponse.data.orders.length > 0) {
                    var ISML = require('dw/template/ISML');
                    var globaleResponse = require('*/cartridge/models/globale/response');
                    var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
                    globaleResponse.writer.close();
                    orderSendToMerchantResponse.data.orders.forEach(function (order) {
                        var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);
                        ISML.renderTemplate('/reporting/reportingUrls', {
                            reportingURLs: reportingURLs
                        });
                    });
                }
            });
        } catch (e) {
            // return response anyway
        }

        next();
    }
);

/**
 * SFCC end point for Global-e PerformOrderPayment API
 */
server.post(
    'OrderPerformPayment',
    server.middleware.https,
    function (req, res, next) {
        res.json(require('*/cartridge/scripts/factories/globale/order/orderPayment')());
        next();
    }
);

/**
 * SFCC end point for Global-e UpdateOrderStatus API
 */
server.post(
    'OrderUpdateStatus',
    server.middleware.https,
    function (req, res, next) {
        res.json(require('*/cartridge/scripts/factories/globale/order/orderUpdateStatus')());
        next();
    }
);

/**
 * SFCC end point for Global-e UpdateOrderShippingInfo API
 */
server.post(
    'OrderUpdateShippingInfo',
    server.middleware.https,
    function (req, res, next) {
        res.json(require('*/cartridge/scripts/factories/globale/order/orderUpdateShippingInfo')());
        next();
    }
);

/**
 * SFCC end point for Global-e NotifyOrderRefund API
 */
server.post(
    'OrderRefund',
    server.middleware.https,
    function (req, res, next) {
        res.json(require('*/cartridge/scripts/factories/globale/order/orderRefundInfo')());
        next();
    }
);

/**
 * SFCC end point ClearCart on order confirmation
 */
server.post(
    'ClearCart',
    server.middleware.https,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        try {
            var isCleared = require('*/cartridge/scripts/factories/globale/dw/basket').geClearCart(BasketMgr.currentBasket);
            res.json({ cleared: isCleared });
        } catch (e) {
            res.json({ cleared: false });
        }
        next();
    }
);

/**
 * SFCC end point for Global-e ValidateCart API
 */
server.post(
    'ValidateCart',
    server.middleware.https,
    function (req, res, next) {
        res.json(require('*/cartridge/scripts/factories/globale/checkout/cartValidation')());
        next();
    }
);

/**
 * SFCC end point for price conversion
 */
server.get(
    'ConvertPrice',
    server.middleware.https,
    function (req, res, next) {
        var globaleResponse = require('*/cartridge/models/globale/response');
        globaleResponse.setExpires(new Date(Date.now() + (1 * 60 * 60 * 1000))); // set 1 hour cache of response
        res.json(require('*/cartridge/scripts/factories/globale/gePriceConversion')());
        next();
    }
);

/**
 * SFCC end point for Global-e SendRMAInfoToMerchant API
 */
server.post(
    'OrderRMA',
    server.middleware.https,
    function (req, res, next) {
        res.json(require('*/cartridge/scripts/factories/globale/order/orderRMA')());
        next();
    }
);

/**
 * SFCC end point for Global-e customer regitration
 */
server.use(
    'CustomerRegistartion',
    server.middleware.https,
    function (req, res, next) {
        res.json(require('*/cartridge/scripts/factories/globale/customerRegistration')());
        next();
    }
);

/**
 * SFCC end point for Global-e VoucherValidation API
 */
server.post(
    'Coupon',
    server.middleware.https,
    function (req, res, next) {
        res.json(require('*/cartridge/scripts/factories/globale/checkoutCouponCode')());
        next();
    }
);

/**
 * SFCC end point for Global-e GetCartToken
 */
server.post(
    'GetCartToken',
    server.middleware.https,
    function (req, res, next) {
        var checkoutData = require('*/cartridge/scripts/factories/globale/checkout/checkoutShow')(true);
        res.json({
            cartToken: checkoutData.cartToken,
            success: checkoutData.success
        });
        next();
    }
);

/**
 * SFCC end point for Global-e VoidInventoryReservation
 */
server.post(
    'VoidInventoryReservation',
    server.middleware.https,
    function (req, res, next) {
        res.json(require('*/cartridge/scripts/factories/globale/inventory/voidReservation')());
        next();
    }
);

module.exports = server.exports();
