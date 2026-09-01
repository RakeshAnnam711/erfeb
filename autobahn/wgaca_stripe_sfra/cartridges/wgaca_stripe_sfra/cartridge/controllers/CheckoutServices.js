'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.extend(module.superModule);

function getValueOrEmpty(value) {
    if (value === null || value === undefined) {
        return '';
    }

    var normalized = String(value).trim();
    var lowered = normalized.toLowerCase();

    if (!normalized || lowered === 'undefined' || lowered === 'null') {
        return '';
    }

    return normalized;
}

/**
 * True when basket has a Stripe processor payment instrument (STRIPE_APM / STRIPE_CREDIT).
 * @param {dw.order.Basket} basket
 * @returns {boolean}
 */
function basketHasStripeProcessorPaymentInstrument(basket) {
    if (!basket) {
        return false;
    }

    var PaymentMgr = require('dw/order/PaymentMgr');
    var collections = require('*/cartridge/scripts/util/collections');
    var hasStripeProcessor = false;

    collections.forEach(basket.getPaymentInstruments(), function (paymentInstrument) {
        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
        var paymentProcessor = paymentMethod && paymentMethod.getPaymentProcessor();

        if (paymentProcessor && (paymentProcessor.ID === 'STRIPE_APM' || paymentProcessor.ID === 'STRIPE_CREDIT')) {
            hasStripeProcessor = true;
        }
    });

    return hasStripeProcessor;
}

function splitFullName(fullName) {
    var parts = getValueOrEmpty(fullName).split(/\s+/).filter(Boolean);

    if (!parts.length) {
        return {
            firstName: '',
            lastName: ''
        };
    }

    if (parts.length === 1) {
        return {
            firstName: parts[0],
            lastName: ''
        };
    }

    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' ')
    };
}

function getShippingData(currentBasket) {
    var shipping = currentBasket.defaultShipment && currentBasket.defaultShipment.shippingAddress;

    if (!shipping) {
        return null;
    }

    return {
        firstName: getValueOrEmpty(shipping.firstName),
        lastName: getValueOrEmpty(shipping.lastName),
        address1: getValueOrEmpty(shipping.address1),
        address2: getValueOrEmpty(shipping.address2),
        city: getValueOrEmpty(shipping.city),
        stateCode: getValueOrEmpty(shipping.stateCode),
        postalCode: getValueOrEmpty(shipping.postalCode),
        countryCode: getValueOrEmpty(shipping.countryCode && shipping.countryCode.value),
        phone: getValueOrEmpty(shipping.phone)
    };
}

function readCountryCode(value) {
    if (value && typeof value === 'object') {
        return getValueOrEmpty(value.value || value.countryCode || value.country_code);
    }

    return getValueOrEmpty(value);
}

function normalizePhone(value) {
    if (typeof value === 'string') {
        return getValueOrEmpty(value);
    }

    if (!value || typeof value !== 'object') {
        return '';
    }

    var countryCode = getValueOrEmpty(value.country_code || value.countryCode);
    var nationalNumber = getValueOrEmpty(value.national_number || value.nationalNumber);
    var directNumber = getValueOrEmpty(value.phone || value.phoneNumber || value.value);

    if (directNumber) {
        return directNumber;
    }

    if (countryCode && nationalNumber) {
        return ['+', countryCode, nationalNumber].join('');
    }

    return nationalNumber;
}

function getFallbackPhone(currentBasket) {
    var shipping = currentBasket.defaultShipment && currentBasket.defaultShipment.shippingAddress;

    if (shipping && getValueOrEmpty(shipping.phone)) {
        return getValueOrEmpty(shipping.phone);
    }

    if (customer && customer.profile) {
        var profilePhone = getValueOrEmpty(customer.profile.phoneHome || customer.profile.phone);
        if (profilePhone) {
            return profilePhone;
        }
    }

    return '';
}

