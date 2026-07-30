'use strict';

var BaseTransactionModel = require('*/cartridge/models/taxjar/baseTransaction');
var TaxJarService = require('*/cartridge/scripts/taxJarService.js');

/**
 * orderTransaction class that represents an order transaction in TaxJar
 * @constructor
 * @param {dw.order.Shipment} shipment - shipment to load data for
 * @param {dw.order.Order} order - order to load data for
 * @return {void}
 */
function OrderTransaction(shipment, order) {
    this.loadSharedData(shipment, order);
    this.loadLineItems(shipment);
    this.loadTotalSalesTax(shipment);
    this.loadTotalShipmentAmount(shipment);
    this.loadTotalShippingAmount(shipment);
}

OrderTransaction.prototype = Object.create(BaseTransactionModel.prototype);

/**
 * Loads total sales tax collected from shipment
 * @param  {dw.order.Shipment} shipment - shipment to get total tax from
 * @return {void}
 */
OrderTransaction.prototype.loadTotalSalesTax = function (shipment) {
    this.total_sales_tax = shipment.getTotalTax().getValue();
};

/**
 * Loads total shipping cost from shipment
 * @param  {dw.order.Shipment} shipment - shipment to get total shipping cost from
 * @return {void}
 */
OrderTransaction.prototype.loadTotalShippingAmount = function (shipment) {
    this.total_shipping = shipment.getAdjustedShippingTotalNetPrice().getValue();
};

/**
 * Loads total cost of shipment
 * @param  {dw.order.Shipment} shipment - shipment to get total for
 * @return {void}
 */
OrderTransaction.prototype.loadTotalShipmentAmount = function (shipment) {
    this.shipment_amount = shipment.getProratedMerchandizeTotalPrice().add(shipment.getAdjustedShippingTotalNetPrice()).getValue();
};

/**
 * Creates the order transaction ID from order and shipment IDs
 * @param  {string} order transaction ID
 * @return {void}
 */
OrderTransaction.prototype.getTransactionID = function () {
    return this.order_id + '-' + this.shipment_id;
};

/**
 * Calculates line item discount amount
 * @param  {dw.order.LineItem} lineItem - line item to get discount amount for
 * @return {number} discount amount
 */
OrderTransaction.prototype.calculateLineItemDiscountAmount = function (lineItem) {
    return lineItem.getPriceValue() - lineItem.getProratedPrice().getValue();
};

/**
 * Builds transaction line item from product line item
 * @param  {dw.order.LineItem} lineItem - line item to get data for
 * @return {Object} transaction line item
 */
OrderTransaction.prototype.buildProductLineItem = function (lineItem) {
    return {
        id: lineItem.getUUID(),
        quantity: lineItem.getQuantity().getValue(),
        product_identifier: lineItem.getProductID(),
        description: lineItem.getProductName(),
        product_tax_code: this.getProductTaxCodeFromLineItem(lineItem),
        unit_price: lineItem.getBasePrice().getValue(),
        discount: this.calculateLineItemDiscountAmount(lineItem),
        sales_tax: lineItem.getAdjustedTax().getValue()
    };
};

/**
 * Load product option line items
 * @param  {dw.order.LineItem} productLineItem - Product line item
 * @return {Array<Object>} array of product option line items
 */
OrderTransaction.prototype.loadProductOptionLineItems = function (productLineItem) {
    var optionLineItems = [];
    var optionLineItemIterator = productLineItem.getOptionProductLineItems().iterator();

    while (optionLineItemIterator.hasNext()) {
        var optionLineItem = optionLineItemIterator.next();
        optionLineItems.push(this.buildProductLineItem(optionLineItem));
    }

    return optionLineItems;
}

/**
 * Loads the product line items
 * @param  {dw.order.Shipment} shipment - shipment to load line items from
 * @return {Array<Object>} array of line items
 */
OrderTransaction.prototype.loadProductLineItems = function (shipment) {
    var productLineItems = [];
    var productLineItemsIterator = shipment.getProductLineItems().iterator();

    while (productLineItemsIterator.hasNext()) {
        var productLineItem = productLineItemsIterator.next();
        var requestLineItem = this.buildProductLineItem(productLineItem);
        productLineItems.push(requestLineItem);
        var optionLineItems = this.loadProductOptionLineItems(productLineItem);
        productLineItems = productLineItems.concat(optionLineItems);
    }

    return productLineItems;
};

/**
 * Loads the line item data from the shipment
 * @param  {dw.order.Shipment} shipment - shipment to get line items from
 */
OrderTransaction.prototype.loadLineItems = function (shipment) {
    var lineItems = [];
    lineItems = lineItems.concat(this.loadProductLineItems(shipment));
    this.line_items = lineItems;
};

/**
 * Build body for create order request to TaxJar
 * @return {Object} - create order request body
 */
