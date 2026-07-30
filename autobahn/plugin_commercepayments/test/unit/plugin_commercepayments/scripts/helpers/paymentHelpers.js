'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var Money = require('../../../../mocks/dw/value/Money');

describe('Payment Helpers', function () {
    var paymentInstrument;
    var giftCertificatePaymentInstrument;
    var basket;
    var BasketMgr;
    var Transaction;
    var paymentHelpers;
    beforeEach(function () {
        paymentInstrument = {};
        giftCertificatePaymentInstrument = {
            paymentTransaction: {
                amount: new Money(5, 'USD')
            }
        };
        basket = {
            totalGrossPrice: new Money(10, 'USD'),
            giftCertificatePaymentInstruments: {
                toArray: function () {
                    return [giftCertificatePaymentInstrument];
                }
            },
            getPaymentInstruments: function (method) {
                var array = [];
                if (method === 'Salesforce Payments') {
                    array.push(paymentInstrument);
                }
                return {
                    toArray: function () {
                        return array;
                    }
                };
            },
            removePaymentInstrument: sinon.stub()
        };
        BasketMgr = {
            currentBasket: basket
        };
        Transaction = {
            wrap: sinon.stub().callsArg(0)
        };
        paymentHelpers = proxyquire('../../../../../cartridges/plugin_commercepayments/cartridge/scripts/helpers/paymentHelpers', {
            'dw/value/Money': Money,
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                calculateBuyNowData: function () {
                    return 'Calculated Buy now data';
                }
            },
            'dw/order/BasketMgr': BasketMgr,
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'uid12345';
                }
            },
            'dw/system/Transaction': Transaction,
            'dw/extensions/payments/SalesforcePaymentRequest': function () {
                return {
                    addInclude: function () {}
                };
            }
        });
    });

    describe('getPaymentAmount', function () {
        it('should return the basket total less gift certificates', function () {
            var amount = paymentHelpers.getPaymentAmount(basket);
            assert.equal(amount.value, 5);
        });
    });

    describe('removePaymentInstruments', function () {
        it('should remove Salesforce Payments payment instruments in a transaction', function () {
            paymentHelpers.removePaymentInstruments(basket);
            assert.isTrue(Transaction.wrap.calledOnce);
            assert.isTrue(basket.removePaymentInstrument.calledOnce);
            assert.isTrue(basket.removePaymentInstrument.calledWith(paymentInstrument));
        });
    });

    describe('getBuyNowData', function () {
        it('should return the calculated Buy now data', function () {
            var product = {
                price: {
                    sales: {
                        value: '10.99',
                        currency: 'USD'
                    }
                }
            };
            var buyNowData = paymentHelpers.getBuyNowData(product);
            assert.equal(buyNowData, 'Calculated Buy now data');
        });
    });

    describe('createPaymentRequestData', function () {
        describe('current basket', function () {
            it('should return the payment request data with basket payment amount total', function () {
                var paymentRequestData = paymentHelpers.createPaymentRequestData();
                assert.equal(paymentRequestData.paymentRequestId, 'paymentrequest-uid12345');
                assert.equal(paymentRequestData.elementClass, 'salesforce-paymentrequest-element-uid12345');
                assert.equal(paymentRequestData.errorsClass, 'salesforce-paymentrequest-element-errors-uid12345');
                assert.isNotNull(paymentRequestData.paymentRequest);
                assert.equal(paymentRequestData.total, 5);
            });
        });

        describe('no current basket', function () {
            beforeEach(function () {
                delete BasketMgr.currentBasket;
            });

            it('should return the payment request data with 0 total', function () {
                var paymentRequestData = paymentHelpers.createPaymentRequestData();
                assert.equal(paymentRequestData.paymentRequestId, 'paymentrequest-uid12345');
                assert.equal(paymentRequestData.elementClass, 'salesforce-paymentrequest-element-uid12345');
                assert.equal(paymentRequestData.errorsClass, 'salesforce-paymentrequest-element-errors-uid12345');
                assert.isNotNull(paymentRequestData.paymentRequest);
                assert.equal(paymentRequestData.total, 0);
            });
        });

        describe('payment amount is N/A', function () {
            beforeEach(function () {
                basket.totalGrossPrice = {
                    available: false
                };
                basket.giftCertificatePaymentInstruments = {
                    toArray: function () {
                        return [];
                    }
                };
            });

            it('should return the payment request data with 0 total', function () {
                var paymentRequestData = paymentHelpers.createPaymentRequestData();
                assert.equal(paymentRequestData.paymentRequestId, 'paymentrequest-uid12345');
                assert.equal(paymentRequestData.elementClass, 'salesforce-paymentrequest-element-uid12345');
                assert.equal(paymentRequestData.errorsClass, 'salesforce-paymentrequest-element-errors-uid12345');
                assert.isNotNull(paymentRequestData.paymentRequest);
                assert.equal(paymentRequestData.total, 0);
            });
        });
    });
});
