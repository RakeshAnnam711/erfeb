'use strict';

/**
 * ForterOrder class is the DTO object for request.
 *
 * To include this script use:
 * var ForterOrder = require('~/cartridge/scripts/lib/forter/dto/forterOrder');
 *
 * @param {Object} currentOrder - current order
 * @param {Object} request - current page request
 */

function ForterCustomer(order) {
    if (order.customer.profile != null) {
        var OrderMgr = require('dw/order/OrderMgr');
        this.firstName = order.customer.profile.firstName;
        this.lastName = order.customer.profile.lastName;
        this.email = order.customer.profile.email;
        this.accountId = order.customer.ID;
        this.created = Number((order.customer.profile.getCreationDate().getTime() / 1000).toFixed());

        var query = 'customerNo = {0} AND paymentStatus = {1}';
        var allOrders = OrderMgr.searchOrders(query, 'creationDate desc', order.customer.profile.customerNo, 2);

        this.pastOrdersCount = Number(allOrders.count);
    } else {
        this.firstName = order.billingAddress.firstName;
        this.lastName = order.billingAddress.lastName;
        this.email = order.customerEmail;
    }
}

function ForterPhone(phone) {
    this.phone = phone;
}

function ForterPayment(order, authorizePaymentResult, paymentInstrument, paymentProcessorID, log) {
    var billingAddress = order.billingAddress;

    this.billingDetails = {};
    this.billingDetails.personalDetails = {};
    this.billingDetails.personalDetails.firstName = billingAddress.firstName;
    this.billingDetails.personalDetails.lastName = billingAddress.lastName;
    this.billingDetails.personalDetails.email = order.customerEmail;

    this.billingDetails.address = {};
    this.billingDetails.address.address1 = billingAddress.address1;

    if (billingAddress.address2) {
        this.billingDetails.address.address2 = billingAddress.address2;
    } else {
        this.billingDetails.address.address2 = '';
    }

    this.billingDetails.address.zip = billingAddress.postalCode;
    this.billingDetails.address.city = billingAddress.city;
    this.billingDetails.address.region = billingAddress.stateCode;
    this.billingDetails.address.country = billingAddress.countryCode.value.toUpperCase();

    if (billingAddress.phone) {
        this.billingDetails.phone = [];
        this.billingDetails.phone.push(new ForterPhone(billingAddress.phone));
    }

    var HookManager = require('dw/system/HookMgr');
    var hookResult;
    if (HookManager.hasHook('forter.api.request.payment.' + paymentProcessorID)) {
        hookResult = HookManager.callHook('forter.api.request.payment.' + paymentProcessorID,
            'buildPaymentRequest',
            authorizePaymentResult,
            paymentInstrument,
            order
        );
    } else {
        log.error('Forter integration needs custom coding to support : ' + paymentProcessorID);
        hookResult = HookManager.callHook('forter.api.request.payment.default',
            'buildPaymentRequest',
            authorizePaymentResult,
            paymentInstrument,
            order
        );
    }

    if (hookResult) {
        var keys = Object.keys(hookResult);
        for (var key in keys) {
            this[keys[key]] = hookResult[keys[key]];
        }
    }
}

function ForterBeneficiaryDetailsFromGiftCard(item) {
    this.personalDetails = {};
    this.comments = {};

    this.personalDetails.fullName = item.recipientName;
    this.personalDetails.email = item.recipientEmail;
    this.comments.messageToBeneficiary = item.message ? item.message : '';
}

