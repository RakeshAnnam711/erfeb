'use strict';

var base = require('base/components/countrySelector');

module.exports = function () {
    // initialize action to allow default behavior
    var $page = $('.page');

    if (['', null, undefined].indexOf($page.data('action')) !== -1) $page.data('action','Home-Show');

    return base.apply(this, arguments);
};
