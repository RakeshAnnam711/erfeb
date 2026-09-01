const { int_paypal: { i18nMessagesPath } } = require('../path.json');

const { expect } = require('chai');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');

const i18nMessages = proxyquire(i18nMessagesPath, {
    'dw/web/Resource': {
        msg: (key, bundleName, defaultMessage) => [key, bundleName, defaultMessage].join(', ')
    }
});

describe('i18nMessages', () => {
    it('should return an object of i18n messages', () => {
        expect(i18nMessages).to.deep.equal({
            INTERNAL_SERVER_ERROR: 'paypal.error.internal.server.error, paypalerrors, ',
            INVALID_BILLING_ADDRESS: 'paypal.error.validation.invalid.billing.address, paypalerrors, ',
            ZERO_AMOUNT: 'paypal.error.zeroamount, paypalerrors, ',
            RETURN_TO_ORIGINAL_BROWSER: 'return.to.original.browser, notifications, ',
            THREE_DS_VERIFICATION_FAILED: 'paypal.creditcard.3ds.verification.failed, paypalerrors, '
        });
    });
});
