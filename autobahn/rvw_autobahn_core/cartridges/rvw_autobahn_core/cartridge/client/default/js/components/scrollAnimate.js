'use strict';

module.exports = function (element) {
    var headerUtils = require('../utilities/headerUtils');
    var hasFixedHeader = $('header').hasClass('fixed-header');
    var hasFixedHeaderEnhanced = $('header').hasClass('fixed-header-enhanced');
    var position = 0;

    if (element && element.length) {
        if (hasFixedHeader || hasFixedHeaderEnhanced) {
            var headerNavHeight = headerUtils.getHeaderHeightNavOnly();
            var fullHeaderHeight = headerUtils.getHeaderHeight() * 2;

            if (element.offset().top > fullHeaderHeight) {
                position = element.length ? element.offset().top - headerNavHeight : 0;
            }
        } else {
            position = element.offset().top;
        }
    }

    $('html, body').stop().animate({
        scrollTop: Math.max(position - 100, 0)
    }, 500);

    if (!element) {
        $('.logo-home').focus();
    }
};
