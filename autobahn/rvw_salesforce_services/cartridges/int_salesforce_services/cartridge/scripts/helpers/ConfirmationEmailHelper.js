'use strict';

var logger = require('dw/system/Logger');

/* ***** Public Method declarations ***** */
exports.createOrderPayload = createOrderPayload;

/* ***** Public Functions definitions ***** */
/**
 * Creates a payload object with all data needed by the MarketingCloud orderConfirmation email template
 *
 * @param {dw.order.Order} order
 * @returns {Object} payload - An object that holds all fields needed for email template
 */
 function createOrderPayload(order, locale) {
	var payload = {};

	// Getting Data for Shipment
	if (order.shipments.length > 0) {
		// Fetch Shipping and Billing Information
		prepareShippingAndBilling(payload, order);

		// Fetch Product Line Items
		prepareProductData(payload, order);

		// Fetch Payment Info
		preparePaymentInfo(payload, order, locale);

		// Fetch Cost Totals
		preparePricingInfo(payload, order, locale);

		// Fetch Generic Info
		prepareGenericData(payload, order)
	}

	return payload;
}

/* ***** Private (Support) Functions ***** */
/**
 * Prepares all shipping and billing information needed for payload
 * @param {Object} payload - Payload passed by createOrderPayload
 * @param {dw.order.Order} order - The current user's order
 */
function prepareShippingAndBilling(payload, order) {

	// Billing Address
	payload['BillingAddressFirstName'] = (order.billingAddress.firstName) ? order.billingAddress.firstName : '';
	payload['BillingAddressLastName'] = (order.billingAddress.lastName) ? order.billingAddress.lastName : '';
	payload['BillingAddressAddress1'] = (order.billingAddress.address1) ? order.billingAddress.address1 : '';
	payload['BillingAddressAddress2'] = (order.billingAddress.address2) ? order.billingAddress.address2 : '';
	payload['BillingAddressCity'] = (order.billingAddress.city) ? order.billingAddress.city : '';
	payload['BillingAddressZip'] = (order.billingAddress.postalCode) ? order.billingAddress.postalCode : '';
	payload['BillingAddressState'] = (order.billingAddress.stateCode) ? order.billingAddress.stateCode : '';
	payload['BillingAddressProvince'] = payload.BillingAddressState;
	payload['BillingAddressCountry'] = (order.billingAddress.countryCode.value) ? order.billingAddress.countryCode.value : '';
	payload['BillingAddressName'] = payload.BillingAddressFirstName + " " + payload.BillingAddressLastName;
	payload['BillingAddressStreet'] = payload.BillingAddressAddress1;
	payload['BillingAddressCompany'] = '';

	// Shipping Address
	payload['ShippingAddressFirstName'] = (order.shipments[0].shippingAddress.firstName) ? order.shipments[0].shippingAddress.firstName : '';
	payload['ShippingAddressLastName'] = (order.shipments[0].shippingAddress.lastName) ? order.shipments[0].shippingAddress.lastName : '';
	payload['ShippingAddress1'] = (order.shipments[0].shippingAddress.address1) ? order.shipments[0].shippingAddress.address1 : '';
	payload['ShippingAddress2'] = (order.shipments[0].shippingAddress.address2) ? order.shipments[0].shippingAddress.address2 : '';
	payload['ShippingAddressCity'] = (order.shipments[0].shippingAddress.city) ? order.shipments[0].shippingAddress.city : '';
	payload['ShippingAddressZip'] = (order.shipments[0].shippingAddress.postalCode) ? order.shipments[0].shippingAddress.postalCode : '';
	payload['ShippingAddressState'] = (order.shipments[0].shippingAddress.stateCode) ? order.shipments[0].shippingAddress.stateCode : '';
	payload['ShippingAddressCountry'] = (order.shipments[0].shippingAddress.countryCode.value) ? order.shipments[0].shippingAddress.countryCode.value : '';
	payload['ShippingAddressPhone'] = (order.shipments[0].shippingAddress.phone) ? order.shipments[0].shippingAddress.phone : '';
	payload['ShippingAddressName'] = payload.ShippingAddressFirstName + " " + payload.ShippingAddressLastName;
	payload['ShippingAddressCompany'] = '';
	payload['ShippingType'] = (order.shipments[0].shippingMethod && order.shipments[0].shippingMethod.displayName) ? order.shipments[0].shippingMethod.displayName : '';
	payload['ShippingMethod'] = payload.ShippingType;
	payload['ShippingAddressStreet'] = payload.ShippingAddress1;
}

