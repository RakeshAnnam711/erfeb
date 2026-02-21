/* global dw */

'use strict';

var Logger = require('dw/system/Logger');
var taxJarService = require('*/cartridge/scripts/taxJarService');
var TaxJarNexus = require('*/cartridge/scripts/taxJarNexus');
var TaxJarCustomerUtils = require('*/cartridge/scripts/taxJarCustomerUtils');
var Encoding = require('dw/crypto/Encoding');
var MessageDigest = require('dw/crypto/MessageDigest');
var Site = require('dw/system/Site');
var CacheMgr = require('dw/system/CacheMgr');

/**
 * Calculates effective tax rate from taxable amount and tax collectable
 * @param  {Object} responseLineItem - Line item tax data from TaxJar response
 * @return {number} effective tax rate to apply to line
 */
function calculateEffectiveTaxRate(responseLineItem) {
    if (responseLineItem.tax_collectable === 0 || responseLineItem.taxable_amount === 0) {
        return 0;
    }

    return responseLineItem.combined_tax_rate;
}

/**
 * Conditionally apply tax to line item
 *
 * @param  {dw.order.ProductLineItem} lineItem - Line item to apply tax too
 * @param  {Object} responseLineItems - Tax rates by line item from TaxJar
 * @return {undefined}
 */
function maybeApplyLineItemTax(lineItem, responseLineItems) {
    var lineItemId = lineItem.getUUID();

    // Iterate through line items in breakdown, find match
    for (var i = 0; i < responseLineItems.length; i++) {
        if (responseLineItems[i].id === lineItemId) {
            var effectiveTaxRate = module.exports.calculateEffectiveTaxRate(responseLineItems[i]);
            lineItem.updateTax(effectiveTaxRate, lineItem.getProratedPrice());
            var debugData = {
                name: lineItem.getLineItemText(),
                id: lineItemId,
                tax_class: lineItem.getTaxClassID(),
                combined_tax_rate: responseLineItems[i].combined_tax_rate,
                effective_tax_rate: effectiveTaxRate,
                taxable_amount: lineItem.getProratedPrice().getValue(),
                tax: lineItem.getTax().getValue()
            };
            Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('Applied Tax To Item: ' + JSON.stringify(debugData));
        }
    }
}

/**
 * Retrieves tax rates stored in cache, or if not present requests them from TaxJar
 *
 * @param  {Object} requestParams - Body of request to send to TaxJar
 * @return {Object} - Object containing tax rate data
 */
function getTaxData(requestParams) {
    var siteId = Site.current.ID;
    var cache = CacheMgr.getCache('TaxJarTaxRateCache');
    var hasher = new MessageDigest(MessageDigest.DIGEST_SHA_256);
    var hash = Encoding.toBase64(hasher.digestBytes(Encoding.fromBase64(JSON.stringify(requestParams))));
    var cachedRate = cache.get(siteId + hash);
    var data = {};

    if (!cachedRate) {
        var response = taxJarService.getTaxes(JSON.stringify(requestParams));

        if (!response) {
            return false;
        }

        if (response && response.object) {
            data = JSON.parse(response.object.text);
            cache.put(siteId + hash, response.object.text);
        } else {
            return false;
        }
    } else {
        data = JSON.parse(cachedRate);
        Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('Tax rates retrieved from cache: ' + cachedRate);
    }

    return data;
}

/**
 * Filters default (non TaxJar) tax codes from API requests so as not to affect AutoFile
 * @param  {string} productTaxCode - product tax code to filter
 * @return {string} - filtered product tax code
 */
function filterProductTaxCode(productTaxCode) {
    if (productTaxCode === 'standard') {
        return '';
    }
    return productTaxCode;
}

/**
 * Retrieves necessary data from line item and formats it for request to TaxJar
 *
 * @param  {dw.order.LineItem} lineItem - Line item to add to request
 * @return {Object} - Formatted line item data for request
 */
function buildRequestLineItem(lineItem) {
    var itemTotal = lineItem.getPriceValue();
    var discount = itemTotal - lineItem.getProratedPrice().getValue();
    var productTaxCode = '';
    var taxClassId = lineItem.getTaxClassID();

    if (taxClassId) {
        productTaxCode = taxClassId;
    }

    return {
        id: lineItem.getUUID(),
        unit_price: lineItem.getPriceValue() / lineItem.getQuantity().getValue(),
        quantity: lineItem.getQuantity().getValue(),
        discount: discount,
        product_tax_code: module.exports.filterProductTaxCode(productTaxCode)
    };
}

