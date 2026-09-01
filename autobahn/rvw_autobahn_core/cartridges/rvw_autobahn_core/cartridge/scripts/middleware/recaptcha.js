'use strict';

var server = require('server');

var Logger = require('dw/system/Logger').getLogger('Google');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');

var current = Site.getCurrent();

function isPayPalCheckoutFlowRequest(req) {
    var endpoint = ((req && req.httpPath) || (req && req.path) || '').toString();
    var isCheckoutPaymentEndpoint = endpoint.indexOf('CheckoutServices-SubmitPayment') > -1
        || endpoint.indexOf('CheckoutServices-PlaceOrder') > -1;

    if (!isCheckoutPaymentEndpoint) {
        return false;
    }

    var paymentMethod = (req.form && req.form.dwfrm_billing_paymentMethod) || '';
    var usedPaymentMethod = (req.form && req.form.dwfrm_billing_paypal_usedPaymentMethod) || '';
    var hasPayPalFormSignal = Object.prototype.hasOwnProperty.call(req.form || {}, 'dwfrm_billing_paypal_usedPaymentMethod')
        || Object.prototype.hasOwnProperty.call(req.form || {}, 'dwfrm_billing_paypal_paymentId')
        || /paypal/i.test(paymentMethod)
        || /paypal/i.test(usedPaymentMethod);

    if (hasPayPalFormSignal) {
        return true;
    }

    var basket = BasketMgr.getCurrentBasket();
    if (!basket) {
        return false;
    }

    var paymentInstruments = basket.getPaymentInstruments();
    if (!paymentInstruments || !paymentInstruments.length) {
        return false;
    }

    for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];
        var method = paymentInstrument.getPaymentMethod() || '';
        var hasPayPalOrderId = paymentInstrument.custom && paymentInstrument.custom.paypalOrderID;

        if (/paypal/i.test(method) || hasPayPalOrderId) {
            return true;
        }
    }

    return false;
}

function checkRecaptchaAjax(req, res, next) {
    if (module.exports.recaptchaConfirmedBot(req, res)) {
        res.redirect(URLUtils.url('Recaptcha-AjaxFail'));
    }
    next();
}


function checkRecaptcha(req, res, next) {
    if (module.exports.recaptchaConfirmedBot(req, res)) {
        res.redirect(URLUtils.url('Recaptcha-Fail'));
    }
    next();
}

function recaptchaConfirmedBot(req, res) {
    var enableRecaptcha = current.getCustomPreferenceValue('enableRecaptcha');
    var enableBMAuthRecaptchaBypass = !!current.getCustomPreferenceValue('enableBMAuthRecaptchaBypass');

    if(req.form && req.form.isLoginFromPDP){
        return false;
    }

    // PayPal redirect/return requests do not carry recaptcha form fields.
    // Treating them as bot traffic causes false `Recaptcha-AjaxFail` on checkout submit/place order.
    if (isPayPalCheckoutFlowRequest(req)) {
        return false;
    }

    // Checking to see if session userName is storefront or a login. If it is not storefront then this should be a CSC agent recaptcha bot code can be skipped.
    var reqSession = req.session && req.session.raw || {};
    var isCSCAgent = ('userName' in reqSession && !empty(reqSession.userName) && reqSession.userName != 'storefront' && reqSession.userAuthenticated == true) ? enableBMAuthRecaptchaBypass : false;

    if (!isCSCAgent && enableRecaptcha) {
        var form = server.forms.getForm('recaptcha');
        if (!form || !form.recaptchaToken || !form.recaptchaToken.value || !form.recaptchaAction || !form.recaptchaAction.value) {
            var recaptchaToken = (form && form.recaptchaToken) ? form.recaptchaToken.value : null;
            var recaptchaAction = (form && form.recaptchaAction) ? form.recaptchaAction.value : null;

            Logger.error('Google recaptcha failed to validate token. recaptchaToken: {0} - recaptchaAction: {1}', recaptchaToken, recaptchaAction);
            return true;
        } else {
            var tokenValue = form.recaptchaToken.value;
            var actionValue = form.recaptchaAction.value;

            form.clear();

            var service = module.exports.recaptchaVerifyService();
            var result = service.call({recaptchaToken: tokenValue});

            if (result && result.ok) {
                var msg = JSON.parse(result.object.text);

                if (!msg.success) {
                   if (!(msg['error-codes'] && msg['error-codes'].length && msg['error-codes'][0] === 'timeout-or-duplicate')) {
                       Logger.error('Google recaptcha failed to validate token: ' + (msg['error-codes'] && msg['error-codes'].length ? msg['error-codes'].join('; ') : ''));
                   }
                } else if (msg.score <= current.getCustomPreferenceValue('recaptchaFailThreshold') || msg.action !== actionValue) {
                    return true;
                }
            } else {
                Logger.error('Google recaptcha failed to validate token: ' + service.msg);
            }
        }
    }

    return false;
}

function recaptchaVerifyService() {
    var HTTPRequestPart = require('dw/net/HTTPRequestPart');
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

    var service = LocalServiceRegistry.createService('google.rest.recaptcha.api.siteverify', {
        createRequest: function (service, params) {
            service.setRequestMethod('POST');
            var key = current.getCustomPreferenceValue('recaptchaSecretKey');
            if (!key) {
                key = service.configuration.credential.password;
            }
            return [
                new HTTPRequestPart('secret', key),
                new HTTPRequestPart('response', params.recaptchaToken)
            ];
        },
        parseResponse: function(service, response) {
            return response;
        },
        filterLogMessage: function(msg) {
            return msg;
        }
    });

    return service;
}

module.exports = {
    checkRecaptcha: checkRecaptcha,
    checkRecaptchaAjax: checkRecaptchaAjax,
    recaptchaConfirmedBot: recaptchaConfirmedBot,
    recaptchaVerifyService: recaptchaVerifyService
};

