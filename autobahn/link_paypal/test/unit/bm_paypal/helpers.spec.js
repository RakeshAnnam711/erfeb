/* eslint-disable no-underscore-dangle */
const { bm_paypal: { helpersPath } } = require('../path.json');

const {
    describe, it, before, after
} = require('mocha');

const { expect } = require('chai');
const { stub } = require('sinon');

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const createErrorLog = stub();
const getAllOrders = stub();
const isJson = stub();
const pluralize = stub();
const getPaypalPaymentInstrument = stub();

getPaypalPaymentInstrument.returns({
    custom: {
        paypalRequest: null,
        paypalResponse: null
    }
});

const orderMgr = {
    searchOrder: () => {},
    createOrderSequenceNo: () => {}
};

const savedConfig = {
    cart: {
        layout: 'text',
        'text-color': 'white',
        placement: 'cart'
    },
    category: {
        layout: 'flex',
        color: 'black',
        placement: 'category'
    },
    product_preview: {
        layout: 'text',
        'text-color': 'white',
        placement: 'product_preview'
    }
};

const preferences = {
    payPalButtonLocation: ['miniCart', 'cart', 'pdp'],
    paypalButtonMessagesLocation: ['MiniCart', 'PDP', 'Cart'],
    buttonStyles: {
        payLaterMessaging: JSON.stringify(savedConfig)
    }
};

const paypalConstants = {
    SEARCH_BY_ORDER_NUMBER: 'by order number',
    SEARCH_BY_TRANSACTION_ID: 'by transaction id',
    SEARCH_BY_PAYMENT_STATUS: 'by payment status',
    SEARCH_BY_PAYMENT_METHOD: 'by payment method',
    STATUS_CANCELLED: 'CANCELLED',
    STATUS_VOIDED: 'VOIDED',
    TRANSACTION_STATUSES: [],
    TRANSACTION_FAILED_STATUSES: ['declined', undefined],
    PAYMENT_METHODS_MAP: new Map([['GooglePay', 'Google Pay']])
};

const helpers = require('proxyquire').noCallThru()(helpersPath, {
    'dw/system/Site': dw.system.Site,
    'dw/system/Logger': dw.system.Logger,
    'dw/web/Resource': dw.web.Resource,
    'dw/util/Calendar': dw.util.Calendar,
    'dw/order/OrderMgr': orderMgr,
    'dw/order/PaymentMgr': dw.order.PaymentMgr,
    'dw/util/StringUtils': dw.util.StringUtils,
    'dw/object/CustomObject': dw.object.CustomObject,
    'dw/system/Transaction': dw.system.Transaction,
    '~/cartridge/scripts/helpers/coreHelpers': {
        isJson,
        pluralize,
        sortByProperty: (arr, prop) => {
            return arr.sort((prev, next) => prev[prop] > next[prop] ? 1 : -1);
        },
        filterByProperty: (arr, prop, val) => {
            return arr.filter((el) => el[prop] === val);
        }
    },
    '~/cartridge/config/constants': paypalConstants,
    '~/cartridge/scripts/paypal/bmUtils': {
        createErrorLog
    },
    '~/cartridge/scripts/paypal/paymentInstrumentHelpers': {
        getPaypalPaymentInstrument: getPaypalPaymentInstrument
    },
    '~/cartridge/models/ppOrderMgr': function() {
        return {
            getAllOrders
        };
    },
    '~/cartridge/config/preferences': preferences
});

