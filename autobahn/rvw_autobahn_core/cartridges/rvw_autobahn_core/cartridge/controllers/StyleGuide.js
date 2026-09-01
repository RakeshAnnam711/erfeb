'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');

server.get('Show', cache.applyDefaultCache, function (req, res, next) {
    var icomoonJson = require('*/cartridge/client/default/fonts/icomoon/selection.json');
    var iconArray = [];

    var currentWizardFavicon;
    try {
        var multiBrandHelper = require('*/cartridge/scripts/helpers/brands/multiBrandHelper');
        var brandSettings = multiBrandHelper.getCurrentBrandSettings(res.viewData);
        currentWizardFavicon = brandSettings ? brandSettings.styleguideFavicon : '';
        if (currentWizardFavicon && !empty(currentWizardFavicon)) {
            currentWizardFavicon = currentWizardFavicon.replace(/['"]+/g, '');
        }
    } catch (e) {
        //if no brands exists, continue
    }

    // get icons from Icomoon's JSON file and add to array
    if (!empty(icomoonJson)) {
        icomoonJson.icons.forEach(function(icon) {
            iconArray.push('icon-' + icon.properties.name);
        });
    }

    // alphabetize icons
    iconArray.sort();

    res.render('styleguide/styleguide', {
        icons: iconArray,
        currentFavicon: currentWizardFavicon
    });
    next();
});

module.exports = server.exports();
