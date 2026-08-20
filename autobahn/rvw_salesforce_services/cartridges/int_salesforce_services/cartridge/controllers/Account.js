'use strict';

var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');

var server = require('server');
server.extend(module.superModule);

server.append(
    'SubmitRegistration',
    function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();
        var source = viewData.action || null;
        if (!empty(viewData) && 'form' in viewData && viewData.form !== null &&
            'customer' in viewData.form && viewData.form.customer !== null &&
            'addtoemaillist' in viewData.form.customer && viewData.form.customer.addtoemaillist.checked) {
            var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

            var email = viewData.email;
            var firstName = viewData.firstName;
            var lastName = viewData.lastName;
            var responseData = {
                success: false,
                error: true,
                msg: Resource.msg('subscribe.email.invalid', 'homePage', null)
            };
            hooksHelper('app.mailingList.subscribe', 'subscribe', [responseData, email, firstName, lastName, source], function () {});
        }
    });
    next();
});

if (Site.current.getCustomPreferenceValue('MarketingCloudForNewsletterEnabled')) {

    var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

    server.append(
        'Show',
        csrfProtection.generateToken,
        function (req, res, next) {
            var viewData = res.getViewData();
            var MarketingManager = require('*/cartridge/scripts/marketing/MarketingManager');

            /*
            * MarketingManager.GetSubscriptionSubscriberList returns object with results property. Results (Array of Objects) contains SubscriberList indicating all the lists to which a user is associated.
            * Example SubscriberList objects: (https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/listsubscriber.html)
            * {
            *	  ID: (String) ID related to user account
            *	  ListID: (String) List specific ID
            *	  Status: (String Constants) Active|Bounced|Held|Unsubscribed|Deleted	   Active and Unsubscribed will be our focus
            *	  SubscriberKey: (String) Email/SubscriberKey	   Email of user or subscriber contact ID
            * }
            */
            var email = viewData.account.profile.email;
            var SubscribersLists = (MarketingManager.GetSubscriptionSubscriberList(email) || {}); // Check results

            /*
            * MarketingManager.GetAllList returns object with results property. Results (Array of Objects) contains List indicating all the publication lists to on Marketing Cloud account.
            * Example List objects: (https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/list.html)
            * {
            *	  ID: (String) List ID
            *	  ListName: (String) Name
            *	  Description: (String) MC List Description
            *	  ListCLassification: (String Constants) PublicationList		Always PublicationList
            *	  Type: (String Constant) Public		Always Public
            * }
            */
            var AllLists = (MarketingManager.GetAllList() || {}); // Check results

            res.setViewData({
                AllLists: AllLists,
                SubscribersLists: SubscribersLists,
                MarketingEmail: email
            });

            next();
    });
}

module.exports = server.exports();
