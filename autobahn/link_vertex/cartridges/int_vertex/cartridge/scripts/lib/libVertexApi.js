'use strict';

var constants = require('*/cartridge/scripts/constants');
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');
var vertexLogger = require('*/cartridge/scripts/lib/generalLogger');
var moduleName = 'libVertexApi~';
/**
 * Main entrance for VERTEX functionality
 */
function API() {
    this.isEnabled = constants.isEnabled;
    this.isInvoiceEnabled = constants.isInvoiceEnabled;
    this.isCleansingEnabled = constants.isAddressCleansingEnabled;
    this.isVATEnabled = constants.isVATEnabled;
}

API.prototype = {
    DeleteTransaction: function (transactionId, source) {
        var logLocation = moduleName + 'DeleteTransaction()';
        var serviceResult = false;
        var TaxService = require('*/cartridge/scripts/init/initVertexApi.js').CalculateTax;

        try {
            TaxService.setThrowOnError().call('DeleteTransaction', { constants: constants, transactionId: transactionId, sender: source });
            serviceResult = true;
        } catch (serviceError) {
            vertexLogger.error(logLocation, 'DeleteTransaction call failed. Cause:' + serviceError.message);
        }

        return serviceResult;
    },
    LookupTaxArea: function (form, cart) {
        var logLocation = moduleName + 'LookupTaxArea()';
        var response = {
            result    : true,
            message   : '',
            addresses : []
        };
        var AreaService;
        var Helper = require('*/cartridge/scripts/helper/helper');

        if (!this.isEnabled) {
            vertexLogger.error(logLocation, 'Vertex service is disabled');
            return response;
        }

        if (!this.isCleansingEnabled) {
            vertexLogger.error(logLocation, 'Vertex Address Cleansing is disabled');
            return response;
        }

        this.resetTaxes(cart);

        AreaService = require('*/cartridge/scripts/init/initVertexApi.js').LookupTaxAreas;
        var lookupResult = AreaService.call(form, constants);

        switch (lookupResult.status) {
            case 'ERROR':
                response.result = false;
                response.message = lookupResult.msg;
                vertexLogger.error(logLocation, response.message || response.msg || response.errorMessage);
                break;
            case 'SERVICE_UNAVAILABLE':
                vertexLogger.error(logLocation, response.message || response.msg || response.errorMessage);
                break;
            default:
                if (typeof lookupResult.object.response === 'string') response.result = (lookupResult.object.response === 'NORMAL');

                if (response.result && lookupResult.object.addresses.length) {
                    var normalizedAddresses = Helper.beautifyAddresses(form, lookupResult.object.addresses);
                    response.result = Helper.isEqualAddresses(normalizedAddresses);
                    normalizedAddresses.push(Helper.getCurrentNormalizedAddress());
                    response.addresses = normalizedAddresses;
                } else {
                    response.result = false;
                }
                response.message = lookupResult.object.message;
        }
        return response;
    },

    CalculateTax: function (requestType, cart) {
        var logLocation = moduleName + 'CalculateTax()';
        var response = {
            result  : true,
            message : ''
        };
        var TaxService;

        if (!this.isEnabled) {
            vertexLogger.error(logLocation, 'Vertex service is disabled');
            return response;
        }

        if (requestType == 'Invoice' && !this.isInvoiceEnabled) {
            vertexLogger.error(logLocation, 'Vertex Invoice Request is disabled');
            return response;
        }

        TaxService = require('*/cartridge/scripts/init/initVertexApi.js').CalculateTax;
        var calculationResponse = TaxService.call('CalculateTax', { constants: constants, requestType: requestType, cart: cart });

        if (calculationResponse.status) {
            switch (calculationResponse.status) {
                case 'ERROR':
                    response.result = false;
                    response.message = 'Invalid address';
                    vertexLogger.debug(logLocation, 'calculationResponse.status == ERROR');
                    this.resetTaxes(cart);
                    break;
                case 'SERVICE_UNAVAILABLE':
                    vertexLogger.error(logLocation, calculationResponse.msg || calculationResponse.errorMessage);
                    this.resetTaxes(cart);
                    break;
                default:
                    var taxationDetails = [];

                    if (calculationResponse.object && calculationResponse.object.lineItem) {
                        var totalOrderTax = 0;

                        for (var itemKey = 0; itemKey < calculationResponse.object.lineItem.size(); itemKey += 1) {
                            var vertexLineItem = calculationResponse.object.lineItem[itemKey];
                            var lineItemId = vertexLineItem.lineItemId.split('??');
                            var taxRateCount = 0;
                            var totalTaxCount = 0;
                            var jurisdictionLevel = '';
                            var taxRate = 0;
                            var calculatedTax = 0;
                            var jurisdictionID = 0;
                            var taxable;

                            for (var taxItem = 0; taxItem < vertexLineItem.taxes.length; taxItem += 1) {
                                var tax = vertexLineItem.taxes[taxItem];

                                jurisdictionID = tax.getJurisdiction().getJurisdictionId();
                                jurisdictionLevel = tax.getJurisdiction().getJurisdictionLevel().value();

                                taxRate = tax.getEffectiveRate() * 1;
                                calculatedTax = new Money(tax.getCalculatedTax() * 1, session.getCurrency().currencyCode);

                                taxationDetails.push('Line Item: ' + lineItemId[1]);
                                taxationDetails.push('FairMarket Value: ' + vertexLineItem.getFairMarketValue());
                                taxationDetails.push('Extended Price: ' + vertexLineItem.getExtendedPrice());
                                taxationDetails.push('JurisdictionID: ' + jurisdictionID);
                                taxationDetails.push('Jurisdiction Level: ' + jurisdictionLevel);
                                if (tax.invoiceTextCode.size()) {
                                    taxationDetails.push(' Invoice Tax Code: ' + tax.invoiceTextCode.join('|'));
                                }
                                taxationDetails.push('Tax Rate: ' + taxRate);
                                taxationDetails.push('Calculated Tax: ' + calculatedTax);

                                taxable = new Money(tax.getTaxable() * 1, session.getCurrency().currencyCode);
                                taxRateCount += tax.getEffectiveRate() * 1; // * 1 convert Decimal to Number;
                                totalTaxCount += tax.getCalculatedTax();
                                totalOrderTax += tax.getCalculatedTax();
                            }

                            Transaction.wrap(function () {
                                var shipments = cart.shipments.iterator();
                                var taxAmount = new Money(totalTaxCount, session.getCurrency().currencyCode);
                                while (shipments.hasNext()) {
                                    var shipment = shipments.next();
                                    var lineItems = shipment.allLineItems.iterator();

                                    while (lineItems.hasNext()) {
                                        var lineItem = lineItems.next();
                                        var className = lineItem.constructor.name;
                                        if (className == 'dw.order.ProductLineItem') {
                                            if ((lineItem.productID == lineItemId[1] || lineItem.optionID == lineItemId[1]) && shipment.ID == vertexLineItem.projectNumber) {
                                                lineItem.updateTax(taxRateCount, taxable);
                                                lineItem.updateTaxAmount(taxAmount);
                                            }
                                        } else if (className == 'dw.order.ShippingLineItem') {
                                            if (lineItem.ID == lineItemId[1] && shipment.ID == vertexLineItem.projectNumber) {
                                                lineItem.updateTax(taxRateCount, taxable);
                                                lineItem.updateTaxAmount(taxAmount);
                                            }
                                        } else if (className == 'dw.order.ProductShippingLineItem') {
                                            if (shipment.ID == vertexLineItem.projectNumber) {
                                                if (lineItem.adjustedPrice.decimalValue != 0.00) {
                                                    lineItem.updateTax(taxRateCount, taxable);
                                                    lineItem.updateTaxAmount(taxAmount);
                                                } else {
                                                    lineItem.updateTax(0.00);
                                                }
                                            }
                                        } else {
                                        // price adjustments...
                                            lineItem.updateTax(0.00);
                                        }
                                    }
                                }

                                if (!cart.getPriceAdjustments().empty || !cart.getShippingPriceAdjustments().empty) {
                                // calculate a mix tax rate from
                                    var basketPriceAdjustmentsTaxRate = (cart.getMerchandizeTotalGrossPrice().value / cart.getMerchandizeTotalNetPrice().value) - 1;

                                    var basketPriceAdjustments = cart.getPriceAdjustments().iterator();
                                    while (basketPriceAdjustments.hasNext()) {
                                        var basketPriceAdjustment = basketPriceAdjustments.next();
                                        basketPriceAdjustment.updateTax(0.00);
                                    }

                                    var basketShippingPriceAdjustments = cart.getShippingPriceAdjustments().iterator();
                                    while (basketShippingPriceAdjustments.hasNext()) {
                                        var basketShippingPriceAdjustment = basketShippingPriceAdjustments.next();
                                        basketShippingPriceAdjustment.updateTax(0.00);
                                    }
                                }
                            });
                        }

                        Transaction.wrap(function () {
                        // taxationDetails.push('Jurisdiction ID: ' + jurisdictionID);
                            taxationDetails.push('Total Tax: ' + Math.round(totalOrderTax * 100) / 100);
                            cart.custom.vertex_taxation_details = taxationDetails;
                        });
                    }
            } // end of switch (calculationResponse.status)
        } // if (calculationResponse.status)
        return response;
    },

    /*
     * Set Taxes to 0.00
     */
    resetTaxes: function (basket) {
        var cart;
        try {
            cart = basket.object;
        } catch (e) {
            cart = basket;
        }

        Transaction.wrap(function () {
            var shipments = cart.getShipments().iterator();
            while (shipments.hasNext()) {
                var shipment = shipments.next();
                var shipmentLineItems = shipment.getAllLineItems().iterator();

                while (shipmentLineItems.hasNext()) {
                    var lineItem = shipmentLineItems.next();

                    lineItem.updateTax(0.00);
                }
            }
        });
    },
    /*
     * @example this.log('info' || constants.INFO_LOG, "some errors: {0}", string_variable)
     */
    log: function (level, message, data) {
        var Logger = require('dw/system/Logger').getLogger('VertexInc', 'Vertex.General');
        Logger[level](message, data);
    }
};

module.exports = new API();
