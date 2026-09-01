/* eslint-disable object-curly-newline */
/* eslint-disable no-underscore-dangle */
const { bm_paypal: { createOrderTrackingPath } } = require('../path.json');

const { expect } = require('chai');
const { stub } = require('sinon');
const { describe, it } = require('mocha');

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const proxyquire = require('proxyquire').noCallThru();

const addTrackingAPI = stub();

const orders = [
    {
        paymentInstrument: {
            method: 'PayPal',
            custom: {
                paypalPaymentStatus: 'CREATED'
            }
        }
    },
    {
        paymentInstrument: {
            method: 'CreditCard',
            custom: {
                paypalPaymentStatus: 'COMPLETED'
            }
        },
        shipments: [{
            trackingNumber: 'trackingNumber'
        }]
    },
    {
        paymentInstrument: {
            method: 'PayPal',
            custom: {
                paypalPaymentStatus: 'COMPLETED'
            }
        },
        shipments: [{
            trackingNumber: ''
        }]
    },
    {}
];

const createOrderTracking = proxyquire(createOrderTrackingPath, {
    'dw/order/OrderMgr': {
        searchOrders: () => ({
            asList: () => ({
                toArray: () => orders
            })
        })
    },
    'dw/system/Status': dw.system.Status,
    '~/cartridge/scripts/paypal/api/paypal': {
        addTrackingAPI: addTrackingAPI
    }
});

describe('createOrderTrackingPath file', () => {
    describe('getOrders', () => {
        const getOrders = createOrderTracking.__get__('getOrders');

        it('should return orders', () => {
            const result = getOrders(7);

            expect(result).to.be.deep.equal([
                {
                    paymentInstrument: {
                        method: 'CreditCard',
                        custom: {
                            paypalPaymentStatus: 'COMPLETED'
                        }
                    },
                    shipments: [{
                        trackingNumber: 'trackingNumber'
                    }]
                },
                {
                    paymentInstrument: {
                        method: 'PayPal',
                        custom: {
                            paypalPaymentStatus: 'COMPLETED'
                        }
                    },
                    shipments: [{
                        trackingNumber: ''
                    }]
                }
            ]);
        });
    });

    describe('createOrderTracking', () => {
        const parameters = {
            Days: 7
        };

        it('should call paypal tracking API', () => {
            createOrderTracking.createOrderTracking(parameters);

            expect(addTrackingAPI.calledOnce).to.be.true;
        });
    });
});
