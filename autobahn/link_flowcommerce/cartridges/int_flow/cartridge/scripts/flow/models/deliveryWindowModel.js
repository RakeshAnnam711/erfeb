'use strict';

/**
 * Calculates the number of days between two dates
 * @param {Date} from - From Date
 * @param {Date} to - To Date
 * @returns {number} Number of days between the to and from dates
 */
function getDays(from, to) {
    var diff = to.getTime() - from.getTime();

    return Math.max(1, Math.round(diff / (60 * 60 * 24 * 1000)));
}

/**
 * A Flow Delivery Window Model
 * @param {string} data - Flow delivery Window
 * @constructor
 */
function DeliveryWindowModel(data) {
    this.from = new Date(data.from);
    this.to = new Date(data.to);
    this.rawFrom = data.from;
    this.rawTo = data.to;
}

/**
 * Returns the number of days from now until the from date
 * @returns {number} Number of days until from Date
 */
DeliveryWindowModel.prototype.getFromDays = function () {
    return getDays(new Date(), this.from);
};

/**
 * Returns the number of days from now until the to date
 * @returns {number} Number of days until the to Date
 */
DeliveryWindowModel.prototype.getToDays = function () {
    return getDays(new Date(), this.to);
};

module.exports = DeliveryWindowModel;
