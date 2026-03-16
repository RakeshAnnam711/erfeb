'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Resource = require('dw/web/Resource');

var Site = require('dw/system/Site');
var gtmEnabled = Site.current.getCustomPreferenceValue('GTMEnable') || false;
var gtmContainerId = Site.current.getCustomPreferenceValue('GTMID') || '';
var gtmAuth = Site.current.getCustomPreferenceValue('GTMAuth') || '';
var gtmPreview = Site.current.getCustomPreferenceValue('GTMPreview') || '';
var globaleSession = require('*/cartridge/models/globale/session');

var SITE_NAME = 'Sites-'+Site.current.ID+'-Site';
/**
 * @param {Object} req - current route request object
 * @returns {Object} an object of containing customer data
 */
function getCustomerData(req) {
    var system = require('dw/system/System');
    var customer = req.currentCustomer.raw,
        profile = customer.profile,
        session = request.session,
        customerObject = {};

    customerObject.environment = (system.instanceType === system.PRODUCTION_SYSTEM ? 'production' : 'development');
    customerObject.loggedInState = customer.authenticated;
    if (req.locale && req.locale.id) {
        customerObject.locale = req.locale.id;
    } else {
        customerObject.locale = Site.current.defaultLocale;
    }
    customerObject.currencyCode = session.currency.currencyCode;
    customerObject.pageLanguage = request.httpLocale;
    customerObject.registered = customer.registered;

    if (customer.registered && profile != null) {
        customerObject.email = profile.email.toLowerCase();
        customerObject.emailHash = dw.crypto.Encoding.toHex(new dw.crypto.MessageDigest('SHA-256').digestBytes(new dw.util.Bytes(profile.email.toLowerCase())));
        customerObject.user_id = profile.customerNo;
    } else {
        var email = (session.custom.email == null) ? '' : session.custom.email;
        var emailHash = (session.custom.emailHash == null) ? '' : session.custom.emailHash;
        customerObject.email = email;
        customerObject.emailHash = emailHash;
        customerObject.user_id = '';
    }

    return customerObject;
}

/**
 * @returns {Object} an object of containing home page data
 */
function getHomeData() {
    var obj = {
        'event': 'home'
    };
    return obj;
}

/**
 * @param {Product} product - An instance of a product
 *	@return {Object} Object containing product data
 */
function getProductObject(product) {
    var obj = {};
    obj.item_id = product.ID;
    var master = product.variationModel.master;
    if (product.variant) {
        obj.item_id = master.ID;
        obj.item_variant = product.ID;
    }
    if (product.custom.condition_name) {
        obj.item_condition = product.custom.condition_name;
    }
    if (product.custom.material) {
        obj.item_variant = product.custom.material;
    }
    obj.item_name = product.name;
    obj.product_gender = 'Women';
    if (product.primaryCategory != null) {
        obj.item_category = product.primaryCategory.displayName;
    } else if (master && master.primaryCategory != null) {
        obj.item_category = master.primaryCategory.displayName;
    }

    if (product.priceModel.maxPrice.valueOrNull != null) {
        obj.price = product.priceModel.maxPrice.value.toFixed(2);
        obj.currencyCode = product.priceModel.maxPrice.currencyCode;
    } else if (product.priceModel.price.valueOrNull != null) {
        obj.price = product.priceModel.price.value.toFixed(2);
        obj.currencyCode = product.priceModel.price.currencyCode;
    }
    var PriceBookMgr = require('dw/catalog/PriceBookMgr');
    var productPrice = product.getPriceModel();
    var currencyCode = (productPrice && productPrice.price) ? productPrice.price.currencyCode : null;
    var discountPricebookID = '';
    var webPricebookID = '';
    var applicablePriceBooks = [];
    try {
        applicablePriceBooks = PriceBookMgr.getApplicablePriceBooks();
        if (!applicablePriceBooks || !applicablePriceBooks.length) {
            applicablePriceBooks = PriceBookMgr.getSitePriceBooks();
        }
        applicablePriceBooks = Array.isArray(applicablePriceBooks) ? applicablePriceBooks : applicablePriceBooks.toArray();
    } catch (e) {
        applicablePriceBooks = PriceBookMgr.getSitePriceBooks().toArray();
    }
    
    if (currencyCode && Array.isArray(applicablePriceBooks) && applicablePriceBooks.length > 0) {
        applicablePriceBooks
            .filter(function (pb) {
                return pb.currencyCode === currencyCode;
            })
            .forEach(function (pb) {
                var idLower = (pb.ID || '').toLowerCase();
                if (idLower.indexOf('discount') !== -1) {
                    discountPricebookID = pb.ID;
                    if (pb.parentPriceBook && pb.parentPriceBook.online) {
                        webPricebookID = pb.parentPriceBook.ID;
                    }
                } else if (idLower.indexOf('web') !== -1) {
                    webPricebookID = pb.ID;
                }
            });
    }
    // fallback if not found
    var standardPriceObj = webPricebookID ? productPrice.getPriceBookPrice(webPricebookID) : productPrice.price;
    var listPriceObj = discountPricebookID ? productPrice.getPriceBookPrice(discountPricebookID) : standardPriceObj;
    
    // fallback safely if price not found
    var standardPrice = (standardPriceObj && standardPriceObj.value) ? standardPriceObj.value : 0;
    var listPrice = (listPriceObj && listPriceObj.value) ? listPriceObj.value : 0;
    
    var discountAmount = 0;
    if (listPrice > 0 && standardPrice > listPrice) {
        discountAmount = Number((standardPrice - listPrice).toFixed(2));
    }
    
    var discountPercentage = 0;
    if (discountAmount > 0 && standardPrice > 0) {
        discountPercentage = ((discountAmount / standardPrice) * 100).toFixed(2);
    }
    obj.discount_price = discountAmount;
    obj.discount_percent = discountPercentage+ '%';

    return obj;
}

