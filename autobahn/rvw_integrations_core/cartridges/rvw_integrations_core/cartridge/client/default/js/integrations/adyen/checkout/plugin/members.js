'use strict';

var coreMembers = require('core/checkout/plugin/members');
var baseInitialize = coreMembers.initialize;
var baseHandlePlaceOrderSuccess = coreMembers.handlePlaceOrderSuccess;
var adyenCheckout = require('../../adyenCheckout');

function handlePlaceOrderSuccess (e, data) {
    if (data.adyenAction) {
        window.orderToken = data.orderToken;
        adyenCheckout.actionHandler(data.adyenAction);
    } else {
        baseHandlePlaceOrderSuccess.apply(module.exports, arguments);
    }
};

function initialize(target) {
    var scope = this,
        $billing = $('#dwfrm_billing');

    baseInitialize.apply(scope, arguments);

    // Extend adyenCheckout behavior
    $billing.on('submit-billing', function (e) {
        var $this = $(this),
            defer = $.Deferred();

        defer.then(function () {
            // Update UI with new stage
            $('.error-message').hide();
        },
        function () {
            $this.trigger('validate');
        });
        scope.handlePaymentStage(e, defer);

        return defer;
    });
};


module.exports = {
    initialize: initialize,
    handlePlaceOrderSuccess: handlePlaceOrderSuccess
}
