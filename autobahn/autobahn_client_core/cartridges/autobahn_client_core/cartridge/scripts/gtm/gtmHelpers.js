'use strict';

var base = module.superModule;
var baseGetConfirmationData = base.getConfirmationData;
var baseGetDataLayer = base.getDataLayer;
var baseGetCustomerData = base.getCustomerData;

var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var System = require('dw/system/System');

var SITE_NAME = 'Sites-'+Site.current.ID+'-Site';

var Logger = require('dw/system/Logger');
var Encoding = require('dw/crypto/Encoding');
var MessageDigest = require('dw/crypto/MessageDigest');
var Bytes = require('dw/util/Bytes');
/**
 * @param {Object} req - current route request object
 * @returns {Object} an object of containing customer data
 */
base.getCustomerData = function (req) {
    var system = require('dw/system/System');

    var customer = (req.currentCustomer) ? req.currentCustomer.raw :'',
        profile = (customer) ? customer.profile : '',
        session = request.session,
        customerObject = {};

    customerObject.environment = (System.getInstanceType() === System.PRODUCTION_SYSTEM ? 'production' : 'development');
    customerObject.demandwareID = (customer) ? customer.ID : '';
    customerObject.loggedInState = (customer) ? customer.authenticated: '';
    if (req.locale && req.locale.id) {
        customerObject.locale = req.locale.id;
    } else {
        customerObject.locale = Site.current.defaultLocale;
    }
    customerObject.currencyCode = session.getCurrency().currencyCode;
    customerObject.pageLanguage = request.httpLocale;
    customerObject.registered = (customer) ? customer.registered : '';

    if (customer && customer.registered && profile != null) {
        customerObject.email = profile.email.toLowerCase();
        customerObject.emailHash = dw.crypto.Encoding.toHex(new dw.crypto.MessageDigest('SHA-256').digestBytes(new dw.util.Bytes(profile.email.toLowerCase())));
        customerObject.user_id = profile.getCustomerNo();
    } else {
        var email = (session.custom.email == null) ? '' : session.custom.email;
        var emailHash = (session.custom.emailHash == null) ? '' : session.custom.emailHash;
        customerObject.email = email;
        customerObject.emailHash = emailHash;
        customerObject.user_id = '';
    }

    return customerObject;
};

/*
* Home page promotion impression
*/
base.promotionImpression = function (res) {
    var obj = {
        'event': 'promotionImpression',
        'ecommerce': {'promoView':{}}
    };
    obj.ecommerce.promoView.promotions = [];
    if (res.regions && res.regions.main && res.regions.main.region && res.regions.main.region.size > 0){
        for (var i = 0; i < res.regions.main.region.size; i++) {
            var temp = {};
            temp.id = res.regions.main.region.visibleComponents[i].ID;
            temp.name = res.regions.main.region.visibleComponents[i].typeID;
            temp.creative = '';
            temp.position = 'component'+i;
            obj.ecommerce.promoView.promotions.push(temp);

        }
    }
    return obj;
};

/**
 * @param {Product} product - An instance of a product
 *	@return {Object} Object containing product data
 */
 base.getGA4ProductObject = function (product) {
    var obj = {};
    obj.item_id = product.ID;
    var master = product.variationModel.master;
    if (product.variant) {
        obj.item_id = master.ID;
        obj.item_variant = product.ID;
    }

    obj.item_name = product.name;

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

    return obj;
}

/**
 * @param {Object} res - current route response object
 * @return {Object} Object containing search impression data.
 */
base.getGA4SearchImpressionData = function (res) {
    var obj = {
        'event': 'view_item_list',
        'ecommerce': {
            'items': module.exports.getProductArrayFromList(module.exports.getSearchProducts(res).iterator(), module.exports.getGA4ProductObject)
        }
    };

    if ('productSearch' in res && 'category' in res.productSearch) {
        if ('id' in res.productSearch.category) {
            obj.ecommerce['item_list_id'] = res.productSearch.category.id;
        }
        if ('name' in res.productSearch.category) {
            obj.ecommerce['item_list_name'] = res.productSearch.category.name;
        }
    }

    return obj;
}

base.getFrenzySearchData = function (res){
    return {};
};

