var core = require('core/main');

//paymentMethodMutationObserver, onPaymentMethodObserverShow, and onPaymentMethodObserverIframePresent must be before all the integrations that rely on them below to prevent race conditions
core.baseFiles.paymentMethodMutationObserver = function paymentMethodMutationObserver() {
    var targets = $('.js-paymentmethod-mutationobserver');
    if (targets && targets.length) {
        for (let target of targets) {
            var config = { subtree: true, childList: true };
            var mutationObserver = new MutationObserver((mutationList, observer) => {
                for (var mutationRecord of mutationList) {
                    if (mutationRecord.addedNodes) {
                        for (var addNode of mutationRecord.addedNodes) {
                            $('body').trigger('PaymentMethodObserver:AddNode', {
                                addNode: addNode,
                                target: target,
                                observer: observer
                            });
                        }
                    }
                }
            });

            mutationObserver.observe(target, config);
        }
    }
}

core.baseFiles.onPaymentMethodObserverShow = function onPaymentMethodObserverShow() {
    $('body').on('PaymentMethodObserver:Show', function (e, data) {
        var targets = $('.js-paymentmethodwarning-msgcontainer');
        if (targets && targets.length) {
            for (var target of targets) {
                target = $(target);
                if (data && data.name) {
                    target.data(data.name + '_show', data.show);
                    target.attr('data-' + data.name + '_show', data.show);
                }

                if (target.data('iframepresent') === true) {
                    var dataNames = [];
                    var attrs = target.data();
                    for (var attr of Object.keys(attrs)) {
                        var splits = attr.split('_');
                        if (splits.length === 2) {
                            if (attrs[attr] === true && splits[1] === 'show') {
                                dataNames.push(splits[0]);
                            }
                        }
                    }

                    var newMsg = '';
                    var disable = false;
                    for (var dataName of dataNames) {
                        if (target.data(dataName + '_disable') === true) {
                            disable = true;
                            newMsg = '<p>' + target.data(dataName + '_msg') + '</p>';
                            break;
                        }
                        if (target.data(dataName + '_msg')) {
                            newMsg += '<p>' + target.data(dataName + '_msg') + '</p>';
                        }
                    }

                    if (newMsg.length) {
                        target.removeClass('d-none');
                    } else {
                        target.addClass('d-none');
                    }

                    if (disable) {
                        target.siblings('.js-paymentmethodwarning-affectedcontainer').attr('disabled', true);
                    } else {
                        target.siblings('.js-paymentmethodwarning-affectedcontainer').removeAttr('disabled');
                    }

                    target.html(newMsg);
                }
            }
        }
    })
}

core.baseFiles.onPaymentMethodObserverIframePresent = function onPaymentMethodObserverIframePresent() {
    $('body').on('PaymentMethodObserver:iframePresent', function () {
        $('body').trigger('PaymentMethodObserver:Show');
    })
}

core.baseFiles.base = require('./product/base');
core.baseFiles.cart = require('./cart');

var siteIntegrations = require('./integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

if (toggleObject.bopisCartridgeEnabled) {
    // adding to main.js to make accessible for quickview
    core.baseFiles.pdpInstoreInventory = require('./integrations/bopis/product/pdpInstoreInventory');
}
if (toggleObject.sfcommercepaymentsCartridgeEnabled) {
    core.baseFiles.sfcppayment = require('./integrations/commercepayments/components/payment');
}
if (toggleObject.klaviyo_enabled) {
    core.baseFiles.klaviyo = require('./integrations/klaviyo/identify');
}
if (toggleObject.MarketingCloudForNewsletterEnabled) {
    core.baseFiles.marketing = require('./integrations/marketingCloud/account/marketing');
}
if (toggleObject.yotpoCartridgeEnabled) {
    core.baseFiles.productTile = require('./integrations/yotpo/components/productTile');
}

module.exports = core;
