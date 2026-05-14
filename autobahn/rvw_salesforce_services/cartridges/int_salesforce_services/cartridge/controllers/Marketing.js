'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var cache = require('*/cartridge/scripts/middleware/cache');

/**
 * Marketing-BeforeHeader: Render helper for velocity template use, called from the beforeHeader hook implementation.
 * This could be considered step 3.
*/
server.get('BeforeHeader', server.middleware.include, csrfProtection.generateToken,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var accountId = req.querystring.accountId;
        var cartInfoUrl = URLUtils.url('Marketing-GetCartInfo');
        res.render('common/marketing', {
            AccountId: accountId,
            Metadata: req.querystring.metadata,
            CartInfoUrl: cartInfoUrl
        });

        next();
    }
);

/**
 * Marketing-GetCartInfo: AJAX call made when the cart is updated and not empty to populate JSON for Collect.js call
 * This could be considered step 3.
*/
server.get('GetCartInfo', csrfProtection.generateToken,
    function (req, res, next) {
        var collectHelper = require('*/cartridge/scripts/helpers/CollectHelper');
        var collectInfos = [];
        collectHelper.LoadCartInfo(collectInfos);
        res.json({
            collectInfos: collectInfos
        });

        next();
    }
);

/**
 * Marketing-UpdateSubscription: AJAX call made when the user subscribes or unsubscribes from a list in account preferences
*/
server.post('UpdateSubscription', server.middleware.https, csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        if (dw.system.Site.current.getCustomPreferenceValue('MarketingCloudForNewsletterEnabled')) {
            var MarketingManager = require('*/cartridge/scripts/marketing/MarketingManager')
            var logger = Logger.getLogger('MarketingCloud', 'Subscriptions');
            var queryString = req.querystring;
            var viewData = res.getViewData();
            var result = { error: true, success: false }

            if (!queryString) {
                res.json(result);
                next();
            }

            var email = queryString.email; // Email will be passed from the AJAX request

            result.msg = 'Error adding '+ email + ' to ' + queryString.listName + '.';

            if (!email) {
                logger.error('Marketing-UpdateSubscription error - no email was found');
                next();
            }

            if (!queryString.listID) {
                logger.error('Marketing-UpdateSubscription error - no listID was found');
                next();
            }

            var UpdateLists = [
                {
                    PartnerKey: queryString.partnerKey,
                    ObjectID: queryString.objectID,
                    ID: queryString.listID,
                    Status: queryString.action,
                    Action: 'upsert'
                }
            ];
            var UpdateRequest = (MarketingManager.UpdateSubscriptionSubscriberLists(email, UpdateLists, false) || {});

            if (UpdateRequest.status === "Error" && UpdateRequest.results && UpdateRequest.results[0].properties && UpdateRequest.results[0].properties.ErrorCode === "12001") {
                //if Updating the subscriber did not work, it may be due to the subscriber not existing yet "The subscriber was not found. - ErrorCode: 12001" If so try a `<CreateRequest>` in the xml
                logger.info('Marketing-UpdateSubscription error: ' + UpdateRequest.results[0].properties.StatusMessage + ' ErrorCode: ' + UpdateRequest.results[0].properties.ErrorCode);
                var CreateRequest = true;
                UpdateRequest = (MarketingManager.UpdateSubscriptionSubscriberLists(email, UpdateLists, CreateRequest) || {});
            }

            if (UpdateRequest.status === "Error") {
                if (!empty(UpdateRequest.results)) {
                    logger.warn('Marketing-UpdateSubscription error: ' + UpdateRequest.results[0].properties.StatusMessage + ' ErrorCode: ' + UpdateRequest.results[0].properties.ErrorCode);
                } else {
                    logger.warn('Marketing-UpdateSubscription unknown error occurred in UpdateSubscriptionSubscriberLists');
                }
            }

            if (UpdateRequest.status === "OK") {
                result = {
                    error: false,
                    success: true,
                    data: UpdateRequest,
                    msg: Resource.msgf('form.marketing.email.subscription.'+ (queryString.action === "Active" ? 'subscribed' : 'unsubscribed'), 'forms', null, queryString.listName)
                }
            }

            res.json(result);
        }

        next();
    }
);

server.use(
    'EmailPreferenceCenter',
    cache.applyDefaultCache,
    csrfProtection.generateToken,
    function (req, res, next) {
        var viewData = res.getViewData();
        var URLUtils = require('dw/web/URLUtils');
        var Resource = require('dw/web/Resource');
        var MarketingManager = require('*/cartridge/scripts/marketing/MarketingManager');

        var email = null;
        var subscriberId = req.querystring.id;

        // Before we use the subscriber id, lets check to see if an email was posted
        if (req.form.email) {
            email = req.form.email
        }

        // If email was posted, skip the subscriberId lookup
        if (!email && subscriberId) {
            var emailResponse = MarketingManager.GetEmailFromSubscriberId(subscriberId);
            if (emailResponse && emailResponse.email) {
                email = emailResponse.email;
            }
        }

        var SubscribersLists = (MarketingManager.GetSubscriptionSubscriberList(email) || {}); // Check results
        var AllLists = (MarketingManager.GetAllList() || {}); // Check results

        res.render('account/emailPreferenceCenter', {
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('form.marketing.email.subscription.header.marketingcloud','forms',null),
                    url: URLUtils.https('Marketing-EmailPreferenceCenter').toString()
                }
            ],
            AllLists: AllLists,
            SubscribersLists: SubscribersLists,
            MarketingEmail: email
        });

        next();
});

module.exports = server.exports();
