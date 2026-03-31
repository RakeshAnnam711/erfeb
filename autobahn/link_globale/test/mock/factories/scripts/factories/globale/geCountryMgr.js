'use strict';

function isCountryExists(countryCode) {
    return ['GB', 'US', 'CA', 'AU', 'DE'].indexOf(countryCode) !== -1;
}

function getGECountry(countryCode) {
    var result = null;
    switch (countryCode) {
        case 'AU':
            result = {
                custom: {
                    siteUrl: 'https://www.example.com.au'
                }
            };
            break;
        case 'US':
            result = {
                custom: {
                    siteUrl: 'Home-Show|RefArch|en_US'
                }
            };
            break;
        case 'CA':
            result = {
                custom: {
                    siteUrl: 'Home-Show|RefArch|en_CA|www.example.ca'
                }
            };
            break;
        case 'FR':
            result = {
                custom: {
                    siteUrl: 'Home-Show|RefArch|en_FR|www.example.fr|redirect=false|location=fr'
                }
            };
            break;
        case 'DE':
            result = {
                custom: {
                    siteUrl: 'Home-Show|RefArch|en_DE|null|redirect=false'
                }
            };
            break;
        default:
            break;
    }

    return result;
}

function getCountrySiteURL(countryCode) {
    var geCountry = countryCode ? getGECountry(countryCode) : null;
    return geCountry ? geCountry.custom.siteUrl : null;
}

function getDefaultCurrencyCode(countryCode) {
    var result = null;
    switch (countryCode) {
        case 'CA':
            result = 'CAD';
            break;
        case 'AU':
            result = 'AUD';
            break;
        case 'US':
            result = 'USD';
            break;
        default:
            break;
    }

    return result;
}

function getAllowedCountryCurrencies(countryCode) {
    var result = null;
    switch (countryCode) {
        case 'CA':
            result = ['CAD', 'USD', 'GBP', 'EUR'];
            break;
        case 'AU':
            result = ['AUD', 'USD', 'GBP', 'EUR'];
            break;
        case 'US':
            result = ['USD', 'GBP', 'EUR'];
            break;
        default:
            break;
    }

    return result;
}

module.exports = {
    isCountryExists: isCountryExists,
    getCountrySiteURL: getCountrySiteURL,
    getDefaultCurrencyCode: getDefaultCurrencyCode,
    getAllowedCountryCurrencies: getAllowedCountryCurrencies
};