/**
 * @param {Object} viewData - current route response viewData object
 * @returns {Object} an object of containing pdp data
 */
function getPdpData(viewData) {
    if ('product' in viewData) {
        var product = ProductMgr.getProduct(viewData.product.id);
        var productObject = module.exports.getProductObject(product);

        return {
            'event': 'view_item',
            'ecommerce': {
                'currency': productObject.currencyCode,
                'value': productObject.price,
                'items': [productObject]
            }
        };
    }

    return {};
}

/**
 * @param {dw.util.Iterator} productList - Iterator composed of Products, ProductListItems, or ProductLineItems
 * @param {Function} callback - Callback that constructs the object that will be added to the returned Array
 * @returns {Array} an array containing product data
 */
function getProductArrayFromList(productList, callback, startIndex) {
    var productArray = new Array(),
        position = typeof startIndex === 'number' ? startIndex : 0;

    while (productList.hasNext()) {
        var item = productList.next(),
            prodObj = {};

        if (item instanceof dw.catalog.Product || item instanceof dw.catalog.Variant) {
            prodObj = callback(item);
            prodObj.index = position;
        } else if (item instanceof dw.customer.ProductListItem || item instanceof dw.order.ProductLineItem) {
            prodObj = callback(item);
        }
        productArray.push(prodObj);
        position++;
    }
    return productArray;
}

/**
 * @param {Object} viewData - current route response viewData object
 * @returns {Object} an object containing a product list
 */
function getSearchProducts(viewData) {

    var products = new dw.util.ArrayList();
    if ('productSearch' in viewData) {
        for (var i = 0; i < viewData.productSearch.productIds.length; i++) {
            var product = ProductMgr.getProduct(viewData.productSearch.productIds[i].productID);
            products.add1(product);
        }
    }
    return products;
}

/**
 * @param {Object} viewData - current route response viewData object
 * @return {Object} Object containing search impression data.
 */
