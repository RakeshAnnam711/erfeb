'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');

var server = require('server');
server.extend(module.superModule);

server.append('Confirm', function (req, res, next) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var viewData = res.viewData;
    if (!viewData.forms) {
        viewData.forms = {};
    }

    if (!viewData.forms.guestCustomerForm) {
        viewData.forms.guestCustomerForm = COHelpers.prepareCustomerForm('coCustomer');
        res.setViewData(viewData);
    }

    // Conversion tracking
    this.on('route:Complete', function (req, res) {
        if ( viewData.error !== false && !empty(viewData.orderID)) {
            var Site = require('dw/system/Site');
            const service = require('*/cartridge/scripts/service/ConversionTracking').conversionTracking();
            var token = Site.getCurrent().getCustomPreferenceValue('ConversionTrackingToken');

            // Find conversionTracking cookie if it exists
            var conversionTrackingCookie;
            var cookies = request.getHttpCookies();
            var cookieCount = cookies.getCookieCount();
            for (var i = 0; i < cookieCount; i++) {
                if ('conversionTracking' === cookies[i].getName()) {
                    conversionTrackingCookie = cookies[i];
                    break;
                }
            }

            if (conversionTrackingCookie) {
                conversionTrackingCookie = JSON.parse(conversionTrackingCookie.value);
                var params = {
                    Event: 'Conversion',
                    MemberID: conversionTrackingCookie.mid,
                    JobID: conversionTrackingCookie.utm_id,
                    BatchID: conversionTrackingCookie.jb,
                    ListID: conversionTrackingCookie.l,
                    SubscriberID: conversionTrackingCookie.sfmc_sub,
                    LinkID: conversionTrackingCookie.u,
                    LinkAlias: conversionTrackingCookie.utm_term,
                    OrderNumber: viewData.orderID,
                    OrderTotal: viewData.order.totals.grandTotal,
                    Token: token
                }
                var serviceResponse = service.call(params);

                // Delete cookie if the service call doesn't error
                if (serviceResponse.object.Status !== 'Error') {
                    const Cookie = require('dw/web/Cookie');
                    var cookie = new Cookie('conversionTracking', "");
                    cookie.setDomain(Site.getCurrent().getHttpHostName());
                    cookie.setHttpOnly(true);
                    cookie.setSecure(true);
                    cookie.setPath('/');
                    cookie.setMaxAge(0); // Expire the cookie immediately
                    response.addHttpCookie(cookie);
                }
            }
        }
    });

    return next();
});

server.append('CreateAccount', function (req, res, next) {
    var order = OrderMgr.getOrder(req.querystring.ID);
    if (!order || order.customer.ID !== req.currentCustomer.raw.ID || order.getUUID() !== req.querystring.UUID) {
        res.json({ error: [Resource.msg('error.message.unable.to.create.account', 'login', null)] });
        return next();
    }
    var source = res.viewData && res.viewData.action || null;

    var coCustomerForm = server.forms.getForm('coCustomer');
    var newsletterOptIn = ('newsletterOptIn' in coCustomerForm) ? coCustomerForm.newsletterOptIn : null;
    if (!empty(newsletterOptIn) && newsletterOptIn.addtoemaillist.checked && order) {
        var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

        var email = !empty(order.customerEmail) ? order.customerEmail : '';
        var firstName = !empty(order.billingAddress.firstName) ? order.billingAddress.firstName : '';
        var lastName = !empty(order.billingAddress.lastName) ? order.billingAddress.lastName : '';
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
