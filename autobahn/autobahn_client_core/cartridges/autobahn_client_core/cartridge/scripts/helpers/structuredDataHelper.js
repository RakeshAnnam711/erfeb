'use strict';

var base = module.superModule;
var baseGetContentPageSchema = base.getContentPageSchema;

var URLUtils = require('dw/web/URLUtils');

/**
 * Verify if the address already exists as a stored user address
 * @param {dw.order.OrderAddress} address - Object that contains shipping address
 * @param {Object[]} storedAddresses - List of stored user addresses
 * @returns {boolean} - Boolean indicating if the address already exists
 */
function getContentPageSchema(pageData) {
    var schema = baseGetContentPageSchema.apply(this, arguments);

    if (pageData.page.ID == 'wgaca-home') {
        schema = Object.assign(schema, {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "What Goes Around Comes Around NYC",
            "url": URLUtils.abs('Home-Show').toString(),
            "logo": URLUtils.absStatic("/images/logo.png"),
            "description": "What Goes Around Comes Around, also known as “WGACA”, is the premier purveyor of the finest luxury vintage accessories and apparel from around the world. For over 25 years, we’ve elevated traditional vintage shopping into a high-fashion experience with our unique vision and concept. No other retailer combines pre-owned luxury accessories and high fashion apparel in a curated, seasonal, and trend-facing assortment. WGACA has evolved into a business that cultivates and preserves the fine art of fashion from the most prestigious houses, designers, and luxury brands. What Goes Around Comes Around is a lifestyle. We believe that luxury craftsmanship and premier vintage should be revered, preserved, and adored for years to come. Our goal is to create a sustainable company where the finest collection of pristine, pre-owned luxury and vintage pieces can find new homes.",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "812 Jersey Ave Floor 8",
                "addressLocality": "Jersey City",
                "addressRegion": "NJ",
                "postalCode": "07310"
            },
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "855-746-7942"
            },
            "sameAs": [
                "https://www.instagram.com/whatgoesaroundnyc/",
                "https://www.facebook.com/WhatGoesAroundNYC/",
                "https://www.linkedin.com/company/what-goes-around-comes-around/",
                "https://www.pinterest.com/wgacany/"
            ]
        });
    }

    return schema;
}

base.getContentPageSchema = getContentPageSchema;
module.exports = base;