/**
 * Prepares all product data needed for payload
 * @param {Object} payload - Payload passed by createOrderPayload
 * @param {dw.order.Order} order - The current user's order
 */
function prepareProductData(payload, order) {
	var productMgr = require('dw/catalog/ProductMgr');
	var URLUtils = require('dw/web/URLUtils');
	var ImageModel = require('*/cartridge/models/product/productImages');

	// Product Details
	var productLineItems = order.shipments[0].productLineItems;
	var productLineItem = {};
	var productLineItemsArray = [];
	var items = [];
	var itemPrimaryCategories = [];
	var itemCategories = [];

	for (var index in productLineItems) {
		productLineItem = productLineItems[index];
		var prdUrl = URLUtils.https('Product-Show', 'pid', productLineItem.productID).toString();
		var replenishment = false;
		var priceString = '';
		var basePrice = '';
		var secondaryName = '';

		// Get the product secondary nam
		var lineItemProduct = productLineItem.product;
		var productDetail = productMgr.getProduct(lineItemProduct.ID);

		if (!productLineItem.bonusProductLineItem) {
			priceString = dw.util.StringUtils.formatMoney(dw.value.Money(productLineItem.price.value, session.getCurrency().getCurrencyCode()));
			basePrice = dw.util.StringUtils.formatMoney(dw.value.Money(productLineItem.basePrice.value, session.getCurrency().getCurrencyCode()));
		} else {
			priceString = dw.util.StringUtils.formatMoney(dw.value.Money(0, session.getCurrency().getCurrencyCode()));
		}

		// Variation values
		var variationValues = [];
		if (productDetail.isVariant()) {
			var variationAttributes = productDetail.variationModel.getProductVariationAttributes();
			for (var attributeIndex = 0; attributeIndex < variationAttributes.length; attributeIndex++) {
				var variation = variationAttributes[attributeIndex];
				var selectedValue = productDetail.variationModel.getSelectedValue(variation);
				if (selectedValue) {
					variationValues.push(variation.displayName + ": " + selectedValue.displayValue);
				}
			}
		}

		items.push(productLineItem.productID);
		var allCategories;
		if (productDetail.variant) {
			if (productDetail.masterProduct.getPrimaryCategory()) {
				itemPrimaryCategories.push(productDetail.masterProduct.getPrimaryCategory().displayName);
			}
			allCategories = productDetail.masterProduct.getAllCategories();
		} else {
			if (productDetail.getPrimaryCategory()) {
				itemPrimaryCategories.push(productDetail.getPrimaryCategory().displayName);
			}
			allCategories = productDetail.getAllCategories();
		}

		var isSample = false;
		if (!empty(allCategories) && allCategories.length > 0) {
			var category = '';
			for (var categoryCount = 0; categoryCount < allCategories.length; categoryCount++) {
				category = allCategories[categoryCount];
				itemCategories.push(category.displayName);
				if (category.ID == 'samples') {
					isSample = true;
				}
			}
		}

		var images = new ImageModel(productDetail, { types: ['small'], quantity: 'single' });
		var productImage;
		if(images && images.small) {
			productImage = images.small[0].absURL.toString();
		}

		productLineItemsArray.push({
			'ProductName' : productLineItem.productName,
			'Quantity' : productLineItem.quantity.value,
			'SalePrice' : productLineItem.adjustedPrice.value,
			'ProductLink' : prdUrl,
			'productVariants' : variationValues,
			'RegularPrice' : productLineItem.basePrice.value,
			'ImageLink' : images ? productImage : null,
			'isSample' : isSample,
			'PromoCode' : '',
			'SKU' : productLineItem.getProductID()
		});
	}

	var giftCertificateLineItems = order.giftCertificateLineItems;
	for (var index in giftCertificateLineItems) {
		var giftCertificateLineItem = giftCertificateLineItems[index];
		var hostname = URLUtils.home().toString();
		productLineItemsArray.push({
			'ProductName': giftCertificateLineItem.lineItemText || '',
			'Quantity': '1',
			'SalePrice': giftCertificateLineItem.adjustedPrice.value || '',
			'ProductLink': !empty(hostname) ? hostname + '/giftcard' : '',
			'RegularPrice': giftCertificateLineItem.basePrice.value || '',
			'ImageLink': URLUtils.imageURL(URLUtils.CONTEXT_LIBRARY, '', 'images/gift-certificates.png', null).toString(),
			'isSample': false,
			'PromoCode': '',
			'SKU': 'giftcard'
		});
	}

	logger.info('Items: ' + JSON.stringify(items));

	payload['ProductLineItemsJSON'] = JSON.stringify(productLineItemsArray);
}

