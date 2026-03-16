'use strict';

/**
*
* This controller is invoked to track logged in customer and basket for Yotpo loyalty
*
* @module controllers/Yotpo
*/

var server = require('server');

/**
 * This controller is invoked to track logged in customer and basket for Yotpo loyalty
 */
server.get('IncludeLoyaltyTracking', function (req, res, next) {
    var CommonModel = require('*/cartridge/models/common/commonModel');
    var YotpoUtils = require('*/cartridge/scripts/utils/yotpoUtils');
    var YotpoConfigurationModel = require('*/cartridge/models/common/yotpoConfigurationModel');

    var viewData = res.getViewData();
    var currentLocaleID = YotpoUtils.getCurrentLocaleSFRA(viewData.locale);
    var isCartridgeEnabled = YotpoConfigurationModel.isCartridgeEnabled();
    var isLoyaltyEnabled = isCartridgeEnabled && YotpoConfigurationModel.getYotpoPref('yotpoLoyaltyEnabled', currentLocaleID);
    var customerDetails = {
        customerExists: false
    };

    var basketDetails = {
        basketExists: false
    };

    if (req.currentCustomer.profile) {
        customerDetails = CommonModel.getLoggedInCustomerDetails(req.currentCustomer.profile.customerNo);
    }
    basketDetails = CommonModel.getCurrentBasketDetails(currentLocaleID);

    res.render('/tracking/yotpoLoyaltyTracking', {
        isLoyaltyEnabled: isLoyaltyEnabled,
        customerDetails: customerDetails,
        basketDetails: basketDetails
    });

    return next();
});

server.get('HtmlHead', server.middleware.include, function(req, res, next) {
    var Site = require('dw/system/Site');
    var YotpoConfigurationModel = require('*/cartridge/models/common/yotpoConfigurationModel');
    var yotpoLogger = require('*/cartridge/scripts/utils/yotpoLogger');
    var currLocale = req.locale.id;
    var isCartridgeEnabled = YotpoConfigurationModel.isCartridgeEnabled();
    var isLoyaltyEnabled = YotpoConfigurationModel.getYotpoPref('yotpoLoyaltyEnabled', currLocale);

    var templateParams = res.viewData;
    templateParams.yotpoAppKey = YotpoConfigurationModel.getAppKeyForCurrentLocaleFromRequest(request);
    templateParams.yotpoStaticContentURL = Site.getCurrent().preferences.custom.yotpoStaticContentURL;
    templateParams.isCartridgeEnabled = isCartridgeEnabled;
    templateParams.isLoyaltyEnabled = isLoyaltyEnabled;
    templateParams.yotpoLoyaltyStaticContentURL = '';
    templateParams.yotpoLoyaltySDKURL = '';

    var templateFile = 'common/yotpoHeader';

    if (isCartridgeEnabled) {
        if (isLoyaltyEnabled) {
            var loyaltyAPIKeys = YotpoConfigurationModel.getLoyaltyAPIKeys(currLocale);
            var yotpoLoyaltyStaticContentURL = YotpoConfigurationModel.getYotpoPref('yotpoLoyaltyStaticContentURL', currLocale);
            var yotpoLoyaltySDKURL = YotpoConfigurationModel.getYotpoPref('yotpoLoyaltySDKURL', currLocale);
            yotpoLoyaltyStaticContentURL = !empty(yotpoLoyaltyStaticContentURL) && !empty(loyaltyAPIKeys) && !empty(loyaltyAPIKeys.guid) ? yotpoLoyaltyStaticContentURL.replace('<GUID>', loyaltyAPIKeys.guid) : '';
            yotpoLoyaltySDKURL = !empty(yotpoLoyaltySDKURL) && !empty(loyaltyAPIKeys) && !empty(loyaltyAPIKeys.guid) ? yotpoLoyaltySDKURL.replace('<GUID>', loyaltyAPIKeys.guid) : '';
            templateParams.yotpoLoyaltyStaticContentURL = yotpoLoyaltyStaticContentURL;
            templateParams.yotpoLoyaltySDKURL = yotpoLoyaltySDKURL;
        }
        try {
            res.render(templateFile, templateParams);
        } catch (ex) {
            yotpoLogger.logMessage('Something went wrong while loading the Yotpo header scripts template, Exception code is: ' + ex, 'error', 'scripts/header/yotpo.js');
        }
    }

    next();
});

module.exports = server.exports();
