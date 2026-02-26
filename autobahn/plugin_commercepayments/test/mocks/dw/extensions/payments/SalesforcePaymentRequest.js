'use strict';

var sinon = require('sinon');

function SalesforcePaymentRequest(id, selector) {
    return {
        id: id,
        getId: function () {
            return id;
        },
        selector: selector,
        getSelector: function () {
            return selector;
        },
        addInclude: sinon.stub(),
        setBasketData: sinon.stub(),
        setOptions: sinon.stub()
    };
}

module.exports = SalesforcePaymentRequest;
