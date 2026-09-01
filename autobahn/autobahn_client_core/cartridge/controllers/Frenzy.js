'use strict';

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var URLUtils = require('dw/web/URLUtils');
var frenzyServiceHelpers = require('~/cartridge/scripts/helpers/frenzyServiceHelpers');
var ProductMgr = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger');
var PriceBookMgr = require('dw/catalog/PriceBookMgr');

server.get('Search', function (req, res, next) {
    var wishlist= dw.system.Site.getCurrent().getCustomPreferenceValue('wishlistEnable');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var result = searchHelper.search(req, res);
    req.pageMetaData.setTitle('Sites-WGACA | Search');
    if (result.productSearch && result.productSearch.count === 1 && result.productSearch.productIds.length === 1) {
        var productID = result.productSearch.productIds[0].productID;
        var location = URLUtils.https('Product-Show','pid',productID).toString();
        res.redirect(location);
    }
    var currentCustomer = req.currentCustomer;
    var currentCustomerRawID = currentCustomer.raw.ID;
    session.custom.currentCustomer = currentCustomerRawID;
    res.setViewData({
        currentCustomer: currentCustomer
    });
    res.render('/search/frenzySearchResults', {wishlistPref: wishlist});
    next();
});

server.get('SliderProducts', function(req, res, next) {

    var priceFactory = require('*/cartridge/scripts/factories/price');
    var globaleSession = require('*/cartridge/models/globale/session');
    
    var frenzyData = String(req.querystring.frenzyData);
        frenzyData = JSON.parse(frenzyData);
    
    var present_date = new Date();
    var past_date = new Date(present_date);
        past_date.setDate(past_date.getDate() - frenzyData.number_days_ago);
        present_date = present_date.toISOString().split('T')[0];
        past_date = past_date.toISOString().split('T')[0];

    var data = {};
    data.requestData = {};
    data.auth_key_value = frenzyData.auth_key_value;
    data.endpoint = frenzyData.api_url;

    //requestData
    data.requestData.start_date = past_date;
    data.requestData.end_date = present_date;
    data.requestData.num_matching = 15;
    data.requestData.full_description = true;    

    // pass user id payload value based on user authentication
    try {
        var cookies = request.httpCookies || {};
        var frenzyCookie = cookies['__frenzy_user_id'] || cookies.__frenzy_user_id;
        var frenzyUserId = frenzyCookie ? frenzyCookie.value : '';
        data.requestData.user_id = req.currentCustomer.raw.authenticated && req.currentCustomer.profile ? req.currentCustomer.profile.customerNo : frenzyUserId;
    } catch (error) {
        Logger.error('Error while fetching frenzy user id cookie: {0}', error);
    data.requestData.user_id = session.custom.currentCustomer || req.currentCustomer.raw.ID;
    }


    frenzyData.user_id = data.requestData.user_id;
    var productsData;
    productsData = frenzyServiceHelpers.postFrenzyServiceWrapper(data , {});
    var matchingProducts = productsData.matching_products || [];

    matchingProducts.forEach(function (prod) {
        try {
            var productObj;
            if (prod.sku) {
                var trimmedSku = prod.sku.trim();
                productObj = ProductMgr.getProduct(trimmedSku);
    
                if (!productObj && trimmedSku.toUpperCase() !== trimmedSku) {
                    productObj = ProductMgr.getProduct(trimmedSku.toUpperCase());
                }
            }
    
            if (productObj) {
                // Get price using the central price logic
                var currencyCode = globaleSession.get('geCurrency')
                var price = priceFactory.getPrice(productObj, currencyCode, true, null, null);


                var standardPrice = (price.sales && price.sales.value) ? price.sales.value : 0;
                var listPrice = (price.list && price.list.value) ? price.list.value : standardPrice;


                var discountAmount = 0;
                if (listPrice > 0 && standardPrice < listPrice) {
                    discountAmount = Number((listPrice - standardPrice).toFixed(2));
                }


                var material = productObj.custom.material || '';
                var condition = productObj.custom.condition_name || '';
                var saleStatus = (discountAmount > 0) ? 'Offer' : 'No Offer';


                prod.gtmData = {
                    item_id: prod.sku,
                    item_name: prod.org_product,
                    discount: discountAmount,
                    item_brand: prod.org_brand,
                    item_category: '',
                    item_category2: '',
                    item_list_id: frenzyData.title ? ('Homepage-' + frenzyData.title.toLowerCase().replace(/\s+/g, '_')) : '',
                    item_list_name: frenzyData.title ? 'Homepage-' + frenzyData.title : '',
                    item_variant: material,
                    item_condition: condition,
                    sale_status: saleStatus,
                    stock_status: prod.org_stock_available === 'True' ? 'In Stock' : 'Out of Stock',
                    product_gender: 'Women',
                    price: standardPrice,
                    quantity: 1,
                    currencyCode: currencyCode
                };
            }
            else {
                prod.gtmData = null;
                Logger.warn('Product not found for SKU: {0}', prod.sku);
            }
    
        } catch (e) {
            Logger.error('Error constructing GTM Data for SKU: {0} - {1}', prod.sku || 'Unknown SKU', e.message);
            prod.gtmData = null;
        }
    });
    
    var wishlistToggleURL = URLUtils.url('Wishlist-ToggleProduct').toString(); 

    res.render('experience/components/commerce_assets/frenzyProductList', {
        productsData: productsData,
        frenzyData: frenzyData,
        Wishlist_ToggleProduct: wishlistToggleURL
    });

    next();

});

module.exports = server.exports();
