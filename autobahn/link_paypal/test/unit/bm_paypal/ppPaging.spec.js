const { bm_paypal: { ppPagingPath } } = require('../path.json');

const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const pagingModelObject = {
    setPageSize: () => { },
    setStart: () => { }
};

const ppPaging = proxyquire(ppPagingPath, {
    'dw/web/PagingModel': () => {
        return pagingModelObject;
    }
});

describe('ppPaging file', () => {
    describe('OrdersPagingModel', () => {
        let maxPage = 0;

        const pagingModel = {
            count: 9,
            currentPage: 0,
            empty: false,
            end: 8,
            maxPage: maxPage,
            pageCount: 1,
            pageElements: [],
            pageSize: 10,
            start: 0
        };

        const httpParameterMap = {
            csfr_token: {
                value: 'vtxy-KAEtBQGzJjZOX9F6VD9JjqsCq0U3id9cPB3klpNlIOGE_qmQMC_GpzAtUnsiS84Bwzl8Gr9HQlA_xwOgrtYAyzBgreOUfQRzpjPRoI0IWNwzEnfeRu3K3B2B7brAG4QQQhQg8C0WLai_wDSgPe91JzN2SARltRmgvwwrOAwuQBJ4eA='
            },
            orderNo: {
                value: '0000250*'
            },
            simpleSearch: {
                value: true
            },
            getParameterNames: () => {
                return {
                    toArray: () => ['csfr_token', 'orderNo', 'simpleSearch']
                };
            }

        };

        const expectedObject = {
            current: 0,
            totalCount: 9,
            pageSize: 10,
            currentPage: 0,
            maxPage: 0,
            showingStart: 1,
            showingEnd: 9,
            rangeBegin: 1,
            rangeEnd: -1,
            parameters: [
                {
                    key: 'csfr_token',
                    value: {
                        value: 'vtxy-KAEtBQGzJjZOX9F6VD9JjqsCq0U3id9cPB3klpNlIOGE_qmQMC_GpzAtUnsiS84Bwzl8Gr9HQlA_xwOgrtYAyzBgreOUfQRzpjPRoI0IWNwzEnfeRu3K3B2B7brAG4QQQhQg8C0WLai_wDSgPe91JzN2SARltRmgvwwrOAwuQBJ4eA='
                    }
                },
                {
                    key: 'orderNo',
                    value: {
                        value: '0000250*'
                    }
                },
                {
                    key: 'simpleSearch',
                    value: {
                        value: true
                    }
                }]
        };

        it('includes function createPagingModel', () => {
            expect(new ppPaging()).to.have.property('createPagingModel').to.be.a('function');
        });
        it('return expected object', () => {
            const pagesize = {
                empty: true,
                intValue: null,
                rawValue: null,
                value: null
            };

            const orders = [{
                createdBy: 'Customer',
                currency: 'USD',
                customer: 'Ivan C Vinogadov',
                dareCompare: 1637242226000,
                email: 'I.Vinogradov@gmail.com',
                isRegistered: false,
                orderDate: '11/18/21 1:19 pm',
                orderNo: '00002805',
                orderToken: 'oLH1Lm3DdKdI6cou1nypd32MdyQw8fUpxdQbky4W_kA',
                orderTotal: {
                    value: 192.14
                },
                paypalAmount: {
                    value: 192.14
                },
                status: 'VOIDED'
            },
            {
                createdBy: 'Customer',
                currency: 'USD',
                customer: 'Ivan C Vinogadov',
                dareCompare: 1637241590000,
                email: 'I.Vinogradov@gmail.com',
                isRegistered: false,
                orderDate: '12/18/21 1:19 pm',
                orderNo: '00002807',
                orderToken: 'oLH1Lm3DdKdI6cou1nypd32MdyQw8fUpxdQbky4V_kA',
                orderTotal: {
                    value: 182.14
                },
                paypalAmount: {
                    value: 182.14
                },
                status: 'VOIDED'
            }
            ];

            const page = {
                empty: true,
                intValue: null,
                rawValue: null,
                value: null
            };

            expect(new ppPaging().createPagingModel(orders, page, pagesize)).to.deep.equal(pagingModelObject);
        });
        it('includes function createPagingModelParameters', () => {
            expect(new ppPaging()).to.have.property('createPagingModelParameters').to.be.a('function');
        });
        it('function createPagingModelParameters returns the expected object in if-else block if is true case', () => {
            expect(new ppPaging().createPagingModelParameters(pagingModel, httpParameterMap)).to.deep.equal(expectedObject);
        });
        it('function createPagingModelParameters returns the expected object in if-else block if is true case', () => {
            maxPage = 5;
            pagingModel.maxPage = maxPage;
            expectedObject.maxPage = maxPage;
            expectedObject.rangeEnd = 4;
            expect(new ppPaging().createPagingModelParameters(pagingModel, httpParameterMap)).to.deep.equal(expectedObject);
        });

        it('should use pagesize.intValue if it is not empty', () => {
            const orders = [
                { orderNo: '0001' },
                { orderNo: '0002' },
                { orderNo: '0003' }
            ];

            const pagesize = {
                empty: false,
                intValue: 5
            };

            const page = {
                empty: true
            };

            const pagingModelSpy = {
                setPageSize: (size) => {
                    expect(size).to.equal(5);
                },
                setStart: (start) => {
                    expect(start).to.equal(0);
                }
            };

            const localPaging = proxyquire(ppPagingPath, {
                'dw/web/PagingModel': () => pagingModelSpy
            });

            const result = new localPaging().createPagingModel(orders, page, pagesize);

            expect(result).to.equal(pagingModelSpy);
        });
    });
});
