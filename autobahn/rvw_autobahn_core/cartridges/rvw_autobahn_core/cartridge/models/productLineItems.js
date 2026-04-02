'use strict';

var base = module.superModule;

/**
 * @constructor
 * @classdesc This model extension includes additional custom attributes used on the Status Email
 * which are provided from SOM Status updates
 *
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - the product line items
 *                                                       of the current line item container
 * @param {string} view - the view of the line item (basket or order)
 */
function ProductLineItems(productLineItems, view) {
    base.call(this, productLineItems, view);

    var items = this.items;
    if (items && items.length > 0) {
        this.items = items.sort(function (a, b){
            if (a.itemType === 'digital' && b.itemType !== 'digital'){
                return -1;
            }

            if (a.itemType !== 'digital' && b.itemType === 'digital') {
                return 1;
            }

            return 0;
        });
        var physicalItems = items.filter(function (item) {
            return item.itemType !== 'digital'
        });
        this.physicalItemsCount = physicalItems.length;
    } else {
        this.physicalItemsCount = 0;
    }
};

ProductLineItems.prototype = Object.create(base.prototype);

module.exports = ProductLineItems;

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