/**
 * @param {Object} viewData - current route response viewData object
 * @returns {Object} an object of containing pdp data
 */
base.getPdpData = function (viewData) {
    if ('product' in viewData) {
        var product = ProductMgr.getProduct(viewData.product.id);
        var productObject = module.exports.getProductObjectpdp(product);
        var breadcrumbList = viewData.breadcrumbs || [];
        var breadcrumbArray = Array.from(breadcrumbList);
        var productName = (productObject.item_name || '').trim().toLowerCase();
        var breadcrumbNames = breadcrumbArray.map(function (crumb) {
            return crumb.htmlValue;
        }).filter(Boolean)
          .map(name => name.trim())
          .filter(name => {
            var lowerName = name.toLowerCase();
            return lowerName !== 'home' && lowerName !== productName;
        });
        var totalBreadcrumbs = breadcrumbNames.length;
        var itemCategory = '';
        var itemCategory2 = '';
        var itemCategory3 = '';
        var itemCategory4 = '';
        if (totalBreadcrumbs >= 2) {
            itemCategory = breadcrumbNames[totalBreadcrumbs - 2];
            itemCategory2 = breadcrumbNames[totalBreadcrumbs - 1];
            itemCategory3 = breadcrumbNames[totalBreadcrumbs - 2];
            itemCategory4 = breadcrumbNames[totalBreadcrumbs - 1];
        } else if (totalBreadcrumbs === 1) {
            itemCategory = breadcrumbNames[0];
            itemCategory2 = breadcrumbNames[0];
            itemCategory3 = breadcrumbNames[0];
            itemCategory4 = breadcrumbNames[0];
        }
        var mutatedProductObject = Object.assign({}, productObject);
        mutatedProductObject.item_category = itemCategory;
        mutatedProductObject.item_category2 = itemCategory2;
        mutatedProductObject.item_category3 = itemCategory3;
        mutatedProductObject.item_category4 = itemCategory4;
        mutatedProductObject.item_brand = productObject.brand;
        mutatedProductObject.discount =
            Number(productObject.discount_price) || 0;
        mutatedProductObject.item_condition =
            productObject.item_condition || 'Excellent';
        mutatedProductObject.price = Number(productObject.price) || 0;
        delete mutatedProductObject.brand;
        delete mutatedProductObject.discount_price;
        delete mutatedProductObject.discount_percent;
        if (breadcrumbNames[1]) {
            mutatedProductObject.item_list_id = breadcrumbNames[1].toLowerCase().replace(/\s+/g, '-');
            mutatedProductObject.item_list_name = breadcrumbNames[1];
        } else if (breadcrumbNames[0]) {
            mutatedProductObject.item_list_id = breadcrumbNames[0].toLowerCase().replace(/\s+/g, '-');
            mutatedProductObject.item_list_name = breadcrumbNames[0];
        } else if (product.primaryCategory) {
            mutatedProductObject.item_list_id = product.primaryCategory.ID;
            mutatedProductObject.item_list_name =
                product.primaryCategory.displayName;
        }
        delete mutatedProductObject.currencyCode;
        delete mutatedProductObject.currency;
        mutatedProductObject.affiliation = 'WGACA';
        mutatedProductObject.quantity = viewData.selectedQuantity || 1;
        return {
            event: 'view_item',
            ecommerce: {
                currency:
                    productObject.currency ||
                    productObject.currencyCode ||
                    'USD',
                value: mutatedProductObject.price,
                items: [mutatedProductObject]
            }
        };
    }

    return {};
};

/**
 * @param {object} viewData - current route response viewData object
 * @returns {Object} Object containing full datalayer
 */
base.getDataLayer = function (viewData) {
    // GA4 Events
    switch (viewData.action) {
        case SITE_NAME:
        case 'Home-Show':
        case 'Default-Start':
            //return module.exports.getHomeData(res);
            return module.exports.promotionImpression(viewData);
        case 'Frenzy-Search':
            return module.exports.getFrenzySearchData(viewData);
        case 'Checkout-Login':
            return module.exports.getCheckoutData('begin_checkout');
        case 'CheckoutServices-PlaceOrder':
            return module.exports.getCheckoutData('add_payment_info');
        case 'Affirm-Confirmation':
            return module.exports.getConfirmationData(viewData);
        case 'Account-Login':
            return module.exports.getLoginData(viewData);
        case 'CheckoutServices-LoginCustomer':
            return module.exports.getLoginData(viewData);
        case 'Account-SubmitRegistration':
        case 'Order-CreateAccount':
            return module.exports.getSignUpData(viewData);
        case 'EmailSubscribe-Subscribe':
            return module.exports.getNewsLetter(viewData);
        default:
            return baseGetDataLayer.apply(this, arguments);
    }
};

