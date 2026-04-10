'use strict';

var URLUtils = require('dw/web/URLUtils');

var styles = [];
var scripts = [];

/**
 * If the resource to add is not already in the resource array then add it to the array
 * @param {Array} resourceArray - Either the scripts or styles array to which you want to add the resource src to.
 * @param {string} src - URI of the resource to add
 * @param {string} integrity - cryptographic hash of a resource
 * @param {string/boolean} sequence - include null (default), defer, async
 */
function addResource(resourceArray, src, integrity, sequence) {
    var result = {};
    var exists = resourceArray.some(function (element) {
        return element.src === src;
    });

    if (!exists) {
        result.src = src;
        if (integrity) {
            result.integrity = integrity;
        }

        result.sequence = ''; // default value
        if (['defer', 'async'].indexOf(sequence) !== -1) {
            result.sequence = sequence;
        }

        resourceArray.push(result);
    }
}

module.exports = {
    addResource: addResource,
    addCss: function (src, integrity) {
        if (/((http(s)?:)?\/\/).*.css/.test(src)) {
            module.exports.addResource(module.exports.styles, src, integrity);
        } else {
            module.exports.addResource(module.exports.styles, URLUtils.staticURL(src).toString(), integrity);
        }
    },
    addJs: function (src, integrity, sequence) {
        // eslint-disable-next-line no-param-reassign
        sequence = !empty(sequence) ? sequence : 'defer'; // default JS behavior

        if (/((http(s)?:)?\/\/).*.js/.test(src)) {
            module.exports.addResource(module.exports.scripts, src, integrity, sequence);
        } else {
            module.exports.addResource(module.exports.scripts, URLUtils.staticURL(src).toString(), integrity, sequence);
        }
    },
    scripts: scripts,
    styles: styles
};
