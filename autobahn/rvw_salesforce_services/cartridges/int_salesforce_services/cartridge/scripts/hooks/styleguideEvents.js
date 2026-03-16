'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

var MarketingManager = require('*/cartridge/scripts/marketing/MarketingManager');
var SalesforceConstants = require('*/cartridge/scripts/constants/SalesforceConstants');
var MarketingCloudAssetTypes = SalesforceConstants.MarketingCloudAssetTypes;

/**
 * validates the current users basket
 * @param {Object} pdict - The current pdict
 * @returns {String} attributes string for product DOM element
 */
function updateStyles(pdict) {
    // TODO - make more dynamic based on constant lookup.
    var cssVarMap = {
        '--white': '#ffffff',
        '--off-white': '#f2f2f2',
        '--light-gray': '#c5c5c5',
        '--gray': '#bebebe',
        '--dark-gray': '#767676',
        '--black': '#000000',
        '--success': '#008827',
        '--warning': '#ddcc00',
        '--danger': '#a3080f',
        '--info': '#3091e7'
    };
    var cssVarTest = /var\(\-\-[\-a-zA-Z0-9]+\)/;
    var valueLookup = function (value) {
        value = value || '';
        // Find variables with var syntax
        var matchedCssVarValues = value.match(cssVarTest); // [var(--white)]

        // Only replace and recurse if vars are found
        if (matchedCssVarValues && matchedCssVarValues.length > 0) {
            // Replace var syntax
            matchedCssVarValues.forEach(function (cssVarValue) { //var(--white)
                // Lookup Key
                var cssVarMapKey = cssVarValue.slice(4, -1); //--white
                var cssVarMapValue = cssVarMap[cssVarMapKey];

                // Only attempt recusrion if value found
                if (!empty(cssVarMapValue)) {
                    // Single instance replace action, intensionally not global
                    value = value.replace(cssVarValue, valueLookup(cssVarMapValue));
                }
            });
        }

        return value;
    };

    var payload = [];

    // Translate styleguide prefs to map
    if (!empty(pdict.styles)) {
        let stylesArray = pdict.styles.split(';');

        stylesArray.forEach(function (styleVariable) {
            styleVariable = (styleVariable || '').split(':');

            var varKey = styleVariable[0];
            var varValue = styleVariable.length > 0 ? styleVariable[1] : null;

            if (!styleVariable || empty(varKey) || empty(varValue)) return;

            cssVarMap[varKey] = varValue;
            payload.push([varKey, varValue]);
        });
    }

    // Translate styleguide prefs to map
    if (!empty(pdict.font)) {
        let stylesArray = pdict.font.split('&');

        stylesArray.forEach(function (styleVariable) {
            styleVariable = (styleVariable || '').split('=');

            var varKey = styleVariable[0];
            var varValue = styleVariable.length > 0 ? styleVariable[1] : null;

            if (!styleVariable || empty(varKey) || empty(varValue)) return;

            cssVarMap[varKey] = varValue;
            payload.push([varKey, varValue]);
        });
    }

    // Convert 'vars' to values
    payload = payload.map(function (args) {
        var cssVarNameRoot = args[0].slice(2);
        var cssVarValue = valueLookup(args[1]);
        var payloadKey = cssVarNameRoot.replace(/\-+/g,'_'); // reformt dash/multi-dash to underscore
        var payloadName = cssVarNameRoot.split('').map(function (char, i, str) {
            // Replace dash and underscore
            char =  /[\-\_]/i.test(char) ? ' ' : char;
            // Uppercase rule
            return i === 0 || /[^a-z0-9]/i.test(str[i - 1]) ? char.toUpperCase() : char;
        })
        .join('')
        .replace(/\s+/g,' '); // Remove redundant spaces

        return {
            keys: {
                Key: payloadKey
            },
            values: {
                Value: cssVarValue,
                Name: payloadName
            }
        };
    });

    try {
        var DataEventsResponse = MarketingManager.InsertIntoDataEvents('rvw_styles_sfcc', payload);

        Logger.info("MarketingManager service call complete: {0}", DataEventsResponse.Successful);
    } catch (err) {
        Logger.warn("MarketingManager service call failed: {0} in {2}: {3}\n\n Details: {1}", [err.message, err.toString(), err.fileName, err.lineNumber]);
    }
}