OrderTransaction.prototype.buildOrderRequestBody = function () {
    var body = this.getBaseTransactionCreateRequestBody();
    body.transaction_id = this.getTransactionID();
    body.sales_tax = this.total_sales_tax;
    body.shipping = this.total_shipping;
    body.amount = this.shipment_amount;
    body.line_items = this.line_items;
    return body;
};

/**
 * Retrieves request body from object or builds it if it doesn't exist
 * @return {Object} - request body to send to TaxJar
 */
OrderTransaction.prototype.getRequestBody = function () {
    if (!this.body) {
        this.body = this.buildOrderRequestBody();
    }

    return this.body;
};

/**
 * Determines whether or not order should sync to TaxJar
 * @param {boolean} isForceSync - true when order should sync regardless of last sync time
 * @return {boolean} - true when order passes validation, false otherwise
 */
OrderTransaction.prototype.shouldSync = function (isForceSync) {
    if (!this.containsAllRequiredFields()) {
        this.logMessage('Failed validation: Transaction is missing required field. Skipped processing.');
        return false;
    }

    if (!this.hasLineItems()) {
        this.logMessage('Failed validation: No line items in transaction. Skipped processing.');
        return false;
    }

    if (!this.isAllowedCountry()) {
        this.logMessage('Failed validation: Country is not allowed. Skipped processing.');
        return false;
    }

    if (!this.isAllowedCurrency()) {
        this.logMessage('Failed validation: Currency is not allowed. Skipped processing.');
        return false;
    }

    if (!isForceSync) {
        if (!this.wasUpdatedAfterLastSync()) {
            this.logMessage('Transaction not updated since last sync to TaxJar. Skipped processing.');
            return false;
        }
    } else {
        this.logMessage('Force sync enabled. Modified date not validated.');
    }

    this.logMessage('Transaction passed should sync validation.');
    return true;
};

/**
 * Checks transaction to ensure all fields required by TaxJar API are in place
 * @return {boolean} - true when order contains all required fields to sync, false otherwise
 */
OrderTransaction.prototype.containsAllRequiredFields = function () {
    var body = this.getRequestBody();
    var requiredStringFields = [
        'transaction_id',
        'transaction_date',
        'to_country',
        'to_zip',
        'to_state'
    ];

    for (var i = 0; i < requiredStringFields.length; i++) {
        if (!body[requiredStringFields[i]]) {
            return false;
        }
    }

    var requiredNumberFields = [
        'amount',
        'shipping',
        'sales_tax'
    ];

    for (var j = 0; j < requiredNumberFields.length; j++) {
        if (!body[requiredNumberFields[j]] && body[requiredNumberFields[j]] !== 0) {
            return false;
        }
    }

    return true;
};

/**
 * Checks if line items on transaction are valid
 * @return {boolean} - true when order has at least one line item, false otherwise
 */
OrderTransaction.prototype.hasLineItems = function () {
    var body = this.getRequestBody();
    if (body.line_items) {
        return true;
    }
    return false;
};

/**
 * Checks if shipment is to allowed country
 * @return {boolean} - true when to country is allowed to sync to TaxJar, false otherwise
 */
OrderTransaction.prototype.isAllowedCountry = function () {
    var body = this.getRequestBody();
    if (body.to_country === 'US') {
        return true;
    }
    return false;
};

/**
 * Checks if order used allowed currency
 * @return {boolean} - true when currency or order is allowed to sync to TaxJar, false otherwise
 */
OrderTransaction.prototype.isAllowedCurrency = function () {
    if (this.order.getCurrencyCode() === 'USD') {
        return true;
    }
    return false;
};

/**
 * Attempts to create and then update order in TaxJar
 * @return {boolean} - true when order is successfully synced to TaxJar, false otherwise
 */
OrderTransaction.prototype.createOrUpdateInTaxJar = function () {
    this.logMessage('Attempting to create transaction in TaxJar');
    var result = TaxJarService.createOrderTransaction(JSON.stringify(this.getRequestBody()));

    if (TaxJarService.isRequestSuccessful(result)) {
        this.logMessage('Transaction created successfully.');
        return true;
    }

    if (TaxJarService.isCreateRequestForAlreadyExistingRecord(result)) {
        this.logMessage('Could not create in TaxJar, transaction already exists. Attempting to update transaction.');
        result = TaxJarService.updateOrderTransaction(JSON.stringify(this.getRequestBody()));
    }

    if (TaxJarService.isRequestSuccessful(result)) {
        this.logMessage('Transaction updated successfully.');
        return true;
    }

    var errorData = {
        code: result.getError(),
        message: result.getErrorMessage(),
        extra_message: result.getMsg(),
        unavailable_reason: result.getUnavailableReason()
    };
    this.logMessage('Request to TaxJar failed. Error data: ' + JSON.stringify(errorData));
    return false;
};

/**
 * Attempts to update and then create order in TaxJar
 * @return {boolean} - true when order is synced successfully, false otherwise
 */