function buildBillingDataFromSource(source, shippingData) {
    var sourceAddress = source && source.address ? source.address : source;
    var sourceName = source && source.name ? source.name : source;
    var fullName = splitFullName(sourceName && sourceName.full_name);
    var phoneObj = source && source.phone && source.phone.phone_number
        ? source.phone.phone_number
        : (source && source.phone_number ? source.phone_number : source);

    var billingData = {
        firstName: getValueOrEmpty(sourceName && (sourceName.given_name || sourceName.firstName)) || fullName.firstName,
        lastName: getValueOrEmpty(sourceName && (sourceName.surname || sourceName.lastName)) || fullName.lastName,
        address1: getValueOrEmpty(sourceAddress && (sourceAddress.address_line_1 || sourceAddress.line1 || sourceAddress.address1)),
        address2: getValueOrEmpty(sourceAddress && (sourceAddress.address_line_2 || sourceAddress.line2 || sourceAddress.address2)),
        city: getValueOrEmpty(sourceAddress && (sourceAddress.admin_area_2 || sourceAddress.city)),
        stateCode: getValueOrEmpty(sourceAddress && (sourceAddress.admin_area_1 || sourceAddress.stateCode || sourceAddress.state)),
        postalCode: getValueOrEmpty(sourceAddress && (sourceAddress.postal_code || sourceAddress.postalCode)),
        countryCode: readCountryCode(sourceAddress && (sourceAddress.country_code || sourceAddress.countryCode)),
        phone: normalizePhone(phoneObj)
    };

    if (shippingData) {
        billingData.firstName = billingData.firstName || shippingData.firstName;
        billingData.lastName = billingData.lastName || shippingData.lastName;
        billingData.address1 = billingData.address1 || shippingData.address1;
        billingData.address2 = billingData.address2 || shippingData.address2;
        billingData.city = billingData.city || shippingData.city;
        billingData.stateCode = billingData.stateCode || shippingData.stateCode;
        billingData.postalCode = billingData.postalCode || shippingData.postalCode;
        billingData.countryCode = billingData.countryCode || shippingData.countryCode;
        billingData.phone = billingData.phone || shippingData.phone;
    }

    return billingData;
}

function isCompleteBillingData(data) {
    return data
        && data.firstName
        && data.lastName
        && data.address1
        && data.city
        && data.postalCode
        && data.stateCode
        && data.countryCode;
}

function setBillingAddress(currentBasket, billingData) {
    var Transaction = require('dw/system/Transaction');

    Transaction.wrap(function () {
        var billing = currentBasket.billingAddress || currentBasket.createBillingAddress();

        billing.setFirstName(getValueOrEmpty(billingData.firstName));
        billing.setLastName(getValueOrEmpty(billingData.lastName));
        billing.setAddress1(getValueOrEmpty(billingData.address1));
        billing.setAddress2(getValueOrEmpty(billingData.address2));
        billing.setCity(getValueOrEmpty(billingData.city));
        billing.setPostalCode(getValueOrEmpty(billingData.postalCode));
        billing.setStateCode(getValueOrEmpty(billingData.stateCode));
        billing.setCountryCode(getValueOrEmpty(billingData.countryCode));
        billing.setPhone(getValueOrEmpty(billingData.phone));
    });
}

function hasBillingAddress(billingAddress) {
    return billingAddress
        && billingAddress.address1
        && billingAddress.city
        && billingAddress.postalCode
        && billingAddress.stateCode
        && billingAddress.countryCode;
}

function applyShippingAsBillingFallback(currentBasket) {
    var shippingData = getShippingData(currentBasket);

    if (!shippingData) {
        return;
    }

    setBillingAddress(currentBasket, shippingData);
}

