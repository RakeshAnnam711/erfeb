/* eslint-disable no-underscore-dangle */
/* global customer */
const { int_paypal: { orderHelperPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe } = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const productLineItemsModelObj = {
    items: [{ images: { small: [{ alt: 'Image small alt', title: 'Image small title', url: 'https://test.com' }] } }]
};

const orderHelper = proxyquire(orderHelperPath, {
    '*/cartridge/models/productLineItems': function() {
        return productLineItemsModelObj;
    }
});

describe('orderHelper file', () => {
    describe('getFirstProductLineItem', () => {
        let productLineItemsModel = productLineItemsModelObj;

        const getFirstProductLineItem = orderHelper.__get__('getFirstProductLineItem');

        it('should return an object with keys', () => {
            const val = getFirstProductLineItem(productLineItemsModel);

            expect(val).to.be.an('object').that.all.keys(['imageURL', 'alt', 'title']);
        });

        it('should return null', () => {
            productLineItemsModel = null;

            expect(getFirstProductLineItem(productLineItemsModel)).to.be.null;
        });
    });

    describe('fillOrderDetails', () => {
        let orderCount = 2;
        let getOrderHistoryArr = [
            { orderNo: '0000001' },
            { orderNo: '0000002' }
        ];

        const firstLineItem = productLineItemsModelObj.items[0].images.small.slice()[0];

        firstLineItem.imageURL = firstLineItem.url;
        delete firstLineItem.url;

        const orders = [
            { orderNumber: '0000001' },
            {
                orderNumber: '0000002',
                shippedToFirstName: 'John',
                shippedToLastName: 'Ferguson',
                firstLineItem: firstLineItem
            }
        ];

        const req = {
            currentCustomer: {
                raw: {
                    getOrderHistory: () => ({
                        orderCount: orderCount,
                        orders: { asList: () => ({ toArray: () => (getOrderHistoryArr) }) }
                    })
                }
            }
        };

        before(() => {
            customer.profile = {
                firstName: 'John',
                lastName: 'Doe'
            };

            orderHelper.__set__('getFirstProductLineItem', () => (firstLineItem));
        });

        after(() => {
            delete customer.profile;
            orderHelper.__ResetDependency__('getFirstProductLineItem');
        });

        it('should return array of objects', () => {
            const val = orderHelper.fillOrderDetails(req, orders);

            expect(val).to.be.an('array').that.is.not.empty;

            expect(val).to.deep.equal([
                {
                    orderNumber: '0000001',
                    firstLineItem: firstLineItem,
                    shippedToFirstName: 'John',
                    shippedToLastName: 'Doe'
                },
                {
                    orderNumber: '0000002',
                    firstLineItem: firstLineItem,
                    shippedToFirstName: 'John',
                    shippedToLastName: 'Ferguson'
                }
            ]);
        });

        it('should return empty array', () => {
            orderCount = 0;
            getOrderHistoryArr = [];
            expect(orderHelper.fillOrderDetails(req, orders)).to.be.an('array').that.is.empty;
        });
    });
});