function ForterCartItem(item, itemType) {
    this.basicItemData = {};

    if (itemType === 'product') {
        this.basicItemData.productId = item.productID;     // Optional
        this.basicItemData.name = item.productName;        // Required
        this.basicItemData.quantity = item.quantityValue;  // Required

        var product = item.getProduct();
        if (product.getCategories().isEmpty() && product.getVariationModel()) {
            product = product.getVariationModel().getMaster();
        }

        var categoryDisplayName = '';
        if (product.getCategories()[0]) {
            categoryDisplayName = product.getCategories()[0].getDisplayName();
        }

        this.basicItemData.category = categoryDisplayName;
        this.basicItemData.type = 'TANGIBLE'; // Add if type is available. Change according to the actual item type

        // if any adjustements
        this.basicItemData.price = {};
        this.basicItemData.price.amountLocalCurrency = item.adjustedPrice.value.toFixed(2);
        this.basicItemData.price.currency = item.adjustedPrice.currencyCode.toString();
    }

    if (itemType === 'gift') {
        this.basicItemData.name = item.lineItemText;        // Required
        this.basicItemData.productId = 'GC';                // Helps with display issue on forter cloud admin side
        this.basicItemData.quantity = 1;                    // Required (set 1 by default for a gift cert?)
        this.basicItemData.type = 'NON_TANGIBLE';   // Add if type is available. Change according to the actual item type

        this.deliveryDetails = {};
        this.deliveryDetails.deliveryType = 'DIGITAL';
        this.deliveryDetails.deliveryMethod = 'email';

        this.basicItemData.price = {};
        this.basicItemData.price.amountLocalCurrency = item.price.value.toFixed(2);
        this.basicItemData.price.currency = item.price.currencyCode.toString();

        this.beneficiaries = [];
        this.beneficiaries.push(new ForterBeneficiaryDetailsFromGiftCard(item));
    }
}

