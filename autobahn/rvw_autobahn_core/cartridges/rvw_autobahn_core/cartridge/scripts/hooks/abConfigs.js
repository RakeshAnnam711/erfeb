'use strict';

module.exports = {
    registerRoute: function (route) {
        var abConfigsHelper = require('*/cartridge/scripts/helpers/abConfigsHelper');

        route.on('route:Start', function (req, res) {
            res.setViewData({ abConfigs: abConfigsHelper.getABConfigs(res.viewData) });
        });

        // Remove abConfigs from view data at final rending steps to prevent overloading JSON.stringify for template rendering (Page Designer)
        route.on('route:BeforeComplete', function (req, res) {
            var rendering = (res.renderings || []).find(function (rendering) { return rendering.type === 'render' });
            var abConfigs = res.viewData.abConfigs;

            if (!empty(abConfigs)) {
                if (!rendering || rendering.subType !== 'isml') {
                    if (rendering && rendering.subType === 'page') {
                        delete res.viewData.abConfigs;
                    } else {
                        var hiddenABConfigs = new Object();

                        Object.keys(abConfigs).forEach(function (key) {
                            Object.defineProperty(hiddenABConfigs, key, {
                                enumerable: false,
                                value: abConfigs[key]
                            })
                        });

                        res.setViewData({ abConfigs: hiddenABConfigs });
                    }
                }
            }
        });
    }
};
