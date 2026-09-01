'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cwd = process.cwd();

const cartridgeName = process.env.npm_config_cartridgeName;
const cartridges = cartridgeName ? [cartridgeName] : [
    'bm_paypal',
    'int_paypal'
];

process.noDeprecation = true;

/**
 * Returns a map js object for the some cartridge
 * @param {string} folderName Cartridge name
 * @returns {Object} An object
 */
function createCartridgeJsFiles(folderName) {
    const cartridgesPath = path.resolve(cwd, 'cartridges');
    const clientPath = path.resolve(cartridgesPath, folderName, 'cartridge/client');
    const result = {};

    glob.sync('*/js/*.js', { cwd: clientPath, absolute: true }).forEach(f => {
        const fileName = path.basename(f, '.js');
        const regex = new RegExp(`${fileName}`, 'g');
        const key = path.join(path.dirname(path.relative(cwd, f)), fileName)
            .replace('client', 'static')
            .replace(regex, (match, p1, p2) => p2.indexOf('js') < p1 ? `${folderName}_${match}` : match);

        result[key] = f;
    });

    return result;
}

/**
 * Deletes js files from cartridge static folder
 * @param {string} folderName Cartridge name
 * @returns {void}
 */
function cleanStaticFolder(folderName) {
    const cartridgesPath = path.resolve(cwd, 'cartridges');
    const clientPath = path.resolve(cartridgesPath, folderName, 'cartridge/static/default/js');

    if (fs.existsSync(clientPath)) {
        const entries = fs.readdirSync(clientPath);

        entries.forEach((entry) => {
            fs.rmSync(path.resolve(clientPath, entry), { recursive: true, force: true });
        });
    }
}

/**
 * Returns a map js object for all cartridges
 * @returns {Object} An object
 */
function createCartridgesJsFiles() {
    return cartridges.reduce((accum, cur) => {
        cleanStaticFolder(cur);

        return Object.assign(accum, createCartridgeJsFiles(cur));
    }, {});
}

module.exports = [{
    mode: process.env.npm_config_mode || 'development',
    devtool: false,
    name: 'js',
    entry: createCartridgesJsFiles(),
    output: {
        path: path.resolve(__dirname) + '/',
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/preset-env',
                                {
                                    targets: {
                                        chrome: '53',
                                        firefox: '49',
                                        edge: '38',
                                        ie: '11',
                                        safari: '10'
                                    }
                                }
                            ]
                        ],
                        plugins: [
                            '@babel/plugin-transform-destructuring',
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-proposal-object-rest-spread'
                        ],
                        cacheDirectory: true
                    }
                },
                exclude: [
                    /tab\.js$/
                ]
            }
        ]
    }
}];
