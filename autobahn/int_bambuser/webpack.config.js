'use strict';

const path = require('path');

module.exports = [{
    mode: 'development',
    name: 'js',
    entry: {
            client: path.resolve('./cartridges/int_bambuser/cartridge/client/default/js/bambuser/client.js'), 
            conversionTracker: path.resolve('./cartridges/int_bambuser/cartridge/client/default/js/bambuser/conversionTracker.js')},
    output: {
        path: path.resolve('./cartridges/int_bambuser/cartridge/static/default/js/bambuser'),
        filename: '[name].js'
    },
}];
