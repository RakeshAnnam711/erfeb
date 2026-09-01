'use strict';

const addressHelper = require('*/cartridge/scripts/paypal/helpers/addressHelper');

const HttpClientOcapi = require('~/cartridge/models/httpClientOcapi');

const httpClientOcapiInstance = new HttpClientOcapi();

/**
 * Constructs the helper to handle PayPal shipping callback
 * @param {Object} requestData Data provided be PayPal
 * @param {Object} queryStrings Query string object from the request
 * @param {string} queryStrings.cartId cart id of the buyer.
 * @param {string} queryStrings.sessionId Customer session id
 * @param {string|undefined} [queryStrings.token_data] Data regarding dwsecuretoken or undefined if it is not needed for request
 */
function ShippingCallback(requestData, queryStrings) {
    const shippingAddress = requestData.shipping_address;

    httpClientOcapiInstance.initJWTForSession(queryStrings.session_id, queryStrings.token_data);

    this.shippingOptions = null;
    this.shippingOption = requestData.shipping_option;
    this.purchaseUnit = requestData.purchase_units[0];
    this.address = {
        state_code: shippingAddress.admin_area_1,
        postal_code: shippingAddress.postal_code,
        city: shippingAddress.admin_area_2,
        country_code: shippingAddress.country_code
    };
    this.addressValidationResult = addressHelper.validatePayPalShippingAddress({
        stateCode: shippingAddress.admin_area_1,
        postalCode: shippingAddress.postal_code,
        countryCode: shippingAddress.country_code,
        city: shippingAddress.admin_area_2
    });
    this.cartId = queryStrings.cart_id;
    this.basketData = httpClientOcapiInstance.getBasket(queryStrings.cart_id);
    this.merchantId = this.purchaseUnit.payee.merchant_id || '';
    this.referenceId = this.purchaseUnit.reference_id || 'default';
}

/**
 * Returns a decline response with error
 * @returns {Object} Decline response
 */
ShippingCallback.prototype.formatDeclineResponse = function() {
    return {
        name: 'UNPROCESSABLE_ENTITY',
        details: [{
            issue: this.addressValidationResult.errorCodes.shift()
        }]
    };
};

/**
 * Updates basket shipping address and set data to the constructor
 */
ShippingCallback.prototype.updateBasketShippingAddress = function() {
    if (this.shippingOption) {
        return;
    }

    const updatedBasket = httpClientOcapiInstance.updateBasketShippingAddress(this.address, this.cartId, this.basketData.shipments[0].shipment_id);

    if (updatedBasket) {
        this.basketData = updatedBasket;
    }
};

/**
 * Updates basket shipping address and set data to the constructor
 * @param {string} shippingMethodId New shipping method id
 */
ShippingCallback.prototype.updateBasketShippingMethod = function(shippingMethodId) {
    if (!this.shippingOption && !shippingMethodId) {
        return;
    }

    const methodId = this.shippingOption ? this.shippingOption.id : shippingMethodId;

    const updatedBasket = httpClientOcapiInstance.updateBasketShippingMethod(
        { id: methodId  }, this.cartId, this.basketData.shipments[0].shipment_id
    );

    if (updatedBasket) {
        this.basketData = updatedBasket;
    }
};

/**
 * Gets and sets the applicable shipping methods of the basket shipment
 */
ShippingCallback.prototype.setShippingOptions = function() {
    const shipment = this.basketData.shipments[0];
    const currency = this.basketData.currency;
    const result = httpClientOcapiInstance.getBasketApplicableShippingMethods(
        this.cartId, shipment.shipment_id
    );

    // Filter out whatever the method associated with in store pickup or with online pick up
    const filteredMethods = result.applicable_shipping_methods.filter(function(shippingMethod) {
        return !shippingMethod.c_storePickupEnabled;
    }).filter(function(shippingMethod) {
        return !shippingMethod.c_onlinePickupEnabled;
    });

    const isShippingMethodApplicable = filteredMethods.some(function(shippingMethod) {
        return shippingMethod.id === shipment.shipping_method.id;
    });

    const selectedShippingMethodId = isShippingMethodApplicable ? shipment.shipping_method.id : filteredMethods[0].id;

    if (!isShippingMethodApplicable) {
        this.updateBasketShippingMethod(selectedShippingMethodId);
    }

    this.shippingOptions = filteredMethods.map(function(shippingMethod) {
        return {
            id: shippingMethod.id,
            amount: {
                currency_code: currency,
                value: shippingMethod.price.toString()
            },
            type: 'SHIPPING',
            label: shippingMethod.name,
            selected: selectedShippingMethodId === shippingMethod.id
        };
    });
    this.shippingTotal = this.shippingOptions.find(function(option) {
        return option.selected;
    }).amount;
};

/**
 * Creates a response to be passed to the PayPal
 * @returns {Object} Response object
 */
ShippingCallback.prototype.createResponseObject = function() {
    return {
        id: this.merchantId,
        purchase_units: [
            {
                reference_id: this.referenceId,
                shipping_options: this.shippingOptions,
                amount: {
                    currency_code: this.basketData.currency,
                    value: this.basketData.order_total.toString(),
                    breakdown: {
                        item_total: this.purchaseUnit.amount.breakdown.item_total,
                        tax_total: {
                            currency_code: this.basketData.currency,
                            value: this.basketData.tax_total.toString()
                        } ,
                        shipping: this.shippingTotal,
                        discount: this.purchaseUnit.amount.breakdown.discount,
                        shipping_discount: this.purchaseUnit.amount.breakdown.shipping_discount
                    }
                }
            }
        ]
    };
};

module.exports = ShippingCallback;
