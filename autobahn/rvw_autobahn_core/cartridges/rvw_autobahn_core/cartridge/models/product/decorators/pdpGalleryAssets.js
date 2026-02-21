'use strict';

function createAssetList(apiProduct) {
    var URLUtils = require('dw/web/URLUtils');
    var PageMgr = require('dw/experience/PageMgr');
    var SiteConstants = require('*/cartridge/scripts/constants/SiteConstants');
    var collections = require('*/cartridge/scripts/util/collections');
    var galleryAssets = [];
    var galleryAssetIds = !empty(apiProduct.custom) && !empty(apiProduct.custom.pdpGalleryAssetIds) ? apiProduct.custom.pdpGalleryAssetIds : [];

    galleryAssetIds.forEach(function(assetId) {
        var page = PageMgr.getPage(assetId);

        if (page == null) { // check if the gallery asset exists
            return;
        }

        var region = page.getRegion('main');
        var visibleComponents = region.visibleComponents;
        var thumbnailImagePath = SiteConstants.placeholderImagePaths.thumbnail;
        var isVideo = false;

        // TODO RVW: add support for more Page Designer components
        collections.forEach(visibleComponents, function(component) {
            var componentType = component.typeID;
            var thumbnailImageAttribute;

            // Get thumbnail for components
            switch (componentType) {
                case 'commerce_assets.video':
                    thumbnailImageAttribute = component.getAttribute('thumbnailImage');
                    isVideo = true;
                    break;
                case 'commerce_assets.photoHotspots':
                    thumbnailImageAttribute = component.getAttribute('image1');
                    break;
                case 'commerce_assets.heroBanner':
                    thumbnailImageAttribute = component.getAttribute('backgroundImage');
                    break;
                default: thumbnailImageAttribute = component.getAttribute('image');
            }

            if (!empty(thumbnailImageAttribute) && !empty(thumbnailImageAttribute.path)) {
                thumbnailImagePath = thumbnailImageAttribute.path;
            }
        });

        var thumbnailImageParams = {scaleWidth: 100, scaleHeight: 100};
        var thumbnailImageUrl = URLUtils.imageURL(URLUtils.CONTEXT_LIBRARY, null, thumbnailImagePath, thumbnailImageParams).toString();
        var assetRenderUrl = URLUtils.url('Page-Show', 'cid', assetId, 'isAjax', true).toString();

        galleryAssets.push({
            id: assetId,
            thumbnail: thumbnailImageUrl,
            assetRenderUrl: assetRenderUrl,
            isVideo: isVideo
        });
    });

    return galleryAssets;
}

module.exports = function(object, apiProduct) {
    Object.defineProperty(object, 'pdpGalleryAssets', {
        enumerable: true,
        value: createAssetList(apiProduct)
    });
};
