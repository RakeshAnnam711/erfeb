'use strict';

/**
 * Renders yotpo scripts inline velocity remoteInclude
 *
 * @param {Object} params - parameters required by yotpoHeader isml template
 */
function htmlHead(params) {
    var YotpoConfigurationModel = require('*/cartridge/models/common/yotpoConfigurationModel');
    var isCartridgeEnabled = YotpoConfigurationModel.isCartridgeEnabled();
    if (isCartridgeEnabled) {
        var velocity = require('dw/template/Velocity');
        velocity.render('$velocity.remoteInclude(\'Yotpo-HtmlHead\')', { velocity: velocity });
    }
}

module.exports = {
    htmlHead: htmlHead
};
