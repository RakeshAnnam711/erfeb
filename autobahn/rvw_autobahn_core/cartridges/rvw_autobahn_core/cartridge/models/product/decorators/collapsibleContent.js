'use strict';

function addCollapsibleContent(product, apiProduct) {
    var collapsibleContent = [];
    var productAttributes = apiProduct.custom;
    for (var i=1; i<=4; i++) {
        var collapsible = product['pdpCollapsibleContentDesktop' + i];
        var isCollapsible = !empty(product['pdpCollapsibleContentDesktop' + i]) && product['pdpCollapsibleContentDesktop' + i] != 'not-collapsible';
        var titleID = "collapsibleTitle" + i;
        var contentID = "collapsibleContent" + i;


        if ((isCollapsible || (titleID in productAttributes && !empty(productAttributes[titleID]))) &&
            contentID in productAttributes && !empty(productAttributes[contentID])) {
            var markup = '';
            if (productAttributes[contentID] && productAttributes[contentID].markup) {
                markup = productAttributes[contentID].markup;
            }
            collapsibleContent.push({
                title: productAttributes[titleID],
                content: markup,
                state: product['pdpCollapsibleContentDesktop' + i]
            });
        }
    }

    return collapsibleContent;
}

module.exports = function(object, apiProduct) {
    Object.defineProperty(object, 'collapsibleContent', {
        enumerable: true,
        value: addCollapsibleContent(object, apiProduct)
    });
};