describe('helpers file', () => {
    describe('parseStatus', () => {
        before(() => {
            stub(dw.system.Logger, 'getLogger');
        });

        after(() => {
            dw.system.Logger.getLogger.restore();
        });

        it('if an underscore in paymentsStatus string is replaced with a space', () => {
            expect(helpers.parseStatus('created_now')).to.be.equals('Created now');
        });

        it('if error', () => {
            dw.system.Logger.getLogger.returns({ error: () => {} });

            expect(helpers.parseStatus(null)).to.be.null;
        });
    });

    describe('isSearchQueryEmpty', () => {
        const searchQueryParams = {
            transactionId: {},
            orderNo: {},
            paymentStatus: {},
            paymentMethod: {}
        };

        it('if a search query is empty', () => {
            expect(helpers.isSearchQueryEmpty(searchQueryParams)).to.equal(true);
        });

        it('if a search query is partially empty', () => {
            searchQueryParams.transactionId.stringValue = '00001293';

            expect(helpers.isSearchQueryEmpty(searchQueryParams)).to.equal(false);
        });

        it('if a search query is not empty', () => {
            searchQueryParams.orderNo.stringValue = 'pp_00001293';
            searchQueryParams.paymentStatus.stringValue = 'created';

            expect(helpers.isSearchQueryEmpty(searchQueryParams)).to.equal(false);
        });
    });

    describe('getSearchType', () => {
        const transactionId = { submitted: true, stringValue: 'transactionId' };
        const paymentStatus = { submitted: true, stringValue: 'created' };
        const paymentMethod = { submitted: true, stringValue: 'PayPal' };

        it('if a search type is by transaction id', () => {
            expect(helpers.getSearchType(transactionId, paymentStatus, paymentMethod)).to.equal('by transaction id');
        });

        it('if a search type is by payment status', () => {
            transactionId.submitted = false;
            expect(helpers.getSearchType(transactionId, paymentStatus, paymentMethod)).to.equal('by payment status');
        });

        it('if a search type is by payment method', () => {
            paymentStatus.submitted = false;
            expect(helpers.getSearchType(transactionId, paymentStatus, paymentMethod)).to.equal('by payment method');
        });

        it('if a search type is by order number', () => {
            paymentMethod.submitted = false;
            expect(helpers.getSearchType(transactionId, paymentStatus, paymentMethod)).to.equal('by order number');
        });
    });

    describe('formattedDate', () => {
        before(() => {
            stub(dw.util.StringUtils, 'formatCalendar');
        });

        after(() => {
            dw.util.StringUtils.formatCalendar.restore();
        });

        it('if isoString already contains .000Z', () => {
            dw.util.StringUtils.formatCalendar.returns('09/22/2023 08:53');
            expect(helpers.formattedDate('2023-09-22T08:53:53.000Z')).to.equal('09/22/2023 08:53');
        });

        it('if isoString is not undefined', () => {
            dw.util.StringUtils.formatCalendar.returns('10/05/2022 14:48');
            expect(helpers.formattedDate('2022-10-05T14:48:00Z')).to.equal('10/05/2022 14:48');
        });
    });

    describe('isExpiredHonorPeriod', () => {
        it('if returns boolean', () => {
            expect(helpers.isExpiredHonorPeriod('2022-10-05T14:48:00Z')).to.be.a('boolean');
        });
    });

    describe('getPaymentStatus', () => {
        const transactionResponse = {
            purchase_units: [{
                payments: {
                    captures: [{ status: 'COMPLETED' }],
                    authorizations: [{ status: 'COMPLETED' }]
                }
            }]
        };

        it('if status from payments.captures is COMPLETED', () => {
            expect(helpers.getPaymentStatus(transactionResponse)).to.be.equal('COMPLETED');
        });

        it('if status from payments.authorizations is COMPLETED', () => {
            transactionResponse.purchase_units[0].payments.captures = null;
            expect(helpers.getPaymentStatus(transactionResponse)).to.be.equal('COMPLETED');
        });

        it('if status from transactionResponse.status is VOIDED', () => {
            transactionResponse.status = 'VOIDED';
            expect(helpers.getPaymentStatus(transactionResponse)).to.be.equal('CANCELLED');
        });
    });

    describe('getPaymentStatusTransactionStatistics', () => {
        const orders = {
            statuses: [{}],
            iterator: function() {
                return new dw.util.Iterator(this.statuses);
            }
        };

        let result;

        getAllOrders.returns(orders);

        it('if status is undefined, still return an object but with N/A values', () => {
            expect(helpers.getPaymentStatusTransactionStatistics()).to.not.be.undefined;
        });

        it('if status object is built correctly', () => {
            pluralize.returns('transactions');
            result = {
                new: {
                    count: 2, value: 'new', label: 'New', textColor: '#000'
                }
            };
            orders.statuses = [{ status: 'new' }, { status: 'new' }];

            expect(helpers.getPaymentStatusTransactionStatistics()).to.deep.equal(result);
        });

        it('if objects with status set to success go before those set to failure', () => {
            pluralize.returns('transaction');
            result = {
                new: {
                    count: 1, value: 'new', label: 'New', textColor: '#000'
                },
                declined: {
                    count: 1, value: 'declined', label: 'Declined', textColor: '#e31616'
                }
            };
            orders.statuses = [{ status: 'declined' }, { status: 'new' }];

            expect(helpers.getPaymentStatusTransactionStatistics()).to.deep.equal(result);
        });
    });

    describe('getOrderByOrderNo', () => {
        before(() => {
            stub(orderMgr, 'searchOrder');
        });

        after(() => {
            orderMgr.searchOrder.restore();
        });

        it('if empty', () => {
            orderMgr.searchOrder.returns();

            expect(helpers.getOrderByOrderNo('orderNo')).to.be.undefined;
        });
    });

    describe('saveTransactionRequestAndResponse', () => {
        before(() => {
            stub(orderMgr, 'searchOrder');
            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        after(() => {
            orderMgr.searchOrder.restore();
            dw.system.Transaction.wrap.restore();
        });

        const requestData = { orderNo: '', custom: {} };
        const responseDate = {};

        it('if there\'s no order', () => {
            orderMgr.searchOrder.returns();

            expect(helpers.saveTransactionRequestAndResponse(requestData, responseDate)).to.be.undefined;
        });

        it('if order is an instance of dw.object.CustomObject', () => {
            expect(helpers.saveTransactionRequestAndResponse(requestData, responseDate)).to.be.undefined;
        });

        it('if order isn\'t an instance of dw.object.CustomObject', () => {
            orderMgr.searchOrder.returns({ orderNo: 'orderNo' });

            expect(helpers.saveTransactionRequestAndResponse(requestData, responseDate)).to.be.undefined;
        });
    });

    describe('getTransactionHistory', () => {
        const dateTime = '2023-02-28T12:00:00.000Z';

        before(() => {
            stub(Date.prototype, 'toISOString').returns(dateTime);
        });

        after(() => {
            Date.prototype.toISOString.restore();
        });

        const getTransactionHistory = helpers.__get__('getTransactionHistory');

        const transaction = {
            request: {
                methodName: 'DoRefundPartial',
                refundtype: 'Partial'
            },
            response: {},
            amount: '50.00',
            status: 'Capture'
        };

        it('should returns an object with keys', () => {
            const val = getTransactionHistory(transaction);

            expect(val).to.be.an('object').that.has.all.keys([
                'amount', 'timestamp', 'status', 'methodName', 'refundType'
            ]);

            expect(val).to.include({
                amount: '50.00',
                methodName: 'DoRefundPartial',
                refundType: 'Partial',
                status: 'Capture',
                timestamp: dateTime
            });
        });

        it('should returns an object and amount get from request amt', () => {
            transaction.request.amt = '40.00';

            const val = getTransactionHistory(transaction);

            expect(val).to.include({
                amount: '40.00',
                methodName: 'DoRefundPartial',
                refundType: 'Partial',
                status: 'Capture',
                timestamp: dateTime
            });
        });

        it('should returns an object and refundType are empty', () => {
            delete transaction.request.refundtype;

            const val = getTransactionHistory(transaction);

            expect(val).to.include({
                amount: '40.00',
                methodName: 'DoRefundPartial',
                refundType: '',
                status: 'Capture',
                timestamp: dateTime
            });
        });
    });

    describe('prepareTransactionHistory', () => {
        const data = {
            request: {}, response: {}, amount: '40.00', status: 'Capture'
        };

        const objectType = { custom: { paypalTransactionHistory: null } };

        before(() => {
            isJson.returns(false);

            helpers.__set__('getTransactionHistory', () => ({
                amount: '40.00',
                methodName: 'DoRefundPartial',
                refundType: 'Partial',
                status: 'Capture',
                timestamp: '2023-02-28T12:00:00.000Z'
            }));
        });

        after(() => {
            isJson.reset();
            helpers.__ResetDependency__('getTransactionHistory');
        });

        it('should returns one item of transaction history in json format', () => {
            const val = helpers.prepareTransactionHistory(objectType, data);

            expect(val).to.be.a('string').that.is.not.empty;
            expect(JSON.parse(val)).to.have.lengthOf(1);
        });

        it('should returns a list of transaction history in json format', () => {
            isJson.returns(true);

            objectType.custom.paypalTransactionHistory = JSON.stringify([{
                amount: '40.00',
                status: 'Created',
                timestamp: '2023-02-28T10:00:00.000Z'
            }]);

            const val = helpers.prepareTransactionHistory(objectType, data);

            expect(val).to.be.a('string').that.is.not.empty;
            expect(JSON.parse(val)).to.have.lengthOf(2);
        });
    });

    describe('saveTransactionHistory', () => {
        const requestData = { orderNo: '0000001' };
        const responseData = {};

        const orderResponse = {
            totalGrossPrice: { value: '40.00' },
            custom: { paypalTransactionHistory: null }
        };

        before(() => {
            stub(helpers, 'getOrderByOrderNo').returns(orderResponse);

            stub(helpers, 'prepareTransactionHistory').returns(JSON.stringify([]));

            getPaypalPaymentInstrument.returns({
                custom: { paypalPaymentStatus: 'COMPLETED' },
                paymentTransaction: { custom: {} }
            });

            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        after(() => {
            getPaypalPaymentInstrument.reset();
            dw.system.Transaction.wrap.restore();
            helpers.getOrderByOrderNo.restore();
            helpers.prepareTransactionHistory.restore();
        });

        it('should update custom attribute `paypalTransactionHistory` for System Object Type', () => {
            const val = helpers.saveTransactionHistory(requestData, responseData);

            expect(val).to.be.undefined;
        });

        it('if order is not found', () => {
            helpers.getOrderByOrderNo.returns(null);

            const val = helpers.saveTransactionHistory(requestData, responseData);

            expect(val).to.be.undefined;
        });
    });

    describe('getPaymentMethod', () => {
        before(() => {
            stub(dw.order.PaymentMgr, 'getPaymentMethod').returns({});
        });

        after(() => {
            dw.order.PaymentMgr.getPaymentMethod.restore();
        });

        it('should returns a PaymentMethod object', () => {
            expect(helpers.getPaymentMethod('PayPal')).to.be.an('object');
        });
    });

    describe('splitFullName', () => {
        it('should return a splitted full name object', () => {
            expect(helpers.splitFullName('Joy Gray')).to.deep.equal({
                firstName: 'Joy',
                lastName: 'Gray'
            });
        });
    });

    describe('getLocaleWithHyphen', () => {
        before(() => {
            dw.system.Site.current = { defaultLocale: 'en_US' };
        });

        after(() => {
            delete dw.system.Site.current;
        });

        it('should return en-us if locale is default', () => {
            expect(helpers.getLocaleWithHyphen('default')).to.be.equal('en-us');
        });

        it('should return pl-pl if locale don\'t have a underscore', () => {
            expect(helpers.getLocaleWithHyphen('pl')).to.be.equal('pl-pl');
        });

        it('should return en-us if locale have a underscore', () => {
            expect(helpers.getLocaleWithHyphen('en_US')).to.be.equal('en-us');
        });
    });

    describe('isElementEnabled', () => {
        beforeEach(() => {
            preferences.payPalButtonLocation = ['minicart', 'cart', 'pdp'];
        });

        it('should return true for PayPal button on cart page', () => {
            expect(helpers.isElementEnabled('cart', preferences.payPalButtonLocation)).to.be.true;
        });

        it('should return false for PayPal button on pvp page', () => {
            expect(helpers.isElementEnabled('pvp', preferences.payPalButtonLocation)).to.be.false;
        });

        it('should return true for Button Messaging Banner on minicart page', () => {
            const result = helpers.isElementEnabled('minicart', preferences.paypalButtonMessagesLocation);

            expect(result).to.be.true;
        });

        it('should return false if targetPage null or empty site pref', () => {
            expect(helpers.isElementEnabled(null, [])).to.be.false;
            expect(helpers.isElementEnabled(undefined, [])).to.be.false;
            expect(helpers.isElementEnabled('', [])).to.be.false;
            expect(helpers.isElementEnabled('pdp', [])).to.be.false;
        });
    });

    describe('getPageVisibility', () => {
        it('should return an empty object if list of locations is empty array', () => {
            expect(helpers.getPageVisibility([], preferences.payPalButtonLocation)).to.be.an('object').that.empty;
        });

        it('should return an empty object if site preference has empty list', () => {
            expect(helpers.getPageVisibility(['pvp', 'pdp'], [])).to.deep.equal({ pvp: false, pdp: false });
        });

        it('should return an object with active locations', () => {
            const result = helpers.getPageVisibility(['cart', 'pdp', 'pvp'], preferences.payPalButtonLocation);

            expect(result).to.deep.equal({ pvp: false, pdp: true, cart: true });
        });
    });

    describe('setStylesForEnabledLocations', () => {
        let obj;

        const defaultStyle = { buttonStyle: 'plain', type: 'black' };
        const locations = ['pdp', 'pvp', 'cart', 'minicart', 'billing'];

        const createStyles = () => ({
            pdp: defaultStyle,
            pvp: defaultStyle,
            cart: defaultStyle,
            billing: defaultStyle,
            minicart: defaultStyle
        });

        it('should set styles only for cart location', () => {
            obj = createStyles();

            const styles = { buttonStyle: 'buy', type: 'white' };

            helpers.setStylesForEnabledLocations(obj, {
                hm: { applyToAll: { booleanValue: false }, location: { value: 'cart' } },
                styles: styles,
                alwaysVisiblePages: { billing: true },
                locations: locations,
                customPreference: ['pdp', 'pvp', 'cart', 'minicart']
            });

            expect(obj).to.deep.equal({
                billing: defaultStyle,
                cart: styles,
                minicart: defaultStyle,
                pdp: defaultStyle,
                pvp: defaultStyle
            });
        });

        it('should set styles for all locations that is visible, alwaysVisiblePages = { billing: true }', () => {
            obj = createStyles();

            const styles = { buttonStyle: 'buy', type: 'white' };

            helpers.setStylesForEnabledLocations(obj, {
                hm: { applyToAll: { booleanValue: true }, location: { value: 'cart' } },
                styles: styles,
                alwaysVisiblePages: { billing: true },
                locations: locations,
                customPreference: ['pdp', 'pvp', 'cart', 'minicart']
            });

            expect(obj).to.deep.equal({
                billing: styles,
                cart: styles,
                minicart: styles,
                pdp: styles,
                pvp: styles
            });
        });

        it('should set styles for all locations that is visible, alwaysVisiblePages empty', () => {
            obj = createStyles();

            const styles = { buttonStyle: 'pay', type: 'white-outline' };

            helpers.setStylesForEnabledLocations(obj, {
                hm: { applyToAll: { booleanValue: true }, location: { value: 'cart' } },
                styles: styles,
                alwaysVisiblePages: {},
                locations: locations,
                customPreference: ['pdp', 'pvp', 'cart', 'minicart']
            });

            expect(obj).to.deep.equal({
                billing: defaultStyle,
                cart: styles,
                minicart: styles,
                pdp: styles,
                pvp: styles
            });
        });
    });

    describe('getReadablePaymentMethod', () => {
        it('should return payment method name in readable format', () => {
            expect(helpers.getReadablePaymentMethod('GooglePay')).to.be.equal('Google Pay');
        });

        it('it should return an argument value if payment method is not present into the list of payment methods', () => {
            expect(helpers.getReadablePaymentMethod('Sofort')).to.be.equal('Sofort');
        });
    });

    describe('savePayLaterMessagingStyles', () => {
        before(() => {
            dw.system.Site.current = {
                setCustomPreferenceValue: (_, data) => {
                    preferences.buttonStyles.payLaterMessaging = data;
                }
            };

            stub(dw.system.Transaction, 'wrap').callsFake(callback => callback());
        });

        after(() => {
            delete dw.system.Site.current;

            dw.system.Transaction.wrap.restore();
        });

        it('should save new messaging styles', () => {
            const newStyles =  JSON.parse(JSON.stringify(savedConfig));

            newStyles.cart['text-color'] = 'black';
            newStyles.product_preview['text-color'] = 'black';
            newStyles.category.color = 'white';

            helpers.savePayLaterMessagingStyles(newStyles);

            expect(preferences.buttonStyles.payLaterMessaging).to.equals(JSON.stringify(newStyles));
        });
    });
});
