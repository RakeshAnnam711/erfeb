
'use strict';

var OrderAddress = require('./OrderAddress');

/**
 * Mock of dw.order.Shipment
 */
function Shipment() {
    this.shippingAddress = new OrderAddress();

    this.getShippingAddress = function () {
        return this.shippingAddress;
    };

    this.getProductLineItems = function () {
        return {
            isEmpty: function () {
                return false;
            },
            iterator: function () {

            }
        };
    };

    this.getAdjustedShippingTotalNetPrice = function () {
        return {
            getValue: function () {
                return 10;
            }
        };
    };
}

module.exports = Shipment;