function updateImages (pdict) {
    var urlFlag = /url\(data:image\/.*\;base64\,.*\)/;
    var parseValue = function (value) {
        var type;
        var base64;

        value = value || '';
        // Find variables with func syntax
        var urlVar = value.match(urlFlag); // [url(data:image/...;base64,...)]

        if (urlVar && urlVar.length > 0) {
            // Replace func syntax
            urlVar.forEach(function (replaceVar) { //var(--white)
                // Lookup Key
                var index = replaceVar.indexOf(';base64,');

                type = replaceVar.slice(replaceVar.indexOf('image/') + 6, index);
                base64 = replaceVar.slice(index + 8, -1);
            });
        }

        return {
            type: type,
            base64: base64
        };
    };

    var payloads = [];

    ['desktopLogo', 'mobileLogo', 'favicon'].forEach(function (prop) {
        // Remove extra quotes
        var imageVarCSSFuction = pdict[prop].replace(/[\"\']/g,'');
        if (pdict[prop]) {
            var index = imageVarCSSFuction.indexOf(':'); // split point (cannot use split since multiple : exist)
            var cssVarID = imageVarCSSFuction.slice(0, index);
            var cssVarValue = imageVarCSSFuction.slice(index + 1);

            payloads.push([cssVarID, cssVarValue]);
        }
    });

    // Convert 'vars' to values
    payloads = payloads.map(function (args) {
        var cssVarVal = parseValue(args[1]);

        var fileNamePattern = args[0].slice(2);
        var cssVarKey = fileNamePattern.replace(/\-+/g,'_'); // reformt dash/multi-dash to underscore
        var titleKey = fileNamePattern.split('').map(function (char, i, str) {
            // Replace dash and underscore
            char =  /[\-\_]/i.test(char) ? ' ' : char;
            // Uppercase rule
            return i === 0 || /[^a-z0-9]/i.test(str[i - 1]) ? char.toUpperCase() : char;
        })
        .join('')
        .replace(/\s+/g,' '); // Remove redundant spaces

        return {
            "name": titleKey,
            "customerKey": cssVarKey,
            "assetType": {
                "name": cssVarVal.type,
                "id": MarketingCloudAssetTypes[cssVarVal.type] || null
            },
            "file": cssVarVal.base64,
            "ModelVersion": 2,
            "FileProperties": {
                "fileName": [fileNamePattern, cssVarVal.type].join('.')
            }
        };
    });

    try {
        payloads.forEach(function (payload) {
            var customerKey = payload && payload.customerKey;
            var DataEventsQueryResponse = !empty(customerKey) ? MarketingManager.QueryForContentAsset(null, 'CustomerKey eq \'' + customerKey + '\'') : null;
            var assetId = null;

            if (DataEventsQueryResponse && DataEventsQueryResponse.SalesforceInfo && DataEventsQueryResponse.SalesforceInfo.count > 0) {
                if (DataEventsQueryResponse.SalesforceInfo.count !== 1) throw "Customer Key is not unique";

                assetId = DataEventsQueryResponse.SalesforceInfo.items[0].id;
            }

            var DataEventsResponse = MarketingManager.InsertIntoContentAsset(assetId, payload);

            Logger.info("MarketingManager service call complete: {0}", DataEventsResponse.Successful);
        });

    } catch (err) {
        Logger.warn("MarketingManager service call failed: {0} in {2}: {3}\n\n Details: {1}", [err.message, err.toString(), err.fileName, err.lineNumber]);
    }
}

module.exports = {
    styleGuideUpdate: function (pdict) {
        var current = Site.getCurrent();

        if (current.getCustomPreferenceValue('MarketingCloudForBMStyleguideSyncEnabled') && pdict) {
            if (pdict.styles || pdict.font) module.exports.updateStyles.apply(module.exports, arguments);

            if (pdict.desktopLogo || pdict.mobileLogo || pdict.favicon) module.exports.updateImages.apply(module.exports, arguments);
        }
    },
    updateStyles: updateStyles,
    updateImages: updateImages
};
