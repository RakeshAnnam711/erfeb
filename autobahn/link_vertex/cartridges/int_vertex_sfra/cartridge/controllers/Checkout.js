'use strict';

var page = module.superModule;
var server = require('server');
server.extend(page);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Main entry point for Checkout
 */
server.prepend(
    'Begin',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var collections = require('*/cartridge/scripts/util/collections');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var addressHelper = require('*/cartridge/scripts/helpers/addressHelper');

        var viewData = res.getViewData();

        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            res.setViewData(viewData);
            return next();
        }

        delete session.privacy.VertexAddressSelected;

        // only true if customer is registered
        if (req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress) {
            var shipments = currentBasket.shipments;
            var preferredAddress = req.currentCustomer.addressBook.preferredAddress;

            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var addressBook = customer.getProfile().getAddressBook();
            var rawAddress = addressBook.getAddress(preferredAddress.ID);
            if (rawAddress.custom.taxnumber) {
                preferredAddress.taxnumber = rawAddress.custom.taxnumber;
            }

            collections.forEach(shipments, function (shipment) {
                if (!shipment.shippingAddress) {
                    addressHelper.copyCustomerAddressToShipment(preferredAddress, shipment);
                }
                if (!shipment.shippingAddress.custom.taxnumber && !!preferredAddress.taxnumber) {
                    addressHelper.addTaxNumber(preferredAddress, shipment);
                }
            });
        }
        res.setViewData(viewData);
        return next();
    }
);

module.exports = server.exports();
