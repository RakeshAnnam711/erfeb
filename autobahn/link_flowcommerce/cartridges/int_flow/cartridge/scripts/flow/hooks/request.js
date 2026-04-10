/* global session:false, request:false, response:false */
'use strict';

/**
 * Creates a redirect to the current URL with the given locale
 * @param {string} localeCode - Locale Code to redirect to
 * @returns {string} Redirect URL
 */
function makeRedirectUrl(localeCode) {
    var URLUtils = require('dw/web/URLUtils');
    var URLAction = require('dw/web/URLAction');
    var URLParameter = require('dw/web/URLParameter');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    var path = request.httpPath.split('/');
    var params = request.getHttpParameterMap();
    var keys = params.parameterNames.toArray();
    var cleanParams = [];
    var action = path[path.length - 1];
    var urlAction;
    var url;

    // If the request object has no action the last path section will equal the sfcc site e.g. Sites-xxx-Site
    if (!action || action.split('-').length === 3) {
        // Assume Homepage
        action = 'Home-Show';
    }
    urlAction = new URLAction(action, FlowHelper.siteId, localeCode);

    keys.forEach(function (key) {
        var paramArray;

        if (key !== 'lang') {
            paramArray = params.get(key).values.toArray();
            cleanParams = cleanParams.concat(paramArray.map(function (value) {
                return new URLParameter(key, value);
            }));
        }
    });

    url = URLUtils.url(urlAction, cleanParams);
    return url;
}

/**
 * Gets the Override Locale of the current request
 * @param {Object} experience - Flow Experience
 * @param {string} countryCode - 3 Digit country code
 * @param {dw.util.Locale} locale - Locale of the current request
 * @returns {string} Locale Code
 */
function getOverrideLocaleCode(experience, countryCode, locale) {
    var Locale = require('dw/util/Locale');

    var localeLanguageMap = {};
    var locales;

    if (countryCode) {
        locales = experience.sfccLocalesCountryMap[countryCode];
    }

    locales = locales || experience.sfccLocales;

    if (locales && locales.length) {
        locales.forEach(function (localeCode) {
            var l = Locale.getLocale(localeCode);
            if (l.getLanguage()) {
                localeLanguageMap[l.getLanguage()] = l.ID;
            }
        });

        if (locale && locale.getLanguage() && localeLanguageMap[locale.getLanguage()]) {
            return localeLanguageMap[locale.getLanguage()];
        }

        if (countryCode && experience.sfccLocalesCountryMap[countryCode]) {
            return experience.sfccLocalesCountryMap[countryCode][0];
        }
    }

    return experience.defaultSfccLocale;
}

/**
 * Checks incoming request for override querystring parameters and redirects as needed.
 * @returns {dw.system.Status} OK Status Code
 */
exports.onRequest = function () {
    var Status = require('dw/system/Status');
    var Locale = require('dw/util/Locale');

    // Check early to see if we can exit early
    if (request.getHttpMethod() !== 'GET'
        || (request.getHttpPath() || '').indexOf('/on/demandware.store/Sites-Site/') !== -1
        || (request.getHttpPath() || '').indexOf('/Flow-ConfirmHostedCheckout') !== -1
        || request.clientId
        || request.includeRequest
    ) {
        return new Status(Status.OK);
    }

    /* eslint-disable vars-on-top */
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var BasketHelper = require('*/cartridge/scripts/flow/helpers/basketHelper');
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');

    var basket = BasketHelper.getBasket();
    var params;
    var qsExperienceId;
    var qsCountryCode;
    var qsFlowDisabled;
    var locale;
    var localeCode;
    var fixedLocale;
    var requestExperience;
    var overrideExperience;
    var overrideLocaleCode;
    var sessionCurrencyCode;
    var basketCurrencyCode;
    /* eslint-enable vars-on-top */

    if (!FlowHelper.isFlowEnabled) {
        return new Status(Status.OK);
    }

    params = request.getHttpParameterMap();
    qsExperienceId = params.get('flow_experience').value;
    qsCountryCode = params.get('flow_country').value;
    qsFlowDisabled = params.get('flow_enabled').value === 'false';

    // Fixes Locale issue on Homepage where there is no SFCC action set
    if (params.get('lang').value && request.locale !== params.get('lang').value) {
        fixedLocale = Locale.getLocale(params.get('lang').value);
        if (fixedLocale) {
            request.setLocale(fixedLocale.ID);
        }
    }

    locale = Locale.getLocale(request.getLocale());
    localeCode = locale ? locale.ID : FlowHelper.defaultLocaleCode;

    requestExperience = ExperienceHelper.getCurrentExperience();
    overrideExperience = ExperienceHelper.getExperience(qsExperienceId, qsCountryCode, null);

    if (qsFlowDisabled && requestExperience) {
        ExperienceHelper.setExperience();

        if (localeCode !== FlowHelper.defaultLocaleCode) {
            response.redirect(makeRedirectUrl(FlowHelper.defaultLocaleCode));
        }

        return new Status(Status.OK);
    } else if (!overrideExperience && requestExperience && requestExperience.sfccLocales.indexOf(localeCode) < 0) {
        overrideExperience = ExperienceHelper.getExperience(null, null, localeCode);
        ExperienceHelper.setExperience(overrideExperience);
        return new Status(Status.OK);
    } else if (!overrideExperience && requestExperience && requestExperience.currencyCode !== sessionCurrencyCode) {
        // Fixes Locale issue on Homepage where there is no SFCC action set
        ExperienceHelper.setExperience(requestExperience);
        return new Status(Status.OK);
    }

    sessionCurrencyCode = session.getCurrency().getCurrencyCode();
    basketCurrencyCode = basket.getCurrencyCode();

    if (!overrideExperience && !requestExperience && sessionCurrencyCode !== FlowHelper.defaultCurrencyCode) {
        ExperienceHelper.setExperience();
        return new Status(Status.OK);
    } else if (!overrideExperience && sessionCurrencyCode === basketCurrencyCode) {
        return new Status(Status.OK);
    }

    if (overrideExperience && overrideExperience !== requestExperience) {
        overrideLocaleCode = getOverrideLocaleCode(overrideExperience, qsCountryCode, locale);
        ExperienceHelper.setExperience(overrideExperience);

        if (overrideLocaleCode !== localeCode && FlowHelper.defaultLocaleExperiences.indexOf(overrideExperience.id) < 0) {
            response.redirect(makeRedirectUrl(overrideLocaleCode));
            return new Status(Status.OK);
        } else if (localeCode !== FlowHelper.defaultLocaleCode && FlowHelper.defaultLocaleExperiences.indexOf(overrideExperience.id) > -1) {
            response.redirect(makeRedirectUrl(FlowHelper.defaultLocaleCode));
            return new Status(Status.OK);
        }
    }

    if (session.getCurrency().getCurrencyCode() !== basket.getCurrencyCode()) {
        // Reset experience if currency mismatch
        ExperienceHelper.setExperience();
    }

    return new Status(Status.OK);
};

