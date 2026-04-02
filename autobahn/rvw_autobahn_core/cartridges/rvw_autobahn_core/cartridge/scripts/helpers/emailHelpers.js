'use strict';

var Logger = require('dw/system/Logger');
var Mail = require('dw/net/Mail');
var Site = require('dw/system/Site');

var base = module.superModule;

base.emailTypes.contactUs = 7;
base.emailTypeAssets = base.emailTypeAssets || {};
/**
 * emailTypeAssets - arrays of content assets used in email templates, extendable per superModule.
 * if needing to override a global asset in a specific template, create json object
 * in array with 'id' property of the globalAsset id and 'contentId' property of
 * overriding content asset id.
 * Example:
 * this overrides 'emailGlobalHeaderLink1' with the contents of 'emailOrderConfirmationHeaderLink1'
 * content asset.
 * {'id': 'emailGlobalHeaderLink1', 'contentId': 'emailOrderConfirmationHeaderLink1'}
 */
base.emailTypeAssets.globalAssets = ['emailGlobalHeaderLink1', 'emailGlobalHeaderLink2', 'emailGlobalFooter'];
base.emailTypeAssets.registration = ['emailAccountRegisterTop', 'emailAccountRegisterBottom'];
base.emailTypeAssets.passwordChange = ['emailPasswordChangeTop', 'emailPasswordChangeBottom'];
base.emailTypeAssets.passwordReset = ['emailPasswordResetTop', 'emailPasswordResetBottom'];
base.emailTypeAssets.orderConfirmation = [];
base.emailTypeAssets.accountLocked = [];
base.emailTypeAssets.accountEdited = ['emailAccountEditedTop', 'emailAccountEditedBottom'];
base.emailTypeAssets.contactUs = [];

function getEmailAssetObject(asset) {
    var assetObject = {};

    if (typeof(asset) === 'object') {
        assetObject = asset;
    }
    else {
        assetObject.id = asset;
        assetObject.contentId = asset;
    }

    return assetObject;
}

/**
 * Gather body of all email content assets for email template type
 * @param {int} emailType
 */
function getEmailContentAssets(emailType, emailObjAssets) {
    var ContentMgr = require('dw/content/ContentMgr');
    var assets = {};
    var globalAssets = base.emailTypeAssets.globalAssets;

    // load global template assets available for all template types
    if (!empty(globalAssets)) {
        globalAssets.forEach(function(asset) {
            var assetObject = getEmailAssetObject(asset);
            var content = ContentMgr.getContent(assetObject.contentId);
            if (content && content.online) {
                assets[assetObject.id] = content.custom.body ? content.custom.body.markup : '';
            }
        });
    }

    // use IDs passed from email object or use default settings from above
    if (!empty(emailObjAssets)) {
        emailObjAssets.forEach(function(asset) {
            var assetObject = getEmailAssetObject(asset);
            var content = ContentMgr.getContent(assetObject.contentId);
            if (content && content.online) {
                assets[assetObject.id] = content.custom.body ? content.custom.body.markup : '';
            }
        });
    } else {
        var emailTypeKey = '';

        Object.keys(base.emailTypes).forEach(function (key) {
            if (empty(emailTypeKey) && base.emailTypes[key] === emailType) {
                emailTypeKey = key;
            }
        });

        if (!empty(emailTypeKey)) {
            var assetIds = base.emailTypeAssets[emailTypeKey];
            if (!empty(assetIds)) {
                assetIds.forEach(function(asset) {
                    var assetObject = getEmailAssetObject(asset);
                    var content = ContentMgr.getContent(assetObject.contentId);
                    if (content && content.online) {
                        assets[assetObject.id] = content.custom.body ? content.custom.body.markup : '';
                    }
                });
            }
        }
    }

    return assets;
}

/**
 * CUSTOMIZATION OVERRIDE FROM BASE TO RETURN SEND() STATUS && USE ASSETS
 *
 * Helper that sends an email to a customer. This will only get called if hook handler is not registered
 * @param {obj} emailObj - An object that contains information about email that will be sent
 * @param {string} emailObj.to - Email address to send the message to (required)
 * @param {string} emailObj.subject - Subject of the message to be sent (required)
 * @param {string} emailObj.from - Email address to be used as a "from" address in the email (required)
 * @param {int} emailObj.type - Integer that specifies the type of the email being sent out. See export from emailHelpers for values.
 * @param {string} template - Location of the ISML template to be rendered in the email.
 * @param {obj} context - Object with context to be passed as pdict into ISML template.
 */
base.send = function (emailObj, template, context) {
    var sfraEmailHelpersEmailFilters = Site.current.getCustomPreferenceValue('sfraEmailHelpersEmailFilters') || {};
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');​

    // Pull values from FiltersObject, equivelent to Object.values(), .values only avail with 22.7 Compatibility Mode
    sfraEmailHelpersEmailFilters = Object.keys(sfraEmailHelpersEmailFilters).map(k => sfraEmailHelpersEmailFilters[k]);

    // customization to retrieve template specific content assets
    if (empty(context)) {
        context = {};
    }
    context.emailAssets = getEmailContentAssets.call(this, emailObj.type, emailObj.assets);​
    var email = new Mail();
    email.addTo(emailObj.to);
    email.setSubject(emailObj.subject);
    email.setFrom(emailObj.from);
    email.setContent(renderTemplateHelper.getRenderedHtml(context, template), 'multipart/alternative; boundary="ContentTypeSwitch"; type="html/text"','utf-8');

    // Only validate when configs are present
    if (sfraEmailHelpersEmailFilters && sfraEmailHelpersEmailFilters.length > 0) {
        var allowed = false;

        email.to.toArray().forEach(function (emailTo) {
            allowed = [false].concat(sfraEmailHelpersEmailFilters).reduce(function (match, pattern) {
                try {
                    return match || (new RegExp(pattern,'gi')).test(emailTo);
                } catch (err) {
                    // Trigger 500 failure if site preferences are not valid configurations
                    Logger.error('Malformed Email Address Pattern: Autobahn Configs > sfraEmailHelpersEmailFilter');
                    throw err;
                }
            });
        });

        if (!allowed) {
            // Trigger 500 failure if site preferences do not permit emails
            throw 'Disallowed Email Address Pattern: Autobahn Configs > sfraEmailHelpersEmailFilter';
        }
    }

    return email.send();
};

base.sendEmail = function (emailObj, template, context) {
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var server = require('server');
    var Site = require('dw/system/Site');

    var giftCertificateForm = server.forms.getForm('giftCertificate');

    giftCertificateForm.clear();
    context.giftCertificateForm = giftCertificateForm;
    //capitalizing user name if lowercase
    if (context.firstName && context.lastName) {
        context.firstName = context.firstName.charAt(0).toUpperCase() + context.firstName.slice(1);
        context.lastName = context.lastName.charAt(0).toUpperCase() + context.lastName.slice(1);
    }

    return hooksHelper('app.customer.email', 'sendEmail', [emailObj, template, context], module.exports.send);
};

module.exports = base;