/**
 * Prepares all payment related info needed for payload
 * @param {Object} payload - Payload passed by createOrderPayload
 * @param {*} paymentInstruments - The current shipments payment Instruments
 */
function preparePaymentInfo(payload, order, orderLocale) {
	var orderModel = require('*/cartridge/models/order');
	var locale = require('dw/util/Locale');
	var resource = require('dw/web/Resource');

	var currentLocale = locale.getLocale(orderLocale);
	var fullOrderModel = new orderModel(order, { countryCode: currentLocale.country, containerView: 'order' });
	// var orderObject = { order: orderModel };
	var paymentInstruments = fullOrderModel.billing.payment.selectedPaymentInstruments;

	var paymentInfo = {};
	var paymentInstrumentItem = {};

	paymentInfo.cardLastFour = '';
	paymentInfo.ccExpiration = '';
	paymentInfo.creditCardType = '';
	paymentInfo.paymentMethod = '';
	paymentInfo.maskedGiftCertificateCode = '';
	paymentInfo.giftCertificateBalance = '';
	paymentInfo.giftCertificateFormattedAmount = '';
	paymentInfo.paymentFormattedAmount = '';
	for (var paymentIndex in paymentInstruments) {
		paymentInstrumentItem = paymentInstruments[paymentIndex];

		if (paymentInstrumentItem.creditCardNumberLastDigits) {
			paymentInfo.cardLastFour = paymentInstrumentItem.maskedCreditCardNumber;
			paymentInfo.creditCardType = (paymentInstrumentItem.creditCardType) ? paymentInstrumentItem.creditCardType : '';
			paymentInfo.ccExpiration = paymentInstrumentItem.creditCardExpirationMonth + "/" + paymentInstrumentItem.creditCardExpirationYear;
			paymentInfo.paymentMethod = resource.msg('email.paymentMethod.CreditCard', 'salesforce', null);
		}
		if (paymentInstrumentItem.maskedGiftCertificateCode) {
			paymentInfo.maskedGiftCertificateCode = paymentInstrumentItem.maskedGiftCertificateCode;
			// commenting out the following properties (formattedRemainingBalance and formattedAmount)
			// since these properties are not on the GC payment instrument
			// paymentInfo.giftCertificateBalance = paymentInstrumentItem.formattedRemainingBalance;
			// paymentInfo.giftCertificateFormattedAmount = paymentInstrumentItem.formattedAmount;
			paymentInfo.paymentMethod = resource.msg('email.paymentMethod.GiftCertificate', 'salesforce', null);
		}
		if (paymentInstrumentItem.paymentMethod === 'DW_APPLE_PAY') {
			paymentInfo.paymentMethod = resource.msg('email.paymentMethod.ApplePay', 'salesforce', null);
			paymentInfo.paymentFormattedAmount = paymentInstrumentItem.formattedAmount;
		}
		if (paymentInstrumentItem.paymentMethod === 'PayPal') {
			paymentInfo.paymentMethod = resource.msg('email.paymentMethod.PayPal', 'salesforce', null);
			paymentInfo.paymentFormattedAmount = paymentInstrumentItem.formattedAmount;
		}
		if (paymentInstrumentItem.paymentMethod === 'Salesforce Payments') {
			var paymentMethod = fullOrderModel.billing.payment.paymentMethod;

			paymentInfo.paymentMethod = resource.msgf('label.method.' + paymentMethod.type, 'payment', paymentMethod.name);
			paymentInfo.cardLastFour = paymentMethod.last4;
			paymentInfo.creditCardType = resource.msgf('label.card.brand.' + (paymentMethod.brand || 'unknown'), 'payment', null);

			paymentInfo.paymentFormattedAmount = paymentInstrumentItem.formattedAmount;
		}
		if (paymentInstrumentItem.paymentMethod === 'Affirm') {
			paymentInfo.paymentMethod = resource.msg('email.paymentMethod.Affirm', 'salesforce', null);
			paymentInfo.paymentFormattedAmount = paymentInstrumentItem.formattedAmount;
		}
		if (paymentInstrumentItem.paymentMethod === 'CREDIT_CARD') {
			paymentInfo.cardLastFour = paymentInstrumentItem.maskedCreditCardNumber;
			paymentInfo.paymentMethod = paymentInstrumentItem.paymentMethod;
			paymentInfo.creditCardType = paymentInstrumentItem.type || '';
			paymentInfo.ccExpiration = paymentInstrumentItem.expirationMonth + "/" + paymentInstrumentItem.expirationYear;
			paymentInfo.paymentFormattedAmount = paymentInstrumentItem.formattedAmount;
		}
	}

	payload['Locale'] = orderLocale;
	payload['PaymentMethodType'] = paymentInfo.paymentMethod;
	payload['PaymentMethodTypeCreditCardCompany'] = paymentInfo.creditCardType;
	if (!paymentInfo.creditCardType) {
		payload['PaymentMethodTypeCreditCardCompany'] = paymentInfo.paymentMethod;
	}
	payload['cardLastFour'] = paymentInfo.cardLastFour;
}

