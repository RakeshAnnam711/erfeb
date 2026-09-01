const { bm_paypal: { sendFailedTransactionEmailPath } } = require('../path.json');

const { expect } = require('chai');
const { stub } = require('sinon');
const {
    it, describe, before, after, afterEach
} = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const MockEmail = {
    addTo: stub(),
    setSubject: stub(),
    setFrom: stub(),
    setContent: stub(),
    send: stub()
};

const addAlertFake = stub();
const removeAlertFake = stub();

const emailToSend = 'test@example.com';

const sendFailedTransactionEmail = proxyquire(sendFailedTransactionEmailPath, {
    '~/cartridge/models/ppOrderMgr': function() {
        this.getOrderByPaymentStatus = () => {
            return [
                { status: 'FAILED', paymentTransaction: { creationDate: 'Fri Sep 01 2023 12:45:43 GMT-0000 (GMT)' } },
                { status: 'AUTHORIZED', paymentTransaction: { creationDate: 'Fri Sep 02 2023 12:45:43 GMT-0000 (GMT)' } }
            ];
        };

        return this;
    },
    'dw/net/Mail': function() {
        return MockEmail;
    },
    'dw/alert/Alerts': {
        addAlert: addAlertFake,
        removeAlert: removeAlertFake
    },
    'dw/system/Status': dw.system.Status,
    'dw/system/Logger': dw.system.Logger,
    'dw/system/Site': {
        current: {
            getCustomPreferenceValue: mode => mode
        }
    }
});

