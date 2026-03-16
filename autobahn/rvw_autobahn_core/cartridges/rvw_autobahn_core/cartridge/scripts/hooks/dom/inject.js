'use strict';

var UUIDUtils = require('dw/util/UUIDUtils');
var velocity = require('dw/template/Velocity');

/**
 * validates the current users basket
 * @param {Object} pdict - The current pdict
 * @returns {String} attributes string for product DOM element
 */
function productTile(pdict) {
    if (pdict && pdict.urls && !empty(pdict.urls.replace)) {
        var obj = { url: pdict.urls.replace.toString() };

        var isXMLHttpRequest = request.httpHeaders['x-requested-with'] === 'XMLHttpRequest';

        if (isXMLHttpRequest) {
            obj.uuid = UUIDUtils.createUUID();

            // find parent via elementID, modify parent data attribute
            velocity.render('<script id=\"$uuid\"> document.getElementById(\'$uuid\').parentNode.dataset.replaceContent = \'$url\'; </script>', obj);
        } else {
            // find parent element and modify parent data attribute
            velocity.render('<script> document.currentScript.parentNode.dataset.replaceContent = \'$url\'; </script>', obj);
        }
    }
}

module.exports = {
    productTile: productTile,
};
