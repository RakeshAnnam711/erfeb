'use strict';

exports.htmlHead = function () {
    if (dw.system.Site.getCurrent().getCustomPreferenceValue('SignifydEnableCartridge')) {
        var velocity = require('dw/template/Velocity');
        velocity.render('$velocity.remoteInclude(\'Signifyd-IncludeFingerprint\')',{ velocity: velocity });
    }
};