describe('sendFailedTransactionEmail file', () => {
    describe('createArrayFromString', () => {
        it('should split a comma-separated string into an array', () => {
            const inputString = 'FAILED, AUTHORIZED, GATEWAY_REJECTED, PROCESSOR_DECLINED';
            const expectedResult = ['FAILED', 'AUTHORIZED', 'GATEWAY_REJECTED', 'PROCESSOR_DECLINED'];

            const createArrayFromString = sendFailedTransactionEmail.__get__('createArrayFromString');
            const result = createArrayFromString(inputString);

            expect(result).to.deep.equal(expectedResult);
        });
    });

    describe('filterByDate', () => {
        it('should filter orders within the specified number of days', function() {
            const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
            const daysToRetrieve = 7;
            const orders = {
                toArray: () => {
                    return [
                        {
                            dateCompare: Date.now() - (3 * DAY_IN_MILLISECONDS)
                        },
                        {
                            dateCompare: Date.now() - (10 * DAY_IN_MILLISECONDS)
                        }
                    ];
                }
            };

            const filterByDate = sendFailedTransactionEmail.__get__('filterByDate');
            const filteredOrders = filterByDate(orders, daysToRetrieve);

            expect(filteredOrders).to.be.an('array');
            expect(filteredOrders).to.have.lengthOf(1);
        });
    });

    describe('checkStatuses', () => {
        before(() => {
            sendFailedTransactionEmail.__set__('filterByDate', () => {
                return [
                    { status: 'FAILED', paymentTransaction: { creationDate: 'Fri Sep 01 2023 12:45:43 GMT-0000 (GMT)' } },
                    { status: 'AUTHORIZED', paymentTransaction: { creationDate: 'Fri Sep 18 2023 12:45:43 GMT-0000 (GMT)' } }
                ];
            });
        });

        after(() => {
            sendFailedTransactionEmail.__ResetDependency__('filterByDate');
        });
        it('should return an array of statuses with counts', () => {
            const statusesToCheck = 'FAILED, AUTHORIZED';
            const daysToRetrieve = 30;
            const ordersWithAlertTransactionMock = [
                { status: 'FAILED', paymentTransaction: { creationDate: 'Fri Sep 01 2023 12:45:43 GMT-0000 (GMT)' } },
                { status: 'AUTHORIZED', paymentTransaction: { creationDate: 'Fri Sep 02 2023 12:45:43 GMT-0000 (GMT)' } }
            ];

            const checkStatuses = sendFailedTransactionEmail.__get__('checkStatuses');
            const result = checkStatuses(statusesToCheck, daysToRetrieve);
            const expectedResult = [
                {
                    status: 'FAILED',
                    count: ordersWithAlertTransactionMock.length
                },
                {
                    status: 'AUTHORIZED',
                    count: ordersWithAlertTransactionMock.length
                }
            ];

            expect(result).to.deep.equal(expectedResult);
        });
    });

    describe('getCurrentDate', () => {
        it('should return the current date in the format MM/DD/YY', () => {
            const getCurrentDate = sendFailedTransactionEmail.__get__('getCurrentDate');
            const result = getCurrentDate();

            expect(result).to.match(/^\d{2}\/\d{2}\/\d{2}$/);
        });
    });

    describe('sendEmail', () => {
        it('should send an email with the correct subject and content', () => {
            const emailData = [{
                status: 'FAILED',
                count: '3'
            },
            {
                status: 'AUTHORIZED',
                count: '5'
            }];

            const sendEmail = sendFailedTransactionEmail.__get__('sendEmail');

            sendEmail(emailToSend, emailData);

            expect(MockEmail.addTo.calledWith(emailToSend)).to.be.true;
            expect(MockEmail.setContent.called).to.be.true;
            expect(MockEmail.send.calledOnce).to.be.true;
        });
    });

    describe('createLog', () => {
        let getLoggerStub;
        let loggerInfoStub;

        before(() => {
            getLoggerStub = stub(dw.system.Logger, 'getLogger');
            loggerInfoStub = stub();

            const fakeLogger = {
                info: loggerInfoStub
            };

            getLoggerStub.withArgs('PayPal-BM').returns(fakeLogger);
        });

        after(() => {
            getLoggerStub.restore();
        });

        it('should call the logger.info method with the provided message', () => {
            const msg = 'Test log message';

            const createLog = sendFailedTransactionEmail.__get__('createLog');

            createLog(msg);

            expect(loggerInfoStub.calledOnce).to.be.true;
            expect(loggerInfoStub.calledWith(msg)).to.be.true;
        });
    });

    describe('sendFailedTransactionEmail', () => {
        let checkStatusesStub;
        let sendEmailStub;
        let createLogStub;
        let addAlertStub;

        beforeEach(() => {
            checkStatusesStub = stub();
            sendEmailStub = stub();
            createLogStub = stub();
            addAlertStub = stub();

            sendFailedTransactionEmail.__set__('checkStatuses', checkStatusesStub);
            sendFailedTransactionEmail.__set__('sendEmail', sendEmailStub);
            sendFailedTransactionEmail.__set__('addAlert', addAlertStub);
            sendFailedTransactionEmail.__set__('createLog', createLogStub);
        });

        afterEach(() => {
            sendFailedTransactionEmail.__ResetDependency__('checkStatuses');
            sendFailedTransactionEmail.__ResetDependency__('sendEmail');
            sendFailedTransactionEmail.__ResetDependency__('createLog');
            sendFailedTransactionEmail.__ResetDependency__('addAlert');

            addAlertFake.reset();
            removeAlertFake.reset();
        });

        it('should return Status error if StatusesToCheck is not set', () => {
            const parameters = { StatusesToCheck: null };
            const result = sendFailedTransactionEmail.sendFailedTransactionEmail(parameters);

            expect(result.status).to.equal(dw.system.Status.ERROR);
            expect(result.code).to.equal('ERROR');
        });

        it('should send an email if statusesData length is greater than 0', () => {
            checkStatusesStub.returns([{ status: 'FAILED', count: 3 }, { status: 'AUTHORIZED', count: 6 }]);

            const parameters = {
                StatusesToCheck: 'AUTHORIZED, FAILED',
                DaysToRetrieve: 15,
                Email: emailToSend,
                AlertsInBM: true
            };

            sendFailedTransactionEmail.sendFailedTransactionEmail(parameters);

            expect(checkStatusesStub.calledOnce).to.be.true;
            expect(createLogStub.notCalled).to.be.true;
        });

        it('should not call send email and add alert function', () => {
            checkStatusesStub.returns([{ status: 'FAILED', count: 3 }, { status: 'AUTHORIZED', count: 6 }]);

            const parameters = {
                StatusesToCheck: 'AUTHORIZED, FAILED',
                DaysToRetrieve: 15,
                Email: null,
                AlertsInBM: false
            };

            sendFailedTransactionEmail.sendFailedTransactionEmail(parameters);

            expect(addAlertStub.notCalled).to.be.true;
            expect(sendEmailStub.notCalled).to.be.true;
        });

        it('should create a log if statusesData length is 0', () => {
            checkStatusesStub.returns([]);

            const parameters = {
                StatusesToCheck: 'AUTHORIZED, FAILED',
                DaysToRetrieve: 15,
                Email: emailToSend,
                AlertsInBM: true
            };

            sendFailedTransactionEmail.sendFailedTransactionEmail(parameters);

            expect(checkStatusesStub.calledOnce).to.be.true;
            expect(sendEmailStub.notCalled).to.be.true;
        });
    });

    describe('addAlert', () => {
        const addAlert = sendFailedTransactionEmail.__get__('addAlert');
        const data = [{ status: 'FAILED', count: 3 }, { status: 'AUTHORIZED', count: 6 }];

        before(() => {
            stub(dw.system.Transaction, 'wrap').callsFake((callback) => callback());
        });

        after(() => {
            addAlertFake.reset();
            removeAlertFake.reset();

            dw.system.Transaction.wrap.restore();
        });

        it('should add alert for failed transactions', () => {
            expect(addAlert(data)).to.be.undefined;
            expect(addAlertFake.calledOnce).to.be.true;
            expect(removeAlertFake.calledOnce).to.be.true;
        });
    });
});
