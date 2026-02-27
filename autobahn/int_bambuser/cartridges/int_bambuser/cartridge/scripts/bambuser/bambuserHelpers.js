'use strict';

/*
 * Bambuser Helpers
 */

/**
* Returns the product ID from a given reference
* @param {string} ref - the reference to extract the product ID from
* @returns {string} the extracted product ID
*/
function getProductIdFromRef(ref) {
    var useUrlRegex = dw.system.Site.current
        .getCustomPreferenceValue('bambuser_extract_pid_url');
    if (useUrlRegex && /^http/i.test(ref)) {
        var QueryString = require('server').querystring;
        // check if PID was passed as a param (no storefront urls)
        var pidParam = new QueryString(ref).pid;
        if (pidParam) {
            return pidParam;
        }
        // check if PID was passed as path
        var pidPath = ref
            // remove params
            .replace(/\?.*$/, '')
            // remove fragment
            .replace(/#.*$/, '')
            // remove suffix
            .replace(/(\.html?)?\/?$/, '')
            // get last segment of path
            .replace(/^.*(\/|-)/, '');
        if (pidPath) {
            return pidPath;
        }
    }
    return ref;
}

/**
* Checks if the Bambuser feature is enabled for the current site
* @returns {boolean} - true if the feature is enabled, false otherwise
*/
function isFeatureEnabled() {
    return Boolean(dw.system.Site.current.getCustomPreferenceValue('bambuser_enabled'));
}

/**
* Returns a boolean indicating whether the overview is enabled
* @returns {boolean} - true if the overview is enabled, false otherwise
*/
function isOverviewEnabled() {
    return Boolean(dw.system.Site.current.getCustomPreferenceValue('bambuser_show_overview'));
}

/**
 * @returns {Object} miniplayer dismiss button status
 */
function isDismissMiniplayerButton() {
    return dw.system.Site.current.getCustomPreferenceValue('bambuser_dismiss_miniplayer').value;
}

/**
 * @returns {Object} miniplayer product button status
 */
function isProductMiniplayerButton() {
    return dw.system.Site.current.getCustomPreferenceValue('bambuser_product_miniplayer').value;
}

/**
* Returns whether the checkout miniplayer button is enabled for the current site
* @returns {boolean} - true if the checkout miniplayer button is enabled, false otherwise
*/
function isCheckoutMiniplayerButton() {
    return dw.system.Site.current.getCustomPreferenceValue('bambuser_checkout_miniplayer').value;
}

/**
* Returns the miniplayer skip pages
* @returns {string} - the miniplayer skip pages
*/
function getMiniplayerSkipPages() {
    return dw.system.Site.current.getCustomPreferenceValue('bambuser_skip_pages_miniplayer');
}

/**
* Checks if the floating action button is enabled for the current site
* @returns {boolean} true if the floating action button is enabled, false otherwise
*/
function isFABEnabled() {
    return Boolean(dw.system.Site.current
        .getCustomPreferenceValue('bambuser_floating_action_button'));
}

/**
* Returns the Bambuser FAB widget ID from the current site's custom preferences
* @returns {string} the Bambuser FAB widget ID
*/
function getFABWidgetId() {
    return dw.system.Site.current
        .getCustomPreferenceValue('bambuser_fab_widget_id');
}

/**
* Returns the URL for the FAB Widget
* @returns {string} the URL for the FAB Widget
*/
function getFABWidgetURL() {
    return dw.system.Site.current
        .getCustomPreferenceValue('bambuser_fab_widget_scripturl');
}

/**
* Returns the list of pages to skip for FAB
* @returns {Array} - an array of pages to skip for FAB
*/
function getFABSkipPages() {
    return dw.system.Site.current
        .getCustomPreferenceValue('bambuser_skip_pages_fab');
}

/**
* Checks if cart integration is enabled for the current site
* @returns {boolean} - true if cart integration is enabled, false otherwise
*/
function isCartIntegrationEnabled() {
    return Boolean(dw.system.Site.current.getCustomPreferenceValue('bambuser_cart_integration'));
}

/**
* Returns a plain JS object that contains the configuration for Bambuser integration
* @returns {Object} - the Bambuser configuration object
*/
function getBambuserConfig() {
    var configObj = {
        enabled: isFeatureEnabled(),
        currency: request.session.currency.currencyCode,
        locale: request.locale,
        dismissMiniplayer: isDismissMiniplayerButton(),
        productMiniplayer: isProductMiniplayerButton(),
        checkoutMiniplayer: isCheckoutMiniplayerButton(),
        cartIntegration: isCartIntegrationEnabled(),
        urls: {
            embedScript: dw.system.Site.current
                .getCustomPreferenceValue('bambuser_liveshopping_scripturl'),
            addToCart: dw.web.URLUtils.url('Cart-AddProduct').toString(),
            checkout: dw.web.URLUtils.url('Checkout-Begin').toString(),
            productData: dw.web.URLUtils.url('Bambuser-Product').toString(),
            removeProduct: dw.web.URLUtils.url('Cart-RemoveProductLineItem').toString(),
            updateQuantity: dw.web.URLUtils.url('Cart-UpdateQuantity').toString()
        }
    };
    return configObj;
}

module.exports = {
    getProductIdFromRef: getProductIdFromRef,
    isFeatureEnabled: isFeatureEnabled,
    isOverviewEnabled: isOverviewEnabled,
    isDismissMiniplayerButton: isDismissMiniplayerButton,
    isProductMiniplayerButton: isProductMiniplayerButton,
    isCheckoutMiniplayerButton: isCheckoutMiniplayerButton,
    getMiniplayerSkipPages: getMiniplayerSkipPages,
    isFABEnabled: isFABEnabled,
    getFABWidgetId: getFABWidgetId,
    getFABWidgetURL: getFABWidgetURL,
    getFABSkipPages: getFABSkipPages,
    isCartIntegrationEnabled: isCartIntegrationEnabled,
    getBambuserConfig: getBambuserConfig
};
