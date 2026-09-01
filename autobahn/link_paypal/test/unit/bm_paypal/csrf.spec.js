const { bm_paypal: { csrfPath } } = require('../path.json');

const { stub } = require('sinon');
const { expect } = require('chai');
const { it, describe } = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

const CSRFProtection = {
    validateRequest: stub().returns(false),
    getTokenName: stub().returns('name'),
    generateToken: stub().returns('token')
};

const json = stub();
const render = stub();
const setStatusCode = stub();

function Response() {
    this.json = json;
    this.render = render;
    this.viewData = {};
    this.setStatusCode = setStatusCode;
    this.getViewData = () => this.viewData;
    this.setViewData = (data) => {
        this.viewData = data;
    };
}

const csrfMiddleware = proxyquire(csrfPath, {
    'dw/web/CSRFProtection': CSRFProtection
});

describe('CSRF middleware', () => {
    let res;

    const next = stub();

    beforeEach(() => {
        res = new Response();

        csrfMiddleware.emit = () => true;
    });

    afterEach(() => {
        CSRFProtection.validateRequest.reset();
        CSRFProtection.validateRequest.resetBehavior();
        next.reset();
        json.reset();
        render.reset();
        setStatusCode.reset();
        delete csrfMiddleware.emit;
    });

    it('should validate a request', () => {
        CSRFProtection.validateRequest.returns(true);
        csrfMiddleware.validateRequest(null, res, next);
        expect(CSRFProtection.validateRequest.calledOnce).to.be.true;
        expect(next.calledOnce).to.be.true;
    });

    it('should invalidate a request', () => {
        CSRFProtection.validateRequest.returns(false);
        csrfMiddleware.validateRequest(null, res, next);
        expect(CSRFProtection.validateRequest.calledOnce).to.be.true;
        expect(setStatusCode.calledOnce).to.be.true;
        expect(json.calledOnce).to.be.true;
        expect(next.notCalled).to.be.true;
    });

    it('should generate a token', () => {
        expect(res.viewData.csrf).to.be.undefined;
        csrfMiddleware.generateToken(null, res, next);
        expect(res.viewData.csrf).to.deep.equal({
            tokenName: 'name',
            token: 'token'
        });
        expect(next.calledOnce).to.be.true;
    });

    it('should not generate a token if one is already present', () => {
        res.setViewData({
            csrf: {
                tokenName: 'original_name',
                token: 'original_token'
            }
        });
        csrfMiddleware.generateToken(null, res, next);
        expect(res.viewData.csrf).to.deep.equal({
            tokenName: 'original_name',
            token: 'original_token'
        });
        expect(next.calledOnce).to.be.true;
    });
});
