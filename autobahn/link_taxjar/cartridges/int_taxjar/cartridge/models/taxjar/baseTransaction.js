/* global dw */

'use strict';

var TaxJar = require('*/cartridge/scripts/taxJar');
var TaxJarCustomerUtils = require('*/cartridge/scripts/taxJarCustomerUtils');
var Logger = require('dw/system/Logger');

/**
 * @constructor
 * @classdesc Abstract TaxJar base transaction model
 *
 * @param {dw.order.Shipment} shipment - shipment to process
 * @param {dw.order.Order} order - order to process
 * @return {void}
 */
function BaseTransaction(shipment, order) {
    this.initalizeBaseTransaction(shipment, order);
}

BaseTransaction.prototype = {

    /**
     * Loads ship from address from TaxJar settings
     * @return {void}
     */
    loadShipFromAddress: function () {
        this.shipFromAddress = TaxJar.getShipFromSettings();
    },

    /**
     * Loads ship to address from shipment
     * @param  {dw.order.Shipment} shipment - shipment to retrieve address from
     * @return {void}
     */
    loadShipToAddress: function (shipment) {
        var shippingAddress = shipment.getShippingAddress();
        this.shipToAddress = {
            country: shippingAddress.getCountryCode().getValue().toUpperCase(),
            state: shippingAddress.getStateCode(),
            city: shippingAddress.getCity(),
            street: shippingAddress.getAddress1(),
            zip: shippingAddress.getPostalCode()
        };
    },

    /**
     * Loads customer ID from order
     * @param  {dw.order.Order} order - order to get customer id from
     * @return {void}
     */
    loadCustomerID: function (order) {
        this.customer_id = order.getCustomerNo();
    },

    /**
     * Loads creation date
     * @param  {dw.order.Order} order - order to get creation date from
     * @return {void}
     */
    loadCreationDate: function (order) {
        this.order_created_date = order.getCreationDate();
    },

    /**
     * Loads order ID
     * @param  {dw.order.Order} order - order to get order number from
     * @return {void}
     */
    loadOrderID: function (order) {
        this.order_id = order.getOrderNo();
    },

    /**
     * Loads order ID
     * @param  {dw.order.Shipment} shipment - shipment to get shipment number from
     * @return {void}
     */
    loadShipmentID: function (shipment) {
        this.shipment_id = shipment.getShipmentNo();
    },

    /**
     * Loads customer exemption type
     * @param  {dw.order.Order} order - order to get exemption from
     * @param  {dw.order.Shipment} shipment - shipment to get exemption from
     * @return {void}
     */
    loadCustomerExemption: function (order, shipment) {
        var customer = order.getCustomer();
        var shippingAddress = shipment.getShippingAddress();
        var countryCode = shippingAddress.getCountryCode().getValue().toUpperCase();
        var stateCode = shippingAddress.getStateCode();
        this.exemption_type = TaxJarCustomerUtils.getCustomerExemptionTypeForRegion(customer, countryCode, stateCode);
    },

    /**
     * Calculates line item discount amount
     * @param  {dw.order.LineItem} lineItem - line item to get tax code from
     * @return {string} product tax code
     */
    getProductTaxCodeFromLineItem: function (lineItem) {
        var productTaxCode = '';
        var taxClassId = lineItem.getTaxClassID();
        if (taxClassId) {
            productTaxCode = taxClassId;
        }
        return TaxJar.filterProductTaxCode(productTaxCode);
    },

    /**
     * Loads the data that is shared between orders and refunds
     * @param {dw.order.Shipment} shipment - shipment to load data from
     * @param {dw.order.Order} order - order to load data from
     * @return {void}
     */
    loadSharedData: function (shipment, order) {
        this.loadShipFromAddress();
        this.loadShipToAddress(shipment);
        this.loadCustomerID(order);
        this.loadOrderID(order);
        this.loadCreationDate(order);
        this.loadShipmentID(shipment);
        this.loadCustomerExemption(order, shipment);
        this.shipment = shipment;
        this.order = order;
    },

    /**
     * Builds body of transaction request with all data that is shared between orders and refunds
     * @return {Object} create transaction request body
     */
    getBaseTransactionCreateRequestBody: function () {
        var body = {
            transaction_date: this.order_created_date,
            provider: 'sfcc',
            from_country: this.shipFromAddress.country,
            from_state: this.shipFromAddress.state,
            from_zip: this.shipFromAddress.zip,
            from_city: this.shipFromAddress.city,
            from_street: this.shipFromAddress.street,
            to_country: this.shipToAddress.country,
            to_state: this.shipToAddress.state,
            to_city: this.shipToAddress.city,
            to_street: this.shipToAddress.street,
            to_zip: this.shipToAddress.zip,
            customer_id: this.customer_id,
            plugin: 'sfcc'
        };

        var exemptionType = this.exemption_type;
        if (exemptionType) {
            body.exemption_type = exemptionType;
        }

        return body;
    },

    /**
     * Create a SHA 256 hash from transaction request body
     * @return {string} - request body hash
     */
    getRequestBodyHash: function () {
        var hasher = new dw.crypto.MessageDigest(dw.crypto.MessageDigest.DIGEST_SHA_256);
        var hash = dw.crypto.Encoding.toBase64(hasher.digestBytes(dw.crypto.Encoding.fromBase64(JSON.stringify(this.getRequestBody()))));
        return hash;
    },

    /**
     * Checks to see if data relevant to TaxJar has changed by comparing the request body hashes
     * @param  {string}  previousHash - hash stored on shipment system object from prior sync
     * @return {boolean} - true when relevant data had changed since last sync to TaxJar
     */
    hasRequestBodyChanged: function (previousHash) {
        var newHash = this.getRequestBodyHash();
        return newHash !== previousHash;
    },

    /**
     * Checks to see if transaction was modified after last sync to TaxJar
     * @return {boolean} - true when relevant data to TaxJar was changed since last sync
     */
    wasUpdatedAfterLastSync: function () {
        var lastSyncHash = this.getLastSyncHash();
        return this.hasRequestBodyChanged(lastSyncHash);
    },

    /**
     * Logs debug message to transaction sync log file
     * @param  {string} message - message to log
     * @return {void}
     */
    logMessage: function (message) {
        var log = this.getLog();
        log.debug('[TaxJar Transaction #' + this.getTransactionID() + '] ' + message);
    },

    /**
     * Gets transaction sync logger
     * @return {dw.System.Log} - TaxJar transaction sync logger
     */
    getLog: function () {
        if (!this.log) {
            this.log = Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar');
        }

        return this.log;
    }

};

module.exports = BaseTransaction;