/**
 * Gets all product option line items from product line item and formats them for request to TaxJar
 *
 * @param  {dw.order.ProductLineItem} lineItem - Line item from basket
 * @return {Object} - Object containt formatted propuct option line items
 */
function builtProductOptionRequestLineItems(lineItem) {
    var lineItems = [];
    var optionLineItemIterator = lineItem.optionProductLineItems.iterator();

    while (optionLineItemIterator.hasNext()) {
        var optionLineItem = optionLineItemIterator.next();
        lineItems.push(module.exports.buildRequestLineItem(optionLineItem));
    }

    return lineItems;
}

/**
 * Retrieves ship from address custom preferences
 *
 * @return {Object} - Object containing ship from preferences
 */
function getShipFromSettings() {
    var shipFrom = {
        country: '',
        state: '',
        zip: '',
        city: '',
        street: ''
    };

    var country = Site.getCurrent().getCustomPreferenceValue('TaxJarShipFromCountryCode');
    if (country) {
        shipFrom.country = country;
    }

    var state = Site.getCurrent().getCustomPreferenceValue('TaxJarShipFromState');
    if (state) {
        shipFrom.state = state;
    }

    var zip = Site.getCurrent().getCustomPreferenceValue('TaxJarShipFromZip');
    if (zip) {
        shipFrom.zip = zip;
    }

    var city = Site.getCurrent().getCustomPreferenceValue('TaxJarShipFromCity');
    if (city) {
        shipFrom.city = city;
    }

    var street = Site.getCurrent().getCustomPreferenceValue('TaxJarShipFromAddress');
    if (street) {
        shipFrom.street = street;
    }

    return shipFrom;
}

/**
 * Determine whether shipment has nexus and the required data to get tax calculations from TaxJar
 *
 * @param  {dw.order.Shipment} shipment - shipment that needs tax calculation
 * @param  {dw.order.OrderAddress} shippingAddress - shipping address of shipment
 * @return {boolean} true when shipment should get tax from TaxJar, false otherwise
 */
function shipmentShouldCalculateTax(shipment) {
    var shippingAddress = shipment.getShippingAddress();

    if (!shippingAddress) {
        Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('No shipping address');
        return false;
    }

    if (shipment.getProductLineItems().isEmpty()) {
        Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('No line items');
        return false;
    }

    var countryCode = shippingAddress.getCountryCode().getValue().toUpperCase();
    var stateCode = shippingAddress.getStateCode();
    if (!TaxJarNexus.hasNexus(countryCode, stateCode)) {
        Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('Shipment does not have nexus. Country: ' + countryCode + ' State: ' + stateCode);
        return false;
    }

    return true;
}

/**
 * Builds request body object for tax calculation request
 * @param  {dw.order.Shipment} shipment - shipment to build tax calculation request for
 * @param  {dw.order.Basket} basket - current users basket
 * @return {Object} tax calculation request body
 */
function buildTaxRequestBody(shipment, basket) {
    var shippingAddress = shipment.getShippingAddress();
    var customerId = basket.getCustomerNo();
    var customer = basket.getCustomer();
    var shipmentLineItems = shipment.getProductLineItems().iterator();
    var countryCode = shippingAddress.getCountryCode().getValue().toUpperCase();
    var stateCode = shippingAddress.getStateCode();
    var shipping = shipment.getAdjustedShippingTotalNetPrice().getValue();
    var shipFrom = module.exports.getShipFromSettings();
    var customerExemption = TaxJarCustomerUtils.getCustomerExemptionTypeForRegion(customer, countryCode, stateCode);
    var requestParams = {
        from_country: shipFrom.country,
        from_state: shipFrom.state,
        from_zip: shipFrom.zip,
        from_city: shipFrom.city,
        from_street: shipFrom.street,
        to_country: countryCode,
        to_state: stateCode,
        to_city: shippingAddress.getCity(),
        to_street: shippingAddress.getAddress1(),
        to_zip: shippingAddress.getPostalCode(),
        shipping: shipping,
        customer_id: customerId,
        plugin: 'sfcc',
        line_items: []
    };

    if (customerExemption) {
        requestParams.exemption_type = customerExemption;
    }

    while (shipmentLineItems.hasNext()) {
        var lineItem = shipmentLineItems.next();
        var requestLineItem = module.exports.buildRequestLineItem(lineItem, shipment);
        requestParams.line_items.push(requestLineItem);

        var productOptionsLineItems = module.exports.builtProductOptionRequestLineItems(lineItem);
        requestParams.line_items = requestParams.line_items.concat(productOptionsLineItems);
    }

    return requestParams;
}

