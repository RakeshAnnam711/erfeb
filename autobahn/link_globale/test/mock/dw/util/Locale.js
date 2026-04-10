'use strict';

function getCountry() {
    return this.country;
}

module.exports = {
    getLocale: function (localeID) {
        var result = null;
        switch (localeID) {
            case 'en_GB':
                result = {
                    ID: 'en_GB',
                    country: 'GB',
                    displayCountry: 'United Kingdom',
                    language: 'en',
                    getCountry: getCountry
                };
                break;
            case 'en_AU':
                result = {
                    ID: 'en_AU',
                    country: 'AU',
                    displayCountry: 'Australia',
                    language: 'en',
                    getCountry: getCountry
                };
                break;
            case 'en_US':
                result = {
                    ID: 'en_US',
                    country: 'US',
                    displayCountry: 'United States',
                    language: 'en',
                    getCountry: getCountry
                };
                break;
            default:
                result = {
                    ID: null,
                    country: null,
                    displayCountry: null,
                    language: null,
                    getCountry: getCountry
                };
                break;
        }

        return result;
    }
};