/**
 * @param {Product} product - An instance of a product
 *	@return {Object} Object containing product data
 */
 base.getProductObjectpdp = function (product) {
    var base = module.superModule;
    var getPriceHelper = require('*/cartridge/scripts/factories/price');

    var obj = base.getProductObject.apply(this, arguments);

    obj.brand = product.brand || '';

    var master = (product.variant && product.variationModel && product.variationModel.master) ? product.variationModel.master : null;
    var fdxGender = product.custom.fdxGender || (master ? master.custom.fdxGender : null);

    obj.item_variant = product.custom.material || '';

    var discountAmount = 0;
    var discountPercentage = 0;
    var standardPrice = 0;
    var currencyCode = 'USD';


    // Use Global-e pricing
    var priceObj = getPriceHelper.getPrice(product, null, true, null, null);
    var sales = priceObj.sales;
    var list = priceObj.list;

    var salesPrice = sales ? sales.value : 0;
    var listPriceValue = list ? list.value : 0;
    standardPrice = listPriceValue || salesPrice;
    currencyCode = (sales && sales.currency) || 'USD';

    if (sales && list && sales.value < list.value) {
        discountAmount = Number((list.value - sales.value).toFixed(2));
    }

    if (discountAmount > 0 && standardPrice > 0) {
        discountPercentage = Number(((discountAmount / standardPrice) * 100).toFixed(2));
    }

    obj.discount_price = discountAmount;
    obj.discount_percent = discountPercentage + '%';
    obj.sale_status = (discountAmount > 0) ? 'On Offer' : 'No Offer';
    obj.stock_status = (product.availabilityModel.availability === 0) ? 'Out of stock' : 'In Stock';
    obj.currency = currencyCode;
    obj.price = salesPrice;

    // Walk all categories to find the deepest merchandise navigation path (skip "brand" trees)
    var itemCategory = '';
    var itemCategory2 = '';
    try {
        var catSource = master || product;
        var allCats = catSource.categories.iterator();
        var bestPath = null;
        while (allCats.hasNext()) {
            var cat = allCats.next();
            var path = [];
            var current = cat;
            while (current && current.parent) {
                if (current.root) { break; }
                path.unshift(current.displayName);
                current = current.parent;
            }
            if (path.length > 0 && path[0].toLowerCase().indexOf('brand') === -1) {
                if (!bestPath || path.length > bestPath.length) {
                    bestPath = path;
                }
            }
        }
        if (bestPath && bestPath.length >= 2) {
            itemCategory = bestPath[bestPath.length - 2];
            itemCategory2 = bestPath[bestPath.length - 1];
        } else if (bestPath && bestPath.length === 1) {
            itemCategory = bestPath[0];
        }
        // Infer gender from top-level category when fdxGender is not set
        if (!fdxGender && bestPath && bestPath.length > 0) {
            var topCat = bestPath[0].toLowerCase().replace(/[^a-z]/g, '');
            if (topCat === 'men' || topCat === 'mens') {
                fdxGender = 'Men';
            } else if (topCat === 'women' || topCat === 'womens') {
                fdxGender = 'Women';
            }
        }
    } catch (e) {
        itemCategory = obj.item_category || '';
    }
    obj.product_gender = fdxGender ? String(fdxGender) : 'Women';
    if (itemCategory) {
        obj.item_category = itemCategory;
        obj.item_category2 = itemCategory2;
    }

    return obj;
};


/**
 * @param {Object} productLineItem - a product line item
 * @returns {Object} an object containing order product data
 */
