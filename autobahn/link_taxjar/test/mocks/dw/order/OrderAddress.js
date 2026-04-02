
'use strict';

/**
 * Mock of dw.order.OrderAddress
 */
function OrderAddress() {
    this.getCountryCode = function () {
        return {
            getValue: function () {
                return 'US';
            }
        };
    };

    this.getStateCode = function () {
        return 'UT';
    };

    this.getCity = function () {
        return 'Payson';
    };

    this.getAddress1 = function () {
        return '123 Main St.';
    };

    this.getPostalCode = function () {
        return '84651';
    };
}

module.exports = OrderAddress;
