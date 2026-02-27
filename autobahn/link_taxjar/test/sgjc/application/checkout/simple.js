/* eslint-env es6 */
/* global describe, it, browser, beforeEach */

'use strict';

var helper = require('../../sgjcHelper');

describe('checkout tax', () => {
    beforeEach(() => {
        return browser.deleteCookies();
    });

    it('tax on product', () => {
        var testData = {
            product: {
                pid: '708141676190',
                quantity: 1
            },
            subtotal: '$49.99',
            tax: '$3.62',
            total: '$59.60'
        };
        return helper.basicProductTaxTest(testData);
    });

    it('tax with product percent discount', () => {
        var testData = {
            product: {
                pid: '708141677197',
                quantity: 1
            },
            subtotal: '$39.99',
            tax: '$2.90',
            total: '$48.88'
        };
        return helper.basicProductTaxTest(testData);
    });

    it('tax on product with buy x for total discount and product option', () => {
        var testData = {
            product: {
                pid: 'nikon-d60-wlens',
                quantity: 5,
                options: {
                    index: 1
                }
            },
            subtotal: '$249.95',
            tax: '$18.13',
            total: '$278.07'
        };
        return helper.basicProductTaxTest(testData);
    });

    it('tax with product amount off', () => {
        var testData = {
            product: {
                pid: '708141677203',
                quantity: 1
            },
            subtotal: '$39.99',
            tax: '$2.90',
            total: '$48.88'
        };
        return helper.basicProductTaxTest(testData);
    });

    it('tax with product fixed price', () => {
        var testData = {
            product: {
                pid: '708141677210',
                quantity: 1
            },
            subtotal: '$10.00',
            tax: '$0.73',
            total: '$16.72'
        };
        return helper.basicProductTaxTest(testData);
    });

    it('tax with bonus product', () => {
        var testData = {
            product: {
                pid: '708141677227',
                quantity: 1
            },
            subtotal: '$49.99',
            tax: '$3.62',
            total: '$59.60'
        };
        return helper.basicProductTaxTest(testData);
    });

    it('tax with order percent off', () => {
        var testData = {
            product: {
                pid: '708141677234',
                quantity: 1
            },
            subtotal: '$49.99',
            tax: '$2.90',
            total: '$48.88'
        };
        return helper.basicProductTaxTest(testData);
    });

    it('tax with order amount off', () => {
        var testData = {
            product: {
                pid: '708141677241',
                quantity: 1
            },
            subtotal: '$49.99',
            tax: '$2.17',
            total: '$38.15'
        };
        return helper.basicProductTaxTest(testData);
    });

    it('tax with order bonus product', () => {
        var testData = {
            product: {
                pid: '708141677258',
                quantity: 1
            },
            subtotal: '$49.99',
            tax: '$3.62',
            total: '$59.60'
        };
        return helper.basicProductTaxTest(testData);
    });

    it('tax on product with shipping', () => {
        var testData = {
            product: {
                pid: '708141676190',
                quantity: 1
            },
            address: {
                city: 'Greenwood Village',
                state: 'CO',
                postal: '80111'
            },
            subtotal: '$49.99',
            shipping: '$5.99',
            tax: '$4.05',
            total: '$60.03'
        };
        return helper.basicProductTaxTest(testData);
    });

    it('tax on shipping with percent off', () => {
        var testData = {
            product: {
                pid: '708141677265',
                quantity: 1
            },
            address: {
                city: 'Greenwood Village',
                state: 'CO',
                postal: '80111'
            },
            subtotal: '$49.99',
            shipping: '$5.99',
            tax: '$4.01',
            total: '$59.39'
        };
        return helper.basicProductTaxTest(testData);
    });

    it('tax on shipping with amount off', () => {
        var testData = {
            product: {
                pid: '708141677272',
                quantity: 1
            },
            address: {
                city: 'Greenwood Village',
                state: 'CO',
                postal: '80111'
            },
            subtotal: '$49.99',
            shipping: '$5.99',
            tax: '$3.69',
            total: '$54.67'
        };
        return helper.basicProductTaxTest(testData);
    });

    it('tax on shipping fixed price', () => {
        var testData = {
            product: {
                pid: '708141677289',
                quantity: 1
            },
            address: {
                city: 'Greenwood Village',
                state: 'CO',
                postal: '80111'
            },
            subtotal: '$49.99',
            shipping: '$5.99',
            tax: '$3.98',
            total: '$58.97'
        };
        return helper.basicProductTaxTest(testData);
    });
});

