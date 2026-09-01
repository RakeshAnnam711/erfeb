const { int_paypal: { orderDataHashPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe } = require('mocha');
const { stub } = require('sinon');

const encodeString = stub();

let encodedPurchaseUnit = '123';

const CacheMgr = {
    getCache: () => {
        return {
            put: (_, value) => {
                encodedPurchaseUnit = value;
            },
            get: () => encodedPurchaseUnit,
            invalidate: () => {
                encodedPurchaseUnit = null;
            }
        };
    }
};

const proxyquire = require('proxyquire').noCallThru();

const OrderDataHash = proxyquire(orderDataHashPath, {
    'dw/system/CacheMgr': CacheMgr,
    'dw/system/Site': {
        current: {
            ID: 'RefArch'
        }
    },
    '*/cartridge/scripts/paypal/utils': {
        encodeString
    }
});

describe('OrderDataHash model', () => {
    const result = new OrderDataHash();

    it('should return an object', () => {
        expect(result).to.be.an('object');
    });

    it('should contain: ENCODED_PURCHASE_UNIT_STRING, orderDataHash, encodedPurchaseUnit keys', () => {
        expect(Object.keys(result)).to.deep.equal(['ENCODED_PURCHASE_UNIT_STRING', 'orderDataHash', 'encodedPurchaseUnit']);
    });

    describe('set', () => {
        after(() => {
            encodeString.reset();
            encodedPurchaseUnit = '123';
        });

        it('should set the encodedPurchaseUnit if the encodedPurchaseUnit is not set before', () => {
            encodeString.returns('123');
            result.encodedPurchaseUnit = null;

            result.set();

            expect(result.encodedPurchaseUnit).to.deep.equal('123');
        });

        it('should set the encodedPurchaseUnit if it is set and the paypalUtils.encodeString returns different value', () => {
            encodeString.returns('1234');

            result.encodedPurchaseUnit = '123';

            result.set();

            expect(result.encodedPurchaseUnit).to.deep.equal('1234');
        });

        it('should not set the encodedPurchaseUnit if it is set and the paypalUtils.encodeString returns the same value', () => {
            encodeString.returns('1234');
            result.encodedPurchaseUnit = '1234';

            result.set();

            expect(result.encodedPurchaseUnit).to.deep.equal('1234');
        });
    });

    describe('get', () => {
        it('should returns the encodedPurchaseUnit', () => {
            expect(result.get()).to.deep.equal(encodedPurchaseUnit);
        });
    });

    describe('clear', () => {
        it('should empty the orderDataHash as well as encodedPurchaseUnit', () => {
            result.clear();

            expect(encodedPurchaseUnit).to.be.null;
            expect(result.encodedPurchaseUnit).to.be.null;
        });
    });
});
