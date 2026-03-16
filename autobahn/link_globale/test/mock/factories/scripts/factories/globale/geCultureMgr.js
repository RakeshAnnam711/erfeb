'use strict';

function getGECulture(countryCode) {
    var result = null;
    switch (countryCode) {
        case 'CA':
            result = {
                getCustom: function () {
                    return { culture: 'en' };
                }
            };
            break;
        case 'FR':
            result = {
                getCustom: function () {
                    return { culture: 'fr' };
                }
            };
            break;
        default:
            break;
    }
    return result;
}

module.exports = {
    getGECulture: getGECulture
};
