
'use strict';

function recaptchaPromise(e, args) {
    var actionName = 'submit' + (e && e.target ? (e.target.id + e.target.className).replace(/[^a-zA-Z0-9]+/g, '') : '');

    // return Promise
    return grecaptcha.execute(window.CachedData.sitePreferences.recaptchaSiteKey, {action: actionName}).then(function(token) {
        var recaptchaTokenInput = $("<input type='hidden' class='form-control' id='recaptchaToken' name='dwfrm_recaptcha_recaptchaToken' value=" + token + ">");
        var recaptchaActionInput = $("<input type='hidden' class='form-control' id='recaptchaAction' name='dwfrm_recaptcha_recaptchaAction' value=" + actionName + ">");

        if (typeof args.data == 'string') {
            args.data += args.data.length === 0 ? '' : '&';
            args.data += $.param(recaptchaTokenInput) + '&' + $.param(recaptchaActionInput);
        } else {
            args.data = args.data || {};
            args.data['dwfrm_recaptcha_recaptchaToken'] = token;
            args.data['dwfrm_recaptcha_recaptchaAction'] = actionName;
        }

        // Updated AJAX Arguments
        return args;
    });
}

function validateRecaptcha () {
    // How this code snippet works:
    // This logic overwrites the default behavior of `grecaptcha.ready()` to
    // ensure that it can be safely called at any time. When `grecaptcha.ready()`
    // is called before reCAPTCHA is loaded, the callback function that is passed
    // by `grecaptcha.ready()` is enqueued for execution after reCAPTCHA is loaded.

    if (typeof window.grecaptcha === 'undefined') {
        const c = '___grecaptcha_cfg';
        const error = () => { if (typeof grecaptcha.render === 'undefined') throw 'Recaptcha load failure' };
        const errorCheck = () => document.readyState !== 'complete' ? window.addEventListener('load', error) : error();

        window.grecaptcha = {};

        grecaptcha.ready = function(cb){
            if (typeof grecaptcha.render === 'undefined') {
                // window.__grecaptcha_cfg is a global variable that stores reCAPTCHA's
                // configuration. By default, any functions listed in its 'fns' property
                // are automatically executed when reCAPTCHA loads.
                window[c] = window[c] || {};
                (window[c]['fns'] = window[c]['fns']||[]).push(cb);

                errorCheck();
            } else {
                cb();
            }
        }
        // Required to be the first command to recaptcha in the 'fns' array
        grecaptcha.ready(function(){
            window.grecaptcha?.render("container", {
                sitekey: window.CachedData.sitePreferences.recaptchaSiteKey
            });
        });
    }
}

function check(e, next) {
    var defer = $.Deferred();

    // Rejected or Resolved trigger ajax to trigger success, error, complete
    defer.always((args) => {
        var $xhr = args && $.ajax(args);

        defer.notify($xhr);

        return $xhr;
    });

    if (!!window.CachedData.sitePreferences.enableRecaptcha) {
        module.exports.validateRecaptcha();

        if (window.grecaptcha?.ready) {
            grecaptcha.ready(function() {
                module.exports.recaptchaPromise(e, next).then(function (args) {
                    // success
                    return defer.state() !== 'resolved' && defer.resolve(args); // with native beforeSend
                }, function (args) {
                    // override beforeSend to kill the ajax send and allow error fn to trigger
                    args.beforeSend = () => false;
                    return defer.state() !== 'rejected' && defer.reject(args);
                });
            });
        } else {
            // Fail as Recaptcha is unavailable
            defer.reject(next);
        }
    } else {
        // Fall through to AJAX method
        defer.resolve(next);
    }

    return defer;
}

module.exports = {
    check: check,
    recaptchaPromise: recaptchaPromise,
    validateRecaptcha: validateRecaptcha
}
