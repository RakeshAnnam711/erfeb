'use strict';

function addTabs(apiProduct) {
    var tabs = [];
    var customTabAttribute = apiProduct.custom;
    for (var i=1; i<=4; i++) {
        var titleID = "tabTitle"+i;
        var contentID = "tabContent" + i;

        if (titleID in customTabAttribute && !empty(customTabAttribute[titleID]) &&
            contentID in customTabAttribute && !empty(customTabAttribute[contentID])) {
            var markup = '';
            if (customTabAttribute[contentID] && customTabAttribute[contentID].markup) {
                markup = customTabAttribute[contentID].markup;
            }

            tabs.push({
                title: customTabAttribute[titleID],
                content: markup
            });
        }
    }

    return tabs;
}

module.exports = function(object, apiProduct) {
    Object.defineProperty(object, 'tabs', {
        enumerable: true,
        value: addTabs(apiProduct)
    });
};
