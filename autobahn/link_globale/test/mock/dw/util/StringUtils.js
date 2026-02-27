'use strict';

function format(template) {
    var args = Array.prototype.slice.call(arguments).slice(1);
    return template.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] !== 'undefined' ? args[number] : match;
    });
}

module.exports = {
    format: format,
    formatMoney: function (formattedMoney) { return formattedMoney; },
    formatNumber: function (formattedNumber) { return formattedNumber; }
};
