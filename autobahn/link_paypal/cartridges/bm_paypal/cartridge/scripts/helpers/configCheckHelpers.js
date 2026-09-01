'use strict';

const Resource = require('dw/web/Resource');

const configCheckFlows = require('~/cartridge/config/configCheckFlow');

/**
 * Validates a set of preferences against the current site's custom preference values.
 * @param {Array<Object>} preferences - An array of preference objects to be validated.
 * @returns {Array<Object>} An array containing the results of the preference checks.
 */
function checkPreference(preferences) {
    const currentSite = require('dw/system/Site').getCurrent();

    return preferences.reduce(function(accum, pref) {
        const currentSitePref = currentSite.getCustomPreferenceValue(pref.name);
        const currentValue = currentSitePref.value ? currentSitePref.value : currentSitePref;
        const isValid = pref.values.includes('filled') ? !empty(currentValue) : pref.values.includes(currentValue);

        if (!isValid){
            accum.push({
                name: pref.name,
                isValid: isValid,
                alert: Resource.msgf('error.unconfigured.preference', 'errors', null, pref.name)
            });
        }

        return accum;
    }, []);
}

/**
 * Receive response data for PayPal service
 * @returns {Object} - Responses
 */
function getResponseFromService() {
    const createPaypalRestService = require('*/cartridge/scripts/service/paypalREST');

    const path = 'v1/identity/openidconnect/userinfo?schema=openid';
    const service = createPaypalRestService();

    const serviceResult = service.call({
        method: 'GET',
        path: path
    });

    const serviceResponse = service.getResponse() || {
        msg: serviceResult.msg,
        error: serviceResult.error
    };

    return Object.assign(serviceResponse, {
        service: service,
        path: path,
        serviceResult: serviceResult
    });
}

/**
 * Validates a list of payment methods against the configured payment methods in the system.
 * @param {Array<string>} payments - An array of payment method identifiers or names to be validated.
 * @returns {Object} An object containing two properties:
 * - checkedPayments: An array of objects, each representing a payment method that was checked.
 * - unconfiguredPayments: An array of objects representing payment methods that failed the validation.
 */
function checkPaymentMethod(payments) {
    const PaymentMgr = require('dw/order/PaymentMgr');

    const unconfiguredPayments = [];

    const checkedPayments = payments.map(function(payment) {
        const paymentMethodConfig = configCheckFlows.paymentMethods.find(function(config) {
            return config.id === payment || config.name === payment;
        });

        const configuredPaymentMethod = PaymentMgr.getPaymentMethod(paymentMethodConfig.id);
        const errors = [];

        if (!configuredPaymentMethod.active){
            errors.push(Resource.msgf('error.unconfigured.payment.notactive', 'errors', null, paymentMethodConfig.id));
        }

        if (configuredPaymentMethod.paymentProcessor.ID !== paymentMethodConfig.processorID){
            errors.push(Resource.msgf('error.unconfigured.payment.processor', 'errors', null, paymentMethodConfig.id));
        }

        const paymentObj = {
            name: payment,
            errors: errors,
            isValid: !errors.length,
            alert: errors.join('\n')
        };

        if (!paymentObj.isValid) {
            unconfiguredPayments.push(paymentObj);
        }

        return paymentObj;
    });

    return {
        checkedPayments: checkedPayments,
        unconfiguredPayments: unconfiguredPayments
    };
}

/**
 * Validates a set of flows against configured dependencies and checks.
 * @param {Array<string>} flows - An array of flow names to be validated.
 * @returns {Array<Object>} An array of objects, each representing the results of checking a specific flow.
 */
function checkFlow(flows) {
    return flows.map(function(flow) {
        const flowConfig = configCheckFlows.flows.find(function(config) {
            return config.name === flow;
        });

        const flowObj = {
            name: flow,
            errors: {
                payments: [],
                prefs: []
            }
        };

        if (!flowConfig){
            return flowObj;
        }

        if (flowConfig.paymentDependency.length) {
            const checkedPaymentMethods = checkPaymentMethod(flowConfig.paymentDependency);

            checkedPaymentMethods.unconfiguredPayments.forEach(function(payment) {
                flowObj.errors.payments.push(payment.alert);
            });
        }

        if (flowConfig.prefsDependency.length){
            const unconfiguredPrefs = checkPreference(flowConfig.prefsDependency);

            unconfiguredPrefs.forEach(function(checkedFlow) {
                flowObj.errors.prefs.push(checkedFlow.alert);
            });
        }

        return Object.assign(flowObj, {
            isValid: !flowObj.errors.payments.length && !flowObj.errors.prefs.length,
            alert: [flowObj.errors.payments.join('\n'), flowObj.errors.prefs.join('\n')]
                .filter(function(str) {
                    return str.length > 0;
                }).join('\n')
        });
    });
}

module.exports = {
    getResponseFromService: getResponseFromService,
    checkPaymentMethod: checkPaymentMethod,
    checkFlow: checkFlow
};
