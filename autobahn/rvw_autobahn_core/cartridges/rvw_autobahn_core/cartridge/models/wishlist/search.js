'use strict';

var CustomerMgr = require('dw/customer/CustomerMgr');
var URLUtils = require('dw/web/URLUtils');
var productListMgr = require('dw/customer/ProductListMgr');
var Resource = require('dw/web/Resource');

/**
 * creates a results object for a wishlist search
 * @param {Object} email - email address in form
 * @returns {Object} an object that contains information about the users address
 */
 function search(email) {
    if (!email) {
        return null;
    }

    var result;
    var profiles = [];
    var response = {
        hits: [],
        total: 0
    };

    var listOwner = CustomerMgr.getCustomerByLogin(email);
    if (listOwner) {
        profiles.push(listOwner.profile);
    }

    profiles.forEach(function (profile) {
        var wishLists = productListMgr.getProductLists(profile.customer, 10).toArray();
        wishLists.forEach(function (list) {
            var countLabel = list.items.length === 1
                ? Resource.msg('text.result.wishlist.item.count', 'wishlist', null)
                : Resource.msg('text.result.wishlist.items.count', 'wishlist', null);

            result = {
                name: list.name,
                count: list.items.length,
                countLabel: countLabel,
                url: URLUtils.https('Wishlist-ShowOther', 'id', list.UUID).relative().toString()
            };

            if (list.public) {
                response.total++;
                response.hits.push(result);
            }
        });
    });

    return response;
}

module.exports = search;
