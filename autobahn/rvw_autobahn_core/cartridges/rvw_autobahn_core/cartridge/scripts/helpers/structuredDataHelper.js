'use strict';

var base = module.superModule;

/**
 * Verify if the address already exists as a stored user address
 * @param {dw.order.OrderAddress} address - Object that contains shipping address
 * @param {Object[]} storedAddresses - List of stored user addresses
 * @returns {boolean} - Boolean indicating if the address already exists
 */
function getContentPageSchema(pageData) {
    var Resource = require('dw/web/Resource');
    var schema = {
        "@context": "http://schema.org/",
        "@type": "CreativeWork",
        "name": pageData.page.name,
        "mainEntityOfPage": "True",
        "publisher": {
            "@type": "Organization",
            "name": dw.system.Site.current.name,
            "logo": {
                "@type": "imageObject",
                "url": dw.web.URLUtils.absStatic('/images/logo.png').toString()
            }
        }
    };

    if (!empty(pageData.page.description)) {
        schema.description = pageData.page.description;
    }

    if (!empty(pageData.tileImage)) {
        schema.image = {
            "@type": "imageObject",
            "url": pageData.tileImage.src.toString(),
            "height": pageData.tileImage.height,
            "width": pageData.tileImage.width
        }
    }

    // Additional attributes for blogs
    if (pageData.isBlogPage) {
        schema['@type'] = 'BlogPosting';
        schema.name = pageData.page.name;
        schema.datePublished = pageData.creationDate;
        schema.datemodified = pageData.datemodified;
    }

    return schema;
}

base.getContentPageSchema = getContentPageSchema;
module.exports = base;
