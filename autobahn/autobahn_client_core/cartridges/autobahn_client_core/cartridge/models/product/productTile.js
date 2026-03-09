var base = module.superModule;

var decorators = require('*/cartridge/models/product/decorators/index');

module.exports = function productTile(product, apiProduct, productType, params) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var product = base(product, apiProduct, productType, params);

    var options = productHelper.getConfig(apiProduct, params);

    decorators.availability(product, options.quantity, apiProduct.minOrderQuantity.value, apiProduct.availabilityModel);
    decorators.readyToOrder(product, options.variationModel);

    return product;
};