function hydratePayPalBillingAddress(currentBasket, paypalPaymentInstrument) {
    var paypalApi = require('*/cartridge/scripts/paypal/api');
    var paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
    var shippingData = getShippingData(currentBasket);
    var fallbackPhone = getFallbackPhone(currentBasket);

    try {
        var hasPayPalOrderId = paypalPaymentInstrument
            && paypalPaymentInstrument.custom
            && getValueOrEmpty(paypalPaymentInstrument.custom.paypalOrderID);
        var orderDetails = hasPayPalOrderId ? paypalApi.getOrderDetails(paypalPaymentInstrument) : null;

        if (orderDetails && !orderDetails.err) {
            var payer = paypalHelper.getBillingAddressFromPaymentSource(orderDetails);
            var billingFromPayer = buildBillingDataFromSource(payer, shippingData);
            billingFromPayer.phone = billingFromPayer.phone || fallbackPhone;

            if (isCompleteBillingData(billingFromPayer)) {
                setBillingAddress(currentBasket, billingFromPayer);
                return;
            }
        }
    } catch (e) {
        // Continue to local fallback paths.
    }

    try {
        var billingFromPI = paypalPaymentInstrument.custom
            && paypalPaymentInstrument.custom.paypalBillingAddress
            ? JSON.parse(paypalPaymentInstrument.custom.paypalBillingAddress)
            : null;
        var normalizedFromPI = buildBillingDataFromSource(billingFromPI, shippingData);
        normalizedFromPI.phone = normalizedFromPI.phone || fallbackPhone;

        if (isCompleteBillingData(normalizedFromPI)) {
            setBillingAddress(currentBasket, normalizedFromPI);
            return;
        }
    } catch (e) {
        // Continue to shipping fallback.
    }

    applyShippingAsBillingFallback(currentBasket);
}

function getCheckoutEmailFromContext(req, currentBasket) {
    return getValueOrEmpty(req.form.dwfrm_billing_contactInfoFields_email)
        || getValueOrEmpty(req.form.dwfrm_billing_email)
        || getValueOrEmpty(req.form.dwfrm_singleshipping_shippingAddress_addressFields_email)
        || getValueOrEmpty(req.form.dwfrm_shipping_shippingAddress_addressFields_email)
        || getValueOrEmpty(req.form.email)
        || getValueOrEmpty(currentBasket && currentBasket.customerEmail)
        || getValueOrEmpty(req.currentCustomer && req.currentCustomer.profile && req.currentCustomer.profile.email)
        || getValueOrEmpty(customer && customer.profile && customer.profile.email);
}

function getCheckoutPhoneFromContext(req, currentBasket) {
    var shipping = currentBasket && currentBasket.defaultShipment && currentBasket.defaultShipment.shippingAddress;

    return getValueOrEmpty(req.form.dwfrm_billing_contactInfoFields_phone)
        || getValueOrEmpty(req.form.dwfrm_billing_addressFields_phone)
        || getValueOrEmpty(req.form.dwfrm_singleshipping_shippingAddress_addressFields_phone)
        || getValueOrEmpty(req.form.dwfrm_shipping_shippingAddress_addressFields_phone)
        || getValueOrEmpty(shipping && shipping.phone)
        || getValueOrEmpty(req.currentCustomer && req.currentCustomer.profile && (req.currentCustomer.profile.phoneHome || req.currentCustomer.profile.phone))
        || getValueOrEmpty(customer && customer.profile && (customer.profile.phoneHome || customer.profile.phone));
}

function getSavedStripeSourceId(req, billingForm) {
    return getValueOrEmpty(req.form.saved_card_id)
        || getValueOrEmpty(req.form.dwfrm_billing_creditCardFields_selectedCardID)
        || getValueOrEmpty(req.form.stripe_source_id)
        || getValueOrEmpty(req.form.dwfrm_billing_stripe_source_id)
        || getValueOrEmpty(billingForm
            && billingForm.creditCardFields
            && billingForm.creditCardFields.selectedCardID
            && billingForm.creditCardFields.selectedCardID.value);
}

