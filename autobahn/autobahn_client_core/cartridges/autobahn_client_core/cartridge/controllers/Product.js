'use strict';

var server = require('server');
server.extend(module.superModule);

var HTTPClient = require('dw/net/HTTPClient');
var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var globaleSession = require('*/cartridge/models/globale/session');
var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
var Money = require('dw/value/Money');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

var normalizeText = function (text) {
    return text
        .normalize("NFD") // Decomposes characters (e.g., é → e + ´)
        .replace(/[\u0300-\u036f]/g, '') // Removes diacritical marks
        .replace(/\s+/g, '-') // Replace spaces with "-"
        .toLowerCase(); // Convert to lowercase
}

var setConversetViewData = function (req, res, next) {
    var showProductPageHelperResult = res.viewData.showProductPageHelperResult;
    var viewData = res.viewData;
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    var product = showProductPageHelperResult.product;
    var gtmBreadcrumbs = productHelpers.getAllBreadcrumbs(null, product.id, []).reverse();

    var prevCategory = req.session.privacyCache.get('prevCategory');

    if (viewData.breadcrumbs != null && viewData.breadcrumbs != undefined) {
        viewData.breadcrumbs = productHelpers.getFullBreadcrumbs(prevCategory, product, viewData.breadcrumbs);
    }

    var currentCustomer = req.currentCustomer;
    var currentCustomerRawID = currentCustomer.raw.ID;
    session.custom.currentCustomer = currentCustomerRawID;

    viewData.currentCustomer = currentCustomer;

    // get currency symbol
    var currencyCode =  globaleSession.get('geCurrency');
    var valueMoney = new Money(0, currencyCode);
    valueMoney = globaleMoney(valueMoney.valueOrNull, globaleSession.get('geCurrency'), valueMoney);

    var currencySymbol = '';
    if (
        valueMoney &&
        valueMoney.currency &&
        valueMoney.currency.custom &&
        Object.prototype.hasOwnProperty.call(valueMoney.currency.custom, 'symbol')
    ) {
        currencySymbol = valueMoney.currency.custom.symbol;
    } else {
        var currency = Currency.getCurrency(product.price.sales.currency);
        currencySymbol = currency.getSymbol();
    }
    viewData.currencySymbol = currencySymbol;

    // get USD value for make an offer
    var sessionCurrency = globaleSession.get('geCurrency');
    var isUSD = sessionCurrency === 'USD';
    var rate = 1;
    if (!isUSD) {
        rate = getConversionRate(sessionCurrency);
        if (!rate) {
            Logger.warn('No conversion rate found for USD to {0}', sessionCurrency);
            rate = 1;
        }
    }
    viewData.productUSDPrice = product.price.sales.decimalPrice / rate;
    viewData.currencyRate = rate;

    if (req.querystring.q == 'frenzy') {
        Logger.warn('CurrentCutomerRawID: {0} , SessionCurrentCustomer: {1} , RequestQueryString: {2}',
            currentCustomerRawID,
            session.custom.currentCustomer,
            JSON.stringify(req.querystring)
        );
    }

    if (req.querystring && (req.querystring.j || req.querystring.sfmc_sub || req.querystring.l || req.querystring.u || req.querystring.mid || req.querystring.mid || req.querystring.jb)) {
        var conversionTrackerHelper = require('*/cartridge/scripts/helpers/conversionTrackerHelper');
        var conversionParams = {
            jobID: req.querystring.j,
            subscriberID: req.querystring.sfmc_sub,
            listID: req.querystring.l,
            landingPageID: req.querystring.u,
            memberID: req.querystring.mid,
            batchID: req.querystring.jb,
            pID: req.querystring.pid,
            linkAlias: showProductPageHelperResult.product.id
        };
        conversionTrackerHelper.setConversionCookie(conversionParams);
    }

    var tangibleeResponse = '';

    if (Site.getCurrent().getCustomPreferenceValue('enableTangiblee')) {
        var tangibleeService = require('*/cartridge/scripts/helpers/tangibleeService');

        var service = tangibleeService.tangibleeService();
        var response = service.call(showProductPageHelperResult.product.id);

        var responseObject = response && response.object;
        if (responseObject && responseObject.text) {
            try {
                tangibleeResponse = JSON.parse(responseObject.text);
            } catch (e) {
                Logger.warn('Failed to parse Tangiblee response for product {0}: {1}', showProductPageHelperResult.product.id, e.message);
                tangibleeResponse = '';
            }
        }
    }

    if (!showProductPageHelperResult.product.online) {
        var product = ProductMgr.getProduct(showProductPageHelperResult.product.id);
        if (product) {
            var location;
            var relatedProductSKU = product.custom.relatedProduct; // Fetching the custom attribute
            // Check if related product exists and is online
            if (relatedProductSKU) {
                var relatedProduct = ProductMgr.getProduct(relatedProductSKU.trim());
                if (relatedProduct && relatedProduct.online) {
                    location = URLUtils.abs('Product-Show', 'pid', relatedProduct.ID).toString();
                } else if (product.brand) {
                    var brand = product.brand.trim().replace(/\s+/g, '-').toLowerCase(); // Replace spaces with "-"
                    var brandPageURL = URLUtils.abs('Search-Show', 'cgid', normalizeText(brand)).toString(); // Generate brand page URL
                    // Check if brand page exists
                    var httpClient = new HTTPClient();
                    httpClient.open('GET', brandPageURL);
                    httpClient.send();
                    location = brandPageURL; // Redirect if the brand page is available
                }
            }
            if (!location) {
                var primaryCategory = product.getPrimaryCategory();
                if (primaryCategory && primaryCategory.ID && primaryCategory.online) {
                    location = URLUtils.abs('Search-Show', 'cgid', primaryCategory.ID).toString();
                } else if (product.categories && product.categories.length > 0 && product.categories[0].ID && product.categories[0].online) {
                    var categoryID = product.categories[0].ID
                    location = URLUtils.abs('Search-Show', 'cgid', categoryID).toString();
                } else {
                    location = URLUtils.abs('Home-Show').toString();
                }
            }
            res.redirect(location);
            res.setRedirectStatus(301);
        } else {
            res.setStatusCode(404);
            res.render('error/notFound');
        }
    }
    res.setViewData('currentCustomer', currentCustomer);
    res.setViewData('tangibleeResponse', tangibleeResponse);
    res.setViewData('gtmBreadcrumbs', gtmBreadcrumbs);

    csrfProtection.generateToken(req, res, ()=>{});

    var csrf = res.viewData.csrf;

    next();
};