/**
 * Prepares all Pricing info needed for payload
 * @param {Object} payload - Payload passed by createOrderPayload
 * @param {dw.order.Order} order - The current user's order
 */
function preparePricingInfo(payload, order) {

	// Order Total
	var merchTotalExclOrderDiscounts = order.getAdjustedMerchandizeTotalPrice(false);
	var merchTotalInclOrderDiscounts = order.getAdjustedMerchandizeTotalPrice(true);

	// discounts
	var orderDiscount = merchTotalExclOrderDiscounts.subtract(merchTotalInclOrderDiscounts);
	var orderDiscountString = dw.util.StringUtils.formatMoney(dw.value.Money(orderDiscount.value, session.getCurrency().getCurrencyCode()));

	// Sub Total
	var subTotal = merchTotalInclOrderDiscounts.add(order.giftCertificateTotalPrice);
	var subTotalString = dw.util.StringUtils.formatMoney(dw.value.Money(subTotal.value, session.getCurrency().getCurrencyCode()));

	// Shipping
	var shippingExclDiscounts = order.shippingTotalPrice;
	var shippingInclDiscounts = order.getAdjustedShippingTotalPrice();
	var shippingDiscount = shippingExclDiscounts.subtract(shippingInclDiscounts);
	var shippingTotalCost = shippingExclDiscounts.subtract(shippingDiscount);
	var shippingTotalCostString = dw.util.StringUtils.formatMoney(dw.value.Money(shippingTotalCost.value, session.getCurrency().getCurrencyCode()));

	// Tax
	var totalTax = 0.00;
	if (order.totalTax.available) {
		totalTax = order.totalTax.value;
	} else if (order.giftCertificateTotalPrice.available) {
		totalTax = order.merchandizeTotalTax.value;
	}
	var totalTaxString = dw.util.StringUtils.formatMoney(dw.value.Money(totalTax, session.getCurrency().getCurrencyCode()));

	// Order Total
	var orderTotal = '';
	if (order.totalNetPrice.available) {
		orderTotal = order.totalNetPrice.value + totalTax;
	} else {
		orderTotal = order.getAdjustedMerchandizeTotalPrice(true) + (order.giftCertificateTotalPrice) + (order.shippingTotalPrice) + (totalTax);
	}
	var orderTotalString = dw.util.StringUtils.formatMoney(dw.value.Money(orderTotal, session.getCurrency().getCurrencyCode()));

	var discount = '';
	if (orderDiscountString) {
		discount = orderDiscountString;
	}

	// Payload Data for Pricing
	payload['TotalPrice'] = orderTotal;
	payload['TransactionAmount'] = orderTotal;
	payload['SubtotalPrice'] = subTotal.value;
	payload['ShippingPrice'] = shippingTotalCost.value;
	payload['ShipmentTotal'] = shippingTotalCost.value;
	payload['ShippingCalculated'] = shippingTotalCost.value;
	payload['TaxPrice'] = totalTax;
	payload['DiscountsSavings'] = orderDiscount.value;
}

/**
 * Prepares all generic info needed for payload such as name and email
 * @param {Object} payload - Payload passed by createOrderPayload
 * @param {dw.order.Order} order - The current user's order
 */
function prepareGenericData(payload, order) {
	// Marketing cloud info
	payload['FirstName'] = payload.ShippingAddressFirstName;
	payload['LastName'] = payload.ShippingAddressLastName;
	payload['EmailAddress'] = order.getCustomerEmail();

	// Order Info
	payload['orderCreationDate'] = dw.util.StringUtils.formatCalendar(new dw.util.Calendar(new Date(order.creationDate)), 'yyyy-MM-dd');
	payload['OrderNumber'] = order.orderNo;
	payload['OrderDate'] = payload.orderCreationDate;
}