/**
 * Determines if response from tax calculation request contains tax data to apply to shipment
 * @param  {Object}  taxData - response from tax calculation request
 * @return {boolean} true when response contains tax to apply to shipment, false otherwise
 */
function isTaxDataValid(taxData) {
    if (!taxData || !taxData.tax) {
        Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('No tax data after request.');
        return false;
    }

    if (!taxData.tax.breakdown) {
        Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('No data tax breakdown');
        return false;
    }

    return true;
}

/**
 * Apply tax rate to price adjustments, always 0% rate
 *
 * @param  {dw.order.Shipment} shipment - shipment to get price adjustments from
 * @param  {dw.order.Basket} basket - basket to get order price adjustments from
 * @return {void}
 */
function applyTaxToPriceAdjustments(shipment, basket) {
    var orderPriceAdjustments = basket.getPriceAdjustments().iterator();
    while (orderPriceAdjustments.hasNext()) {
        var orderPriceAdjustment = orderPriceAdjustments.next();
        orderPriceAdjustment.updateTax(0);
    }

    var shipmentPriceAdjustments = shipment.getShippingPriceAdjustments().iterator();
    while (shipmentPriceAdjustments.hasNext()) {
        var shipmentPriceAdjustment = shipmentPriceAdjustments.next();
        shipmentPriceAdjustment.updateTax(0);
    }
}

/**
 * Apply tax to product option line items
 *
 * @param  {dw.order.ProductLineItem} productLineItem - product line item to get product options from
 * @param  {Object} taxResponseLineItems - tax line item from tax calculation request
 * @return {void}
 */
function applyTaxToProductOptionLineItems(productLineItem, taxResponseLineItems) {
    var optionLineItemIterator = productLineItem.optionProductLineItems.iterator();

    while (optionLineItemIterator.hasNext()) {
        var optionLineItem = optionLineItemIterator.next();
        module.exports.maybeApplyLineItemTax(optionLineItem, taxResponseLineItems);
    }
}

/**
 * Apply tax to product price adjustment, always 0% rate
 *
 * @param  {dw.order.ProductLineItem} productLineItem - line item to get price adjustments from
 * @return {void}
 */
function applyTaxToProductPriceAdjustments(productLineItem) {
    var priceAdjustmentIterator = productLineItem.getPriceAdjustments().iterator();

    while (priceAdjustmentIterator.hasNext()) {
        var priceAdjustment = priceAdjustmentIterator.next();
        priceAdjustment.updateTax(0);
    }
}

/**
 * Apply tax to product shipping price adjustment, always 0% rate
 *
 * @param  {dw.order.ProductShippingLineItem} productShippingLineItem - product shipping line item to get price adjustments from
 * @return {void}
 */
function applyTaxToProductShippingPriceAdjustments(productShippingLineItem) {
    var shippingPriceAdjustmentIterator = productShippingLineItem.getPriceAdjustments().iterator();

    while (shippingPriceAdjustmentIterator.hasNext()) {
        var shippingPriceAdjustment = shippingPriceAdjustmentIterator.next();
        shippingPriceAdjustment.updateTax(0);
    }
}

/**
 * Apply tax to product shipping line items
 *
 * @param  {Object} taxData - response from tax calculation request
 * @param  {dw.order.ProductLineItem} productLineItem - product line item to get product shipping line items from
 * @return {void}
 */
function applyTaxToProductShippingLineItems(taxData, productLineItem) {
    var productShippingLineItem = productLineItem.getShippingLineItem();

    if (productShippingLineItem) {
        module.exports.applyTaxToProductShippingPriceAdjustments(productShippingLineItem);

        if (taxData.tax.freight_taxable) {
            productShippingLineItem.updateTax(taxData.tax.breakdown.shipping.combined_tax_rate, productShippingLineItem.getAdjustedPrice());

            var debugData = {
                name: productShippingLineItem.getLineItemText(),
                id: productShippingLineItem.getUUID(),
                tax_class: productShippingLineItem.getTaxClassID(),
                rate: taxData.tax.breakdown.shipping.combined_tax_rate,
                taxable_amount: productShippingLineItem.getAdjustedPrice().getValue(),
                tax: productShippingLineItem.getAdjustedTax().getValue()
            };

            Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('Applied Tax To Product Shipping Line Item: ' + JSON.stringify(debugData));
        } else {
            productShippingLineItem.updateTax(0);
        }
    }
}

/**
 * Apply tax to product line items
 *
 * @param  {Object} taxData - response from tax calculation request
 * @param  {dw.order.Shipment} shipment - shipment to get product line items from
 * @return {void}
 */