server.append('Show', csrfProtection.generateToken, setConversetViewData);
server.append('ShowInCategory', setConversetViewData);


server.get('SubmitCustomerOffer', function (req, res, next) {
    var result = {  success: false, message: '' };
    var productID = req.querystring.productID;
    if(req.currentCustomer.profile == null){
        result.success = false;
        result.message = 'User is not authenticated!';

        res.json({
            success: result.success,
            message: result.message
        });

        return next();
    }
    var customerNo = req.currentCustomer.profile.customerNo;

    try
    {
        Transaction.wrap(function() {
            try
            {
                var customObj = CustomObjectMgr.getCustomObject('MakeAnOffer', customerNo);
                if (!customObj) {
                    customObj = CustomObjectMgr.createCustomObject('MakeAnOffer', customerNo);
                }
                var productList = [];
                if(customObj.custom.productID){
                    productList = customObj.custom.productID.split('|').map(function(item) {
                        return item.trim();
                    });
                }

                if (productList.length == 0 || productList.indexOf(productID) == -1) {
                    productList.push(productID);
                    customObj.custom.productID = productList.join('|');
                    customObj.custom.emailID = req.currentCustomer.profile.email;
                    result.success = true;
                    result.message = 'Offer added successfully.';
                }
                else{
                    result.success = false;
                    result.message = 'You have already submitted an offer for this product.';
                }

            }
            catch(e){
                result.success = false;
                result.message = 'An error occurred: ' + e.message;
            }
        });
    }
    catch (e) {
        result.success = false;
        result.message = 'An error occurred: ' + e.message;
    }

    res.json({
        success: result.success,
        message: result.message
    });

    return next();
});

function getConversionRate(targetCurrency) {
    try {
        var rateObj = CustomObjectMgr.getCustomObject('GLOBALE_CURRENCY_RATES', 'USD_' + targetCurrency);
        if (rateObj && rateObj.custom && rateObj.custom.rate) {
            return parseFloat(rateObj.custom.rate);
        }
    } catch (e) {
        Logger.error('Error fetching conversion rate for USD_{0}: {1}', targetCurrency, e.message);
    }
    return null;
}


module.exports = server.exports();