base.getOrderProductObject = function (productLineItem) {
    var obj = module.exports.getProductObjectpdp(productLineItem.getProduct());
    obj.quantity = productLineItem.getQuantityValue();
    obj.discount = obj.discount_price;
    obj.item_brand = obj.brand;
    obj.item_category = '';
    obj.item_category2 = '';
    delete obj.discount_percent;
    delete obj.discount_price;
    delete obj.currencyCode;
    delete obj.brand
    if (
        productLineItem.product &&
        productLineItem.product.primaryCategory &&
        productLineItem.product.primaryCategory.displayName
    ) {
        obj.item_list_id = productLineItem.product.primaryCategory.ID;
        obj.item_list_name = productLineItem.product.primaryCategory.displayName;
    } else {
        obj.item_list_id = '';
        obj.item_list_name = '';
    }

    obj.affiliation = 'WGACA'
    obj.price = parseFloat(parseFloat(obj.price).toFixed(2));
    return obj;
};

/**
 * @param {Order} order - the current order
 * @param {String} step - string of the current step
 * @return {Object} obj containing confirmation page transaction details
 */

function getRoundedPriceValue(price) {
    if (!price) {
        return 0;
    }

    var value = typeof price.value !== 'undefined' ? price.value : null;
    if (value === null && typeof price.getValue === 'function') {
        value = price.getValue();
    }
    value = parseFloat(value);

    if (isNaN(value)) {
        return 0;
    }

    return parseFloat(value.toFixed(2));
}

function getPurchaseValue(order) {
    var orderTotal = order.totalGrossPrice || (typeof order.getTotalGrossPrice === 'function' ? order.getTotalGrossPrice() : null);
    var value = getRoundedPriceValue(orderTotal);

    if (value > 0) {
        return value;
    }

    return getRoundedPriceValue(order.getAdjustedMerchandizeTotalPrice(true));
}

function getPurchaseEventId(order) {
    return 'purchase-' + order.orderNo;
}

base.getConfirmationData = function (viewData) {
    var order = null;
    var obj = null;

    try {
        if (viewData.action === 'Affirm-Confirmation') {
            order = dw.order.OrderMgr.getOrder(viewData.order.orderNumber); // Affirm orders have a null order token on the order confirmation page
        } else if (viewData.orderID && viewData.orderToken) {
            order = dw.order.OrderMgr.getOrder(viewData.orderID, viewData.orderToken);
        } else if (viewData.orderID) {
            order = dw.order.OrderMgr.getOrder(viewData.orderID);
        }
    } catch (e) {
        var Logger = require('dw/system/Logger');
        Logger.error('GTMHelpers - cannot retrieve order: ' + e.message);
    }

    if (order) {
        var shipment = order.shipments[0];
        var phone = '';
        var email = order.customerEmail;
        var userId = order.customerNo || "";
        var shippingAddress = shipment.shippingAddress;

        if (shippingAddress && shippingAddress.phone) {
            phone = shippingAddress.phone;
        }
        obj = {
            event: 'purchase',
            event_id: getPurchaseEventId(order),
            ecommerce: {
                currency: order.currencyCode,
                currencyCode: order.currencyCode,
                transaction_id: order.orderNo,
                event_id: getPurchaseEventId(order),
                value: getPurchaseValue(order),
                shipping: parseFloat(order.getAdjustedShippingTotalPrice().getValue().toFixed(2)),
                tax: parseFloat(order.getTotalTax().getValue().toFixed(2)),
                items: module.exports.getProductArrayFromList(order.getProductLineItems().iterator(), module.exports.getOrderProductObject),
                email: email,
                user_id: userId,
                phone: phone
            }
        };
        try {
            if (
                order.paymentInstruments &&
                order.paymentInstruments.length > 0
            ) {
                var paymentTypes = [];
                var iter = order.paymentInstruments.iterator();
                while (iter.hasNext()) {
                    var pi = iter.next();
                    var method = pi.paymentMethod;
                    if (method === 'GIFT_CERTIFICATE' && pi.giftCertificateCode) {
                        obj.ecommerce['gift_certificate_code'] =
                            pi.giftCertificateCode;
                            continue;
                    }
                        var adyenMethod =
                            pi.custom &&
                            typeof pi.custom['adyenPaymentMethod'] !==
                                'undefined'
                                ? pi.custom['adyenPaymentMethod']
                                : null;

                        if (method === 'AdyenComponent' && adyenMethod) {
                            paymentTypes.push(method + '-' + adyenMethod);
                        } else if (method){
                            paymentTypes.push(method);
                        }

                }
                if (paymentTypes.length > 0) {
                    obj.ecommerce.payment_method = paymentTypes.join(',');
                }
            }
        } catch (e) {
            Logger.error('GTMHelpers - Error reading payment instruments: ' + e.message);
        }
        if (
            shipment &&
            shipment.shippingMethod &&
            shipment.shippingMethod.displayName
        ) {
            obj.ecommerce.shipping_tier = shipment.shippingMethod.displayName;
        }
        if (shippingAddress) {
            obj.ecommerce.shipping_country = shippingAddress.countryCode ? shippingAddress.countryCode.displayValue : null;
            obj.ecommerce.shipping_city = shippingAddress.city;
        }
        var coupons = module.exports.getCoupons(order.getCouponLineItems().iterator());
        if (!empty(coupons)) {
            obj.ecommerce['coupon'] = coupons;
        }
    }

    return obj;
};

