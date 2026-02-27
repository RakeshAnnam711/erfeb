
'use strict';

/**
 * Mock of dw.value.Money
 */
function Money() {
    this.value = 100;
    this.getValue = function () {
        return this.value;
    };
}

module.exports = Money;
