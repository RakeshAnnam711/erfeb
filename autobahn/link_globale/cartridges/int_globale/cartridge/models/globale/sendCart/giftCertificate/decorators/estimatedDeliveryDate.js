'use strict';

/**
 * Returns Global-e Product.EstimatedDeliveryDate API
 * @returns {string|null} - Global-e Product.EstimatedDeliveryDate API using "YYYY-MM-DD" format
 */
function getEstimatedDeliveryDate() {
    return null;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getEstimatedDeliveryDate', {
        value: getEstimatedDeliveryDate
    });
};