function getSearchImpressionData(viewData) {
    var startIndex = viewData.startIndex || 0;
    var breadcrumbList = viewData.breadcrumbs || [];
    var breadcrumbArray = Array.from(breadcrumbList);
    var items = module.exports.getProductArrayFromList(
        module.exports.getSearchProducts(viewData).iterator(),
        module.exports.getProductObjectpdp,
        startIndex
    );
    var productSearch = viewData.productSearch || '';
    var category = productSearch && productSearch.category ? productSearch.category : {};
    var itemListId = category.id || '';
    var itemListName = category.name || '';
    var ecomCurrency = '';

    items.forEach(function (item, i) {
        var actualIndex = startIndex + i;
        delete item.currencyCode;
        delete item.discount_percent;
        if (item.brand) {
            item.item_brand = item.brand;
            delete item.brand;
        }
        item.index = actualIndex;
        item.affiliation = 'WGACA'
        const filteredBreadcrumbs = breadcrumbArray.filter(function (
            breadcrumb
        ) {
            return (
                breadcrumb &&
                breadcrumb.htmlValue &&
                breadcrumb.htmlValue.toLowerCase() !== 'home'
            );
        });

        const totalBreadcrumbs = filteredBreadcrumbs.length;

        if (totalBreadcrumbs >= 2) {
            item.item_category =
                filteredBreadcrumbs[totalBreadcrumbs - 2].htmlValue;
            item.item_category2 =
                filteredBreadcrumbs[totalBreadcrumbs - 1].htmlValue;
                item.item_category3 =
                filteredBreadcrumbs[totalBreadcrumbs - 2].htmlValue;
            item.item_category4 =
                filteredBreadcrumbs[totalBreadcrumbs - 1].htmlValue;
        } else if (totalBreadcrumbs === 1) {
            item.item_category = filteredBreadcrumbs[0].htmlValue;
            item.item_category2 = filteredBreadcrumbs[0].htmlValue;
                        item.item_category3 = filteredBreadcrumbs[0].htmlValue;
            item.item_category4 = filteredBreadcrumbs[0].htmlValue;
        } else {
            item.item_category = '';
            item.item_category2 = '';
                        item.item_category3 = '';
            item.item_category4 = '';
        }
        item.discount = Number(item.discount_price) || 0;
        if (item.price && typeof item.price === 'string') {
            item.price = parseFloat(item.price);
        }

        if (item.discount && typeof item.discount === 'string') {
            item.discount = parseFloat(item.discount);
        }
        delete item.discount_price;
        item.item_list_id = itemListId;
        item.item_list_name = itemListName;
        if (!ecomCurrency && item.currency) {
            ecomCurrency = item.currency;
        }
        delete item.currency;
    });


    var obj = {
        event: 'view_item_list',
        ecommerce: {
            items: items
        }
    };

    if (itemListId) {
        obj.ecommerce.item_list_id = itemListId;
    }
    if (itemListName) {
        obj.ecommerce.item_list_name = itemListName;
    }
    if (ecomCurrency) {
        obj.ecommerce.currency = ecomCurrency;
    }

    return obj;
}

/**
 * @param {Object} productLineItem - a product line item
 * @returns {Object} an object containing order product data
 */
function getOrderProductObject(productLineItem) {
    var obj = module.exports.getProductObject(productLineItem.getProduct());
    obj.quantity = productLineItem.getQuantityValue();
    return obj;
}

/**
 * @param {String} step - string of the current step, potential values: view_cart, begin_checkout, add_shipping_info, add_payment_info
 * @return {Object} Object containing GA4 checkout data
 */
function getCheckoutData(step) {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
    if (currentBasket != null) {
        var obj = {
            'event': step,
            'ecommerce': {
            'currency': globaleSession.get('geCurrency') || currentBasket.currencyCode,
                value: parseFloat(
                    currentBasket
                        .getAdjustedMerchandizeTotalNetPrice()
                        .value.toFixed(2)
                ),
                'items': module.exports.getProductArrayFromList(currentBasket.getProductLineItems().iterator(), module.exports.getOrderProductObject)
            }
        };

        if (step == 'begin_checkout' || step == 'add_shipping_info' || step == 'add_payment_info') {
            var coupons = getCoupons(currentBasket.getCouponLineItems().iterator());

            if (!empty(coupons)) {
                obj.ecommerce.coupon = coupons;
            }
        }

        if (step == 'add_shipping_info') {
            var shipment = currentBasket.getDefaultShipment();

            if ('shippingMethod' in shipment && 'displayName' in shipment.shippingMethod) {
                obj.ecommerce.shipping_tier = shipment.shippingMethod.displayName;
            }
        }

        if (step === 'add_payment_info') {
            try {
                var paymentInstrumentsArray = [];
                var paymentInstruments = currentBasket
                    .getPaymentInstruments()
                    .iterator();

                while (paymentInstruments.hasNext()) {
                    var paymentInstrument = paymentInstruments.next();
                    var method = paymentInstrument.paymentMethod;
                    var adyenMethod = null;

                    if (
                        paymentInstrument.custom &&
                        typeof paymentInstrument.custom[
                            'adyenPaymentMethod'
                        ] !== 'undefined'
                    ) {
                        adyenMethod =
                            paymentInstrument.custom['adyenPaymentMethod'];
                    }

                    if (method === 'GIFT_CERTIFICATE' && paymentInstrument.giftCertificateCode) {
                        obj.ecommerce['gift_certificate_code'] =paymentInstrument.giftCertificateCode;
                        continue;
                        }
                    
                    if (method === 'AdyenComponent' && adyenMethod) {
                        paymentInstrumentsArray.push(
                            method + '-' + adyenMethod
                        );
                    } else if (method) {
                        paymentInstrumentsArray.push(method);
                    }
                }

                if (paymentInstrumentsArray.length > 0) {
                    obj.ecommerce.payment_method =
                        paymentInstrumentsArray.join(',');
                }
            } catch (e) {
                var Logger = require('dw/system/Logger');
                Logger.error(
                    'GTMHelpers - Error reading basket payment instruments: ' +
                        e.message
                );
            }
        }

        return obj;
    }

    return {};
}

