'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var page = module.superModule;

server.extend(page);

server.append('Locale', cache.applyDefaultCache, function (req, res, next) {
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    if (FlowHelper.isFlowEnabled && FlowHelper.useCountryPicker) {
        res.render('flow/countryPicker', {
            layout: req.querystring.mobile ? 'mobile' : 'desktop'
        });
    }
    next();
});

server.append('SetLocale', function (req, res, next) {
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');

    var experience = ExperienceHelper.getExperience(null, null, req.querystring.code);

    ExperienceHelper.setExperience(experience);
    next();
});

module.exports = server.exports();
