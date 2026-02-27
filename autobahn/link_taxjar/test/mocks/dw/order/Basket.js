
'use strict';

var Customer = require('../customer/Customer');

/**
 * Mock of dw.order.Basket
 */
function Basket() {
    this.customerNo = 'customerNo';
    this.customer = new Customer();

    this.getCustomerNo = function () {
        return this.customerNo;
    };

    this.getCustomer = function () {
        return this.customer;
    };
}

module.exports = Basket;
