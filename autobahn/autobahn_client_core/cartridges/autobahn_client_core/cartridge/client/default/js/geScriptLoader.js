/* eslint new-cap: "off", no-param-reassign: "off" */
/* globals GlobalE, Promise */

'use strict';

//--------------------------------------------------
// Helpers
//--------------------------------------------------

var Helpers = {
    makeJsonAjaxCall: function (url, type, data) {
        var promise = new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(type, url, true);
            xhr.setRequestHeader('Cache-Control', 'no-cache');
            xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
            xhr.send(data || null);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                    } else {
                        reject(xhr.status);
                    }
                }
            };
        });
        return promise;
    },
    removeParametersFromQueryString: function (queryString, parameters) {
        var qsParams = queryString && (typeof queryString === 'string') && queryString.length > 0 ? queryString.split('&') : [];
        var removedParams = parameters && Array.isArray(parameters) && parameters.length > 0 ? parameters : [];
        removedParams.forEach(function (param) {
            var prefix = encodeURIComponent(param) + '=';
            for (var i = qsParams.length; i-- > 0;) {
                if (qsParams[i].lastIndexOf(prefix, 0) !== -1) {
                    qsParams.splice(i, 1);
                }
            }
        });
        return qsParams.join('&');
    }
};

//--------------------------------------------------
// Globale Script Loader
//--------------------------------------------------

/**
 * Represents Globale Script Loader Class
 * @constructor
 */
function GeScriptLoader() { }

/**
 * Init Globale Script Loader Data
 */
GeScriptLoader.prototype.initScriptLoaderData = function () {
    try {
        window.geScriptLoaderData = JSON.parse(document.querySelector('#globale-script-loader-data').innerHTML);
    } catch (e) {
        window.geScriptLoaderData = null;
        console.error(e); // eslint-disable-line no-console
    }
};

/**
 * Init Global-e Client SDK
 * @returns {Object} promise - Promise Object
 */
GeScriptLoader.prototype.initClientSDK = function () {
    // check script loader data
    if (!window.geScriptLoaderData) {
        return Promise.reject();
    }

    return new Promise(function (resolve, reject) {
        window.globaleObject = 'gle';
        window.gle = window.gle || function () { (window.gle.q = window.gle.q || []).push(arguments); };
        window.gle.m = window.geScriptLoaderData.clientJsMerchantId;
        window.gle.v = window.geScriptLoaderData.apiVersion;
        var s = document.createElement('script');
        s.src = window.geScriptLoaderData.clientJsUrl + '?v=' + window.geScriptLoaderData.apiVersion;
        s.async = true;
        s.onerror = function (err) {
            reject(err, s);
        };
        var r = false;
        s.onreadystatechange = function () {
            if (!r && (!this.readyState || this.readyState === 'complete')) {
                r = true;
                resolve();
            }
        };
        s.onload = s.onreadystatechange;
        var t = document.querySelectorAll('script')[0];
        t.parentElement.insertBefore(s, t);
    });
};

/**
 * Init Content Price Conversion
 */
