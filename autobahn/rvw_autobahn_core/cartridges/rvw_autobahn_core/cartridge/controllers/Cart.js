'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('GetProduct', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var viewData = res.getViewData();

    var BasketMgr = require('dw/order/BasketMgr');
    var collections = require('*/cartridge/scripts/util/collections');

    var requestUuid = req.querystring.uuid;
    var requestPLI = collections.find(BasketMgr.getCurrentBasket().allProductLineItems, function (item) {
        return item.UUID === requestUuid;
    });

    var requestQuantity = requestPLI.quantityValue.toString();

    var optionProductLineItems = requestPLI.getOptionProductLineItems();
    var selectedOptions = [];
    var selectedOptionValueId = null;
    if (optionProductLineItems && optionProductLineItems.length) {
        var iter = optionProductLineItems.iterator();
        while (iter.hasNext()) {
            var optionProductLineItem = iter.next();
            selectedOptionValueId = optionProductLineItem.optionValueID;
            selectedOptions.push({ optionId: optionProductLineItem.optionID, selectedValueId: optionProductLineItem.optionValueID, productId: requestPLI.productID });
        }

        var pliProduct = {
            pid: requestPLI.productID,
            quantity: requestQuantity,
            options: selectedOptions
        };

        var ProductFactory = require('*/cartridge/scripts/factories/product');
        var context = {
            product: ProductFactory.get(pliProduct),
            selectedOptionValueIds: JSON.stringify(selectedOptions)
        }

        res.setViewData(context);
    }

    viewData.dialogTitle = Resource.msg('heading.edit.product.edit.modal', 'cart', null);

    next();
});

server.get('MiniCartJSON', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var BasketMgr = require('dw/order/BasketMgr');
        var CartModel = require('*/cartridge/models/cart');

        var currentBasket = BasketMgr.getCurrentBasket();
        var quantityTotal = 0;
        var basket = {};

        if (currentBasket) {
            quantityTotal = currentBasket.productQuantityTotal + currentBasket.giftCertificateLineItems.length;
            basket = new CartModel(currentBasket);
        }

        res.viewData = {};
        res.json({ quantityTotal: quantityTotal, cart: basket });
    });

    next();
});

server.append('MiniCartShow', function (req, res, next) {
    var viewData = res.getViewData();
    var giftCertificateForm = server.forms.getForm('giftCertificate');
    viewData.giftCertificateForm = giftCertificateForm;
    res.setViewData(viewData);

    next();
})

server.append('Show', function(req, res, next) {
    var Resource = require('dw/web/Resource');

    var giftCertificateForm = server.forms.getForm('giftCertificate');
    giftCertificateForm.clear();


    var URLUtils = require('dw/web/URLUtils');
    var canonicalUrl = URLUtils.abs('Cart-Show').toString();
    var customerServiceNumber = res.viewData.abConfigs.customerServiceNumber || Resource.msg('info.phone.number','common',null);

    res.setViewData({
        giftCertificateForm: giftCertificateForm,
        canonicalUrl: canonicalUrl,
        customerServiceNumber: customerServiceNumber
    });

    next();
});

server.get('RemoveGiftCertificateLineItem', function(req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var isGiftCertificateLineItemFound = false;

    Transaction.wrap(function() {
        if (req.querystring.uuid) {
            var giftCertificateLineItems = currentBasket.getAllGiftCertificateLineItems();
            for (var i = 0; i < giftCertificateLineItems.length; i++) {
                var item = giftCertificateLineItems[i];
                if ((item.UUID === req.querystring.uuid)) {
                    var shipmentToRemove = item.shipment;
                    currentBasket.removeGiftCertificateLineItem(item);
                    if (shipmentToRemove.giftCertificateLineItems.empty && shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                        currentBasket.removeShipment(shipmentToRemove);
                    }
                    isGiftCertificateLineItemFound = true;
                    break;
                }
            }
        }
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    if (isGiftCertificateLineItemFound) {
        var basketModel = new CartModel(currentBasket);
        var basketModelPlus = {
            basket: basketModel
        };
        res.json(basketModelPlus);
    } else {
        res.setStatusCode(500);
        res.json({ errorMessage: Resource.msg('error.cannot.remove.product', 'cart', null) });
    }

    return next();
});

server.post('EditGiftCertificateLineItem', function(req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var collections = require('*/cartridge/scripts/util/collections');
    var giftCertificateHelper = require('*/cartridge/scripts/helpers/giftCertificateHelper');
    var Resource = require('dw/web/Resource');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            success: false,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var giftCertificateForm = server.forms.getForm('giftCertificate');
    var giftCertificateForm = giftCertificateHelper.validateGiftCertificateForm(giftCertificateForm);

    if (!giftCertificateForm.valid) {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(giftCertificateForm)
        });
        return next();
    }

    var requestUuid = req.form.uuid;
    var requestGCLI = collections.find(BasketMgr.getCurrentOrNewBasket().getGiftCertificateLineItems(), function(item) {
        return item.UUID === requestUuid;
    });

    if (!requestGCLI) {
        res.json({
            success: false,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var Transaction = require('dw/system/Transaction');
    Transaction.wrap(function() {
        requestGCLI.setSenderName(giftCertificateForm.purchase.from.value);
        requestGCLI.setRecipientName(giftCertificateForm.purchase.recipient.value);
        requestGCLI.setRecipientEmail(giftCertificateForm.purchase.recipientEmail.value);
        requestGCLI.setMessage(giftCertificateForm.purchase.message.value);
        requestGCLI.setPriceValue(giftCertificateForm.purchase.amount.value);
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    var logger = require('dw/system/Logger');
    try {
        giftCertificateHelper.modifyContactIdFromSession(giftCertificateForm.purchase.recipient.htmlValue, giftCertificateForm.purchase.recipientEmail.htmlValue);
    } catch (ex) {
        var email = giftCertificateForm.purchase.recipientEmail.htmlValue;
        logger.error("Gift Card Edit Cart - unexpected exception occurred fetching contact id with email address '" + email + "'. Error: '" + ex + "'.");
    }

    var cartModel = new CartModel(currentBasket);

    res.json({
        success: true,
        msg: Resource.msg('giftcertificate.purchase.updateincart.success.msg', 'checkout', null),
        cartModel: cartModel
    });

    return next();
});

module.exports = server.exports();
