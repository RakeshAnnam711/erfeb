'use strict';

var base = module.superModule;

var ShippingMgr = require('dw/order/ShippingMgr');
var Transaction = require('dw/system/Transaction');

/**
 * Attempts to create an order from the current basket
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {dw.order.Order} The order object created from the current basket
 */
function createOrder(currentBasket) {
    var order;
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');

    try {
        order = Transaction.wrap(function () {
            return OrderMgr.createOrder(currentBasket);
        });
    } catch (error) {
        dw.system.Logger.error('Error creating an order: {0} - {1}', error.message, error.stack);
        return null;
    }
    return order;
}

function reApplyGiftCertificatePaymentInstruments(basket) {
    var collections = require('*/cartridge/scripts/util/collections');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var giftCertificateMgr = require('dw/order/GiftCertificateMgr');
    try {
        return Transaction.wrap(function(){
            var giftCertificatePaymentInstruments = [];

            //first remove all existing giftcertificatepaymentinstruments
            collections.map(basket.giftCertificatePaymentInstruments, function (giftCertificatePaymentInstrument) {
                giftCertificatePaymentInstruments.push(giftCertificatePaymentInstrument);
                basket.removePaymentInstrument(giftCertificatePaymentInstrument);
            });

            //then add the gift certificates back 1 by 1
            //if we reach a 0 balance, tell the customer there is no reason to apply more giftCertificatePaymentInstruments
            var basketTotalGrossPrice = basket.totalGrossPrice;
            for (var i in giftCertificatePaymentInstruments) {
                if (basketTotalGrossPrice.valueOrNull) {
                    var giftCertificatePaymentInstrument = giftCertificatePaymentInstruments[i];
                    var oldGiftCertificate = giftCertificateMgr.getGiftCertificateByCode(giftCertificatePaymentInstrument.giftCertificateCode);
                    if (oldGiftCertificate.balance.valueOrNull < basketTotalGrossPrice.valueOrNull) {
                        basket.createGiftCertificatePaymentInstrument(oldGiftCertificate.giftCertificateCode, oldGiftCertificate.balance)
                        basketTotalGrossPrice = basketTotalGrossPrice.subtract(oldGiftCertificate.balance);
                    } else {
                        basket.createGiftCertificatePaymentInstrument(oldGiftCertificate.giftCertificateCode, basketTotalGrossPrice);
                        basketTotalGrossPrice = new dw.value.Money(0, basketTotalGrossPrice.currencyCode);
                        break;
                    }
                }
            }

            // GC covers total cost, so remove previously applied payment non gc instruments
            if (!basketTotalGrossPrice.valueOrNull) {
                var cleanResult = removeRegularPaymentInstruments(basket);
                if (!cleanResult.success) {
                    return cleanResult;
                }
            }

            return {
                success: true,
                basket: basket,
                nonGCAmountRemaining: basketTotalGrossPrice
            }
        });
    } catch (e) {
        dw.system.Logger.error("Problem reapplying gift certificate payment instruments: " + e.msg);
        return {
            success: false,
            msg: Resource.msg('giftcertificate.checkout.error.internal', 'checkout', null)
        }
    }
}

function removeRegularPaymentInstruments(basket) {
    var collections = require('*/cartridge/scripts/util/collections');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var giftCertificateMgr = require('dw/order/GiftCertificateMgr');
    try {
        collections.map(basket.paymentInstruments, function (paymentInstrument) {
            if (dw.order.PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.getPaymentMethod())) {
                return;
            }
            basket.removePaymentInstrument(paymentInstrument);
        });

        return {
            success: true,
            basket: basket
        }
    } catch (e) {
        dw.system.Logger.error("Problem removing regular payment instruments: " + e.msg);
        return {
            success: false,
            msg: Resource.msg('giftcertificate.checkout.error.internal', 'checkout', null)
        }
    }
}

function applyGiftCertificateToBasket(giftCertificate, basket) {
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var collections = require('*/cartridge/scripts/util/collections');
    var URLUtils = require('dw/web/URLUtils');
    try {
        if (!giftCertificate || !giftCertificate.balance.valueOrNull || !giftCertificate.enabled || giftCertificate.status === dw.order.GiftCertificate.STATUS_PENDING
            || giftCertificate.status === dw.order.GiftCertificate.STATUS_REDEEMED) {
            return {
                success: false,
                msg: Resource.msg('giftcertificate.balance.missing', 'checkout', null)
            };
        }

        if (!basket) {
            return {
                success: false,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            };
        }

        var reApplyResult = module.exports.reApplyGiftCertificatePaymentInstruments(basket);
        if (reApplyResult.success) {
            basket = reApplyResult.basket;
        } else {
            return reApplyResult;
        }

        if (collections.find(basket.giftCertificatePaymentInstruments, function (giftCertificatePaymentInstrument) {
            return giftCertificatePaymentInstrument.giftCertificateCode === giftCertificate.giftCertificateCode;
        })) {
            // its already been applied
            return {
                success: true,
                basket: basket
            };
        }

        return Transaction.wrap(function () {
            var nonGCAmountRemaining = reApplyResult.nonGCAmountRemaining;
            if (nonGCAmountRemaining.valueOrNull) {
                if (giftCertificate.balance.valueOrNull < nonGCAmountRemaining.valueOrNull) {
                    basket.createGiftCertificatePaymentInstrument(giftCertificate.giftCertificateCode, giftCertificate.balance)
                    nonGCAmountRemaining = nonGCAmountRemaining.subtract(giftCertificate.balance);
                } else {
                    basket.createGiftCertificatePaymentInstrument(giftCertificate.giftCertificateCode, nonGCAmountRemaining);
                    nonGCAmountRemaining = new dw.value.Money(0, nonGCAmountRemaining.currencyCode);
                }
            }

            if (!nonGCAmountRemaining.valueOrNull) {
                // GC covers total cost, so remove previously applied payment non gc instruments
                var cleanResult = removeRegularPaymentInstruments(basket);
                if (!cleanResult.success) {
                    return cleanResult;
                }
            }

            return {
                success: true,
                basket: basket
            };
        })
    } catch (e) {
        dw.system.Logger.error("Problem reapplying gift certificate payment instruments: " + e.msg);
        return {
            success: false,
            msg: Resource.msg('giftcertificate.checkout.error.internal', 'checkout', null)
        }
    }
};

