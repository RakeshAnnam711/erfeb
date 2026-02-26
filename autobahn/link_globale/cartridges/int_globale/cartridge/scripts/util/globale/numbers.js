'use strict';

/**
 * Returns rounded value
 * @param {number} number - number to round
 * @param {number} places - decimal places
 * @returns {number} rounded value
 */
function round(number, places) {
    return +(Math.round(number + 'e+' + places) + 'e-' + places);
}

module.exports = {
    round: round
};