GeScriptLoader.prototype.initContentPriceConversion = function () {
    /**
     * Run Price Conversion handler
     */
    function runPriceConversion() {
        // find DOM price elements to convert and filter out already converted ones or with not valid configuration
        var priceElements = Array.prototype.slice.call(document.querySelectorAll('[data-ge-convert-price]'))
            .filter(
                function (el) {
                    // filter out already converted elements
                    if (('isConverted' in el.dataset) && el.dataset.isConverted === 'true') {
                        return false;
                    }

                    // filter out misconfigured elements
                    if (
                        (!(('productId' in el.dataset) && el.dataset.productId !== '')) &&
                        (!(('originalPrice' in el.dataset) && el.dataset.originalPrice !== '' && !isNaN(el.dataset.originalPrice))) // eslint-disable-line no-restricted-globals
                    ) {
                        return false;
                    }
                    return true;
                }
            );

        // iterate DOM price elements and convert price
        priceElements.forEach(function (el) {
            // define base request URL
            var convertPriceUrl = window.geScriptLoaderData.globaleConvertPriceUrl;

            // modify request URL
            // set country and currency code to make sure that if the response is cached it is personalized per country and currency
            convertPriceUrl += '?countryCode=' + encodeURIComponent(window.geScriptLoaderData.country);
            convertPriceUrl += '&currencyCode=' + encodeURIComponent(window.geScriptLoaderData.currency);

            // set parameters to price convert
            if (el.dataset.productId) { // the highest priority is to process 'data-product-id'
                convertPriceUrl += '&productId=' + encodeURIComponent(el.dataset.productId);
            } else if (el.dataset.originalPrice) { // process 'data-original-price' and 'data-is-discount'
                convertPriceUrl += '&originalPrice=' + encodeURIComponent(el.dataset.originalPrice);
                convertPriceUrl += '&isDiscount=' + encodeURIComponent(el.dataset.isDiscount);
            }

            // send request and get converted price
            Helpers.makeJsonAjaxCall(convertPriceUrl, 'GET')
                .then(function (response) {
                    if (response) {
                        response = JSON.parse(response);
                        if (response.success) {
                            el.innerHTML = response.convertedPrice; // eslint-disable-line no-param-reassign
                            el.dataset.isConverted = 'true';
                        }
                    }
                })
                .catch(function (e) {
                    console.error(e); // eslint-disable-line no-console
                });
        });
    }

    try {
        // skip price conversion if script loader data is not available or if country is not Global-e operated
        if (!window.geScriptLoaderData || !window.geScriptLoaderData.globaleOperatedCountry) {
            return;
        }

        /**
         * Add event listener
         * This custom event can be triggered if is needed to update/re-calculate the values in static content
         * @example
         * // Create the event
         * var event = new CustomEvent("runPriceConversion");
         * // Trigger the event
         * window.dispatchEvent(event);
         */
        window.addEventListener('runPriceConversion', runPriceConversion, false);

        // run initial price conversion
        runPriceConversion();
    } catch (e) {
        console.error(e); // eslint-disable-line no-console
    }
};

/**
 * Remove Global-e redirect parameters
 */
GeScriptLoader.prototype.removeGeRedirectParams = function () {
    try {
        var updatedUrl = new URL(document.location);
        var urlParams = updatedUrl.searchParams;

        if (urlParams.get('glCountry') || urlParams.get('glCurrency')) {
            // set 'Welcome Popup' cookie with 'false' value
            // additional GE parameters are existed in URL only during redirect and 'Welcome Popup' should not be displayed
            GlobalE.SetCookie('GlobalE_Welcome_Data', { showWelcome: false }, GlobalE.GE_DATA_COOKIE_EXP, true);

            // remove GE parameters and relpace history state
            urlParams.delete('glCountry');
            urlParams.delete('glCurrency');
            window.history.replaceState({}, document.title, updatedUrl.toString());

            // remove GE parameters from 'data-querystring' in DOM
            var requestDataEl = document.querySelector('[data-action][data-querystring]');
            if (requestDataEl) {
                var queryString = requestDataEl.getAttribute('data-querystring');
                queryString = Helpers.removeParametersFromQueryString(queryString, ['glCountry', 'glCurrency']);
                requestDataEl.setAttribute('data-querystring', queryString);
            }
        }
    } catch (e) {
        console.error(e); // eslint-disable-line no-console
    }
};

/**
 * Handler function of 'GlobalE.LoadShippingSwitcher' event
 */
GeScriptLoader.prototype.loadShippingSwitcherHandler = function () {
    try {
        var links = document.querySelectorAll('.globale-selector');
        Array.prototype.map.call(links, function (link) {
            GlobalE.AttachEvent('click', link, function () {
                return GlobalE.ShippingSwitcher.Show();
            });
        });

        // check and show geo country popup on initial load
        if (!GlobalE.GetCookie('GlobalE_Geo_Popup')) {
            if (
                window.geScriptLoaderData.shippingSwitcher &&
                window.geScriptLoaderData.shippingSwitcher.showGeoCountryPopup !== false &&
                window.geScriptLoaderData.geoLocationCountry &&
                window.geScriptLoaderData.geoLocationCountry.countryCode &&
                window.geScriptLoaderData.geoLocationCountry.isCountryExists &&
                window.geScriptLoaderData.geoLocationCountry.countryCode !== window.geScriptLoaderData.country
            ) {
                GlobalE.SetCookie('GlobalE_Welcome_Data', { showWelcome: false }, GlobalE.GE_DATA_COOKIE_EXP, true);
                GlobalE.ShippingSwitcher.Show(window.geScriptLoaderData.geoLocationCountry.countryCode);
            }

            // set 'GlobalE_Geo_Popup' cookie
            GlobalE.SetCookie('GlobalE_Geo_Popup', true, GlobalE.GE_DATA_COOKIE_EXP);
        }
    } catch (e) {
        console.error(e); // eslint-disable-line no-console
    }
};