function removeGiftCertificatePaymentInstrument(giftCertificate, basket) {
    var Resource = require('dw/web/Resource');
    var collections = require('*/cartridge/scripts/util/collections');
    var URLUtils = require('dw/web/URLUtils');
    try {
        if (!giftCertificate) {
            res.json({
                success: false,
                msg: Resource.msg('giftcertificate.checkout.remove.doesnotexist', 'checkout', null)
            });
            return next();
        }

        if (!basket) {
            res.json({
                success: false,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }

        var currentPaymentInstrument = collections.find(basket.giftCertificatePaymentInstruments, function (giftCertificatePaymentInstrument) {
            return giftCertificatePaymentInstrument.giftCertificateCode === giftCertificate.giftCertificateCode;
        });

        if (!currentPaymentInstrument) {
            res.json({
                success: false,
                msg: Resource.msg('giftcertificate.checkout.remove.doesnotexist', 'checkout', null)
            });
        }

        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function() {
            basket.removePaymentInstrument(currentPaymentInstrument);
        });

        return {
            success: true
        };

    } catch (e) {
        dw.system.Logger.error("Problem removing gift certificate payment instrument: " + e.msg);
        return {
            success: false,
            msg: Resource.msg('giftcertificate.checkout.error.internal.remove', 'checkout', null)
        }
    }
};

/**
 * Sets the payment transaction amount
 * IF YOU DON'T CALL BASKETCALCULATIONHELPERS.CALCULATETOTALS IMMEDIATELY BEFORE THIS BEWARE GC USAGE COULD BE WRONG
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an error object
 */
function calculatePaymentTransaction(currentBasket) {
    var result = { error: false };

    try {
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
            var paymentInstruments = currentBasket.paymentInstruments;

            if (paymentInstruments.length) {
                // Gets all payment instruments for the basket.
                var paymentInstrument = null;
                var nonGCPaymentInstrument = null;
                var giftCertificateTotal = new dw.value.Money(0.0, currentBasket.currencyCode);

                // Locates a non-gift certificate payment instrument if one exists.
                // Tallies gift certificate amounts
                for (var i in paymentInstruments) {
                    var paymentInstrument = paymentInstruments[i];
                    if (dw.order.PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.getPaymentMethod())) {
                        giftCertificateTotal = giftCertificateTotal.add(paymentInstrument.getPaymentTransaction().getAmount());
                    } else {
                        nonGCPaymentInstrument = paymentInstrument;
                    }
                }

                // Sets CC payment to Total - GC amounts
                if (nonGCPaymentInstrument) {
                    var orderTotal = currentBasket.totalGrossPrice;
                    var remainingTotal = orderTotal.subtract(giftCertificateTotal);
                    if (remainingTotal.value < 0) {
                        result.error = true;
                        dw.system.Logger.error('Attempted to set payment transaction totals, but gift certificates are over applied');
                    } else {
                        nonGCPaymentInstrument.getPaymentTransaction().setAmount(remainingTotal);
                    }
                }
            }
        });
    } catch (e) {
        dw.system.Logger.error('Error in the calculatePaymentTransaction function: {0} - {1}', e.message, e.stack);
        result.error = true;
    }

    return result;
}

function clearPaymentInstrumentsExceptGiftCertificates(currentBasket){
    var paymentInstruments = currentBasket.getPaymentInstruments();
    var iterator = paymentInstruments.iterator();
    var Transaction = require('dw/system/Transaction');
    Transaction.wrap(function () {
        while (iterator.hasNext()) {
            var paymentInstrument = iterator.next();
            if (paymentInstrument.paymentMethod.equals(dw.order.PaymentInstrument.METHOD_GIFT_CERTIFICATE)) {
                continue;
            } else {
                currentBasket.removePaymentInstrument(paymentInstrument);
            }
        }
    });
}