server.prepend('SubmitPayment', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Locale = require('dw/util/Locale');
    var OrderModel = require('*/cartridge/models/order');
    var paypalConstants = require('*/cartridge/config/constants');
    var paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');
    var currentBasket = BasketMgr.currentBasket || BasketMgr.getCurrentBasket();
    var billingForm = server.forms.getForm('billing');

    if (!currentBasket) {
        return next();
    }

    var paypalPaymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(currentBasket);

    if (paypalPaymentInstrument) {
        var initialViewData = res.getViewData() || {};

        if (!initialViewData.order || typeof initialViewData.order !== 'object') {
            var initialUsingMultiShipping = req.session.privacyCache.get('usingMultiShipping');

            if (initialUsingMultiShipping === true && currentBasket.shipments.length < 2) {
                req.session.privacyCache.set('usingMultiShipping', false);
                initialUsingMultiShipping = false;
            }

            var initialLocale = Locale.getLocale(req.locale.id);

            initialViewData.order = new OrderModel(currentBasket, {
                usingMultiShipping: initialUsingMultiShipping,
                countryCode: initialLocale.country,
                containerView: 'basket'
            });

            res.setViewData(initialViewData);
        }

    }

    this.on('route:BeforeComplete', function (_, response) {
        var viewData = response.getViewData() || {};
        paypalPaymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(currentBasket);

        if (!paypalPaymentInstrument) {
            return;
        }

        if (!viewData.order || typeof viewData.order !== 'object') {
            var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');

            if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                req.session.privacyCache.set('usingMultiShipping', false);
                usingMultiShipping = false;
            }

            var currentLocale = Locale.getLocale(req.locale.id);

            viewData.order = new OrderModel(currentBasket, {
                usingMultiShipping: usingMultiShipping,
                countryCode: currentLocale.country,
                containerView: 'basket'
            });
            response.setViewData(viewData);
        }

    });

    var email = getCheckoutEmailFromContext(req, currentBasket);

    if (email && !getValueOrEmpty(req.form.dwfrm_billing_contactInfoFields_email)) {
        req.form.dwfrm_billing_contactInfoFields_email = email;
    }

    if (
        billingForm
        && billingForm.contactInfoFields
        && billingForm.contactInfoFields.email
        && email
        && !getValueOrEmpty(billingForm.contactInfoFields.email.value)
    ) {
        billingForm.contactInfoFields.email.value = email;
    }

    var phone = getCheckoutPhoneFromContext(req, currentBasket);

    if (phone) {
        if (!getValueOrEmpty(req.form.dwfrm_billing_contactInfoFields_phone)) {
            req.form.dwfrm_billing_contactInfoFields_phone = phone;
        }

        if (
            billingForm
            && billingForm.contactInfoFields
            && billingForm.contactInfoFields.phone
            && !getValueOrEmpty(billingForm.contactInfoFields.phone.value)
        ) {
            billingForm.contactInfoFields.phone.value = phone;
        }

        if (!getValueOrEmpty(req.form.dwfrm_billing_addressFields_phone)) {
            req.form.dwfrm_billing_addressFields_phone = phone;
        }

        if (
            billingForm
            && billingForm.addressFields
            && billingForm.addressFields.phone
            && !getValueOrEmpty(billingForm.addressFields.phone.value)
        ) {
            billingForm.addressFields.phone.value = phone;
        }
    }

    var paymentMethod = getValueOrEmpty(req.form.dwfrm_billing_paymentMethod)
        || getValueOrEmpty(req.form.paymentMethod)
        || getValueOrEmpty(req.form.selectedPaymentOption)
        || getValueOrEmpty(billingForm && billingForm.paymentMethod && billingForm.paymentMethod.value);

    var savedPaypalAccount = getValueOrEmpty(req.form.restPaypalAccountsList)
        || getValueOrEmpty(req.form.dwfrm_billing_paypal_restPaypalAccountsList);
    var paypalUsedPaymentMethod = getValueOrEmpty(req.form.dwfrm_billing_paypal_usedPaymentMethod)
        || getValueOrEmpty(req.form.paypal_usedPaymentMethod)
        || getValueOrEmpty(billingForm
            && billingForm.paypal
            && billingForm.paypal.usedPaymentMethod
            && billingForm.paypal.usedPaymentMethod.value);
    var paypalUsedPaymentMethodLower = paypalUsedPaymentMethod.toLowerCase();
    var isPayPalUsedPaymentMethod = paypalUsedPaymentMethodLower === paypalConstants.PAYMENT_METHOD_ID_PAYPAL.toLowerCase()
        || paypalUsedPaymentMethodLower === paypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD.toLowerCase()
        || paypalUsedPaymentMethodLower === paypalConstants.PAYMENT_METHOD_ID_VENMO.toLowerCase()
        || paypalUsedPaymentMethodLower.indexOf('paypal') > -1
        || paypalUsedPaymentMethodLower.indexOf('venmo') > -1;
    var isPaypalCreditSubmission = paypalUsedPaymentMethod === paypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD
        || paymentMethod === paypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD;
    var isPaypalSubmission = isPayPalUsedPaymentMethod
        || (savedPaypalAccount && savedPaypalAccount !== 'newaccount')
        || paymentMethod === paypalConstants.PAYMENT_METHOD_ID_PAYPAL
        || paymentMethod === paypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD
        || (paymentMethod && paymentMethod.toUpperCase() === 'PAYPAL');

    if (isPaypalCreditSubmission) {
        paymentMethod = paypalConstants.PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD;
    } else if (isPaypalSubmission) {
        paymentMethod = paypalConstants.PAYMENT_METHOD_ID_PAYPAL;
    }

    if (savedPaypalAccount && savedPaypalAccount !== 'newaccount') {
        paymentMethod = paypalConstants.PAYMENT_METHOD_ID_PAYPAL;
    }

    if (paymentMethod && (isPaypalSubmission || !getValueOrEmpty(req.form.dwfrm_billing_paymentMethod))) {
        req.form.dwfrm_billing_paymentMethod = paymentMethod;
    }

    if (paymentMethod && (isPaypalSubmission || !getValueOrEmpty(req.form.paymentMethod))) {
        req.form.paymentMethod = paymentMethod;
    }

    if (
        billingForm
        && billingForm.paymentMethod
        && paymentMethod
        && (isPaypalSubmission || !getValueOrEmpty(billingForm.paymentMethod.value))
    ) {
        billingForm.paymentMethod.value = paymentMethod;
    }

    if (paymentMethod === 'CREDIT_CARD') {
        var savedSourceId = getSavedStripeSourceId(req, billingForm);

        if (savedSourceId) {
            // Handle() reads request.httpParameterMap, which is not updated when we
            // write req.form — stash for stripeCreditHelper overlay fallback.
            session.privacy.stripeCheckoutSourceId = savedSourceId;

            req.form.stripe_source_id = savedSourceId;
            req.form.dwfrm_billing_stripe_source_id = savedSourceId;
            req.form.saved_card_id = savedSourceId;
            req.form.selectedCardID = savedSourceId;
            req.form.dwfrm_billing_creditCardFields_selectedCardID = savedSourceId;
            req.form.dwfrm_billing_creditCardFields_paymentMethod = paymentMethod;

            if (
                billingForm
                && billingForm.creditCardFields
                && billingForm.creditCardFields.selectedCardID
            ) {
                billingForm.creditCardFields.selectedCardID.value = savedSourceId;
            }

            if (
                billingForm
                && billingForm.creditCardFields
                && billingForm.creditCardFields.paymentMethod
                && !getValueOrEmpty(billingForm.creditCardFields.paymentMethod.value)
            ) {
                billingForm.creditCardFields.paymentMethod.value = paymentMethod;
            }
        }
    } else if (session.privacy.stripeCheckoutSourceId) {
        delete session.privacy.stripeCheckoutSourceId;
    }

    if (savedPaypalAccount && savedPaypalAccount !== 'newaccount') {
        req.form.dwfrm_billing_paymentMethod = paypalConstants.PAYMENT_METHOD_ID_PAYPAL;
        req.form.paymentMethod = paypalConstants.PAYMENT_METHOD_ID_PAYPAL;
        req.form.dwfrm_billing_paypal_usedPaymentMethod = paypalConstants.PAYMENT_METHOD_ID_PAYPAL;
        req.form.dwfrm_billing_paypal_paypalActiveAccount = savedPaypalAccount;

        if (billingForm && billingForm.paymentMethod) {
            billingForm.paymentMethod.value = paypalConstants.PAYMENT_METHOD_ID_PAYPAL;
        }

        if (billingForm
            && billingForm.paypal
            && billingForm.paypal.usedPaymentMethod
        ) {
            billingForm.paypal.usedPaymentMethod.value = paypalConstants.PAYMENT_METHOD_ID_PAYPAL;
        }

        if (billingForm
            && billingForm.paypal
            && billingForm.paypal.paypalActiveAccount
        ) {
            billingForm.paypal.paypalActiveAccount.value = savedPaypalAccount;
        }
    }

    return next();
});