function applyTaxToProductLineItems(taxData, shipment) {
    var productLineItems = shipment.getProductLineItems().iterator();
    var responseLineItems = taxData.tax.breakdown.line_items;

    while (productLineItems.hasNext()) {
        var productLineItem = productLineItems.next();
        module.exports.maybeApplyLineItemTax(productLineItem, responseLineItems);
        module.exports.applyTaxToProductOptionLineItems(productLineItem, responseLineItems);
        module.exports.applyTaxToProductPriceAdjustments(productLineItem);
        module.exports.applyTaxToProductShippingLineItems(taxData, productLineItem);
    }
}

/**
 * Apply tax to shipping line items
 *
 * @param  {Object} taxData - response from tax calculation request
 * @param  {dw.order.Shipment} shipment - shipment to get shipping line items from
 * @return {void}
 */
function applyTaxToShippingItems(taxData, shipment) {
    var shippingLineItems = shipment.getShippingLineItems().iterator();

    while (shippingLineItems.hasNext()) {
        var shippingLineItem = shippingLineItems.next();

        if (taxData.tax.freight_taxable) {
            shippingLineItem.updateTax(taxData.tax.breakdown.shipping.combined_tax_rate, shippingLineItem.getAdjustedPrice());

            var debugData = {
                name: shippingLineItem.getLineItemText(),
                id: shippingLineItem.getUUID(),
                tax_class: shippingLineItem.getTaxClassID(),
                rate: taxData.tax.breakdown.shipping.combined_tax_rate,
                taxable_amount: shippingLineItem.getAdjustedPrice().getValue(),
                tax: shippingLineItem.getAdjustedTax().getValue()
            };

            Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('Applied Tax To Shipping Item: ' + JSON.stringify(debugData));
        } else {
            shippingLineItem.updateTax(0);
        }
    }
}

/**
 * Apply tax to gift certificate line items, always 0% rate
 *
 * @param  {dw.order.Shipment} shipment - shipment to get gift certificates from
 * @return {void}
 */
function applyTaxToGiftCertificateLineItems(shipment) {
    var giftCertificateLineItems = shipment.getGiftCertificateLineItems().iterator();

    while (giftCertificateLineItems.hasNext()) {
        var giftCertificate = giftCertificateLineItems.next();
        giftCertificate.updateTax(0);
    }
}

/**
 * Apply tax to shipment
 *
 * @param  {Object} taxData - response from tax calculation request
 * @param  {dw.order.Shipment} shipment - shipment to apply tax to
 * @param  {dw.order.Basket} basket - basket containing shipment
 * @return {void}
 */
function applyTaxToShipment(taxData, shipment, basket) {
    module.exports.applyTaxToPriceAdjustments(shipment, basket);
    module.exports.applyTaxToProductLineItems(taxData, shipment);
    module.exports.applyTaxToShippingItems(taxData, shipment);
    module.exports.applyTaxToGiftCertificateLineItems(shipment);
}

function applyAdditionalShippingLineItemTaxes(basket, extraTaxCodeMap) {
    var shipmentsIterator = basket.shipments.iterator();
    while (shipmentsIterator.hasNext()) {
        var shipment = shipmentsIterator.next();
        //Then appropriately add special tax SLIs since taxjar API doesn't do that for us
        if (!empty(shipment.shippingAddress)) {
            var shippingAddress = shipment.shippingAddress;
            if (empty(shipment.custom.fromStoreId) && shipment.productLineItems && shipment.productLineItems.length > 0 && !empty(extraTaxCodeMap[shippingAddress.countryCode.value]) && !empty(extraTaxCodeMap[shippingAddress.countryCode.value][shippingAddress.stateCode])) {
                for (var taxCode of extraTaxCodeMap[shippingAddress.countryCode.value][shippingAddress.stateCode].codes) {
                    if (!taxCode.included) {
                        //If the address for this SLI qualifies for extra tax and hasn't already been created create it
                        taxCode.included = true;
                        dw.system.Transaction.wrap(function() {
                            var newItem = shipment.createShippingLineItem(taxCode.ID);
                            newItem.setLineItemText(taxCode.description[request.locale] || taxCode.description['default'] || 'surcharge');
                            newItem.setPriceValue(taxCode.amountInCents / 100);
                            newItem.updateTax(0);
                        });
                    }
                }
            }
        }
    }
}