/**
 * @param {CouponLineItems} coupons - a collection of all the order coupons
 * @return {String} a comman separated string of all the coupons in the order
 */
function getCoupons(coupons) {
    var text = new Array();

    while (coupons.hasNext()) {
        var coupon = coupons.next();
        if (coupon && coupon.couponCode) {
            text.push(coupon.couponCode);
        }
    }

    return text.join(',');
}

/**
 * @param {Order} order - the current order
 * @param {String} step - string of the current step
 * @return {Object} obj containing confirmation page transaction details
 */
function getConfirmationActionFieldObject(order, step) {
    var discount = order.merchandizeTotalNetPrice.decimalValue - order.adjustedMerchandizeTotalNetPrice.decimalValue;
    var obj = {
        id: order.getOrderNo(),
        step: step,
        affiliation: Site.current.ID,
        revenue: order.getAdjustedMerchandizeTotalPrice(true).getValue().toFixed(2),
        tax: order.getTotalTax().getValue().toFixed(2),
        shipping: order.getAdjustedShippingTotalPrice().getValue().toFixed(2),
        discount: discount.toFixed(2),
        coupon: module.exports.getCoupons(order.getCouponLineItems().iterator())
    };

    return obj;
}

/**
 * @param {object} viewData - current route response viewData object
 * @return {Object} Object containing confirmation page data.
 */
function getConfirmationData(viewData) {
    var order = null;
    var obj = null;

    try {
        if (viewData.orderID && viewData.orderToken) {
            order = dw.order.OrderMgr.getOrder(viewData.orderID, viewData.orderToken);
        }
    } catch (e) {
        var Logger = require('dw/system/Logger');
        Logger.error('GTMHelpers - cannot retrieve order: ' + e.message);
    }

    if (order) {
        obj = {
            'event': 'purchase',
            'ecommerce': {
                'currency': order.currencyCode,
                'transaction_id': order.orderNo,
                'value': order.getAdjustedMerchandizeTotalPrice(true).getValue().toFixed(2),
                'shipping': order.getAdjustedShippingTotalPrice().getValue().toFixed(2),
                'tax': order.getTotalTax().getValue().toFixed(2),
                'items': module.exports.getProductArrayFromList(order.getProductLineItems().iterator(), module.exports.getOrderProductObject),
                'affiliation': Site.current.ID
            }
        };

        var coupons = getCoupons(order.getCouponLineItems().iterator());
        if (!empty(coupons)) {
            obj.ecommerce['coupon'] = coupons;
        }
    }

    return obj;
}

/**
 * @param {object} viewData - current route response viewData object
 * @returns {Object} Object containing full datalayer
 */
function getDataLayer(viewData) {
    // GA4 Events
    switch (viewData.action) {
        case 'Home-Show':
        case 'Default-Start':
            return module.exports.getHomeData();
        case 'Product-Show':
        case 'Product-ShowInCategory':
            return module.exports.getPdpData(viewData);
        case 'Search-Show':
            return module.exports.getSearchImpressionData(viewData);
        case 'Cart-Show':
            return module.exports.getCheckoutData('view_cart');
        case 'Checkout-Begin':
            return module.exports.getCheckoutData('begin_checkout');
        case 'CheckoutShippingServices-SubmitShipping':
            return module.exports.getCheckoutData('add_shipping_info');
        case 'CheckoutServices-SubmitPayment':
            return module.exports.getCheckoutData('add_payment_info');
        case 'Order-Confirm':
            return module.exports.getConfirmationData(viewData);
        default:
            return false;
    }
}

module.exports = {
    isEnabled: gtmEnabled,
    gtmContainer: gtmContainerId,
    gtmAuth: gtmAuth,
    gtmPreview: gtmPreview,
    getDataLayer: getDataLayer,
    getProductObject: getProductObject,
    getCustomerData: getCustomerData,
    getSearchImpressionData: getSearchImpressionData,
    getHomeData: getHomeData,
    getPdpData: getPdpData,
    getCoupons: getCoupons,
    getConfirmationData: getConfirmationData,
    getConfirmationActionFieldObject: getConfirmationActionFieldObject,
    getProductArrayFromList: getProductArrayFromList,
    getSearchProducts: getSearchProducts,
    getOrderProductObject: getOrderProductObject,
    getCheckoutData: getCheckoutData
};
