'use strict';

function addBadges(apiProduct) {
    var badges = [];

    if (apiProduct && apiProduct.attributeModel && apiProduct.attributeModel.attributeGroups) {
        // Pulls down the badges product attribute group and converts it to an array
        var badgeNames = !empty(apiProduct.custom) && !empty(apiProduct.custom.badgeNames) ? apiProduct.custom.badgeNames : [];
        var badgeClasses = !empty(apiProduct.custom) && !empty(apiProduct.custom.badgeClasses) ? apiProduct.custom.badgeClasses : [];

        for (var i = 0; i < badgeNames.length; i++) {
            var badgeClass = !empty(badgeClasses[i]) ? badgeClasses[i] : '';
            badges.push({
                class: badgeClass,
                name: badgeNames[i]
            });
        }
    }

    return badges;
}

module.exports = function(object, apiProduct) {
    Object.defineProperty(object, 'badges', {
        enumerable: true,
        value: addBadges(apiProduct)
    });
};
