'use strict';
var collections = require('*/cartridge/scripts/util/collections');
function createRecommendationModel(recommendations) {
    var products = [];
    collections.forEach(recommendations, function(recs) {
        products.push({ID: recs.recommendedItem.ID});
    });
    return products;
}
module.exports = function(object, apiProduct) {
    Object.defineProperty(object, 'recommendations', {
        enumerable: true,
        value: createRecommendationModel(apiProduct.getOrderableRecommendations(1))
    });
};