/**
 * Handler function of 'GlobalE.OnShippingSwitcherClosed' event
 * @param {Object} event - Event object
 * @returns {boolean} - 'false' by default
 */
GeScriptLoader.prototype.onShippingSwitcherClosedHandler = function (event) {
    try {
        // check if window.geScriptLoaderData exists
        if (!window.geScriptLoaderData) {
            throw new Error('Script Loader Data not found');
        }

        // check if window.GlobalE exists
        if (!window.GlobalE) {
            throw new Error('GlobalE not found');
        }

        // extract data from window.geScriptLoaderData
        var currentCountry = window.geScriptLoaderData.country;
        var currentCurrency = window.geScriptLoaderData.currency;
        var currentLanguage = window.geScriptLoaderData.languageSwitcher && window.geScriptLoaderData.languageSwitcher.selectedLanguage;

        // check if redirect is needed
        var isRedirect = (
            event.button === 'save' &&
            (
                event.country !== currentCountry ||
                event.currency !== currentCurrency ||
                (
                    window.GlobalE.ShippingSwitcher &&
                    window.GlobalE.ShippingSwitcher.isLanguageDropDownShown &&
                    window.GlobalE.ShippingSwitcher.selectedLanguage !== currentLanguage
                )
            )
        );

        // if redirection is not needed, return false
        if (!isRedirect) {
            return false;
        }

        // construct URL for redirection
        var url = new URL(window.geScriptLoaderData.getRedirectLocationUrl);
        url.searchParams.append('countryCode', event.country);
        url.searchParams.append('currencyCode', event.currency);

        // append locale code if language dropdown is shown
        if (window.GlobalE.ShippingSwitcher && window.GlobalE.ShippingSwitcher.isLanguageDropDownShown) {
            url.searchParams.append('localeCode', window.GlobalE.ShippingSwitcher.selectedLanguage);
        }

        // append additional parameters if available
        var requestElement = document.querySelector('[data-action][data-querystring]');
        if (requestElement) {
            var action = requestElement.dataset.action;
            if (action) {
                url.searchParams.append('action', action);
            }

            var querystring = requestElement.dataset.querystring;
            if (querystring) {
                url.searchParams.append('querystring', querystring);
            }
        }

        // prepare redirection data
        var locationRedirectData = { url: url };

        // invoke callback if available
        if (typeof window.GlobalE.onBeforeLocatioRedirect === 'function') {
            window.GlobalE.onBeforeLocatioRedirect(event, locationRedirectData);
        }

        // Fetch the final Globale redirect URL (JSON) and navigate directly.
        // This avoids the intermediate 302 redirect previously used by Globale-LocationRedirect.
        $.ajax({
            url: locationRedirectData.url.toString(),
            method: 'GET',
            dataType: 'json'
        })
        .done((data) => {
            if (data && data.finalUrl) {
                window.location.href = data.finalUrl;
            } else {
                console.error('No finalUrl in response:', data);
            }
        })
        .fail((err) => {
            console.error('Redirect request failed:', err);
        });
    } catch (e) {
        console.error(e); // eslint-disable-line no-console
    }
    return false;
};

/**
 * Init 'KeepAlive' feature
 */
GeScriptLoader.prototype.initKeepAlive = function () {
    var geIframe = document.querySelector('#gle_iframe');
    try {
        window.globaleKeepAlive = setInterval(function () {
            Helpers.makeJsonAjaxCall(geIframe.dataset.keepaliveUrl, 'GET')
                .then(function (response) { // eslint-disable-line no-unused-vars
                    // handle response
                })
                .catch(function (e) {
                    console.error(e); // eslint-disable-line no-console
                });
        }, 60000); // every 1 minute
    } catch (e) {
        console.error(e); // eslint-disable-line no-console
    }
};

/**
 * Handler function of 'GlobalE.OnCheckoutStepLoadedHandler' event
 * @param {Object} data - Event data
 */
