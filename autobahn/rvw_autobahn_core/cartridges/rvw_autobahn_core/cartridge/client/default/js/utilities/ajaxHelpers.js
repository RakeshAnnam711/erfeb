'use strict';

/**
 * Helper to re-init files after ajax calls
 *
 * @return {Object}  An object containing the core files to re-init
 */
module.exports = {
    methods: require('pagedesigner/base').methods,
    einstein: require('../components/einsteinRecs'),
    productTile: require('../components/productTile'),
    video: require('../components/video'),
    slider: require('../components/slider'),
    pageDesigner: require('pagedesigner/pageDesigner')
};