/**
 * Ensure billing is restored right after PayPal returns on the payment step.
 */
server.append('SubmitPayment', function (req, res, next) {
    this.on('route:BeforeComplete', function () {
        var BasketMgr = require('dw/order/BasketMgr');
        var Locale = require('dw/util/Locale');
        var OrderModel = require('*/cartridge/models/order');
        var paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');

        var currentBasket = BasketMgr.currentBasket || BasketMgr.getCurrentBasket();
        var viewData = res.getViewData() || {};
        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');

        if (!currentBasket) {
            return;
        }

        var paypalPaymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(currentBasket);

        if (!paypalPaymentInstrument) {
            return;
        }

        if (!viewData.order || typeof viewData.order !== 'object') {
            if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                req.session.privacyCache.set('usingMultiShipping', false);
                usingMultiShipping = false;
            }

            var currentLocale = Locale.getLocale(req.locale.id);

            viewData.order = new OrderModel(currentBasket, {
                usingMultiShipping: usingMultiShipping,
                countryCode: currentLocale.country,
                containerView: 'basket'
            });
            res.setViewData(viewData);
        }

        if (hasBillingAddress(currentBasket.billingAddress)) {
            return;
        }

        hydratePayPalBillingAddress(currentBasket, paypalPaymentInstrument);

        // Rebuild order model after hydration so billing summary reflects freshly populated address.
        if (hasBillingAddress(currentBasket.billingAddress)) {
            if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                req.session.privacyCache.set('usingMultiShipping', false);
                usingMultiShipping = false;
            }

            var hydratedLocale = Locale.getLocale(req.locale.id);

            viewData.order = new OrderModel(currentBasket, {
                usingMultiShipping: usingMultiShipping,
                countryCode: hydratedLocale.country,
                containerView: 'basket'
            });

            res.setViewData(viewData);
        }
    });

    return next();
});

