'use strict';

var Site = require('dw/system/Site');
var velocity = require('dw/template/Velocity');

/**
 * Implementation of the 'app.template.postFooter' hook that executes after the footer is rendered
 */
function afterFooter (pdict) {
    if (Site.current.getCustomPreferenceValue('ShowLiveChat')) {
        velocity.render('$velocity.remoteInclude(\'Page-LiveChatInclude\')', { velocity: velocity });
    }
}

module.exports = {
    afterFooter: afterFooter
}
