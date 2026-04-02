'use strict';

/**
 * Returns Global-e product VAT Rate
 * @param {string} countryCode - country code
 * @returns {numeric|null} - VAT Rate
 */
function geGetProductCode() {
    return this.isOptionProductLineItem() ? this.getOptionID() : this.productID;
}

/**
 * Define properties on an object.
 * @param {Object} object - The object to define properties on.
 */
module.exports = function (object) {
    Object.defineProperties(object, {
        geGetProductCode: {
            value: geGetProductCode
        }
    });
};
