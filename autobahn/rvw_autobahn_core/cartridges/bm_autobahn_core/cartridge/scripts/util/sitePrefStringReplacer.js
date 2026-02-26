'use strict';

var Site = require('dw/system/Site');
var current = Site.getCurrent();

module.exports = function (strings) {
    if ([null, undefined].indexOf(strings) !== -1) throw new Error('sitePrefStringReplacer: No arguments were passed.');

    if (typeof strings === 'string') {
        return module.exports.replacer(strings);
    } else if (Array.isArray(strings)) {
        return strings.map(function (string) {
            return module.exports.replacer(string);
        });
    }
};

module.exports.replacer= function (stringVal) {
    var exp = module.exports;

    return stringVal.replace(module.exports.replaceRegExp, module.exports.matches);
};

module.exports.replacePrefix = 'siteprefid'
module.exports.replaceRegExp = new RegExp('\\[\\[' + module.exports.replacePrefix + '[\\:\\|].*\\]\\]','gi');

module.exports.matches = function (match) {
    var replaceValue = match.replace(/\[+/gi,'').replace(/\]+/gi,'');
    var customSitePrefId = replaceValue.split(replaceValue.indexOf(':') !== -1 ? ':' : '|').pop();
    var customSitePrefVal = current.getCustomPreferenceValue(customSitePrefId);

    return !empty(customSitePrefVal) ? customSitePrefVal : match;
}