/**
 * Calculate and apply tax to shipment
 * @param  {dw.order.Shipment} shipment - shipment that needs tax calculation
 * @param  {dw.order.Basket} basket - basket containing the shipment
 * @return {boolean} - true when TaxJar successfully calculated and applied tax, false when reverting to default tax calculation
 */
function calculateTaxForShipment(shipment, basket) {
    var shouldCalculateTax = module.exports.shipmentShouldCalculateTax(shipment);
    if (shouldCalculateTax === false) {
        return false;
    }

    var requestBody = module.exports.buildTaxRequestBody(shipment, basket);
    var taxData = module.exports.getTaxData(requestBody);

    if (!module.exports.isTaxDataValid(taxData)) {
        return false;
    }

    module.exports.applyTaxToShipment(taxData, shipment, basket);

    return true;
}

/**
 * Calulates tax on basket using TaxJar SmartCalcs API
 *
 * @param  {dw.order.Basket} basket - the basket containing the line items which need tax calculated
 * @return {boolean} - true when TaxJar successfully calculated tax on basket, false when need to revert to default calculation
 **/
function calculateTax(basket) {
    var extraTaxCodeMap = JSON.parse(dw.system.Site.current.getCustomPreferenceValue('extraShippingTaxCodeJSON'));
    // Get a set of all special SLI tax codes
    var allExtraTaxCodes = new Set();
    for (var country in Object.keys(extraTaxCodeMap)) {
        var country = Object.keys(extraTaxCodeMap)[country];
        for (var region in Object.keys(extraTaxCodeMap[country])) {
            var region = Object.keys(extraTaxCodeMap[country])[region];
            for (var taxCode of extraTaxCodeMap[country][region].codes) {
                allExtraTaxCodes.add(taxCode.ID);
            }
        }
    }

    //First remove/clear all special tax SLIs as address/bopis may have changed
    var shipmentsIterator = basket.shipments.iterator();
    while (shipmentsIterator.hasNext()) {
        var shipment = shipmentsIterator.next();
        var shippingLineItemsIterator = shipment.shippingLineItems.iterator();
        while (shippingLineItemsIterator.hasNext()) {
            var li = shippingLineItemsIterator.next();
            if (allExtraTaxCodes.has(li.ID)) {
                shipment.removeShippingLineItem(li);
            }
        }
    }

    var shipments = basket.getShipments().iterator();

    while (shipments.hasNext()) {
        var shipment = shipments.next();
        var taxCalculationSuccessful = module.exports.calculateTaxForShipment(shipment, basket);

        if (taxCalculationSuccessful === false) {
            return false;
        }
    }

    module.exports.applyAdditionalShippingLineItemTaxes(basket, extraTaxCodeMap);

    return true;
}

/**
 * Checks whether or not TaxJar is enabled via custom preferences
 *
 * @return {boolean} - True if TaxJar is enabled, false otherwise
 */
function isEnabled() {
    var enabled = Site.getCurrent().getCustomPreferenceValue('TaxJarEnable');
    if (enabled) {
        return true;
    }
    return false;
}

module.exports = {
    calculateEffectiveTaxRate: calculateEffectiveTaxRate,
    isEnabled: isEnabled,
    calculateTax: calculateTax,
    calculateTaxForShipment: calculateTaxForShipment,
    getShipFromSettings: getShipFromSettings,
    filterProductTaxCode: filterProductTaxCode,
    maybeApplyLineItemTax: maybeApplyLineItemTax,
    getTaxData: getTaxData,
    buildRequestLineItem: buildRequestLineItem,
    builtProductOptionRequestLineItems: builtProductOptionRequestLineItems,
    shipmentShouldCalculateTax: shipmentShouldCalculateTax,
    buildTaxRequestBody: buildTaxRequestBody,
    isTaxDataValid: isTaxDataValid,
    applyAdditionalShippingLineItemTaxes: applyAdditionalShippingLineItemTaxes,
    applyTaxToPriceAdjustments: applyTaxToPriceAdjustments,
    applyTaxToProductOptionLineItems: applyTaxToProductOptionLineItems,
    applyTaxToProductPriceAdjustments: applyTaxToProductPriceAdjustments,
    applyTaxToProductLineItems: applyTaxToProductLineItems,
    applyTaxToProductShippingPriceAdjustments: applyTaxToProductShippingPriceAdjustments,
    applyTaxToProductShippingLineItems: applyTaxToProductShippingLineItems,
    applyTaxToShipment: applyTaxToShipment,
    applyTaxToShippingItems: applyTaxToShippingItems,
    applyTaxToGiftCertificateLineItems: applyTaxToGiftCertificateLineItems
};