GeScriptLoader.prototype.onCheckoutStepLoadedHandler = function (data) {
    try {
        if (data.StepId === data.Steps.CONFIRMATION) {
            // stop sending keepAlive ajax call
            if (('globaleKeepAlive' in window) && window.globaleKeepAlive) {
                clearInterval(window.globaleKeepAlive);
            }
        }

        /**
         * If you need to implement the frontend analytics please put it here
         */
        window.dataLayer = window.dataLayer || [];

        if (data.StepId === data.Steps.LOADED) {
            window.dataLayer.push({
                event: 'begin_checkout',
                ecommerce: {
                    currency: data.details.CustomerCurrencyCode,
                    value: Number(data.details.OrderPrices.CustomerTransaction.CustomerTotalPrice),
                    items: data.details.ProductInformation.map(product => {
                        const transactionPrices = product.ProductPrices?.CustomerTransaction || {};
                        const customerTotalPrice = Number(transactionPrices.CustomerTotalPrice || 0);
                        const customerDiscountedPrice = Number(transactionPrices.CustomerDiscountedPrice || 0);
                        const customerListPrice = Number(transactionPrices.CustomerListPrice || 0);
                        const customerSalePrice = Number(transactionPrices.CustomerSalePrice || 0);

                        // Prefer the direct discounted price, else fall back to list - sale price
                        const discountAmount = (customerTotalPrice - customerDiscountedPrice) > 0
                            ? (customerTotalPrice - customerDiscountedPrice)
                            : (customerListPrice - customerSalePrice > 0 ? (customerListPrice - customerSalePrice) : 0);

                        return {
                            item_id: product.SKU,
                            item_name: product.ProductName,
                            item_category: "",
                            product_gender: product.Gender || "",
                            sale_status: (customerListPrice > customerDiscountedPrice) ? "On Offer" : "No Offer",
                            stock_status: product.StockStatus || "",
                            quantity: Number(product.Quantity),
                            item_condition: product.Condition || "",
                            item_list_id: product.ListId || "",
                            item_list_name: product.ListName || "",
                            item_category2:"",
                            price: customerDiscountedPrice,
                            item_brand: product.Brand || "",
                            item_variant: product.Variant || "",
                            discount: discountAmount,
                            affiliation: product.Affiliation || "WGACA"
                        };
                    })
                }
            });
        }

        if (data.StepId === data.Steps.CONFIRMATION) {
            $('.minicart .minicart-total .minicart-quantity').remove();
            $('.minicart .minicart-total').append('<span class="minicart-quantity">0</span>');

            const productTotals = (data?.details?.ProductInformation || []).map(product => {
                const quantity = Number(product.Quantity || 0);
                const totalPrice = Number(product?.ProductPrices?.MerchantTransaction?.TotalPrice || 0);
                return quantity * totalPrice;
            });

            const totalSum = productTotals.reduce((sum, val) => sum + val, 0);

            var pixelScript = document.createElement('script');
            pixelScript.type = 'text/plain';
            pixelScript.className = 'optanon-category-C0004';
            pixelScript.src = 'https://go.launchingdeals.com/util/pixel?product=WGACR&orderTotal=' + encodeURIComponent(totalSum);

            document.head.appendChild(pixelScript);

            window.dataLayer.push({
                event: "purchase",
                ecommerce: {
                    currency: data.details.CustomerCurrencyCode,
                    transaction_id: data.details.OrderID,
                    value: Number(data.details.OrderPrices.CustomerTransaction.CustomerTotalProductsPrice),
                    tax: Number(data.details.OrderPrices.CustomerTransaction?.CustomerDutiesAndTaxes),
                    shipping: Number(data.details.OrderPrices.CustomerTransaction.CustomerShippingPrice),

                    coupon: (() => {
                        const discounts = data.details.Discounts || [];
                        const cartDiscount = discounts.find(d => d.DiscountTypeName === "Cart discount" && d.CouponCode);
                        return cartDiscount ? cartDiscount.CouponCode : '';
                    })(),                
                    gift_certificate_code: data.details.GiftCertificateCode || "", 
                    shipping_tier: data.details.ShippingMethodType || "",          

                    shipping_country: data.details.CustomerDetails?.ShippingAddress?.ShippingCountryName || "",
                    shipping_city: data.details.CustomerDetails?.ShippingAddress?.ShippingCity || "",
                    payment_method: data.details.OrderPaymentMethods?.map(pm => `${pm.PaymentMethodName}-${pm.PaymentMethodTypeName}`).join(", ") || "",
                    email:data.details.CustomerDetails?.BillingAddress.BillingEmail || " ",
                    phone:data.details.CustomerDetails?.BillingAddress.BillingPhoneNumber || "",
                    user_id:data.details.CustomerDetails.MerchantUserId || "Guest",
                    items: data.details.ProductInformation.map(product => {
                        const transactionPrices = product.ProductPrices?.CustomerTransaction || {};
                        const customerTotalPrice = Number(transactionPrices.CustomerTotalPrice || 0);
                        const customerDiscountedPrice = Number(transactionPrices.CustomerDiscountedPrice || 0);
                        const customerListPrice = Number(transactionPrices.CustomerListPrice || 0);
                        const customerSalePrice = Number(transactionPrices.CustomerSalePrice || 0);

                        const discountAmount = (customerTotalPrice - customerDiscountedPrice) > 0
                            ? (customerTotalPrice - customerDiscountedPrice)
                            : (customerListPrice - customerSalePrice > 0 ? (customerListPrice - customerSalePrice) : 0);

                        return {
                            item_id: product.SKU,
                            item_name: product.ProductName,
                            item_category: "",
                            item_category2: "",
                            product_gender: "Women",
                            sale_status: (customerListPrice > customerDiscountedPrice) ? "On Offer" : "No Offer",
                            stock_status: product.StockStatus || "",
                            quantity: Number(product.Quantity),
                            item_condition: product.Condition || "",
                            item_list_id: product.ListId || "",
                            item_list_name: product.ListName || "",
                            price: customerDiscountedPrice,
                            item_brand: product.Brand || "",
                            item_variant: product.Variant || "",
                            discount: discountAmount,
                            affiliation: product.Affiliation || "WGACA"
                        };
                    })
                }
            });
        }




        /**
         * Only for Backend Analytics, like standard SFCC Merchant Tools / Analytics / Purchase Reports.
         * Should be handled in Globale-Analytics controller
         */
        var geIframe = document.querySelector('#gle_iframe');
        Helpers.makeJsonAjaxCall(geIframe.dataset.analyticsUrl, 'POST', JSON.stringify(data))
            .then(function (response) { // eslint-disable-line no-unused-vars
                // handle response
                console.log(data);

            })
            .catch(function (e) {
                console.error(e); // eslint-disable-line no-console
            });
    } catch (e) {
        console.error(e); // eslint-disable-line no-console
    }
};