/**
 * Stripe Payment Element / card checkout must use dedicated submit-order endpoints
 * (StripePaymentsAPM-PaymentElementSubmitOrder / StripePaymentsCard-CardPaymentSubmitOrder).
 *
 * Ghost-order case: Stripe PI still on basket, shopper switched to PayPal without submitting
 * PayPal, then hits PlaceOrder. app_stripe_sfra would create CREATED/STRIPE_APM with no PI.
 *
 * Rules:
 * - PayPal PI + Stripe PI: strip Stripe, continue with PayPal.
 * - Gift cert covers remaining balance (non-GC amount == 0): strip Stripe, continue GC-only.
 * - Otherwise: do NOT strip Stripe and block PlaceOrder. Blind strip left GC-only baskets
 *   that still owed money and let confirmation succeed without charging Stripe.
 */
server.prepend('PlaceOrder', function (req, res, next) {
    var stripeHelper = require('*/cartridge/scripts/stripe/helpers/stripeHelper');

    if (!stripeHelper.isStripeEnabled()) {
        return next();
    }

    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var checkoutHelper = require('*/cartridge/scripts/stripe/helpers/checkoutHelper');
    var paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket || !basketHasStripeProcessorPaymentInstrument(currentBasket)) {
        return next();
    }

    var paypalPaymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(currentBasket);
    if (paypalPaymentInstrument) {
        Transaction.wrap(function () {
            checkoutHelper.removeStripePaymentInstruments(currentBasket);
        });
        return next();
    }

    var nonGiftAmount = checkoutHelper.getNonGiftCertificateAmount(currentBasket);
    if (nonGiftAmount && nonGiftAmount.value === 0) {
        // Full GC coverage — Stripe PI is stale; safe to drop and place GC-only order.
        Transaction.wrap(function () {
            checkoutHelper.removeStripePaymentInstruments(currentBasket);
        });
        return next();
    }

    // Stripe balance still owed — PlaceOrder must not run (and must not strip Stripe).
    res.json({
        error: true,
        errorStage: {
            stage: 'payment',
            step: 'paymentInstrument'
        },
        errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
    });

    this.emit('route:Complete', req, res);
    return null;
});