/**
 * Checks new session for geolocation and redirects to flow experience
 * @returns {dw.system.Status} OK Status Code
 */
exports.onSession = function () {
    var Status = require('dw/system/Status');
    var Locale = require('dw/util/Locale');

    // Check early to see if we can exit early
    if (request.getHttpMethod() !== 'GET'
        || (request.getHttpPath() || '').indexOf('/on/demandware.store/Sites-Site/') !== -1
        || (request.getHttpPath() || '').indexOf('/Flow-ConfirmHostedCheckout') !== -1
        || request.clientId
        || request.includeRequest
    ) {
        return new Status(Status.OK);
    }

    /* eslint-disable vars-on-top */
    var flowApi = require('*/cartridge/scripts/flow/api/api');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');

    var geolocation = request.getGeolocation();
    var requestLocale = Locale.getLocale(request.getLocale());
    var fixedLocale;
    var country;
    var possibleExperience;
    var params;
    var qsExperienceId;
    var qsCountryCode;
    var qsFlowDisabled;
    var experience;
    var flowSession;

    params = request.getHttpParameterMap();
    qsExperienceId = params.get('flow_experience').value;
    qsCountryCode = params.get('flow_country').value;
    qsFlowDisabled = params.get('flow_enabled').value === 'false';

    if (FlowHelper.disableServerSessions || !FlowHelper.isFlowEnabled || qsFlowDisabled) {
        return new Status(Status.OK);
    }

    // Fixes Locale issue on Homepage where there is no SFCC action set
    if (params.get('lang').value && requestLocale.getID() !== params.get('lang').value) {
        fixedLocale = Locale.getLocale(params.get('lang').value);
        if (fixedLocale) {
            request.setLocale(fixedLocale.ID);
        }
    }

    if (requestLocale.getID() !== FlowHelper.defaultLocaleCode) {
        country = qsCountryCode || requestLocale.getISO3Country();
    } else {
        country = qsCountryCode || ExperienceHelper.convertCountryCode(geolocation.getCountryCode());
    }

    possibleExperience = ExperienceHelper.getExperience(qsExperienceId, country, null);

    // If we don't have a possible flow experience then carry on
    if (!possibleExperience) {
        return new Status(Status.OK);
    }

    // Create the Flow session, or use existing flow session
    // Always recreate a session if using Flow qs params
    if (qsExperienceId || qsCountryCode || !FlowHelper.sessionId) {
        flowSession = flowApi.session.createSession(country, qsExperienceId);
    } else {
        flowSession = flowApi.session.getSession(FlowHelper.sessionId);
    }

    if (!flowSession) {
        return new Status(Status.OK);
    }

    session.privacy.flowSessionId = flowSession.id;

    if (!flowSession.experience) {
        return new Status(Status.OK);
    }

    experience = ExperienceHelper.getExperience(flowSession.experience.key) || possibleExperience;

    ExperienceHelper.setExperience(experience);

    if (FlowHelper.autoDetectLocale && requestLocale.getID() !== experience.defaultSfccLocale) {
        response.redirect(makeRedirectUrl(experience.defaultSfccLocale));
    }

    return new Status(Status.OK);
};
