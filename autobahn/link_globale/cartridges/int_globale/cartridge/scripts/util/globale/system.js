'use strict';

/**
 * Delays a thread execution
 * @param {number} ms - timeout (ms)
 * @returns {boolean} - true
 */
function sleep(ms) {
    var waitTill = ((new Date()).getTime() + (ms));
    while ((new Date()).getTime() < waitTill) {
        // wait 1 proc time
    }
    return true;
}

module.exports = {
    sleep: sleep
};
