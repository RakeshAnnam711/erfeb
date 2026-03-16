'use strict';

var server = require('server');

var recaptcha = require('*/cartridge/scripts/middleware/recaptcha');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.extend(module.superModule);

server.prepend('SubmitPayment', recaptcha.checkRecaptchaAjax);

server.prepend('PlaceOrder', server.middleware.https, recaptcha.checkRecaptchaAjax);

//Base SFRA doesn't even validate the shipments, so basically port CheckoutShippingServices-SubmitShipping validation here
server.append('Get', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var URLUtils = require('dw/web/URLUtils');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var formHelpers = require('*/cartridge/scripts/helpers/formHelpers');
    var AddressModel = require('*/cartridge/models/address');

    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var collections = require('*/cartridge/scripts/util/collections');
    collections.forEach(currentBasket.shipments, function (shipment) {
        if (shipment.custom.fromStoreId && shipment.custom.shipmentType === 'instore') {
            return;
        }

        var addressModel = new AddressModel(shipment.shippingAddress);
        delete addressModel.address.addressId; //TODO is this always ok? what about a saved address?

        //Get session form
        var shippingForm = session.forms.shipping;
        shippingForm.clearFormElement();

        //Copy values into session form
        formHelpers.copyFromModel(shippingForm.shippingAddress.addressFields, addressModel.address);

        //Get server form, which now has the new session values
        var serverAddressForm = server.forms.getForm('shipping');

        //Use server form to check for errors with helper
        var addressFormErrors = COHelpers.validateShippingForm(serverAddressForm);
        if (Object.keys(addressFormErrors).length > 0) {
            req.session.privacyCache.set(shipment.UUID, 'invalid');

            res.json({
                form: serverAddressForm,
                shipmentUUID: shipment.UUID,
                fieldErrors: [addressFormErrors],
                error: true
            });
        }
    })

    next();
});

server.prepend('LoginCustomer',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    recaptcha.checkRecaptchaAjax,
    function (req, res, next) {

    if (dw.system.Site.getCurrent().getCustomPreferenceValue('wishlistEnable')) {
        var viewData = res.getViewData();
        var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
        var wishlistList = productListHelper.getDefaultList();
        viewData.wishlistList = wishlistList;
        res.setViewData(viewData);
    }

    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    storeHelpers.setPreferredStoreViewData(req, res);

    next();
});

server.append('LoginCustomer', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();
        if (!viewData.error) {
            if (dw.system.Site.getCurrent().getCustomPreferenceValue('wishlistEnable')) {
                var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
                var listGuest = viewData.wishlistList;
                var customerLoginResult = 'customerLoginResult' in viewData && 'authenticatedCustomer' in viewData.customerLoginResult ? viewData.customerLoginResult.authenticatedCustomer : null;

                if (customerLoginResult && listGuest && 'items' in listGuest && listGuest.items.length) {
                    var listLoggedIn = productListHelper.getDefaultList();
                    productListHelper.mergelists(listLoggedIn, listGuest, req, { type: 10 });
                } else {
                    //create a default wishlist if they don't have one
                    productListHelper.getDefaultList()
                }
            }

            if (customerLoginResult && viewData.preferredStoreID && empty(customerLoginResult.profile.custom.preferredStoreID)) {
                dw.system.Transaction.wrap(function (){
                    viewData.customerLoginResult.authenticatedCustomer.profile.custom.preferredStoreID = viewData.preferredStoreID;
                })
            }
        }
    });

    next();
});

module.exports = server.exports();
