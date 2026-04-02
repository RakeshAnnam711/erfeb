'use strict';

var Site = require('dw/system/Site');
var constants = require('*/cartridge/scripts/bmConstants');
var storefrontConstants = require('*/cartridge/scripts/constants');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var TaxService = require('*/cartridge/scripts/init/initVertexApi.js').CalculateTax;
var AreaService = require('*/cartridge/scripts/init/initVertexApi.js').LookupTaxAreas;
var ProductMgr = require('dw/catalog/ProductMgr');
var logger = require('dw/system/Logger');

/**
 * Vertex service api helpers
 */
function API() {}

API.prototype = {
    currentSite   : Site.getCurrent(),
    allowedFields : constants.ALLOWED_FIELDS,
    toggleFields  : constants.TOGGLE_FIELDS,
    getConfig     : function () {
        return constants.PREFERENCES;
    },
    saveForm: function (form) {
        if (!empty(form)) {
            try {
                var prefs = require('dw/system/Site').getCurrent().preferences.custom;

                Transaction.begin();

                for (var index in this.allowedFields) {
                    var fieldName = this.allowedFields[index];
                    var formFieldValue = form[fieldName].value;

                    if (this.toggleFields.indexOf(fieldName) !== -1) {
                        if (prefs[fieldName] == false && formFieldValue == null) {
                            continue;
                        } else if (prefs[fieldName] == true && formFieldValue == null) {
                            formFieldValue = !prefs[fieldName];
                        } else if (prefs[fieldName] == false && formFieldValue != null) {
                            formFieldValue = true;
                        } else {
                            formFieldValue = prefs[fieldName];
                        }
                    }

                    Transaction.wrap(function () {
                        prefs[fieldName] = formFieldValue;
                    });
                }

                Transaction.commit();

                Transaction.begin();
                if (!empty(prefs.Vertex_TrustedId)) {
                    prefs.Vertex_UserName = '';
                    prefs.Vertex_Password = '';
                } else if (empty(prefs.Vertex_UserName) || empty(prefs.Vertex_Password)) {
                    throw new Error('credentials');
                }
                Transaction.commit();
            } catch (e) {
                Transaction.rollback();
                return this.getError(e);
            }
        }
    },
    healthCheck: function () {
        var result = {
            areaResponse : {},
            taxResponse  : {}
        };
        var startPos;
        var endPos;

        if (request.httpParameterMap.job.stringValue === 'taxService') {
            var taxResponse = this.checkTaxCalculateService();

            result.taxResponse.status = taxResponse.ok;
            if (!taxResponse.ok) {
                result.taxResponse.error = taxResponse.msg || taxResponse.errorMessage;
                logger.error(result.taxResponse.error);
                if (result.taxResponse.error.indexOf('Wrapped') !== -1) {
                    startPos = result.taxResponse.error.indexOf('Wrapped') === -1 ? 0 : result.taxResponse.error.indexOf('Wrapped') + 7;
                    if (result.taxResponse.error.lastIndexOf('(') !== -1) {
                        endPos = result.taxResponse.error.lastIndexOf('(') - 1;
                        result.taxResponse.error = result.taxResponse.error.slice(startPos, endPos);
                    } else {
                        result.taxResponse.error = result.taxResponse.error.slice(startPos);
                    }
                }
            } else if (taxResponse.object.totalTax != 6) {
                result.taxResponse.error = 'Invalid test taxCalc response: TotalTax for mock request should be 6 instead of ' + taxResponse.object.totalTax;
                logger.error(result.taxResponse.error);
                
            }
        }

        if (request.httpParameterMap.job.stringValue === 'lookupService') {
            var areaResponse = this.checkTaxAreaLookupService();

            result.areaResponse.status = areaResponse.ok;
            if (!areaResponse.ok || areaResponse.object.response !== 'NORMAL') {
                result.areaResponse.error = areaResponse.msg || areaResponse.errorMessage;
                logger.error(result.areaResponse.error);
                if (result.areaResponse.error.indexOf('Wrapped') !== -1) {
                    startPos = result.areaResponse.error.indexOf('Wrapped') === -1 ? 0 : result.areaResponse.error.indexOf('Wrapped') + 7;
                    if (result.areaResponse.error.lastIndexOf('(') !== -1) {
                        endPos = result.areaResponse.error.lastIndexOf('(') - 1;
                        result.areaResponse.error = result.areaResponse.error.slice(startPos, endPos);
                    } else {
                        result.areaResponse.error = result.areaResponse.error.slice(startPos);
                    }
                }
            }
        }
        return result;
    },
    checkTaxAreaLookupService: function () {
        return AreaService.call(constants.TAX_AREA_LOOKUP_MOCK_DATA, storefrontConstants);
    },
    checkTaxCalculateService: function (productID) {
        return TaxService.call('CalculateTax', {
            constants   : storefrontConstants,
            requestType : 'Quotation',
            cart        : productID != null ? this.cart_custom_product(productID) : constants.CART_MOCK_DATA,
            MOCK_DATA   : constants.TAX_AREA_LOOKUP_MOCK_DATA
        });
    },
    getError: function (exception) {
        switch (exception.javaMessage || exception.message) {
            case 'Type does not exist: Vertex':
                return Resource.msg('error.customObjectsError', 'vertex', null);
            case 'Service not found':
                return Resource.msg('error.servicesError', 'vertex', null);
            case 'Auth Error':
                return Resource.msg('error.authError', 'vertex', null);
            case 'SSL Error':
                return Resource.msg('error.sslError', 'vertex', null);
            case 'credentials':
                return 'Trusted ID OR Username and Password should be entered';
            default:
                return Resource.msg('error.unhandledError', 'vertex', null);
        }
    },

    cart_custom_product: function (productID) {
        var product = ProductMgr.getProduct(productID);
        if (!empty(product)) {
            return {
                getAllLineItems: function () {
                    return {
                        iterator: function () {
                            return {
                                count   : 1,
                                hasNext : function () {
                                    return this.count > 0;
                                },
                                next: function () {
                                    this.count -= 1;
                                    return {
                                        quantity: {
                                            value: 5
                                        },
                                        constructor: {
                                            name: 'dw.order.ProductLineItem'
                                        },
                                        productName : product.name,
                                        ID          : product.ID,
                                        price       : {
                                            decimalValue: product.priceModel.price.value ? product.priceModel.price.value : product.priceModel.minPrice.value
                                        },
                                        proratedPrice: {
                                            decimalValue: product.priceModel.price.value ? product.priceModel.price.value : product.priceModel.minPrice.value
                                        },
                                        product: product
                                    };
                                }
                            };
                        }
                    };
                },
                defaultShipment: {
                    shippingLineItems: {
                        iterator: function () {
                            return [];
                        }
                    }
                },
                customer: {
                    authenticated : true,
                    registered    : true
                },
                customerNo: '00008003'
            };
        }

        return constants.CART_MOCK_DATA;
    }
};

module.exports = new API();
