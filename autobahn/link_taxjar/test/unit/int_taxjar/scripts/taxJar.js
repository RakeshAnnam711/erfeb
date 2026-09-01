/* global describe, it, beforeEach */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var ProductLineItem = require('../../../mocks/dw/order/ProductLineItem');
var Shipment = require('../../../mocks/dw/order/Shipment');
var Basket = require('../../../mocks/dw/order/Basket');
var Money = require('../../../mocks/dw/value/Money');

describe('taxJar', function () {
    var TaxJar;
    var getValueFromCacheStub;
    var putValueInCacheStub;
    var getCustomPreferenceValueStub;
    var hasNexusStub;
    var getTaxesServiceStub;

    beforeEach(function () {
        getCustomPreferenceValueStub = sinon.stub();
        getCustomPreferenceValueStub.withArgs('TaxJarEnable').returns(true);
        getCustomPreferenceValueStub.withArgs('TaxJarShipFromCountryCode').returns('US');
        getCustomPreferenceValueStub.withArgs('TaxJarShipFromState').returns('UT');
        getCustomPreferenceValueStub.withArgs('TaxJarShipFromZip').returns('84651');
        getCustomPreferenceValueStub.withArgs('TaxJarShipFromCity').returns('Payson');
        getCustomPreferenceValueStub.withArgs('TaxJarShipFromAddress').returns('123 Main St.');

        getValueFromCacheStub = sinon.stub();
        putValueInCacheStub = sinon.stub();
        getTaxesServiceStub = sinon.stub();
        hasNexusStub = sinon.stub();

        TaxJar = proxyquire('../../../../cartridges/int_taxjar/cartridge/scripts/taxJar', {
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        debug: function () {

                        }
                    };
                }
            },
            '*/cartridge/scripts/taxJarService': {
                getTaxes: getTaxesServiceStub
            },
            '*/cartridge/scripts/taxJarNexus': {
                hasNexus: hasNexusStub
            },
            '*/cartridge/scripts/taxJarCustomerUtils': {
                getCustomerExemptionTypeForRegion: function () {
                    return null;
                }
            },
            'dw/crypto/Encoding': {
                fromBase64: function (value) {
                    return value;
                },
                toBase64: function (value) {
                    return value;
                }
            },
            'dw/crypto/MessageDigest': function () {
                return {
                    digestBytes: function () {
                        return 'hash';
                    }
                };
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: getCustomPreferenceValueStub
                    };
                },
                current: {
                    ID: 'siteid'
                }
            },
            'dw/system/CacheMgr': {
                getCache: function () {
                    return {
                        get: getValueFromCacheStub,
                        put: putValueInCacheStub
                    };
                }
            }
        });
    });

    describe('isEnabled', function () {
        it('should return true when custom site preference is enabled', function () {
            var isEnabled = TaxJar.isEnabled();
            assert.isTrue(isEnabled);
        });

        it('should return false when custom site preference is not enabled', function () {
            getCustomPreferenceValueStub.withArgs('TaxJarEnable').returns(false);
            var isEnabled = TaxJar.isEnabled();
            assert.isFalse(isEnabled);
        });
    });

    describe('getShipFromSettings', function () {
        it('should return array of ship from settings', function () {
            var shipFromSettings = TaxJar.getShipFromSettings();
            assert.equal(shipFromSettings.country, 'US');
            assert.equal(shipFromSettings.state, 'UT');
            assert.equal(shipFromSettings.zip, '84651');
            assert.equal(shipFromSettings.city, 'Payson');
            assert.equal(shipFromSettings.street, '123 Main St.');
        });
    });

    describe('calculateEffectiveTaxRate', function () {
        it('should return 0 as effective tax rate', function () {
            var responseItem = {
                tax_collectable: 0.0,
                taxable_amount: 100
            };
            var effectiveRate = TaxJar.calculateEffectiveTaxRate(responseItem);
            assert.equal(effectiveRate, 0);

            var responseItemTwo = {
                tax_collectable: 5,
                taxable_amount: 0.0
            };
            var effectiveRateTwo = TaxJar.calculateEffectiveTaxRate(responseItemTwo);
            assert.equal(effectiveRateTwo, 0);
        });

        it('should calculate effective rate from response item', function () {
            var responseItem = {
                tax_collectable: 5,
                taxable_amount: 100
            };
            var effectiveRate = TaxJar.calculateEffectiveTaxRate(responseItem);
            assert.equal(effectiveRate, 0.05);
        });
    });

    describe('maybeApplyLineItemTax', function () {
        it('should apply tax to line item', function () {
            var lineItem = new ProductLineItem();
            var spy = sinon.spy(lineItem, 'updateTax');
            var responseLineItems = [
                {
                    id: 'notmatchinguuid',
                    combined_tax_rate: 1,
                    tax_collectable: 1,
                    taxable_amount: 100
                },
                {
                    id: 'uuid',
                    combined_tax_rate: 5,
                    tax_collectable: 5,
                    taxable_amount: 100
                }
            ];
            TaxJar.maybeApplyLineItemTax(lineItem, responseLineItems);
            assert.isTrue(spy.calledWith(0.05, lineItem.getProratedPrice()));
        });
    });

    describe('getTaxData', function () {
        it('should get tax data from the cache', function () {
            var requestParams = {};
            var testTaxData = {
                key: 'value'
            };

            getValueFromCacheStub.withArgs('siteidhash').returns(JSON.stringify(testTaxData));

            var taxData = TaxJar.getTaxData(requestParams);

            assert.isTrue(getValueFromCacheStub.calledWith('siteidhash'));
            assert.deepEqual(taxData, testTaxData);
        });

        it('should return false when no tax data in cache and service request fails', function () {
            var requestParams = {};

            getValueFromCacheStub.withArgs('siteidhash').returns(null);
            getTaxesServiceStub.returns(false);

            var taxData = TaxJar.getTaxData(requestParams);

            assert.isTrue(getValueFromCacheStub.calledWith('siteidhash'));
            assert.isFalse(taxData);
        });

        it('should return tax data from service request when no cache data is in cache', function () {
            var requestParams = {};
            var expectedTaxData = {
                key: 'foo'
            };
            var response = {
                object: {
                    text: JSON.stringify(expectedTaxData)
                }
            };

            getValueFromCacheStub.withArgs('siteidhash').returns(null);
            getTaxesServiceStub.returns(response);

            var taxData = TaxJar.getTaxData(requestParams);

            assert.isTrue(getValueFromCacheStub.calledWith('siteidhash'));
            assert.isTrue(putValueInCacheStub.calledWith('siteidhash', JSON.stringify(expectedTaxData)));
            assert.deepEqual(taxData, expectedTaxData);
        });

        it('should return false when service response does not have all necessary data', function () {
            var requestParams = {};
            var response = {
                key: 'foo'
            };

            getValueFromCacheStub.withArgs('siteidhash').returns(null);
            getTaxesServiceStub.returns(response);

            var taxData = TaxJar.getTaxData(requestParams);

            assert.isTrue(getValueFromCacheStub.calledWith('siteidhash'));
            assert.isTrue(putValueInCacheStub.notCalled);
            assert.isFalse(taxData);
        });
    });

    describe('filterProductTaxCode', function () {
        it('should filter standard product tax code', function () {
            var productTaxCode = 'standard';
            var filteredTaxCode = TaxJar.filterProductTaxCode(productTaxCode);

            assert.equal(filteredTaxCode, '');
        });

        it('should not filter taxjar tax code', function () {
            var productTaxCode = '11151700A0000';
            var filteredTaxCode = TaxJar.filterProductTaxCode(productTaxCode);

            assert.equal(filteredTaxCode, productTaxCode);
        });
    });

    describe('buildRequestLineItem', function () {
        it('should build line item data to send to TaxJar', function () {
            var lineItem = new ProductLineItem();
            lineItem.proratedPrice.value = 95;
            lineItem.taxClassID = '';

            var lineItemRequestData = TaxJar.buildRequestLineItem(lineItem);

            var expectedLineItemRequestData = {
                id: 'uuid',
                unit_price: 100,
                quantity: 1,
                discount: 5,
                product_tax_code: ''
            };

            assert.deepEqual(lineItemRequestData, expectedLineItemRequestData);
        });
    });

    describe('builtProductOptionRequestLineItems', function () {
        it('should build line item request data for product option', function () {
            var lineItem = new ProductLineItem();
            var optionLineItem = new ProductLineItem();

            var hasNextStub = sinon.stub();
            hasNextStub.onFirstCall().returns(true);
            hasNextStub.onSecondCall().returns(false);

            var nextStub = sinon.stub();
            nextStub.returns(optionLineItem);

            lineItem.optionProductLineItems = {
                iterator: function () {
                    return {
                        hasNext: hasNextStub,
                        next: nextStub
                    };
                }
            };

            var expectedLineItems = [{
                id: 'uuid',
                unit_price: 100,
                quantity: 1,
                discount: 0,
                product_tax_code: ''
            }];
            var lineItems = TaxJar.builtProductOptionRequestLineItems(lineItem);

            assert.deepEqual(lineItems, expectedLineItems);
        });

        it('should return empty array when no product option line items are present', function () {
            var lineItem = new ProductLineItem();

            var hasNextStub = sinon.stub();
            hasNextStub.onFirstCall().returns(false);

            var nextStub = sinon.stub();
            lineItem.optionProductLineItems = {
                iterator: function () {
                    return {
                        hasNext: hasNextStub,
                        next: nextStub
                    };
                }
            };

            var expectedLineItems = [];
            var lineItems = TaxJar.builtProductOptionRequestLineItems(lineItem);

            assert.deepEqual(lineItems, expectedLineItems);
        });
    });

    describe('shipmentShouldCalculateTax', function () {
        it('should return false when shipment has no shipping address', function () {
            var shipment = new Shipment();
            shipment.shippingAddress = null;

            var shouldCalculateTaxOnShipment = TaxJar.shipmentShouldCalculateTax(shipment);
            assert.isFalse(shouldCalculateTaxOnShipment);
        });

        it('should return false when shipment has no line items', function () {
            var shipment = new Shipment();
            var isEmptyStub = sinon.stub().returns(true);
            shipment.getProductLineItems = function () {
                return {
                    isEmpty: isEmptyStub
                };
            };

            var shouldCalculateTaxOnShipment = TaxJar.shipmentShouldCalculateTax(shipment);
            assert.isTrue(isEmptyStub.calledOnce);
            assert.isFalse(shouldCalculateTaxOnShipment);
        });

        it('should return false when shipment does not have nexus', function () {
            var shipment = new Shipment();
            hasNexusStub.returns(false);

            var shouldCalculateTaxOnShipment = TaxJar.shipmentShouldCalculateTax(shipment);
            assert.isTrue(hasNexusStub.calledOnce);
            assert.isFalse(shouldCalculateTaxOnShipment);
        });

        it('should return true when shipment has necessary data and nexus', function () {
            var shipment = new Shipment();
            hasNexusStub.returns(true);

            var shouldCalculateTaxOnShipment = TaxJar.shipmentShouldCalculateTax(shipment);
            assert.isTrue(hasNexusStub.calledOnce);
            assert.isTrue(shouldCalculateTaxOnShipment);
        });
    });

    describe('buildTaxRequestBody', function () {
        it('should return object containing tax request body', function () {
            var basket = new Basket();
            var shipment = new Shipment();
            var lineItem = new ProductLineItem();

            lineItem.optionProductLineItems = {
                iterator: function () {
                    return {
                        hasNext: function () {
                            return false;
                        },
                        next: function () {
                            return {};
                        }
                    };
                }
            };

            var hasNextStub = sinon.stub();
            hasNextStub.onFirstCall().returns(true);
            hasNextStub.onSecondCall().returns(false);
            var nextStub = sinon.stub();
            nextStub.returns(lineItem);

            shipment.getProductLineItems = function () {
                return {
                    isEmpty: function () {
                        return false;
                    },
                    iterator: function () {
                        return {
                            hasNext: hasNextStub,
                            next: nextStub
                        };
                    }
                };
            };

            var taxRequestBody = TaxJar.buildTaxRequestBody(shipment, basket);

            var expectedRequestBody = {
                from_country: 'US',
                from_state: 'UT',
                from_zip: '84651',
                from_city: 'Payson',
                from_street: '123 Main St.',
                to_country: 'US',
                to_state: 'UT',
                to_city: 'Payson',
                to_street: '123 Main St.',
                to_zip: '84651',
                shipping: 10,
                customer_id: 'customerNo',
                plugin: 'sfcc',
                line_items: [
                    {
                        id: 'uuid',
                        unit_price: 100,
                        quantity: 1,
                        discount: 0,
                        product_tax_code: ''
                    }
                ]
            };

            assert.deepEqual(taxRequestBody, expectedRequestBody);
        });
    });

    describe('isTaxDataValid', function () {
        it('should return false when object is empty', function () {
            var isValid = TaxJar.isTaxDataValid(null);
            assert.isFalse(isValid);
        });

        it('should return false when object is missing tax property', function () {
            var taxData = {
                key: 'value'
            };
            var isValid = TaxJar.isTaxDataValid(taxData);
            assert.isFalse(isValid);
        });

        it('should return false when object is missing tax breakdown', function () {
            var taxData = {
                tax: {

                }
            };
            var isValid = TaxJar.isTaxDataValid(taxData);
            assert.isFalse(isValid);
        });

        it('should return true when tax breakdown is present', function () {
            var taxData = {
                tax: {
                    breakdown: 'value'
                }
            };
            var isValid = TaxJar.isTaxDataValid(taxData);
            assert.isTrue(isValid);
        });
    });

    describe('applyTaxToPriceAdjustments', function () {
        it('should apply 0 rate to basket price adjustments', function () {
            var basket = new Basket();
            var hasNextStub = sinon.stub();
            hasNextStub.onFirstCall().returns(true);
            hasNextStub.onSecondCall().returns(false);
            var updateTaxStub = sinon.stub();
            var nextStub = sinon.stub();
            nextStub.returns({
                updateTax: updateTaxStub
            });

            basket.getPriceAdjustments = function () {
                return {
                    iterator: function () {
                        return {
                            hasNext: hasNextStub,
                            next: nextStub
                        };
                    }
                };
            };

            var shipment = new Shipment();
            var shipmentHasNextStub = sinon.stub();
            shipmentHasNextStub.onFirstCall().returns(true);
            shipmentHasNextStub.onSecondCall().returns(false);
            var shipmentUpdateTaxStub = sinon.stub();
            var shipmentNextStub = sinon.stub();
            shipmentNextStub.returns({
                updateTax: shipmentUpdateTaxStub
            });

            shipment.getShippingPriceAdjustments = function () {
                return {
                    iterator: function () {
                        return {
                            hasNext: shipmentHasNextStub,
                            next: shipmentNextStub
                        };
                    }
                };
            };

            TaxJar.applyTaxToPriceAdjustments(shipment, basket);

            assert.isTrue(updateTaxStub.calledOnce);
            assert.isTrue(updateTaxStub.calledWith(0));

            assert.isTrue(shipmentUpdateTaxStub.calledOnce);
            assert.isTrue(shipmentUpdateTaxStub.calledWith(0));
        });
    });

    describe('applyTaxToProductOptionLineItems', function () {
        it('should apply 0 tax rate to product price adjustments', function () {
            var lineItem = new ProductLineItem();
            var hasNextStub = sinon.stub();
            hasNextStub.onFirstCall().returns(true);
            hasNextStub.onSecondCall().returns(false);
            var updateTaxStub = sinon.stub();
            var nextStub = sinon.stub();
            nextStub.returns({
                updateTax: updateTaxStub
            });

            lineItem.getPriceAdjustments = function () {
                return {
                    iterator: function () {
                        return {
                            hasNext: hasNextStub,
                            next: nextStub
                        };
                    }
                };
            };

            TaxJar.applyTaxToProductPriceAdjustments(lineItem);

            assert.isTrue(updateTaxStub.calledOnce);
            assert.isTrue(updateTaxStub.calledWith(0));
        });
    });

    describe('applyTaxToProductShippingPriceAdjustments', function () {
        it('should apply 0 tax rate to product shipping price adjustments', function () {
            var lineItem = new ProductLineItem();
            var hasNextStub = sinon.stub();
            hasNextStub.onFirstCall().returns(true);
            hasNextStub.onSecondCall().returns(false);
            var updateTaxStub = sinon.stub();
            var nextStub = sinon.stub();
            nextStub.returns({
                updateTax: updateTaxStub
            });

            lineItem.getPriceAdjustments = function () {
                return {
                    iterator: function () {
                        return {
                            hasNext: hasNextStub,
                            next: nextStub
                        };
                    }
                };
            };

            TaxJar.applyTaxToProductShippingPriceAdjustments(lineItem);

            assert.isTrue(updateTaxStub.calledOnce);
            assert.isTrue(updateTaxStub.calledWith(0));
        });
    });

    describe('applyTaxToProductShippingLineItems', function () {
        it('should apply 0 tax rate when shipping is not taxable', function () {
            var updateTaxStub = sinon.stub();
            var lineItem = new ProductLineItem();
            lineItem.getShippingLineItem = function () {
                return {
                    getPriceAdjustments: function () {
                        return {
                            iterator: function () {
                                return {
                                    hasNext: function () {
                                        return false;
                                    }
                                };
                            }
                        };
                    },
                    updateTax: updateTaxStub
                };
            };

            var taxData = {
                tax: {
                    freight_taxable: false
                }
            };

            TaxJar.applyTaxToProductShippingLineItems(taxData, lineItem);

            assert.isTrue(updateTaxStub.calledOnce);
            assert.isTrue(updateTaxStub.calledWith(0));
        });

        it('should apply combined tax rate when shipping is taxable', function () {
            var updateTaxStub = sinon.stub();
            var lineItem = new ProductLineItem();
            var shippingLineItem = new ProductLineItem();
            var money = new Money();

            shippingLineItem.getPriceAdjustments = function () {
                return {
                    iterator: function () {
                        return {
                            hasNext: function () {
                                return false;
                            }
                        };
                    }
                };
            };
            shippingLineItem.updateTax = updateTaxStub;
            shippingLineItem.getAdjustedPrice = function () {
                return money;
            };
            shippingLineItem.getAdjustedTax = function () {
                return {
                    getValue: function () {
                        return 10;
                    }
                };
            };

            lineItem.getShippingLineItem = function () {
                return shippingLineItem;
            };

            var taxData = {
                tax: {
                    freight_taxable: true,
                    breakdown: {
                        shipping: {
                            combined_tax_rate: 10
                        }
                    }
                }
            };

            TaxJar.applyTaxToProductShippingLineItems(taxData, lineItem);

            assert.isTrue(updateTaxStub.calledOnce);
            assert.isTrue(updateTaxStub.calledWith(10, money));
        });
    });

    describe('applyTaxToShippingItems', function () {
        it('should apply 0 tax rate when shipping is not taxable', function () {
            var shipment = new Shipment();
            var shippingLineItem = new ProductLineItem();
            var updateTaxStub = sinon.stub();
            shippingLineItem.updateTax = updateTaxStub;
            var hasNextStub = sinon.stub();
            hasNextStub.onFirstCall().returns(true);
            hasNextStub.onSecondCall().returns(false);

            shipment.getShippingLineItems = function () {
                return {
                    iterator: function () {
                        return {
                            hasNext: hasNextStub,
                            next: function () {
                                return shippingLineItem;
                            }
                        };
                    }
                };
            };

            var taxData = {
                tax: {
                    freight_taxable: false
                }
            };

            TaxJar.applyTaxToShippingItems(taxData, shipment);

            assert.isTrue(updateTaxStub.calledOnce);
            assert.isTrue(updateTaxStub.calledWith(0));
        });

        it('should apply combined tax rate when shipping is taxable', function () {
            var shipment = new Shipment();
            var shippingLineItem = new ProductLineItem();
            var updateTaxStub = sinon.stub();
            shippingLineItem.updateTax = updateTaxStub;
            var hasNextStub = sinon.stub();
            hasNextStub.onFirstCall().returns(true);
            hasNextStub.onSecondCall().returns(false);
            var money = new Money();

            shippingLineItem.getAdjustedPrice = function () {
                return money;
            };
            shippingLineItem.getAdjustedTax = function () {
                return {
                    getValue: function () {
                        return 10;
                    }
                };
            };

            shipment.getShippingLineItems = function () {
                return {
                    iterator: function () {
                        return {
                            hasNext: hasNextStub,
                            next: function () {
                                return shippingLineItem;
                            }
                        };
                    }
                };
            };

            var taxData = {
                tax: {
                    freight_taxable: true,
                    breakdown: {
                        shipping: {
                            combined_tax_rate: 10
                        }
                    }
                }
            };

            TaxJar.applyTaxToShippingItems(taxData, shipment);

            assert.isTrue(updateTaxStub.calledOnce);
            assert.isTrue(updateTaxStub.calledWith(10, money));
        });
    });

    describe('applyTaxToGiftCertificateLineItems', function () {
        it('should apply 0 rate to gift card line items', function () {
            var shipment = new Shipment();
            var hasNextStub = sinon.stub();
            hasNextStub.onFirstCall().returns(true);
            hasNextStub.onSecondCall().returns(false);
            var updateTaxStub = sinon.stub();
            var giftCertfiicateLineItem = {
                updateTax: updateTaxStub
            };

            shipment.getGiftCertificateLineItems = function () {
                return {
                    iterator: function () {
                        return {
                            hasNext: hasNextStub,
                            next: function () {
                                return giftCertfiicateLineItem;
                            }
                        };
                    }
                };
            };

            TaxJar.applyTaxToGiftCertificateLineItems(shipment);

            assert.isTrue(updateTaxStub.calledOnce);
            assert.isTrue(updateTaxStub.calledWith(0));
        });
    });
});
