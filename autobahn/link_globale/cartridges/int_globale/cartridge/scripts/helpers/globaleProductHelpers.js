'use strict';

const CATEGORIES_LIMIT = 5;

/**
 * Returns product variation group
 * @param {dw.catalog.Product} product - Product
 * @returns {dw.catalog.VariationGroup} - Product variation group
 */
function getProductVariationGroup(product) {
    var productVariationGroup = null;
    var currentVariationGroup = null;
    var masterVariationGroups = product.variant ? product.masterProduct.variationGroups : null;

    if (masterVariationGroups) {
        var masterVariationGroupsIter = masterVariationGroups.iterator();

        while (masterVariationGroupsIter.hasNext()) {
            currentVariationGroup = masterVariationGroupsIter.next();

            if (currentVariationGroup.getVariationModel().getSelectedVariants().contains(product)) {
                productVariationGroup = currentVariationGroup;
                break;
            }
        }
    }

    return productVariationGroup;
}

/**
 * Returns product categories
 * @param {dw.catalog.Product} product - Product
 * @returns {dw.util.LinkedHashSet} - Product categories
 */
function getProductCategories(product) {
    var LinkedHashSet = require('dw/util/LinkedHashSet');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger('GE_PRODUCT_CATEGORIES');
    var categoriesLinkedHashSet = new LinkedHashSet();
    var variationGroupProduct = product.variant ? getProductVariationGroup(product) : null;
    var masterProduct = product.variant ? product.masterProduct : null;

    try {
        // get primary category
        var primaryCategory = product.getPrimaryCategory() ||
            (variationGroupProduct && variationGroupProduct.getPrimaryCategory()) ||
            (masterProduct && masterProduct.getPrimaryCategory());
        if (primaryCategory) {
            categoriesLinkedHashSet.add(primaryCategory);
        }

        // get classification category
        var classificationCategory = product.getClassificationCategory() ||
            (variationGroupProduct && variationGroupProduct.getClassificationCategory()) ||
            (masterProduct && masterProduct.getClassificationCategory());
        if (classificationCategory) {
            categoriesLinkedHashSet.add(classificationCategory);
        }

        // get other product categories
        var productCategories = (product.categories.length && product.categories) ||
            (variationGroupProduct && variationGroupProduct.categories.length && variationGroupProduct.categories) ||
            (masterProduct && masterProduct.categories.length && masterProduct.categories);
        if (productCategories && productCategories.length > 0) {
            collections.forEach(productCategories, function (category) {
                if (category.ID &&
                    category.displayName &&
                    !categoriesLinkedHashSet.contains(category) &&
                    categoriesLinkedHashSet.size() <= CATEGORIES_LIMIT
                ) {
                    categoriesLinkedHashSet.add(category);
                }
            }, this);
        }
    } catch (e) {
        logger.error('getProductCategories: Was not able to get product categories. Error: {0}', logger.message(e));
    }

    return categoriesLinkedHashSet;
}

/**
 * Calculates the Product's Image Absolute URL. If you use Dynamic Imaging Service, update the
 * code to return the image URL using the Dynamic Imaging Service syntax.
 * @example
 * return imageMedia.getAbsImageURL({ scaleWidth: 200, quality: 90 }).toString();
 * @param {dw.catalog.Product} product - Product
 * @returns {string|null} - Product's Image Absolute URL or null
 */
function getProductImageUrl(product) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var imageType = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geProductImageViewType);
    if (!imageType) {
        imageType = 'large';
    }
    var imageMedia = product.getImage(imageType);
    if (imageMedia) {
        return imageMedia.getHttpsURL().toString();
    }
    return null;
}

module.exports = {
    getProductVariationGroup: getProductVariationGroup,
    getProductCategories: getProductCategories,
    getProductImageUrl: getProductImageUrl
};