/**
 * Handler function of 'GlobalE.OnClientEvent' event
 * Used for Extreme Analytic
 * @param {string} source - Event source
 * @param {Object} data - Event data
 */
GeScriptLoader.prototype.onClientEvent = function (source, data) { // eslint-disable-line no-unused-vars
    try {
        switch (source) {
            case GEMerchantUtils.ClientEvents.INPUT_BLUR: // eslint-disable-line no-undef
                // your code
                break;
            case GEMerchantUtils.ClientEvents.STORE_SELECTION: // eslint-disable-line no-undef
                // your code
                break;
            case GEMerchantUtils.ClientEvents.SHIPPINGMETHOD_SELECTION: // eslint-disable-line no-undef
                // your code
                break;
            case GEMerchantUtils.ClientEvents.TAX_OPTION_SELECTED: // eslint-disable-line no-undef
                // your code
                break;
            case GEMerchantUtils.ClientEvents.PAYMENTMETHOD_CHANGED: // eslint-disable-line no-undef
                // your code
                break;
            case GEMerchantUtils.ClientEvents.BUTTON_CLICKED: // eslint-disable-line no-undef
                // your code
                break;
            case GEMerchantUtils.ClientEvents.COMBO_CHANGED: // eslint-disable-line no-undef
                // your code
                break;
            case GEMerchantUtils.ClientEvents.ADD_NEW_SHIPPING_ADDRESS: // eslint-disable-line no-undef
                // your code
                break;
            case GEMerchantUtils.ClientEvents.ON_PAGE_LOAD: // eslint-disable-line no-undef
                // your code
                break;
            case GEMerchantUtils.ClientEvents.ON_CLIENT_ERROR: // eslint-disable-line no-undef
                // your code
                break;
            case GEMerchantUtils.ClientEvents.ON_SERVER_ERROR: // eslint-disable-line no-undef
                // your code
                break;
            case GEMerchantUtils.ClientEvents.CHECKBOX_CHANGE: // eslint-disable-line no-undef
                // your code
                break;
            case GEMerchantUtils.ClientEvents.WINDOW_SHOWN: // eslint-disable-line no-undef
                // your code
                break;
            default:
                break;
        }
    } catch (e) {
        console.error(e); // eslint-disable-line no-console
    }
};

