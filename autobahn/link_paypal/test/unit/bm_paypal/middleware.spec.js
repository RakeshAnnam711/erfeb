const { bm_paypal: { middlewarePath } } = require('../path.json');

const proxyquire = require('proxyquire').noCallThru();
const {
    describe, it, afterEach
} = require('mocha');

const { expect } = require('chai');
const { stub } = require('sinon');

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const next = stub();

const res = {};
const req = {
    body: JSON.stringify({ data: {} })
};

const middleware = proxyquire(middlewarePath, {
    '*/cartridge/scripts/helpers/responseHelper': {
        handleControllerError: () => {
            res.error = true;
            res.message = 'error';
        }
    }
});

describe('parseBody', () => {
    afterEach(() => {
        next.reset();
    });

    it('should parse body and call next function', () => {
        middleware.parseBody(req, res, next);

        expect(res.parsedBody).to.deep.equals({ data: {} });
        expect(next.calledOnce).to.be.true;
    });

    it('should set error to the res', () => {
        req.body = {};

        middleware.parseBody(req, res, next);

        expect(res.error).to.be.true;
        expect(res.message).to.equals('error');

        expect(next.calledOnce).to.be.false;
    });
});