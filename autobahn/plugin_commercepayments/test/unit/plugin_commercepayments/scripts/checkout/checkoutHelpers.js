'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');

var Money = require('../../../../mocks/dw/value/Money');
var Resource = require('../../../../mocks/dw/web/Resource');
var mockSuperModule = require('../../../mockModuleSuperModule.js');
var superModule = {};

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('checkoutHelpers', function () {
    var paymentInstrument = {};
    var product = {};
    var shippingMethod = {
        ID: 's1'
    };

    var Transaction = {
        wrap: sinon.stub().callsArg(0)
    };

    var basket;
    var order;
    var paymentRequestOptions;
    var ProductMgr;
    var ShippingMgr;
    var TaxMgr;
    var BasketMgr;
    var OrderMgr;
    var SalesforcePaymentRequest;
    var Logger;
    var checkoutHelpers;
    before(function () {
        mockSuperModule.create(superModule);
    });
    after(function () {
        mockSuperModule.remove();
    });
    beforeEach(function () {
        basket = {};
        order = {
            totalNetPrice: new Money(10, 'USD'),
            paymentInstruments: [paymentInstrument]
        };
        paymentRequestOptions = {};

        ProductMgr = {
            getProduct: function () {
                return product;
            }
        };

        ShippingMgr = {
            defaultShippingMethod: shippingMethod,
            getShippingCost: function () {
                return new Money(4, 'USD');
            },
            getProductShippingModel: function () {
                return {
                    getShippingCost: function () {
                        return null;
                    }
                };
            }
        };

        TaxMgr = {
            TAX_POLICY_GROSS: 'GROSS',
            defaultTaxClassID: 'taxClass',
            defaultTaxJurisdictionID: 'taxJurisdiction',
            taxationPolicy: 'GROSS',
            getTaxRate: function () {
                return 0.5;
            }
        };

        BasketMgr = {
            currentBasket: basket
        };

        OrderMgr = {
            failOrder: sinon.stub()
        };

        SalesforcePaymentRequest = {
            calculatePaymentRequestOptions: sinon.stub().returns(paymentRequestOptions)
        };

        Logger = {
            error: sinon.stub()
        };

        checkoutHelpers = proxyquire('../../../../../cartridges/plugin_commercepayments/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/value/Money': Money,
            'dw/web/Resource': Resource,
            'dw/catalog/ProductMgr': ProductMgr,
            'dw/order/ShippingMgr': ShippingMgr,
            'dw/order/TaxMgr': TaxMgr,
            'dw/order/BasketMgr': BasketMgr,
            'dw/order/OrderMgr': OrderMgr,
            'dw/system/Transaction': Transaction,
            'dw/system/Logger': Logger,
            'dw/extensions/payments/SalesforcePaymentRequest': SalesforcePaymentRequest
        });
    });

    describe('handleCommercePayments', function () {
        describe('order with NA totalNetPrice', function () {
            it('should return an empty object', function () {
                order.totalNetPrice = {
                    available: false
                };
                assert.deepEqual(checkoutHelpers.handleCommercePayments(order), {});
            });
        });

        describe('order with zero totalNetPrice', function () {
            it('should return an empty object', function () {
                order.totalNetPrice = new Money(0, 'USD');
                assert.deepEqual(checkoutHelpers.handleCommercePayments(order), {});
            });
        });

        describe('order without payment instruments', function () {
            it('should fail the order and return error', function () {
                order.paymentInstruments = [];
                assert.deepEqual(checkoutHelpers.handleCommercePayments(order), {
                    error: true
                });

                assert.isTrue(Transaction.wrap.calledOnce);
                assert.isTrue(OrderMgr.failOrder.calledOnce);
                assert.isTrue(OrderMgr.failOrder.calledWith(order, true));
            });
        });

        describe('order has payment instruments', function () {
            it('should return an empty object', function () {
                assert.deepEqual(checkoutHelpers.handleCommercePayments(order), {});
            });
        });
    });

    describe('calculateBuyNowData', function () {
        describe('gross taxation', function () {
            it('should calculate data', function () {
                var data = checkoutHelpers.calculateBuyNowData('p1', 1, new Money(10, 'USD'), null);

                assert.equal(data.basketData.sku, 'p1');
                assert.equal(data.basketData.quantity, 1);
                assert.equal(data.basketData.shippingMethod, 's1');
                assert.equal(data.basketData.options.length, 0);

                assert.equal(data.options.currency, 'USD');
                assert.equal(data.options.total.label, Resource.msg('label.item.total', 'salesforcepayments', null));
                assert.equal(data.options.total.amount, '14');
                assert.equal(data.options.displayItems.length, 2);
                assert.equal(data.options.displayItems[0].label, Resource.msg('label.item.subtotal', 'salesforcepayments', null));
                assert.equal(data.options.displayItems[0].amount, '10');
                assert.equal(data.options.displayItems[1].label, shippingMethod.ID);
                assert.equal(data.options.displayItems[1].amount, '4');
                assert.equal(data.options.shippingOptions.length, 1);
                assert.equal(data.options.shippingOptions[0].id, shippingMethod.ID);
                assert.equal(data.options.shippingOptions[0].label, shippingMethod.displayName);
                assert.equal(data.options.shippingOptions[0].detail, shippingMethod.description);
                assert.equal(data.options.shippingOptions[0].amount, '4');
            });
        });

        describe('net taxation', function () {
            beforeEach(function () {
                TaxMgr.taxationPolicy = 'NET';
            });

            it('should calculate data for net taxation sites', function () {
                var data = checkoutHelpers.calculateBuyNowData('p1', 1, new Money(10, 'USD'), null);

                assert.equal(data.basketData.sku, 'p1');
                assert.equal(data.basketData.quantity, 1);
                assert.equal(data.basketData.shippingMethod, 's1');
                assert.equal(data.basketData.options.length, 0);

                assert.equal(data.options.currency, 'USD');
                assert.equal(data.options.total.label, Resource.msg('label.item.total', 'salesforcepayments', null));
                assert.equal(data.options.total.amount, '21');
                assert.equal(data.options.displayItems.length, 3);
                assert.equal(data.options.displayItems[0].label, Resource.msg('label.item.subtotal', 'salesforcepayments', null));
                assert.equal(data.options.displayItems[0].amount, '10');
                assert.equal(data.options.displayItems[1].label, shippingMethod.ID);
                assert.equal(data.options.displayItems[1].amount, '4');
                assert.equal(data.options.displayItems[2].label, Resource.msg('label.item.tax', 'salesforcepayments', null));
                assert.equal(data.options.displayItems[2].amount, '7');
                assert.equal(data.options.shippingOptions.length, 1);
                assert.equal(data.options.shippingOptions[0].id, shippingMethod.ID);
                assert.equal(data.options.shippingOptions[0].label, shippingMethod.displayName);
                assert.equal(data.options.shippingOptions[0].detail, shippingMethod.description);
                assert.equal(data.options.shippingOptions[0].amount, '4');
            });

            it('should omit zero shipping and tax line items', function () {
                TaxMgr.getTaxRate = function () {
                    return 0;
                };
                ShippingMgr.getShippingCost = function () {
                    return new Money(0, 'USD');
                };

                var data = checkoutHelpers.calculateBuyNowData('p1', 2, new Money(10, 'USD'), null);

                assert.equal(data.basketData.sku, 'p1');
                assert.equal(data.basketData.quantity, 2);
                assert.equal(data.basketData.shippingMethod, 's1');
                assert.equal(data.basketData.options.length, 0);

                assert.equal(data.options.currency, 'USD');
                assert.equal(data.options.total.label, Resource.msg('label.item.total', 'salesforcepayments', null));
                assert.equal(data.options.total.amount, '20');
                assert.equal(data.options.displayItems.length, 1);
                assert.equal(data.options.displayItems[0].label, Resource.msg('label.item.subtotal', 'salesforcepayments', null));
                assert.equal(data.options.displayItems[0].amount, '20');
                assert.equal(data.options.shippingOptions.length, 1);
                assert.equal(data.options.shippingOptions[0].id, shippingMethod.ID);
                assert.equal(data.options.shippingOptions[0].label, shippingMethod.displayName);
                assert.equal(data.options.shippingOptions[0].detail, shippingMethod.description);
                assert.equal(data.options.shippingOptions[0].amount, '0');
            });

            it('should include options', function () {
                var options = [{
                    id: 'o1',
                    selectedValueId: 'ov1'
                }, {
                    id: 'o2',
                    selectedValueId: 'ov2'
                }];

                var data = checkoutHelpers.calculateBuyNowData('p1', 1, new Money(10, 'USD'), options);

                assert.equal(data.basketData.sku, 'p1');
                assert.equal(data.basketData.quantity, 1);
                assert.equal(data.basketData.shippingMethod, 's1');
                assert.equal(data.basketData.options.length, 2);
                assert.equal(data.basketData.options[0].id, options[0].id);
                assert.equal(data.basketData.options[0].valueId, options[0].selectedValueId);
                assert.equal(data.basketData.options[1].id, options[1].id);
                assert.equal(data.basketData.options[1].valueId, options[1].selectedValueId);

                assert.equal(data.options.currency, 'USD');
                assert.equal(data.options.total.label, Resource.msg('label.item.total', 'salesforcepayments', null));
                assert.equal(data.options.total.amount, '21');
                assert.equal(data.options.displayItems.length, 3);
                assert.equal(data.options.displayItems[0].label, Resource.msg('label.item.subtotal', 'salesforcepayments', null));
                assert.equal(data.options.displayItems[0].amount, '10');
                assert.equal(data.options.displayItems[1].label, shippingMethod.ID);
                assert.equal(data.options.displayItems[1].amount, '4');
                assert.equal(data.options.displayItems[2].label, Resource.msg('label.item.tax', 'salesforcepayments', null));
                assert.equal(data.options.displayItems[2].amount, '7');
                assert.equal(data.options.shippingOptions.length, 1);
                assert.equal(data.options.shippingOptions[0].id, shippingMethod.ID);
                assert.equal(data.options.shippingOptions[0].label, shippingMethod.displayName);
                assert.equal(data.options.shippingOptions[0].detail, shippingMethod.description);
                assert.equal(data.options.shippingOptions[0].amount, '4');
            });

            it('should include product specific shipping', function () {
                ShippingMgr.getProductShippingModel = function () {
                    return {
                        getShippingCost: function () {
                            return {
                                amount: new Money(2, 'USD')
                            };
                        }
                    };
                };

                var data = checkoutHelpers.calculateBuyNowData('p1', 1, new Money(10, 'USD'), null);

                assert.equal(data.basketData.sku, 'p1');
                assert.equal(data.basketData.quantity, 1);
                assert.equal(data.basketData.shippingMethod, 's1');
                assert.equal(data.basketData.options.length, 0);

                assert.equal(data.options.currency, 'USD');
                assert.equal(data.options.total.label, Resource.msg('label.item.total', 'salesforcepayments', null));
                assert.equal(data.options.total.amount, '24');
                assert.equal(data.options.displayItems.length, 3);
                assert.equal(data.options.displayItems[0].label, Resource.msg('label.item.subtotal', 'salesforcepayments', null));
                assert.equal(data.options.displayItems[0].amount, '10');
                assert.equal(data.options.displayItems[1].label, shippingMethod.ID);
                assert.equal(data.options.displayItems[1].amount, '6');
                assert.equal(data.options.displayItems[2].label, Resource.msg('label.item.tax', 'salesforcepayments', null));
                assert.equal(data.options.displayItems[2].amount, '8');
                assert.equal(data.options.shippingOptions.length, 1);
                assert.equal(data.options.shippingOptions[0].id, shippingMethod.ID);
                assert.equal(data.options.shippingOptions[0].label, shippingMethod.displayName);
                assert.equal(data.options.shippingOptions[0].detail, shippingMethod.description);
                assert.equal(data.options.shippingOptions[0].amount, '6');
            });
        });
    });

    describe('calculatePaymentRequestOptions', function () {
        describe('script API function exists', function () {
            it('should call the API and return the result', function () {
                assert.equal(checkoutHelpers.calculatePaymentRequestOptions(), paymentRequestOptions);
                assert.isTrue(SalesforcePaymentRequest.calculatePaymentRequestOptions.calledOnce);
                assert.isTrue(SalesforcePaymentRequest.calculatePaymentRequestOptions.calledWith(basket, {}));
            });

            it('should call the API and log an error', function () {
                var e = new Error();
                SalesforcePaymentRequest.calculatePaymentRequestOptions.throws(e);
                assert.equal(checkoutHelpers.calculatePaymentRequestOptions(), null);
                assert.isTrue(SalesforcePaymentRequest.calculatePaymentRequestOptions.calledOnce);
                assert.isTrue(SalesforcePaymentRequest.calculatePaymentRequestOptions.calledWith(basket, {}));
                assert.isTrue(Logger.error.calledOnce);
                assert.isTrue(Logger.error.calledWith(e));
            });
        });
    });
});
