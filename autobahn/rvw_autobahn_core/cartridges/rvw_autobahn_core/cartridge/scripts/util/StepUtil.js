
'use strict';
var base = module.superModule;

var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

var DATE_FORMAT = 'yyyy-MM-dd';
var DATETIME_FORMAT = 'yyyy-MM-dd_HH-mm-ss-SSS';

module.exports.replacePathPlaceholders = function (path) {
    if (empty(path)) {
        return path;
    }

    var siteID = Site.getCurrent().getID();
    var calendar = new Calendar();

    if (path.indexOf('_today_') > -1) {
        path = path.replace(/_today_/, StringUtils.formatCalendar(calendar, DATE_FORMAT));
    }
    if (path.indexOf('_now_') > -1) {
        path = path.replace(/_now_/, StringUtils.formatCalendar(calendar, DATETIME_FORMAT));
    }
    if (path.indexOf('_siteid_') > -1) {
        path = path.replace(/_siteid_/, siteID);
    }
    if (path.indexOf('_root_') > -1) {
        path = '';
    }

    return path;
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
