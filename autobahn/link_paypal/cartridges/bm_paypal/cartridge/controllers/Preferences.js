'use strict';

/**
 * @namespace Preferences
 */

const server = require('server');

const Resource = require('dw/web/Resource');
const Site = require('dw/system/Site');

const customPreferencesConfig = require('~/cartridge/config/customPreferencesConfig');

const DEFAULT_ROWS = 10;
const NUMBER_OF_CURLY_BRACES = 2;

/**
 * Set Predefined Values
 * @param {dw.system.Site} currentSite - Current site
 * @returns {void}
 */
function setPredefinedValues(currentSite) {
    const Transaction = require('dw/system/Transaction');

    Transaction.wrap(function() {
        ['PP_OCAPI_Config', 'PP_WebDAV_Config'].forEach(function(name) {
            if (currentSite.getCustomPreferenceValue(name) === null) {
                currentSite.setCustomPreferenceValue(name, '{}');
            }
        });
    });
}

/**
 * Get site preference groups
 */
server.get('Groups', server.middleware.https, function(req, res, next) {
    const currentSite = Site.current;

    setPredefinedValues(currentSite);

    const prefs = require('~/cartridge/config/preferences');
    const configCheckFlows = require('~/cartridge/config/configCheckFlow');
    const urls = require('~/cartridge/config/urls');

    const activeTabs = customPreferencesConfig.sections.reduce(function(accum, value) {
        const attributeGroup = currentSite.preferences.describe().getAttributeGroup(value.groupId);

        accum[value.groupId] = !!attributeGroup;

        return accum;
    }, {});

    res.render('preferences/preferenceList', {
        activeTabs: activeTabs,
        customPreferencesConfig: customPreferencesConfig,
        relations: JSON.stringify(customPreferencesConfig.relations),
        apiConfig: JSON.stringify({ ocapi: prefs.ocapiConfig, webdav: prefs.webdavConfig }),
        services: [{
            primary: true,
            name: require('~/cartridge/config/constants').SERVICE_NAME
        }],
        selfCheckFlows: configCheckFlows.flows,
        selfCheckPayments: configCheckFlows.paymentMethods,
        testConnectionUrl: urls.testServiceConnection,
        selfCheckUrl: urls.selfCheck,
        additionalData: JSON.stringify(require('~/cartridge/config/versions')),
        resources: JSON.stringify({
            submit: Resource.msg('forms.submit', 'paypalbm', null),
            cancel: Resource.msg('forms.cancel', 'paypalbm', null),
            pleaseWait: Resource.msg('msg.pleasewait', 'paypalbm', null),
            modalTitle: Resource.msg('configcheck.modal.title', 'preferences', null),
            selfCheckModalTitle: Resource.msg('selfcheck.modal.title', 'preferences', null),
            exportAllSuccess: Resource.msg('configcheck.export.success', 'preferences', null),
            exportAllFailure: Resource.msg('configcheck.export.failure', 'preferences', null),
            exportSomeFailure: Resource.msg('configcheck.export.some.failure', 'preferences', null),
            exportGeneralSuccess: Resource.msg('configcheck.export.general.success', 'preferences', null)
        })
    });

    next();
});

/**
 * Site preference by group id
 * @returns {mixed} response
 */
server.get('Group', server.middleware.include, function(req, res, next) {
    const EnumValue = require('dw/value/EnumValue');
    const CSRFProtection = require('dw/web/CSRFProtection');
    const ObjectAttributeDefinition = require('dw/object/ObjectAttributeDefinition');

    const coreHelpers = require('~/cartridge/scripts/helpers/coreHelpers');

    const currentSite = Site.current;

    const typeDefinition = currentSite.preferences.describe();
    const groupId = req.httpParameterMap.group_id.stringValue;
    const attributeGroup = typeDefinition.getAttributeGroup(groupId);

    if (!attributeGroup) {
        res.render('preferences/error', {
            errorMessage: Resource.msgf('preference.incorrect.groupid', 'preferences', null, groupId)
        });

        return next();
    }

    let paymentMethod;

    const attributeValues = {};

    const attributeDefinitions = attributeGroup.attributeDefinitions.toArray();

    attributeDefinitions.forEach(function(attribute) {
        const value = currentSite.getCustomPreferenceValue(attribute.ID);

        attributeValues[attribute.ID] = {
            value: value instanceof EnumValue ? value.getValue() : value
        };

        if (attribute.valueTypeCode === ObjectAttributeDefinition.VALUE_TYPE_TEXT) {
            attributeValues[attribute.ID].rows = coreHelpers.isJson(value)
                ? Object.keys(coreHelpers.tryParseJSON(value)).length + NUMBER_OF_CURLY_BRACES
                : DEFAULT_ROWS;
        }
    });

    const section = customPreferencesConfig.sections.find(function(item) {
        return item.groupId === groupId;
    });

    let fastlaneSettings = {};

    const paypalHelper = require('~/cartridge/scripts/paypal/helpers');

    if (section.paymentMethodId) {
        paymentMethod = paypalHelper.getPaymentMethod(section.paymentMethodId);
    }

    if (section.isFastlane) {
        const constants = require('~/cartridge/config/constants');

        const paymentMatches = {};
        const paymentIds = section.paymentMethodIds.split(',');

        paymentMatches[constants.PAYMENT_METHOD_ID_PAYPAL] = 'isPayPalEnabled';
        paymentMatches[constants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD] = 'isCreditCardEnabled';

        fastlaneSettings = paymentIds.reduce(function(accum, paymentMethodId) {
            accum[paymentMatches[paymentMethodId]] = paypalHelper.getPaymentMethod(paymentMethodId).active;

            return accum;
        }, {});

        fastlaneSettings.active = !fastlaneSettings.isPayPalEnabled || !fastlaneSettings.isCreditCardEnabled;
    }

    res.render('preferences/preferenceGroup', {
        sectionName: section.name,
        paymentMethod: paymentMethod,
        attributeGroup: attributeGroup,
        attributeValues: attributeValues,
        attributeConstants: ObjectAttributeDefinition,
        attributeDefinitions: attributeDefinitions,
        valueType: require('~/cartridge/config/constants').VALUE_TYPE,
        csrf: {
            tokenName: CSRFProtection.getTokenName(),
            token: CSRFProtection.generateToken()
        },
        fastlaneSettings: fastlaneSettings
    });

    return next();
});

module.exports = server.exports();
