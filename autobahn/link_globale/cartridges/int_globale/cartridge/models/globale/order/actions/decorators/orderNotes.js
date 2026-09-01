'use strict';

/**
 * Adds note
 * @param {string} note - note
 */
function addNote(note) {
    this.orderNotes.push(note);
}

/**
 * Writes the Notes to LineItemCtnr (Order or Basket)
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Order or Basket
 * @param {string} subject - Subject of Order Notes
 */
function writeNotes(lineItemCtnr, subject) {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    try {
        if (
            globaleHelpers.getPreference(globaleHelpers.preferenceKeys.addNotes) &&
            lineItemCtnr &&
            !globaleHelpers.isNotesLimitReached(lineItemCtnr) &&
            this.orderNotes.length
        ) {
            subject = subject || 'GLOBALE'; // eslint-disable-line no-param-reassign
            var orderNotes = (this.orderNotes.join(';\n') + ';');
            if (orderNotes.length > 4000) {
                orderNotes = (orderNotes.slice(0, 3981) + '| truncated to 4000');
            }
            Transaction.wrap(function () {
                lineItemCtnr.addNote(subject, orderNotes);
            });
        }
    } catch (e) {
        logger.error('ORDER_NOTES: {0}', logger.message(e));
    }
    this.orderNotes = [];
}

module.exports = function (object) {
    Object.defineProperties(object, {
        orderNotes: {
            enumerable: true,
            writable: true,
            value: []
        },
        addNote: {
            value: addNote
        },
        writeNotes: {
            value: writeNotes
        }
    });
};