/**
 * Customer registration post message handler
 * @param {Object} event - Event object
 */
GeScriptLoader.prototype.registrationPostMessageHandler = function (event) {
    try {
        // check request is from legitimate source and message is expected or not
        if (!GlobalE || !GlobalE.CheckoutManager || !GlobalE.CheckoutManager.IsGlobaleMessage(event.origin)) { return; }
        var eventMessage = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        var geIframe = document.querySelector('#gle_iframe');
        if (('Key' in eventMessage) && eventMessage.Key === 'CustomerRegistration') {
            Helpers.makeJsonAjaxCall(geIframe.dataset.registrationUrl, 'POST', JSON.stringify(eventMessage.Data))
                .then(function (response) {
                    if (response) {
                        response = JSON.parse(response);
                        GlobalE.CheckoutManager.UpdateGlobalE('CustomerRegistration', response);
                    }
                })
                .catch(function (e) {
                    console.error(e); // eslint-disable-line no-console
                });
        }
    } catch (e) {
        console.error(e); // eslint-disable-line no-console
    }
};

/**
 * Init events
 */
GeScriptLoader.prototype.initEvents = function () {
    // check script loader data
    if (!window.geScriptLoaderData) {
        return;
    }

    // ---------------------------GENERAL EVENTS--------------------------- //
    // 'GlobalE.SetMerchantParameters' event
    GlobalE.SetMerchantParameters(JSON.parse(window.geScriptLoaderData.clientSettings));

    // 'GlobalE.ScriptsURL' event
    GlobalE.ScriptsURL(window.geScriptLoaderData.clientJsDomain);

    // 'GlobalE.SetCookieDomain' event
    GlobalE.SetCookieDomain(window.geScriptLoaderData.cookieDomain);

    // Remove Global-e redirect parameters
    this.removeGeRedirectParams();

    // 'GlobalE.LoadWelcome' event
    if (window.geScriptLoaderData.globaleOperatedCountry) {
        // The welcome popup should be blocked for all regions except the US, until the user submits consent.
        if (!(window.geScriptLoaderData?.country==='US')) {
            GlobalE.SetCookie('GlobalE_Welcome_Data', { showWelcome: false }, GlobalE.GE_DATA_COOKIE_EXP, true);
        }
        GlobalE.LoadWelcome(window.geScriptLoaderData.country, window.geScriptLoaderData.culture, window.geScriptLoaderData.currency);
    }

    // 'GlobalE.LoadShippingSwitcher' event
    GlobalE.LoadShippingSwitcher(window.geScriptLoaderData.country, window.geScriptLoaderData.culture, window.geScriptLoaderData.currency, false, this.loadShippingSwitcherHandler);

    // 'GlobalE.OnShippingSwitcherClosed' event
    GlobalE.OnShippingSwitcherClosed(this.onShippingSwitcherClosedHandler);

    // ---------------------------CHECKOUT EVENTS--------------------------- //
    var geIframe = document.querySelector('#gle_iframe');
    if (geIframe) {
        // 'GlobalE.Checkout' event
        GlobalE.Checkout(geIframe.dataset.cartToken, 'gle_iframe');

        // 'KeepAlive' feature
        this.initKeepAlive();

        // 'GlobalE.OnCheckoutStepLoaded' event
        GlobalE.OnCheckoutStepLoaded(this.onCheckoutStepLoadedHandler);

        // 'GlobalE.OnClientEvent' event
        GlobalE.OnClientEvent(this.onClientEvent);

        // 'Customer registration' feature
        window.addEventListener('message', this.registrationPostMessageHandler, false);
    }
};

GeScriptLoader.prototype.init = function () {
    this.initScriptLoaderData();
    this.initContentPriceConversion();
    this.initClientSDK()
        .then(this.initEvents.bind(this))
        .catch(function (e) {
            console.error(e); // eslint-disable-line no-console
        });
};

//--------------------------------------------------
// Initialisation
//--------------------------------------------------

/**
 * General init function
 */
function init() {
    var geScriptLoader = new GeScriptLoader();
    geScriptLoader.init();
}

/**
 * Run initialisation once document is loaded
 */
if (/complete|interactive|loaded/.test(document.readyState)) {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
