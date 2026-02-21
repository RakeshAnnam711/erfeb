'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');

var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

server.replace('AddProduct', function (req, res, next) {
    var CartModel = require('*/cartridge/models/cart');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
    var result = cartHelper.addProductToCartTransaction(currentBasket, req);
    var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems) + currentBasket.giftCertificateLineItems.length;
    var newBonusDiscountLineItem = cartHelper.newBonusDiscountLineItem(currentBasket, result, previousBonusDiscountLineItems);
    var reportingURL = cartHelper.getReportingUrlAddToCart(currentBasket, result.error);

    res.json({
        reportingURL: reportingURL,
        quantityTotal: quantityTotal,
        message: result.message,
        cart: new CartModel(currentBasket),
        newBonusDiscountLineItem: newBonusDiscountLineItem || {},
        error: result.error,
        pliUUID: result.uuid,
        minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, quantityTotal)
    });

    next();
});

server.replace('EditProductLineItem', function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var arrayHelper = require('*/cartridge/scripts/util/array');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var responseObject = cartHelper.editProductLineItemHelper(currentBasket, req);

    if (!responseObject.error && responseObject.cartModel) {
        var cartItem = arrayHelper.find(responseObject.cartModel.items, function (item) {
            return item.UUID === responseObject.uuid || item.UUID === req.form.uuid;
        });
        var productCardContext = {
            lineItem: cartItem,
            actionUrls: responseObject.cartModel.actionUrls
        };
        var productCardTemplate = 'cart/productCard/cartProductCardServer.isml';

        responseObject.renderedTemplate = renderTemplateHelper.getRenderedHtml(
            productCardContext,
            productCardTemplate
        );
        res.json(responseObject);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('error.cannot.update.product', 'cart', null)
        });
    }

    next();
});

module.exports = server.exports();
