'use strict';

// These values should always match the variables set in _variables.scss and the contentImageBreakpoints site pref
module.exports.BreakpointSizes = {
    'sm': 544,
    'md': 769,
    'lg': 1024,
    'xl': 1440
};

module.exports.TransitionSpeed = 200;

module.exports.ComponentAnimationDelay = 0;

module.exports.Spacer = 16;

module.exports.placeholderImagePaths = {
    'thumbnail': '/images/gray.png',
    'imageMissing': '/images/placeholder.png'
}

module.exports.defaultMapMarker = {
    'color': 'white',
    'backgroundImage': '/images/icons/map-marker-default.svg'
}

module.exports.defaultStoreType = {
    'id': 0,
    'displayValue': 'Retail',
    'value': 'retail'
}

// These are used in cartridge/client/default/js/components/search.js
module.exports.UP_KEY = 38;
module.exports.DOWN_KEY = 40;
module.exports.DIRECTION_DOWN = 1;
module.exports.DIRECTION_UP = -1;