/**
 * Block PlaceOrder when a balance remains after gift certificates but no non-GC
 * payment instrument exists (prevents GC-only confirmation for partial redemption).
 */
server.prepend('PlaceOrder', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Resource = require('dw/web/Resource');
    var collections = require('*/cartridge/scripts/util/collections');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        return next();
    }

    var checkoutHelper;
    try {
        checkoutHelper = require('*/cartridge/scripts/stripe/helpers/checkoutHelper');
    } catch (e) {
        return next();
    }

    if (!checkoutHelper || typeof checkoutHelper.getNonGiftCertificateAmount !== 'function') {
        return next();
    }

    var nonGiftAmount = checkoutHelper.getNonGiftCertificateAmount(currentBasket);
    if (!nonGiftAmount || nonGiftAmount.value <= 0) {
        return next();
    }

    var hasNonGiftPaymentInstrument = false;
    collections.forEach(currentBasket.getPaymentInstruments(), function (paymentInstrument) {
        if (paymentInstrument.paymentMethod !== PaymentInstrument.METHOD_GIFT_CERTIFICATE) {
            hasNonGiftPaymentInstrument = true;
        }
    });

    if (hasNonGiftPaymentInstrument) {
        return next();
    }

    res.json({
        error: true,
        errorStage: {
            stage: 'payment',
            step: 'paymentInstrument'
        },
        errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
    });

    this.emit('route:Complete', req, res);
    return null;
});

/**
 * Clears Stripe payment instruments when shopper leaves Stripe payment tabs.
 */
server.post('ClearStripePaymentInstruments', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var checkoutHelper = require('*/cartridge/scripts/stripe/helpers/checkoutHelper');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket && basketHasStripeProcessorPaymentInstrument(currentBasket)) {
        Transaction.wrap(function () {
            checkoutHelper.removeStripePaymentInstruments(currentBasket);
        });
    }

    res.json({ success: true });
    return next();
});

/**
 * Ensures PayPal orders always have a billing address before order creation.
 */
server.prepend('PlaceOrder', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');

    var currentBasket = BasketMgr.currentBasket;

    if (!currentBasket) {
        return next();
    }

    var paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');
    var paypalPaymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(currentBasket);

    if (!paypalPaymentInstrument) {
        return next();
    }

    if (hasBillingAddress(currentBasket.billingAddress)) {
        return next();
    }

    hydratePayPalBillingAddress(currentBasket, paypalPaymentInstrument);

    return next();
});

server.append('PlaceOrder', function (req, res, next) {
    this.on('route:BeforeComplete', function () {
        var viewData = res.getViewData() || {};

        if (viewData.error || !viewData.orderID) {
            return;
        }

        var OrderMgr = require('dw/order/OrderMgr');
        var Transaction = require('dw/system/Transaction');
        var order = OrderMgr.getOrder(viewData.orderID);

        if (!order) {
            return;
        }

        Transaction.wrap(function () {
            order.addNote('OMS Dispatch', 'Order placed successfully. Existing OMS integration flow invoked.');
        });
    });

    return next();
});

module.exports = server.exports();
