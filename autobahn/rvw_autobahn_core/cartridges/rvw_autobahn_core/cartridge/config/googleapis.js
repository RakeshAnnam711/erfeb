'use strict';
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

var base = module.superModule || {};

var current = Site.current;

module.exports = {
    maps: 'https://maps.googleapis.com/maps/api/js?key={0}' + (current.getCustomPreferenceValue('googlePlacesEnabled') ? '&libraries=places' : '') + '&callback=_googleCbPromiseResolution',
    mapsFn: function (key) {
        key = key || current.getCustomPreferenceValue('googleApiKey');
        return StringUtils.format(module.exports.maps, key);
    }
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
