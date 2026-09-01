'use strict';

const Resource = require('dw/web/Resource');

module.exports = {
    ZERO_AMOUNT: Resource.msg('paypal.error.zeroamount', 'paypalerrors', null),
    INTERNAL_SERVER_ERROR: Resource.msg('paypal.error.internal.server.error', 'paypalerrors', null),
    INVALID_BILLING_ADDRESS: Resource.msg('paypal.error.validation.invalid.billing.address', 'paypalerrors', null),
    RETURN_TO_ORIGINAL_BROWSER: Resource.msg('return.to.original.browser', 'notifications', null),
    THREE_DS_VERIFICATION_FAILED: Resource.msg('paypal.creditcard.3ds.verification.failed', 'paypalerrors', null)
};
