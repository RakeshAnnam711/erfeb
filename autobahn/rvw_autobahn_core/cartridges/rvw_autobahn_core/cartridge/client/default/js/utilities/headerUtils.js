'use strict';

/**
 * Creating a global getHeaderHeight function since its used more than once
 * @param {excludedClasses} string of class names, comma separated — OPTIONAL
 * used in: search.js, menu.js
 */
function getHeaderHeight(excludedClasses) {
    var excludedConstants = '.skip, .d-none'
    var excludedClasses = excludedClasses ? excludedClasses + ', ' + excludedConstants : excludedConstants;
    var calculatedHeaderHeight = 0;
    $("#top-header > *:not(" + excludedClasses + ")").each(function () {
        calculatedHeaderHeight += $(this).outerHeight();
    })
    return calculatedHeaderHeight;
}

/**
 * getHeaderHeightNavOnly
 * sometimes there are 2 header-navs if secondary-nav is enabled
 */
function getHeaderHeightNavOnly() {
    var calculatedHeaderHeight = 0;
    //logo-centers secondary-nav is within the original header-nav so don't calculate the height again
    if ($('.logo-center').length) {
        calculatedHeaderHeight = $('.header-nav').outerHeight();
    } else {
        $('.header-nav').each(function () {
            calculatedHeaderHeight += $(this).outerHeight();
            if ($(this).hasClass('secondary-nav')) {
                //helps offset rounding of pixels
                calculatedHeaderHeight --;
            }
        })
    }
    return calculatedHeaderHeight;
}

module.exports = {
    getHeaderHeight: getHeaderHeight,
    getHeaderHeightNavOnly: getHeaderHeightNavOnly
};
