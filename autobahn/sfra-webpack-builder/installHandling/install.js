"use strict";

/**
 * Multicartridge npm installer command.
 */

const helper = require("../helper/helper");
const sfraBuilderConfigPath = helper.getSfraBuilderConfig();
const sfraBuilderConfig = require(sfraBuilderConfigPath);
const installHelper = require("./installHelper");
const useYarn = require("minimist")(process.argv.slice(2)).useYarn;

const args = process.argv.slice(2) || [];
let CI = false;
if (args.length) {
    if (args[0] === 'CI') {
        CI = true;
    }
}

(() => {
  sfraBuilderConfig.sites.forEach((site) => {
    site.cartridges.forEach((cartridge) => {
        if (useYarn) installHelper.yarnInstall(cartridge, CI);
        else installHelper.npmInstall(cartridge, CI);
      });
    })
})();