OrderTransaction.prototype.updateOrCreateInTaxJar = function () {
    this.logMessage('Attempting to update transaction in TaxJar.');
    var result = TaxJarService.updateOrderTransaction(JSON.stringify(this.getRequestBody()));

    if (TaxJarService.isRequestSuccessful(result)) {
        this.logMessage('Transaction updated successfully.');
        return true;
    }

    if (TaxJarService.isRecordNotFoundForUpdateRequest(result)) {
        this.logMessage('Could not update in TaxJar, transaction does not exists. Attempting to create transaction.');
        result = TaxJarService.createOrderTransaction(JSON.stringify(this.getRequestBody()));
    }

    if (TaxJarService.isRequestSuccessful(result)) {
        this.logMessage('Transaction created successfully.');
        return true;
    }

    var errorData = {
        code: result.getError(),
        message: result.getErrorMessage(),
        extra_message: result.getMsg(),
        unavailable_reason: result.getUnavailableReason()
    };
    this.logMessage('Request to TaxJar failed. Error data: ' + JSON.stringify(errorData));
    return false;
};

/**
 * Syncs transaction to TaxJar
 * @return {void}
 */
OrderTransaction.prototype.syncToTaxJar = function () {
    var wasSuccessful;
    if (this.hasPreviouslySynced()) {
        wasSuccessful = this.updateOrCreateInTaxJar();
    } else {
        wasSuccessful = this.createOrUpdateInTaxJar();
    }

    if (wasSuccessful) {
        this.updateSyncDataOnShipment();
    }
};

/**
 * Saves last sync and request hash to shipment system object
 * @return {void}
 */
OrderTransaction.prototype.updateSyncDataOnShipment = function () {
    var requestHash = this.getRequestBodyHash();
    var currentDateTime = new Date(Date.now());
    this.saveLastSyncDateTime(currentDateTime);
    this.saveLastSyncHash(requestHash);
};

/**
 * Removes last sync and request hash from shipment system object
 * @return {void}
 */
OrderTransaction.prototype.removeSyncDataOnShipment = function () {
    this.removeLastSyncDateTime();
    this.removeLastSyncHash();
};

/**
 * Saves last sync time to shipment system object
 * @param  {Date} lastSyncDateTime - date to save as last sync time
 * @return {void}
 */
OrderTransaction.prototype.saveLastSyncDateTime = function (lastSyncDateTime) {
    this.shipment.custom.TaxJarOrderLastSyncDateTime = lastSyncDateTime;
};

/**
 * Gets last sync date time from shipment system object
 * @return {Date} last sync date time
 */
OrderTransaction.prototype.getLastSyncDateTime = function () {
    return this.shipment.custom.TaxJarOrderLastSyncDateTime;
};

/**
 * Removes last sync time from shipment system object
 * @return {void}
 */
OrderTransaction.prototype.removeLastSyncDateTime = function () {
    this.shipment.custom.TaxJarOrderLastSyncDateTime = null;
};

/**
 * Saves last sync request body hash to shipment system object
 * @param  {string} lastSyncRequestBodyHash - hash of request body of last sync to TaxJar
 * @return {void}
 */
OrderTransaction.prototype.saveLastSyncHash = function (lastSyncRequestBodyHash) {
    this.shipment.custom.TaxJarOrderLastSyncHash = lastSyncRequestBodyHash;
};

/**
 * Gets last sync date hash from shipment system object
 * @return {string} last sync request body hash
 */
OrderTransaction.prototype.getLastSyncHash = function () {
    return this.shipment.custom.TaxJarOrderLastSyncHash;
};

/**
 * Removes last sync hash from shipment system object
 * @return {void}
 */
OrderTransaction.prototype.removeLastSyncHash = function () {
    this.shipment.custom.TaxJarOrderLastSyncHash = null;
};

/**
 * Determines if the order transaction has been synced to TaxJar
 * @return {boolean} - true when order has previously synced
 */
OrderTransaction.prototype.hasPreviouslySynced = function () {
    if (this.getLastSyncDateTime()) {
        return true;
    }
    return false;
};

/**
 * Deletes order from TaxJar and clears sync data from shipment system object
 */
OrderTransaction.prototype.deleteFromTaxJar = function () {
    var transactionID = this.getTransactionID();
    var result = TaxJarService.deleteOrderTransaction(transactionID);

    if (TaxJarService.isRequestSuccessful(result)) {
        this.removeSyncDataOnShipment();
        this.logMessage('Transaction deleted from TaxJar.');
    } else {
        var errorData = {
            code: result.getError(),
            message: result.getErrorMessage(),
            extra_message: result.getMsg(),
            unavailable_reason: result.getUnavailableReason()
        };
        this.logMessage('Delete request to TaxJar failed. Error data: ' + JSON.stringify(errorData));
    }
};

module.exports = OrderTransaction;
