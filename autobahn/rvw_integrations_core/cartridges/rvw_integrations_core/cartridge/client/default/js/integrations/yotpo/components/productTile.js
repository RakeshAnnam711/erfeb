'use strict';

var core = require('core/components/productTile');

core.initYotpo = function () {
    var $body = $('body'),
        ns = '.yotpo';

    $body.off('producttiles:init' + ns)
        .on('producttiles:init' + ns, () => { window.yotpo?.initialized && yotpo.refreshWidgets?.(); });
}

module.exports = core;