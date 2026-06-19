'use strict';

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

var TAX_CALCULATION_ERROR_KEY = 'TaxJarTaxCalculationError';

function getTaxCalculationError() {
    if (typeof session === 'undefined' || !session.privacy) {
        return null;
    }

    return session.privacy[TAX_CALCULATION_ERROR_KEY] || null;
}

function clearTaxCalculationError() {
    if (typeof session !== 'undefined' && session.privacy) {
        delete session.privacy[TAX_CALCULATION_ERROR_KEY];
    }
}

function hasTaxCalculationError() {
    return !!getTaxCalculationError();
}

function getTaxCalculationErrorMessage() {
    return Resource.msg('error.message.taxcalculation.address', 'checkout', null);
}

function getTaxCalculationErrorResponse() {
    return {
        error: true,
        errorStage: {
            stage: 'shipping',
            step: 'address'
        },
        fieldErrors: [],
        serverErrors: [getTaxCalculationErrorMessage()],
        errorMessage: getTaxCalculationErrorMessage(),
        message: getTaxCalculationErrorMessage(),
        redirectUrl: URLUtils.https(
            'Checkout-Begin',
            'stage',
            'shipping',
            'errormessagetext',
            getTaxCalculationErrorMessage()
        ).toString()
    };
}

module.exports = {
    getTaxCalculationError: getTaxCalculationError,
    clearTaxCalculationError: clearTaxCalculationError,
    hasTaxCalculationError: hasTaxCalculationError,
    getTaxCalculationErrorMessage: getTaxCalculationErrorMessage,
    getTaxCalculationErrorResponse: getTaxCalculationErrorResponse
};
