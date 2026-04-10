'use strict';

// WGACA MODIFICATION - ISML class does not respect page hook insertion point
// var ISML = require('dw/template/ISML');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var Velocity = require('dw/template/Velocity');
// END MODIFICATION
var BambuserLogger = require('dw/system/Logger').getLogger('BambuserLogger', 'BambuserLogger');
var bambuserHelpers = require('~/cartridge/scripts/bambuser/bambuserHelpers');

/**
 * Example template-based hook
 * Should be executed after page footer
 * Renders a template result. No value return is expected.
 * Platform hook execution results in all registered
 * hooks being executed, regardless of any return value.
 * For this to execute, a cartridge's hooks.json must register app.template.afterFooter hook.
 * @param {Object} params Parameters from the template
 */
function afterFooter() {
    var templateName = 'hooks/afterFooter';
    var config = bambuserHelpers.getBambuserConfig();
    var bambuserEnabled = bambuserHelpers.isFeatureEnabled();
    var miniplayerSkipPages = bambuserHelpers.getMiniplayerSkipPages();
    var fabSkipPages = bambuserHelpers.getFABSkipPages();

    var configFAB = {
        enableFAB: bambuserHelpers.isFABEnabled(),
        fabWidgetId: bambuserHelpers.getFABWidgetId(),
        fabWidgetURL: bambuserHelpers.getFABWidgetURL()
    };

    var fabSkipPage = false;
    var miniplayerSkipPage = false;
    var httpPath = request.httpPath.split('/');
    var page = httpPath.pop();

    for (var i = 0; i < miniplayerSkipPages.length; i += 1) {
        if (page && page === miniplayerSkipPages[i]) {
            miniplayerSkipPage = true;
        }
    }

    for (var j = 0; j < fabSkipPages.length; j += 1) {
        if (page && page === fabSkipPages[j]) {
            fabSkipPage = true;
        }
    }

    if (bambuserEnabled) {
        try {
            // WGACA MODIFICATION - ISML class does not respect page hook insertion point
            // ISML.renderTemplate(templateName, {
            //     config: JSON.stringify(config),
            //     configFAB: JSON.stringify(configFAB),
            //     fabSkipPage: fabSkipPage,
            //     miniplayerSkipPage: miniplayerSkipPage
            // });
            Velocity.render(
                renderTemplateHelper.getRenderedHtml({
                    config: JSON.stringify(config),
                    configFAB: JSON.stringify(configFAB),
                    fabSkipPage: fabSkipPage,
                    miniplayerSkipPage: miniplayerSkipPage
                }, templateName),
                {}
            );
        } catch (e) {
            // WGACA MODIFICATION - ISML class does not respect page hook insertion point
            BambuserLogger.error('Error while rendering template {0}, {1} in {2}:{3}', templateName, e.toString(), e.fileName, e.lineNumber);
        }
    }
}

exports.afterFooter = afterFooter;
