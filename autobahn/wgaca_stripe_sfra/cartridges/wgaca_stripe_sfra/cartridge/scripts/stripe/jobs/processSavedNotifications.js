'use strict';

var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

var base = module.superModule;

function patchOrderManagerPlaceOrder() {
    var logger = Logger.getLogger('Stripe', 'stripe');
    var OrderMgr = require('dw/order/OrderMgr');

    if (!OrderMgr || typeof OrderMgr.placeOrder !== 'function' || OrderMgr.__wgacaStripeJobSafePlaceOrderWrapped) {
        return;
    }

    var originalPlaceOrder = OrderMgr.placeOrder;

    OrderMgr.placeOrder = function () {
        try {
            return originalPlaceOrder.apply(this, arguments);
        } catch (e) {
            logger.error(
                'Stripe webhook job: placeOrder failed in job context. orderNo={0}, message={1}',
                arguments && arguments[0] && arguments[0].orderNo ? arguments[0].orderNo : 'unknown',
                e && e.message ? e.message : e
            );
            return new Status(Status.ERROR, 'ERROR', e && e.message ? e.message : 'placeOrder failed');
        }
    };

    OrderMgr.__wgacaStripeJobSafePlaceOrderWrapped = true;
}

function patchCheckoutEmailHelper() {
    var logger = Logger.getLogger('Stripe', 'stripe');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    if (!COHelpers || typeof COHelpers.sendConfirmationEmail !== 'function' || COHelpers.__wgacaStripeJobSafeEmailWrapped) {
        return;
    }

    var originalSendConfirmationEmail = COHelpers.sendConfirmationEmail;

    COHelpers.sendConfirmationEmail = function () {
        try {
            return originalSendConfirmationEmail.apply(this, arguments);
        } catch (e) {
            logger.error('Error sending SFRA confirmation email in Stripe webhook job: {0}', e && e.message ? e.message : e);
            return null;
        }
    };

    COHelpers.__wgacaStripeJobSafeEmailWrapped = true;
}

exports.execute = function () {
    if (!base || typeof base.execute !== 'function') {
        return new Status(Status.ERROR);
    }

    try {
        patchOrderManagerPlaceOrder();
        patchCheckoutEmailHelper();
    } catch (e) {
        Logger.getLogger('Stripe', 'stripe').error('Unable to patch checkout email helper for Stripe webhook job: {0}', e && e.message ? e.message : e);
    }

    Logger.getLogger('Stripe', 'stripe').info('Using wgaca_stripe_sfra override for Stripe webhook notifications job.');

    var result = base.execute.apply(this, arguments);

    if (result && typeof result.isError === 'function' && result.isError()) {
        Logger.getLogger('Stripe', 'stripe').error('Stripe webhook job finished with ERROR in base module; returning FINISHED_WITH_WARNINGS from custom override.');
        return new Status(Status.OK, 'FINISHED_WITH_WARNINGS', 'Stripe webhook notifications processed with warnings');
    }

    return result;
};
