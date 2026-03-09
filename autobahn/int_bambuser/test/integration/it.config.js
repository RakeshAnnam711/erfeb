var getConfig = require('@tridnguyen/config');
var chalk = require("chalk");
var yargs = require('yargs/yargs')
var { hideBin } = require('yargs/helpers')
var argv = yargs(hideBin(process.argv)).argv

var siteID = 'RefArch';
var hostname = 'zzzz-123.dx.commercecloud.salesforce.com';

if (!argv.baseUrl) {
    console.log(`${chalk.yellow.bold("[warning] \u26A0")} --baseUrl parameter missing using ${hostname} instead`);
} else {
    hostname = argv.baseUrl;
}

if (!argv.siteId) {
    console.log(`${chalk.yellow.bold("[warning] \u26A0")} --siteId parameter missing using ${siteID} instead`);
} else {
    siteID = argv.siteId;
}

var opts = Object.assign({ siteID }, getConfig({
    baseUrl: 'https://' + hostname + '/on/demandware.store/Sites-' + siteID + '-Site/default',
    suite: '*',
    reporter: 'spec',
    timeout: 60000,
    locale: 'x_default'
}, './config.json'));

module.exports = opts;