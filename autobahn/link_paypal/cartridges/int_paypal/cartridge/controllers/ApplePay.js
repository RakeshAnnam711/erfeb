'use strict';

const server = require('server');

const middleware = require('*/cartridge/scripts/paypal/middleware');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.post('CreateOrder',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    middleware.parseBody,
    function(req, res, next) {
        const BasketMgr = require('dw/order/BasketMgr');
        const prefs = require('*/cartridge/config/preferences');
        const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
        const paypalApi = require('*/cartridge/scripts/paypal/api');
        const addressHelper = require('*/cartridge/scripts/paypal/helpers/addressHelper');
        const applePayAddressValidation = require('*/cartridge/scripts/paypal/helpers/applePayAddressValidation');

        const currentBasket = BasketMgr.currentBasket;
        const parsedBody = res.parsedBody;
        const paymentSourceData = {
            apple_pay: parsedBody.apple_pay
        };

        const purchaseUnit = paypalHelper.getPurchaseUnit(currentBasket, parsedBody.isExpressCheckout);
        const billingAddress = parsedBody.billingAddress;

        let shippingAddressFormatted;

        if (!prefs.isDigitalGoodsFlowEnabled) {
            // Shipping fields that can't be validated during onShippingContactSelected step
            shippingAddressFormatted = {
                name: parsedBody.shippingAddress.name,
                addressLines: parsedBody.shippingAddress.addressLines
            };
        }

        const billingAddressFormatted = {
            phoneNumber: billingAddress.phone.phone_number.national_number,
            email: billingAddress.email_address,
            name: billingAddress.name,
            addressLines: billingAddress.address.address_line_1,
            locality: billingAddress.address.admin_area_1,
            postalCode: billingAddress.address.postal_code,
            countryCode: billingAddress.address.country_code
        };

        const billingAddressValidationResult = applePayAddressValidation.validateAddress(billingAddressFormatted, shippingAddressFormatted);

        if (billingAddressValidationResult.error) {
            res.json({
                error: billingAddressValidationResult.error,
                errors: billingAddressValidationResult.errors
            });

            return next();
        }

        if (!(currentBasket.billingAddress && currentBasket.billingAddress.address1) && parsedBody && prefs.isDigitalGoodsFlowEnabled) {
            addressHelper.updateOrderBillingAddress(currentBasket, parsedBody.billingAddress);
        }

        const result = paypalApi.createOrder({
            purchaseUnit: purchaseUnit,
            lineItemCtnr: currentBasket
        }, paymentSourceData);

        if (result.err) {
            const utils = require('*/cartridge/scripts/paypal/utils');

            utils.createErrorLog(result.err);

            res.setStatusCode(500);
            res.json({
                error: true
            });

            return next();
        }

        session.privacy.paypalOrderID = result.resp.id;

        res.json({
            id: result.resp.id
        });

        return next();
    }
);

module.exports = server.exports();
