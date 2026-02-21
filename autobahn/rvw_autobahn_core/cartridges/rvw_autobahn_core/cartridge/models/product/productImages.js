'use strict';


/*
 * This is a custom DIS configuration. Currently only scaling is used as default. This can be extended as needed.
 * If there is no image, a backup image will be used and should be configured for each view type named: images/noimage-[viewname].png
 * Using the "viewTypeMapping" settings defined in the json, we are able to easily configure and use image types that exist in the catalog
 * Example DIS Config JSON that should be defined in a site preference.
 * {
 *  "viewTypeMapping":{
      "hi-res":"large",
      "large":"large",
      "medium":"large",
      "small":"large",
      "swatch":"swatch",
      "card":"large",
      "thumbnail":"thumbnail"
   },
   "hi-res":{
      "scaleWidth":1600,
      "scaleHeight":1600
   },
   "large":{
      "scaleWidth":800,
      "scaleHeight":800
   },
   "medium":{
      "scaleWidth":250,
      "scaleHeight":250
   },
   "small":{
      "scaleWidth":120,
      "scaleHeight":120
   },
   "swatch":{
      "scaleWidth":60,
      "scaleHeight":60
   },
   "card":{
      "scaleWidth":400,
      "scaleHeight":400
   },
   "thumbnail":{
      "scaleWidth":60,
      "scaleHeight":60
  }
}
*/

var collections = require('*/cartridge/scripts/util/collections');
var Site = require('dw/system/Site');
var ProductVariationAttributeValue = require('dw/catalog/ProductVariationAttributeValue');
var ProductVariationModel = require('dw/catalog/ProductVariationModel');
var URLUtils = require('dw/web/URLUtils');
var disConfigurationJSON = Site.getCurrent().getCustomPreferenceValue("disConfiguration");
if ( !empty(disConfigurationJSON) ) {
    disConfigurationJSON = JSON.parse( disConfigurationJSON );
}

/**
 * @constructor
 * @classdesc Returns images for a given product
 * @param {dw.catalog.Product} product - product to return images for
 * @param {Object} imageConfig - configuration object with image types
 */
function Images(product, imageConfig) {
    var product = product;

    var isProductVariationAttributeValue = (product instanceof ProductVariationAttributeValue);
    var isProductVariationModel = (product instanceof ProductVariationModel);

    //configure backup Alt and Title depending on product type
    var backupAltAndTitle = '';
    if (isProductVariationAttributeValue) {
        backupAltAndTitle = product.displayValue;
    } else if (isProductVariationModel){
        var selectedProd = product.selectedVariants.length > 0 ? product.selectedVariants[0] : product.master;
        backupAltAndTitle = selectedProd.name;
    } else {
        backupAltAndTitle = product.name;
    }

    imageConfig.types.forEach(function (type) {
        var absMissingUrl = URLUtils.httpImage('/images/noimage-' + type + '.png', disConfigurationJSON[type]);
        var viewType = disConfigurationJSON.viewTypeMapping[type];

        var images = product.getImages(viewType);
        var result = {};

        //If no image is found, then we will look for an image in the images folder named noimage-[viewname].png
        if(images.empty) {
            result = [{
                alt: backupAltAndTitle,
                url: absMissingUrl.toString(),
                index: '0',
                title: backupAltAndTitle,
                absURL: absMissingUrl,
                type: viewType
            }];
        } else {
            if (imageConfig.quantity === 'single') {
                var firstImage = collections.first(images);
                var url = firstImage.getAbsImageURL(disConfigurationJSON[type]);

                if (firstImage) {
                    var imageAlt = firstImage.alt ? firstImage.alt : backupAltAndTitle;
                    var imageTitle = firstImage.title ? firstImage.title : backupAltAndTitle;
                    var imageUrl = !empty(firstImage.absURL) ? firstImage.absURL.toString() : absMissingUrl;

                    result = [{
                        alt: imageAlt,
                        url: url.toString(),
                        title: imageTitle,
                        index: '0',
                        absURL: imageUrl,
                        type: viewType
                    }];
                }
            } else {
                result = collections.map(images, function (image, index) {
                    var url = image.getAbsImageURL(disConfigurationJSON[type]);
                    var imageAlt = image.alt ? image.alt : backupAltAndTitle;
                    var imageTitle = image.title ? image.title : backupAltAndTitle;
                    var imageUrl = !empty(image.absURL) ? image.absURL.toString() : absMissingUrl;
                    return {
                        alt: imageAlt,
                        url: url.toString(),
                        index: index.toString(),
                        title: imageTitle,
                        absURL: imageUrl,
                        type: viewType
                    };
                });
            }
        }
        this[type] = result;
    }, this);

    imageConfig.types.forEach(function (type) {
        var absMissingUrl = URLUtils.httpImage('/images/noimage-' + type + '.png', disConfigurationJSON[type]);
        var viewType = disConfigurationJSON.viewTypeMapping[type];
        this[type + '-no-image'] = {
            alt: backupAltAndTitle,
            url: absMissingUrl.toString(),
            index: '0',
            title: backupAltAndTitle,
            absURL: absMissingUrl,
            type: viewType
        };
    }, this);
};

module.exports = Images;