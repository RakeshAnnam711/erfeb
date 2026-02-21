'use strict';

exports.getPLICustomMetadata = function (lineItem) {
    // Pass attribute to globale if item is final sale
    if (lineItem && lineItem.product && lineItem.product.custom.final_sale === true) {
        return { 'finalsale': true };
    }

    return false;
};
