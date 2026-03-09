/* global empty:false */
'use strict';

/**
 * A Flow Order
 * @param {string} data - Flow Order data
 * @constructor
 */
function OrderModel(data) {
    if (empty(data) || !data.number) {
        return null;
    }

    this.id = data.id;
    this.number = data.number;
    this.destination = data.destination;
    this.deliveries = data.deliveries;
    this.payments = data.payments;
    this.experience = data.experience;
    this.customer = data.customer;
    this.balance = data.balance;
    this.total = data.total;
    this.prices = data.prices;
    this.selections = data.selections;
    this.lines = data.lines;
    this.items = data.items;
    this.payments = data.payments;
    this.attributes = data.attributes;
    this.submitted_at = data.submitted_at;
    this.delivered_duty = data.delivered_duty;
}

OrderModel.prototype.getItem = function (pid) {
    var i;
    var item;

    for (i = 0; i < this.items.length; i++) {
        item = this.items[i];

        if (item.number === pid) {
            return item;
        }
    }

    return null;
};

module.exports = OrderModel;
