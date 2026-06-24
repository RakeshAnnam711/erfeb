'use strict';

var base = module.superModule;

/**
 * Middleware to compute request pageMetaData object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function computedPageMetaData(req, res, next) {
    var computedMetaData = {
        title: req.pageMetaData.title,
        description: req.pageMetaData.description,
        keywords: req.pageMetaData.keywords,
        pageMetaTags: []
    };

    req.pageMetaData.pageMetaTags.forEach(function (item) {
        if (item.title) {
            computedMetaData.title = item.content;
        } else if (item.name && item.ID === 'description') {
            computedMetaData.description = item.content;
        } else if (item.name && item.ID === 'keywords') {
            computedMetaData.keywords = item.content;
        } else if (item.property && item.ID === 'og:image') {
            if (res.viewData.product) {
                // Add og:image for PDPs
                var productImage = res.viewData.product.images.large[0].url || null;
                if (!empty(productImage)) {
                    computedMetaData.pageMetaTags.push({
                        content: productImage,
                        ID: item.ID,
                        name: item.name,
                        property: item.property,
                        title: item.title
                    });
                }
            }
        } else {
            computedMetaData.pageMetaTags.push(item);
        }
    });

    res.setViewData({
        CurrentPageMetaData: computedMetaData
    });
    next();
}

module.exports = {
    computedPageMetaData: computedPageMetaData
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
