const { billingAgreementHelperPath } = require('./path');
const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');
const { stub, assert } = require('sinon');

require('dw-api-mock/demandware-globals');
require('babel-register')({
    plugins: ['babel-plugin-rewire']
});

const billingAgreementHelper = proxyquire(billingAgreementHelperPath, {});

describe('billingAgreementHelper file', () => {
    describe('getBAEmailFromForm', () => {
        const getBAEmailFromForm = billingAgreementHelper.__get__('getBAEmailFromForm');

        describe('if paypalActiveAccount value exists', () => {
            it('should return email', () => {
                let ppBillingForm = {
                    paypalActiveAccount: {
                        htmlValue: 'epamtester@pptest.com'
                    }
                }
                expect(getBAEmailFromForm(ppBillingForm)).to.be.equals('epamtester@pptest.com');
            });
        });

        describe('if billingAgreementPayerEmail value exists', () => {
            it('should return email', () => {
                let ppBillingForm = {
                    billingAgreementPayerEmail: {
                        htmlValue: 'test@test.com'
                    }
                }
                expect(getBAEmailFromForm(ppBillingForm)).to.be.equals('test@test.com');
            });
        });
        describe('if there is no ppBillingForm data in object', () => {
            it('should return email', () => {
                let ppBillingForm = {};
                expect(getBAEmailFromForm(ppBillingForm)).to.be.equals(false);
            });
        });

    });

    describe('createBaFromForm', () => {
        const createBaFromForm = billingAgreementHelper.__get__('createBaFromForm');
        before(() => {
            billingAgreementHelper.__set__('getBAEmailFromForm', () => 'epamtester@pptest.com');
        });
        after(() => {
            billingAgreementHelper.__ResetDependency__('getBAEmailFromForm', () => {
                return false;
            });
        });
        it('should return BA object with data', () => {
            let billingForm = {
                paypal: {
                    billingAgreementID: {
                        htmlValue: 'B-31J59452XL217381K'
                    },
                    makeDefaultPaypalAccount: {
                        checked: true
                    },
                    savePaypalAccount: {
                        checked: true
                    }
                }
            };
            let createdBa = {
                baID: 'B-31J59452XL217381K',
                email: 'epamtester@pptest.com',
                default: true,
                saveToProfile: true
            };
            expect(createBaFromForm(billingForm)).to.deep.equals(createdBa);
        });
    });

    describe('isSameBillingAgreement', () => {
        const isSameBillingAgreement = billingAgreementHelper.__get__('isSameBillingAgreement');
        describe('if billing agreements are the same', () => {
            it('should return true', () => {
                let activeBA = {
                    email: 'epamtester@pptest.com',
                    default: true,
                    saveToProfile: true
                };
                let formBA = {
                    email: 'epamtester@pptest.com',
                    default: true,
                    saveToProfile: true
                };
                expect(isSameBillingAgreement(activeBA, formBA)).to.be.equals(true);
            });
        });
        describe('if billing agreements are different', () => {
            it('should return false', () => {
                let activeBA = {
                    email: 'test@test.com',
                    default: false,
                    saveToProfile: true
                };
                let formBA = {
                    email: 'epamtester@pptest.com',
                    default: true,
                    saveToProfile: true
                };
                expect(isSameBillingAgreement(activeBA, formBA)).to.be.equals(false);
            });
        });
    });

    describe('saveBAtoSession', () => {
        const saveBAtoSession = billingAgreementHelper.__get__('saveBAtoSession');
        let activeBA = {
            baID: 'B-31J59452XL217381K',
            email: 'epamtester@pptest.com',
            default: true,
            saveToProfile: true
        };

        it('should save to session', () => {
            saveBAtoSession(activeBA);
            expect(session.privacy.baID).to.equals('B-31J59452XL217381K');
        });
    });

    describe('getBAFromSession', () => {
        const getBAFromSession = billingAgreementHelper.__get__('getBAFromSession');
        before(() => {
            session.privacy.baID = 'B-31J59452XL217381K';
            session.privacy.isBADefault = true;
            session.privacy.baEmail = 'epamtester@pptest.com';
            session.privacy.saveToProfile = true;
        });
        after(() => {
            session.privacy.baID = null;
            session.privacy.isBADefault = null;
            session.privacy.baEmail = null;
            session.privacy.saveToProfile = null;
        });
        it('should return object with ba data from session', () => {
            let baFromSession = {
                baID: 'B-31J59452XL217381K',
                email: 'epamtester@pptest.com',
                default: true,
                saveToProfile: true
            };
            expect(getBAFromSession()).to.deep.equals(baFromSession);
        });
    });

    describe('removeBAfromSession', () => {
        const removeBAfromSession = billingAgreementHelper.__get__('removeBAfromSession');
        before(() => {
            session.privacy.baID = 'B-31J59452XL217381K';
            session.privacy.isBADefault = true;
            session.privacy.baEmail = 'epamtester@pptest.com';
            session.privacy.saveToProfile = true;
        });
        it('should remove session.privacy.baID', () => {
            removeBAfromSession();
            expect(session.privacy.baID).to.be.equals(undefined);
        });
        it('should remove session.privacy.isBADefault', () => {
            expect(session.privacy.isBADefault).to.be.equals(undefined);
        });
        it('should remove session.privacy.baEmail', () => {
            expect(session.privacy.baEmail).to.be.equals(undefined);
        });
        it('should remove session.privacy.saveToProfile', () => {
            expect(session.privacy.saveToProfile).to.be.equals(undefined);
        });
    });

    describe('filterBillingAgreements', () => {
        const filterBillingAgreements = billingAgreementHelper.__get__('filterBillingAgreements');
        let ba = {
            email: 'epamtester@pptest.com',
            default: true,
            saveToProfile: true
        }
        let savedBA = [
            ba
        ];
        let billingAgreementModel;
        describe('if BA is active', () => {
            before(() => {
                billingAgreementModel = {
                    checkBillingAgreementStatus: () => true
                }
            })
            it('nothing happened', () => {
                filterBillingAgreements(savedBA, billingAgreementModel);
            });
        });
        describe('if BA is not active', () => {
            before(() => {
                billingAgreementModel = {
                    checkBillingAgreementStatus: () => false,
                    removeBillingAgreement: stub()
                }
            })
            it('removeBillingAgreement should remove inactive BA', () => {
                filterBillingAgreements(savedBA, billingAgreementModel);
                assert.calledWith(billingAgreementModel.removeBillingAgreement, ba);
            });
        });
    });
});
