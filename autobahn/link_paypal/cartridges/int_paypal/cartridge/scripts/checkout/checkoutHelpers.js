'use strict';

const base = module.superModule;

const Transaction = require('dw/system/Transaction');

const preferences = require('*/cartridge/config/preferences');

const ensureValidShipments = base.ensureValidShipments;
const copyBillingAddressToBasket = base.copyBillingAddressToBasket;

/**
 * Validate shipping form fields
 * @param {Object} form - the form object with pre-validated form fields
 * @returns {Object} the names of the invalid form fields
 */
base.validateShippingForm = function(form) {
    return preferences.isDigitalGoodsFlowEnabled ? {} : base.validateFields(form);
};

/**
 * Copies a raw address object to the basket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
base.copyBillingAddressToBasket = function(address, currentBasket) {
    // Temporary workaround, will be removed after fix delivery in the base cartridge
    if (address.address1 === null) {
        return;
    }

    if (preferences.isDigitalGoodsFlowEnabled && !currentBasket.billingAddress && address.address1 === '') {
        return;
    }

    copyBillingAddressToBasket(address, currentBasket);
};

/**
 * Handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error or empty object
 */
base.handlePayments = function(order, orderNumber) {
    const PaymentMgr = require('dw/order/PaymentMgr');
    const HookMgr = require('dw/system/HookMgr');
    const OrderMgr = require('dw/order/OrderMgr');

    const result = {};

    if (order.totalNetPrice === 0.00) {
        return result;
    }

    const paymentInstruments = order.paymentInstruments.toArray();

    if (paymentInstruments.length === 0) {
        Transaction.wrap(function() {
            OrderMgr.failOrder(order, true);
        });
        result.error = true;
    }

    if (result.error) {
        return result;
    }

    paymentInstruments.every(function(paymentInstrument) {
        const paymentProcessor = PaymentMgr
            .getPaymentMethod(paymentInstrument.paymentMethod)
            .paymentProcessor;

        let authorizationResult;

        if (paymentProcessor === null) {
            Transaction.wrap(function() {
                paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
            });
        } else {
            if (HookMgr.hasHook('app.payment.processor.' + paymentProcessor.ID.toLowerCase())) {
                authorizationResult = HookMgr.callHook(
                    'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                    'Authorize',
                    orderNumber,
                    paymentInstrument,
                    paymentProcessor
                );
            } else {
                authorizationResult = HookMgr.callHook(
                    'app.payment.processor.default',
                    'Authorize'
                );
            }

            if (authorizationResult.error) {
                Transaction.wrap(function() {
                    OrderMgr.failOrder(order, true);
                });

                Object.assign(result, authorizationResult);

                return false;
            }
        }

        return true;
    });

    return result;
};

/**
* Loop through all shipments and make sure all not null
* @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
* @returns {boolean} - allValid
*/
base.ensureValidShipments = function(lineItemContainer) {
    return preferences.isDigitalGoodsFlowEnabled ? true : ensureValidShipments(lineItemContainer);
};

module.exports = base;