base.getLoginData = function (viewData) {
    var obj = null;
    let authenticatedCustomer;

        if (viewData) {
        if (viewData.authenticatedCustomer && viewData.authenticatedCustomer.profile) {
            authenticatedCustomer = viewData.authenticatedCustomer;
        } else if (viewData.customerLoginResult && viewData.customerLoginResult.authenticatedCustomer && viewData.customerLoginResult.authenticatedCustomer.profile) {
            authenticatedCustomer = viewData.customerLoginResult.authenticatedCustomer;
        }
    }

    if(authenticatedCustomer && authenticatedCustomer.profile) {
        let email = authenticatedCustomer.profile.email || '';
        let emailHash = generateEmailHash(email);
        obj = {
            event: 'login',
            login_method: "Email",
            user_id: authenticatedCustomer.profile.customerNo || '',
            email: email,
            email_hash: emailHash
        };
    }
    return obj;
};

base.getSignUpData = function (viewData) {
    var events = [];
    var authenticatedCustomer;

    if (viewData) {
        if (viewData.authenticatedCustomer && viewData.authenticatedCustomer.profile) {
            authenticatedCustomer = viewData.authenticatedCustomer;
        } else if (viewData.newCustomer && viewData.newCustomer.profile) {
            authenticatedCustomer = viewData.newCustomer;
        }
    }

    if (authenticatedCustomer) {
        var email = authenticatedCustomer.profile.email;
        var emailHash = generateEmailHash(email);

        events.push({
            event: 'signup',
            signup_method: "Email",
            user_id: authenticatedCustomer.profile.customerNo,
            email: email,
            email_hash: emailHash
        });
    }

    var newsletterObj = viewData.subscribeToMail || viewData.subscriberMail;
    if (
        newsletterObj && newsletterObj.email &&
        viewData.success === true
    ) {
        var emailHash = generateEmailHash(newsletterObj.email);
        events.push({
            event: 'newsletter_subscription',
            email: newsletterObj.email,
            emailHash:emailHash
        });
    }

    return events.length > 0 ? events : null;
};


function generateEmailHash(email) {

    var emailHash = '';

    if (email && [null, undefined, '', false, 'null', 'undefined'].indexOf(email) === -1) {
        try {
            var lowerEmail = email.toLowerCase();
            var digest = new MessageDigest('SHA-256');
            var hashBytes = digest.digestBytes(new Bytes(lowerEmail));
            emailHash = Encoding.toHex(hashBytes);

            // Extra validation for a real SHA-256 hex string
            if ([null, undefined, '', false, 'null', 'undefined'].indexOf(emailHash) !== -1 ||
                !/^[a-f0-9]{64}$/.test(emailHash)) {
                emailHash = '';
            }
        } catch (e) {
            Logger.error('Error hashing email: ', e.message);
            emailHash = '';
        }
    }
    return emailHash;
}

base.getNewsLetter=function(viewData){
    var obj=null;
    let email = viewData.email || '';
    let isSuccessful = viewData.success || '';

    if(email && isSuccessful){
    let emailHash = generateEmailHash(email);
    obj={
        event:'newsletter_subscription',
        email:email,
        emailHash:emailHash
    }
}
    return obj;
}
module.exports = base;