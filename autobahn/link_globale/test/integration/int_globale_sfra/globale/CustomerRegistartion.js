'use strict';

var assert = require('chai').assert;
var request = require('request-promise');
var config = require('./globale.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

/**
 * Test case:
 * endpoint should be available
 */

describe('CustomerRegistartion', function () {
    this.timeout(10000);

    var cookieJar = request.jar();

    var myRequest = {
        url: '',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        json: true
    };

    var url = 'Globale-CustomerRegistartion';

    myRequest.url = config.baseUrl + url;

    describe('positive test: check registration status', function () {
        it('Global-e CustomerRegistartion: registered customer.', function () {
            myRequest.body = {
                eventName: 'status',
                eventData: {
                    customer: {
                        Email: config.customerRegistration.registeredEmail
                    }
                }
            };

            return request(myRequest)
                .then(function (resp) {
                    var jsonResponse = resp.body;
                    assert.equal(resp.statusCode, 200, 'Expected CustomerRegistartion request statusCode to be 200.');
                    assert.property(jsonResponse, 'eventName', 'Expected CustomerRegistartion response to contain \'eventName\' property.');
                    assert.equal(jsonResponse.eventName, 'status', 'Expected CustomerRegistartion response "eventName" to be "status".');
                    assert.property(jsonResponse, 'success', 'Expected CustomerRegistartion response to contain \'success\' property.');
                    assert.equal(jsonResponse.success, true, 'Expected CustomerRegistartion response "success" to be true.');
                    assert.property(jsonResponse, 'registered', 'Expected CustomerRegistartion response to contain \'registered\' property.');
                    assert.equal(jsonResponse.registered, true, 'Expected CustomerRegistartion response "registered" to be true.');
                });
        });

        it('Global-e CustomerRegistartion: guest customer.', function () {
            myRequest.body = {
                eventName: 'status',
                eventData: {
                    customer: {
                        Email: config.customerRegistration.guestEmail
                    }
                }
            };

            return request(myRequest)
                .then(function (resp) {
                    var jsonResponse = resp.body;
                    assert.equal(resp.statusCode, 200, 'Expected CustomerRegistartion request statusCode to be 200.');
                    assert.property(jsonResponse, 'eventName', 'Expected CustomerRegistartion response to contain \'eventName\' property.');
                    assert.equal(jsonResponse.eventName, 'status', 'Expected CustomerRegistartion response "eventName" to be "status".');
                    assert.property(jsonResponse, 'success', 'Expected CustomerRegistartion response to contain \'success\' property.');
                    assert.equal(jsonResponse.success, true, 'Expected CustomerRegistartion response "success" to be true.');
                    assert.property(jsonResponse, 'registered', 'Expected CustomerRegistartion response to contain \'registered\' property.');
                    assert.equal(jsonResponse.registered, false, 'Expected CustomerRegistartion response "registered" to be false.');
                });
        });
    });

    describe('negative test: customer registration', function () {
        it('Global-e CustomerRegistartion: register customer (ErrorCode:3, customer exists).', function () {
            myRequest.body = {
                eventName: 'register',
                eventData: {
                    customer: {
                        Email: config.customerRegistration.registeredEmail,
                        Password: 'password'
                    },
                    confirmationData: {
                        CustomerDetails: {
                            ShippingAddress: {
                                ShippingFirstName: 'Firstname',
                                ShippingLastName: 'LastName',
                                ShippingCountryCode: 'US'
                            }
                        },
                        MerchantOrderID: 'SFCC_ORDER_NUMBER',
                        OrderID: 'GLOBALE_ORDER_NUMBER'
                    }
                }
            };

            return request(myRequest)
                .then(function (resp) {
                    var jsonResponse = resp.body;
                    assert.equal(resp.statusCode, 200, 'Expected CustomerRegistartion request statusCode to be 200.');
                    assert.property(jsonResponse, 'eventName', 'Expected CustomerRegistartion response to contain \'eventName\' property.');
                    assert.equal(jsonResponse.eventName, 'register', 'Expected CustomerRegistartion response "eventName" to be "register".');
                    assert.property(jsonResponse, 'success', 'Expected CustomerRegistartion response to contain \'success\' property.');
                    assert.equal(jsonResponse.success, false, 'Expected CustomerRegistartion response "success" to be false.');
                    assert.property(jsonResponse, 'registered', 'Expected CustomerRegistartion response to contain \'registered\' property.');
                    assert.equal(jsonResponse.registered, null, 'Expected CustomerRegistartion response "registered" to be false.');
                    assert.property(jsonResponse, 'errorCode', 'Expected CustomerRegistartion response to contain \'errorCode\' property.');
                    assert.equal(jsonResponse.errorCode, 3, 'Expected CustomerRegistartion response "errorCode" to be "3".');
                });
        });

        it('Global-e CustomerRegistartion: register customer (ErrorCode:3, customer exists).', function () {
            myRequest.body = {
                eventName: 'register',
                eventData: {
                    customer: {
                        Email: config.customerRegistration.registeredEmail,
                        Password: 'password'
                    },
                    confirmationData: {
                        CustomerDetails: {
                            ShippingAddress: {
                                ShippingFirstName: 'Firstname',
                                ShippingLastName: 'LastName',
                                ShippingCountryCode: 'US'
                            }
                        },
                        MerchantOrderID: 'SFCC_ORDER_NUMBER',
                        OrderID: 'GLOBALE_ORDER_NUMBER'
                    }
                }
            };

            return request(myRequest)
                .then(function (resp) {
                    var jsonResponse = resp.body;
                    assert.equal(resp.statusCode, 200, 'Expected CustomerRegistartion request statusCode to be 200.');
                    assert.property(jsonResponse, 'eventName', 'Expected CustomerRegistartion response to contain \'eventName\' property.');
                    assert.equal(jsonResponse.eventName, 'register', 'Expected CustomerRegistartion response "eventName" to be "register".');
                    assert.property(jsonResponse, 'success', 'Expected CustomerRegistartion response to contain \'success\' property.');
                    assert.equal(jsonResponse.success, false, 'Expected CustomerRegistartion response "success" to be false.');
                    assert.property(jsonResponse, 'registered', 'Expected CustomerRegistartion response to contain \'registered\' property.');
                    assert.equal(jsonResponse.registered, null, 'Expected CustomerRegistartion response "registered" to be false.');
                    assert.property(jsonResponse, 'errorCode', 'Expected CustomerRegistartion response to contain \'errorCode\' property.');
                    assert.equal(jsonResponse.errorCode, 3, 'Expected CustomerRegistartion response "errorCode" to be "3".');
                });
        });
    });
});