/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
    if (currentBasket && !currentBasket.totalGrossPrice.valueOrNull) {
        // no payment necessary when total gross price is 0
        return true;
    }

    return base.validatePayment(req, currentBasket);
}

function selectDefaultPaymentMethod(res) {
    var viewData = res.getViewData();

    if (viewData.order && viewData.order.billing && viewData.order.billing.payment && viewData.order.billing.payment.selectedPaymentInstruments && viewData.order.billing.payment.selectedPaymentInstruments.length) {
        if (viewData.order.billing.payment.selectedPaymentInstruments.length === 1 && viewData.order.totals && !viewData.order.totals.grandTotalLessGiftCertificatePaymentInstrumentsValue) {
            //If gift certificate covers full amount and its the only payment instrument, select it
            viewData.selectedPaymentMethod = viewData.order.billing.payment.selectedPaymentInstruments[0].paymentMethod;
        } else {
            for (var pi of viewData.order.billing.payment.selectedPaymentInstruments) {
                if (pi.paymentMethod !== dw.order.PaymentInstrument.METHOD_GIFT_CERTIFICATE) {
                    // otherwise pick the first payment instrument that isn't a gift certificate
                    viewData.selectedPaymentMethod = pi.paymentMethod;
                }
            }
        }
    } else {
        //fallback to first ranked payment instrument (this will break if ApplePay is #1 and your browser can't use it as the payment tab will be invisible for example)
        if (viewData.order && viewData.order.billing && viewData.order.billing.payment && viewData.order.billing.payment.applicablePaymentMethods && viewData.order.billing.payment.applicablePaymentMethods.length) {
            viewData.selectedPaymentMethod = viewData.order.billing.payment.applicablePaymentMethods[0].ID;
        } else {
            viewData.selectedPaymentMethod = dw.order.PaymentInstrument.METHOD_CREDIT_CARD;
        }
    }
}

function copyBillingAddressToShippingAddress(shipment, billingAddress, shippingAddress) {
    Transaction.wrap(function () {
        shippingAddress = shipment.createShippingAddress();

        shippingAddress.setFirstName(billingAddress.getFirstName() || '');
        shippingAddress.setLastName(billingAddress.getLastName() || '');
        shippingAddress.setAddress1(billingAddress.getAddress1() || '');
        shippingAddress.setAddress2(billingAddress.getAddress2() || '');
        shippingAddress.setCity(billingAddress.getCity() || '');
        shippingAddress.setStateCode(billingAddress.getStateCode() || '');
        shippingAddress.setPostalCode(billingAddress.getPostalCode() || '');
        shippingAddress.setCountryCode(billingAddress.getCountryCode() || '');
        shippingAddress.setPhone(billingAddress.getPhone() || '');
        shippingAddress.setCompanyName(billingAddress.getCompanyName() || '');
        shippingAddress.setPostBox(billingAddress.getPostBox() || '');
    });
}

function ensureValidShipments(lineItemContainer) {
    var collections = require('*/cartridge/scripts/util/collections');

    var requiresShippingAddress = lineItemContainer.getProductLineItems().toArray().some(pli => 'itemType' in pli.custom && pli.custom.itemType.value !== 'digital');
    if (!requiresShippingAddress) {
        return true;
    }

    var shipments = lineItemContainer.shipments;
    var allValid = collections.every(shipments, function (shipment) {
        if (shipment) {
            var hasStoreID = shipment.custom && shipment.custom.fromStoreId;
            var storeAddress = true;
            if (shipment.shippingMethod && shipment.shippingMethod.custom && shipment.shippingMethod.custom.storePickupEnabled && !hasStoreID) {
                storeAddress = false;
            }
            var address = shipment.shippingAddress;
            return address && address.address1 && storeAddress;
        }
        return false;
    });
    return allValid;
}

function hideShipping(lineItemContainer) {
    var hideShipping = false;
    var hasDigitalProducts = lineItemContainer.getProductLineItems().toArray().every(pli => pli.product && 'itemType' in pli.product.custom && pli.product.custom.itemType.value === 'digital');
    var isGiftCertOnly = lineItemContainer.getGiftCertificateLineItems().size() > 0 && lineItemContainer.getProductLineItems().length === 0;

    if (hasDigitalProducts || isGiftCertOnly) {
        hideShipping = true;
    }

    return hideShipping;
}

module.exports = {
    createOrder: createOrder,
    reApplyGiftCertificatePaymentInstruments: reApplyGiftCertificatePaymentInstruments,
    applyGiftCertificateToBasket: applyGiftCertificateToBasket,
    removeGiftCertificatePaymentInstrument: removeGiftCertificatePaymentInstrument,
    calculatePaymentTransaction: calculatePaymentTransaction,
    clearPaymentInstrumentsExceptGiftCertificates: clearPaymentInstrumentsExceptGiftCertificates,
    validatePayment: validatePayment,
    removeRegularPaymentInstruments: removeRegularPaymentInstruments,
    selectDefaultPaymentMethod: selectDefaultPaymentMethod,
    copyBillingAddressToShippingAddress: copyBillingAddressToShippingAddress,
    ensureValidShipments: ensureValidShipments,
    hideShipping: hideShipping
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
