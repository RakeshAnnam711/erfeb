const { bm_paypal: { ppOrderPath } } = require('../path.json');

const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');
const { stub } = require('sinon');

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const getCustom = stub();
const OrderModel = proxyquire(ppOrderPath, {
    '~/cartridge/scripts/paypal/paymentInstrumentHelpers': {
        getPaypalPaymentInstrument: () => {
            return { getCustom };
        }
    }
});

describe('ppOrder file', () => {
    var orderInstans = new OrderModel();

    it('orderModels is a function', () => {
        expect(OrderModel).to.be.an('function');
    });

    it('orderModels getTransactionIdFromOrder function returns \'paypslToken\' if is not empty', () => {
        getCustom.returns({
            paypalToken: 'paypalToken'
        });
        expect(orderInstans.getTransactionIdFromOrder()).to.be.equal('paypalToken');
    });
    it('orderModels getTransactionIdFromOrder function returns \'paypalOrderID\' if is not empty', () => {
        getCustom.returns({
            paypalOrderID: 'paypalOrderID'
        });
        expect(orderInstans.getTransactionIdFromOrder()).to.be.equal('paypalOrderID');
    });
    it('orderModels getTransactionIdFromOrder function returns undefined if paypalToken and paypalOrderID are empty', () => {
        getCustom.returns({
        });
        expect(orderInstans.getTransactionIdFromOrder()).to.be.undefined;
    });
    getCustom.resetBehavior();
});
