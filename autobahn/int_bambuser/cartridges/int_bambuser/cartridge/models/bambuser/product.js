'use strict';

var IMAGE_SIZE = dw.system.Site.current.getCustomPreferenceValue('bambuser_image_size');

/**
 * bambuser size model
 * @param {Product} variant current variant
 * @returns {BambuserSize} - Size instance
 * @constructor
 */
function BambuserSize(variant) {
    var priceModel = variant.getPriceModel();
    var availabilityModel = variant.getAvailabilityModel();
    var prodVarModel = variant.getVariationModel();

    // get size variants
    var sizeAttr = prodVarModel.getProductVariationAttribute('size');

    this.name = (sizeAttr) ? prodVarModel.getSelectedValue(sizeAttr).displayValue : '';
    this.sku = variant.ID;
    this.price = {
        currency: priceModel.price.currencyCode,
        current: priceModel.price.value
    };
    this.inStock = availabilityModel.inStock;

    return this;
}

/**
 * Bambuser API Product Model
 * used to update the in-player product
 *
 * @param {dw.catalog.Product} prod - API Product object
 * @param {string} bambuserPid - Bambuser Product ID
 * @returns {BambuserProduct} - BambuserProduct instance
 * @constructor
 */
module.exports = function BambuserProduct(prod, bambuserPid) {
    if (prod) {
        // base values
        this.bambuserPID = bambuserPid || prod.ID;
        this.id = prod.ID;
        this.brand = prod.brand;
        this.name = prod.name;
        this.description = prod.shortDescription.toString();

        var colorAttr = prod.variationModel.getProductVariationAttribute('color');

        // Scenario 1: Color variation attribute available
        if (colorAttr) {
            var colorVals = prod.variationModel.getAllValues(colorAttr).toArray();
            this.variations = colorVals.map(function (colorVal) {
                var img = prod.variationModel.getImage(IMAGE_SIZE, colorAttr, colorVal);

                prod.variationModel.setSelectedAttributeValue(colorAttr, colorVal);

                var context = new dw.util.HashMap();
                context.put(colorAttr.ID, colorVal.ID);
                var variants = prod.variationModel.getVariants(context).toArray();
                var sizes = (variants.length ? variants : [prod])
                    .map(function (variant) {
                        return new BambuserSize(variant);
                    });

                return {
                    sku: prod.ID + '_' + colorVal.value,
                    name: prod.name,
                    colorName: colorVal.displayValue,
                    imageURLs: [img.getAbsURL().toString()],
                    sizes: sizes
                };
            });
        // Scenario 2: variations available
        } else if (prod.variants && prod.variants.length) {
            this.variations = prod.variants.toArray().map(function (variant) {
                return {
                    sku: variant.ID,
                    name: variant.name,
                    colorName: null,
                    imageURLs: [variant.getImage(IMAGE_SIZE).getAbsURL().toString()],
                    sizes: [new BambuserSize(variant)]
                };
            });
        // Scenario 3: simple product
        } else {
            this.variations = [
                {
                    sku: prod.ID,
                    name: prod.name,
                    colorName: null,
                    imageURLs: [prod.getImage(IMAGE_SIZE).getAbsURL().toString()],
                    sizes: [new BambuserSize(prod)]
                }
            ];
        }
        return this;
    }
    return null;
};
