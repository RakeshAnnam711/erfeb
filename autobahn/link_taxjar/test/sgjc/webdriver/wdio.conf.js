/* eslint-env es6 */
/* eslint-disable no-console */
/* global chalk */

'use strict';

var minimist = require('minimist');
var argv = minimist(process.argv.slice(2));
var getConfig = require('@tridnguyen/config');
var _ = require('lodash');

const cwd = process.cwd();
const fs = require('fs');
const path = require('path');

var dwJson;

if (fs.existsSync(path.join(cwd, 'dw.json'))) {
    dwJson = require(path.join(cwd, 'dw.json'));
} else {
    console.error(chalk.red('Could not find dw.json file'));
    process.exit(1);
}

var opts = _.assign({}, getConfig({
    client: 'chrome',
    url: 'https://' + dwJson.hostname + '/s/SiteGenesis',
    suite: '*',
    coverage: 'smoke',
    reporter: 'spec',
    timeout: 60000,
    locale: 'x_default'
}, './config.json'), argv);

var specs = 'test/sgjc/application' + opts.suite;

if (opts.suite.indexOf('.js') === -1) {
    specs += '/**';
}

exports.config = _.assign({
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: opts.timeout,
        compilers: ['js:babel-core/register']
    },
    specs: [
        specs
    ],
    capabilities: [{
        browserName: opts.client
    }],
    waitforTimeout: opts.timeout,
    baseUrl: opts.url,
    reporter: opts.reporter,
    reporterOptions: {
        outputDir: 'test/reports'
    },
    locale: opts.locale,
    coverage: opts.coverage,
    user: opts.user,
    userEmail: opts.userEmail || opts.user + '@demandware.com',
    logLevel: 'error'
});

