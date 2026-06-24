'use strict';

/**
 * Writes Order Notes
 * @param {dw.order.Order} order - SFCC order
 * @param {string} subject - note subject
 * @param {string} note - note text
 */
function writeOrderNote(order, subject, note) {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    try {
        if (
            globaleHelpers.getPreference(globaleHelpers.preferenceKeys.addNotes) &&
            !globaleHelpers.isNotesLimitReached(order)
        ) {
            if (note.length > 4000) {
                note = (note.slice(0, 3980) + '| truncated to 4000'); // eslint-disable-line no-param-reassign
            }

            // write order note if possible
            Transaction.wrap(function () {
                order.addNote(subject, note);
            });
        }
    } catch (e) {
        // skip error handling
    }
}

module.exports = function (object) {
    Object.defineProperties(object, {
        writeOrderNote: {
            enumerable: true,
            value: writeOrderNote
        }
    });
};
