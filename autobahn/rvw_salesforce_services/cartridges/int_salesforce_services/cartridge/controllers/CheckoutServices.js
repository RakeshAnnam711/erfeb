'use strict';

var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');

server.extend(module.superModule);

server.append('PlaceOrder', function (req, res, next) {
    var coCustomerForm = server.forms.getForm('coCustomer');
    var newsletterOptIn = ('newsletterOptIn' in coCustomerForm) ? coCustomerForm.newsletterOptIn : null;
    var viewData = res.getViewData();
    var source = viewData.action || null;
    var currentOrder;

    if (viewData.orderID && viewData.orderToken) {
        currentOrder = OrderMgr.getOrder(viewData.orderID, viewData.orderToken);
    }

    if (!empty(newsletterOptIn) && newsletterOptIn.addtoemaillist.checked && currentOrder !== null) {
        var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

        var email = !empty(coCustomerForm.email.htmlValue) ? coCustomerForm.email.htmlValue : '';
        var firstName = !empty(currentOrder.billingAddress.firstName) ? currentOrder.billingAddress.firstName : '';
        var lastName = !empty(currentOrder.billingAddress.lastName) ? currentOrder.billingAddress.lastName : '';
        var responseData = {
            success: false,
            error: true,
            msg: Resource.msg('subscribe.email.invalid', 'homePage', null)
        };

        if (!empty(email)) {
            hooksHelper('app.mailingList.subscribe', 'subscribe', [responseData, email, firstName, lastName, source], function () {});
        }
    }
    return next();
});

module.exports = server.exports();