function ForterOrder(currentOrder, request, authorizePaymentResult) {
    var ForterLogger = require('*/cartridge/scripts/lib/forter/forterLogger');
    var log = new ForterLogger('ForterOrder.js');
    var order = currentOrder;
    var shipment = null;
    var i;

    function ForterConnectionInformation(request) { // eslint-disable-line
        this.customerIP = request.httpRemoteAddress;                    // Required
        this.userAgent = request.httpUserAgent;
        this.forterTokenCookie = '';

        for (i = 0; i < request.httpCookies.cookieCount; i++) {
            if (request.httpCookies[i].name === 'forterToken') {
                this.forterTokenCookie = request.httpCookies[i].value;   // Required
            }
        }
    }

    // General parameters
    this.orderId = order.originalOrderNo;                                          // Required
    this.orderType = 'WEB';                                                        // Required
    this.timeSentToForter = (new Date()).getTime();                                // Required
    this.checkoutTime = Number((order.creationDate.getTime() / 1000).toFixed());   // Required //must be seconds, not milliseconds
    this.connectionInformation = new ForterConnectionInformation(request);         // Required

    // Calculate totals
    this.totalAmount = {};                                                         // Required
    this.totalAmount.amountLocalCurrency = order.totalGrossPrice.value.toFixed(2);
    this.totalAmount.currency = order.totalGrossPrice.currencyCode;

    // Discounts
    var discountPrice = 0;
    var couponName = '';


    if (!order.getCouponLineItems().isEmpty()) {
        var coupons = order.getCouponLineItems();
        var couponNames = [];

        for (i = 0; i < coupons.length; i++) { // UNIT
            var coup = coupons[i];
            couponNames.push(coup.getCouponCode());

            if (!coup.getPriceAdjustments().isEmpty()) {
                var coupAdjustments = coup.getPriceAdjustments();

                for (var j = 0; j < coupAdjustments.length; j++) { // UNIT
                    var coupAdj = coupAdjustments[j];
                    discountPrice += coupAdj.priceValue;
                }
            }
        }

        couponName = couponNames.join(',');
        discountPrice *= -1;

        if (discountPrice > 0) {
            this.totalDiscount = {};                         // Optional
            this.totalDiscount.couponCodeUsed = couponName.substring(0, 20); // Required
            this.totalDiscount.couponDiscountAmount = {};                         // Required
            this.totalDiscount.couponDiscountAmount.amountLocalCurrency = discountPrice.toFixed(2);
            this.totalDiscount.couponDiscountAmount.currency = order.currencyCode;
            this.totalDiscount.discountType = 'COUPON';                   // Required
        }
    }

    // Customer's details
    this.accountOwner = new ForterCustomer(order);

    // Cart items (regular product)
    this.cartItems = []; // Required

    for (i = 0; i < order.productLineItems.length; i++) { // UNIT
        var pli = order.productLineItems[i];
        this.cartItems.push(new ForterCartItem(pli, 'product'));
    }

    // Cart items (gift certificate)
    for (i = 0; i < order.giftCertificateLineItems.length; i++) { // UNIT
        var gcli = order.giftCertificateLineItems[i];
        this.cartItems.push(new ForterCartItem(gcli, 'gift'));
    }

    // Payments
    var PaymentManager = require('dw/order/PaymentMgr');
    this.payment = []; // Required
    for (var i in order.paymentInstruments) {
        var paymentInstrument = order.paymentInstruments[i];
        var paymentProcessorID = PaymentManager.getPaymentMethod(paymentInstrument.paymentMethod).paymentProcessor.ID.toLowerCase();

        this.payment.push(new ForterPayment(order, authorizePaymentResult[paymentProcessorID], paymentInstrument, paymentProcessorID, log));
    }

    // Delivery and Recipient (shipping information)
    if (order.shipments.length > 0) {
        shipment = order.shipments[0];

        this.primaryDeliveryDetails = {};
        this.primaryDeliveryDetails.deliveryPrice = {};
        this.primaryDeliveryDetails.deliveryMethod = (shipment.getShippingMethod() && shipment.getShippingMethod().getDisplayName()) ? shipment.getShippingMethod().getDisplayName() : ''; // 'BY AIR';

        var deliveryType = 'PHYSICAL'; // default value
        if (order.getProductLineItems().size() > 0 && order.getGiftCertificateLineItems().size() === 0) {
            deliveryType = 'PHYSICAL'; // if real products only
        } else if (order.getProductLineItems().size() === 0 && order.getGiftCertificateLineItems().size() > 0) {
            deliveryType = 'DIGITAL';  // if gift certificates only
            this.primaryDeliveryDetails.deliveryMethod = 'email';
        } else if (order.getProductLineItems().size() > 0 && order.getGiftCertificateLineItems().size() > 0) {
            deliveryType = 'HYBRID';  // if gift certificates and real products
        }
        this.primaryDeliveryDetails.deliveryType = deliveryType;

        this.primaryDeliveryDetails.deliveryPrice.amountLocalCurrency = shipment.adjustedShippingTotalPrice.value.toFixed(2);
        this.primaryDeliveryDetails.deliveryPrice.currency = shipment.adjustedShippingTotalPrice.currencyCode.toString();

        if (shipment.productLineItems.size() > 0) {
            this.primaryRecipient = {};                 // Optional
            this.primaryRecipient.personalDetails = {};

            this.primaryRecipient.personalDetails.firstName = shipment.shippingAddress.firstName; // from the shipping address
            this.primaryRecipient.personalDetails.lastName = shipment.shippingAddress.lastName;  // from the shipping address

            this.primaryRecipient.address = {};
            this.primaryRecipient.address.address1 = shipment.shippingAddress.address1;
            this.primaryRecipient.address.address2 = shipment.shippingAddress.address2 ? shipment.shippingAddress.address2 : '';
            this.primaryRecipient.address.zip = shipment.shippingAddress.postalCode;
            this.primaryRecipient.address.city = shipment.shippingAddress.city;
            this.primaryRecipient.address.region = shipment.shippingAddress.stateCode;
            this.primaryRecipient.address.country = shipment.shippingAddress.countryCode.value.toUpperCase();

            this.primaryRecipient.phone = [];

            if (shipment.shippingAddress.phone) {
                this.primaryRecipient.phone.push(new ForterPhone(shipment.shippingAddress.phone));
            }
        } else if (shipment.giftCertificateLineItems.size() > 0) {
            this.primaryRecipient = {};     // Optional
            this.primaryRecipient.personalDetails = {};

            this.primaryRecipient.personalDetails.fullName = shipment.giftCertificateLineItems[0].recipientName;  // from the gift form
            this.primaryRecipient.personalDetails.email = shipment.giftCertificateLineItems[0].recipientEmail; // from the gift form
        }

        if (shipment.gift === true) {
            this.primaryRecipient.comments = {};
            this.primaryRecipient.comments.messageToBeneficiary = shipment.giftMessage ? shipment.giftMessage : '';
        }
    }
}

module.exports = ForterOrder;
