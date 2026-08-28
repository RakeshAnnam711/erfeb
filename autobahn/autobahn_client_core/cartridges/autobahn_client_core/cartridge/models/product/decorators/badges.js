'use strict';

/**
 * Badges decorators to populate badges Data
 * Behaviour
 * When:
 * 1. badgeStartDateTime and badgeEndDateTime not set badges wont be displayed
 * 2. badgeStartDateTime is set then bagde will only start displaying after that time.
 * 3. badgeEndDateTime is set then badge will only stop displaying after that time.
 * 
 * 
 * Custom Object called 'badges' has to exist otherwise it will throw an error.
 * 
 * 
 */

function isCssColorValue(value) {
    return /^#|^rgb\(|^hsl\(/i.test(value);
}

function normalizeClass(prefix, value) {
    if (!value) {
        return '';
    }
    if (value.indexOf(prefix + '--') === 0) {
        return value;
    }
    return prefix + '--' + value;
}

function buildBadgeStyleAndClass(badgeClass, badgeFontSize, badgeBorderColor, badgeBackgroundColor, badgeFontColor, badgeFontStyle, badgeFontWeight) {
    var classParts = [];
    var styleParts = [];

    // Parse badgeClass and remove conflicting classes if individual fields are set
    var badgeClassArray = [];
    if (!empty(badgeClass)) {
        badgeClassArray = badgeClass.toString().trim().split(/\s+/);
    }

    // If individual fields are set, remove conflicting classes from badgeClass
    if (!empty(badgeFontSize)) {
        badgeClassArray = badgeClassArray.filter(function(cls) {
            return cls.indexOf('font-size--') !== 0;
        });
    }

    if (!empty(badgeBackgroundColor)) {
        badgeClassArray = badgeClassArray.filter(function(cls) {
            return cls.indexOf('background--') !== 0;
        });
    }

    if (!empty(badgeBorderColor)) {
        badgeClassArray = badgeClassArray.filter(function(cls) {
            return cls.indexOf('border--') !== 0;
        });
    }

    if (!empty(badgeFontColor)) {
        badgeClassArray = badgeClassArray.filter(function(cls) {
            return cls.indexOf('text--') !== 0;
        });
    }

    if (!empty(badgeFontWeight)) {
        badgeClassArray = badgeClassArray.filter(function(cls) {
            return cls.indexOf('font-weight--') !== 0;
        });
    }

    // Add remaining badgeClass classes
    if (badgeClassArray.length > 0) {
        classParts.push(badgeClassArray.join(' '));
    }

    if (!empty(badgeFontSize)) {
        var fontSizeValue = badgeFontSize.toString().trim();
        if (/^\d+$/.test(fontSizeValue)) {
            classParts.push(normalizeClass('font-size', fontSizeValue));
        } else if (fontSizeValue.indexOf('font-size--') === 0) {
            classParts.push(fontSizeValue);
        } else {
            styleParts.push('font-size: ' + fontSizeValue + ';');
        }
    }

    if (!empty(badgeBackgroundColor)) {
        var backgroundColorValue = badgeBackgroundColor.toString().trim();
        if (backgroundColorValue.indexOf('background--') === 0) {
            classParts.push(backgroundColorValue);
        } else if (isCssColorValue(backgroundColorValue)) {
            styleParts.push('background-color: ' + backgroundColorValue + ';');
        } else {
            classParts.push(normalizeClass('background', backgroundColorValue));
        }
    }

    if (!empty(badgeBorderColor)) {
        var borderColorValue = badgeBorderColor.toString().trim();
        if (borderColorValue.indexOf('border--') === 0) {
            classParts.push(borderColorValue);
        } else if (isCssColorValue(borderColorValue)) {
            styleParts.push('border-color: ' + borderColorValue + ';');
        } else {
            classParts.push(normalizeClass('border', borderColorValue));
        }
    }

    if (!empty(badgeFontColor)) {
        var fontColorValue = badgeFontColor.toString().trim();
        if (fontColorValue.indexOf('text--') === 0) {
            classParts.push(fontColorValue);
        } else if (isCssColorValue(fontColorValue)) {
            styleParts.push('color: ' + fontColorValue + ';');
        } else {
            classParts.push(normalizeClass('text', fontColorValue));
        }
    }

    if (!empty(badgeFontStyle)) {
        var fontStyleValue = badgeFontStyle.toString().trim();
        if (fontStyleValue === 'italic' || fontStyleValue === 'normal' || fontStyleValue === 'oblique') {
            styleParts.push('font-style: ' + fontStyleValue + ';');
        }
    }

    if (!empty(badgeFontWeight)) {
        var fontWeightValue = badgeFontWeight.toString().trim();
        if (/^\d+$/.test(fontWeightValue)) {
            classParts.push('font-weight--' + fontWeightValue);
        } else if (fontWeightValue.indexOf('font-weight--') === 0) {
            classParts.push(fontWeightValue);
        } else if (fontWeightValue === 'normal' || fontWeightValue === 'bold' || fontWeightValue === 'lighter' || fontWeightValue === 'bolder') {
            styleParts.push('font-weight: ' + fontWeightValue + ';');
        }
    }

    return {
        className: classParts.join(' ').trim(),
        style: styleParts.join(' ').trim()
    };
}


// Resolves one 'badges' Custom Object by name into {name, class, style}; wrapped in try/catch since liveSelling.js calls this for every product tile and a missing Custom Object type must not break the whole PLP.
function resolveBadge(badgeName) {
    try {
        if (empty(badgeName)) {
            return null;
        }

        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var Site = require('dw/system/Site');
        var Calendar = require('dw/util/Calendar');

        // custom object badges had to be in metadata otherwise a error will be thrown
        var badgeObj = CustomObjectMgr.getCustomObject("badges", badgeName);
        if (empty(badgeObj)) {
            return null;
        }

        var badgeStartDateTime = !empty(badgeObj.custom.badgeStartDateTime) ? badgeObj.custom.badgeStartDateTime : null;
        var badgeEndDateTime = !empty(badgeObj.custom.badgeEndDateTime) ? badgeObj.custom.badgeEndDateTime : null;
        var badgeClass = !empty(badgeObj.custom.badgeClass) ? badgeObj.custom.badgeClass : null;
        var badgeDisplayName = !empty(badgeObj.custom.badgeDisplayName) ? badgeObj.custom.badgeDisplayName : null;
        var badgeFontSize = !empty(badgeObj.custom.badgeFontSize) ? badgeObj.custom.badgeFontSize : null;
        var badgeBorderColor = !empty(badgeObj.custom.badgeBorderColor) ? badgeObj.custom.badgeBorderColor : null;
        var badgeBackgroundColor = !empty(badgeObj.custom.badgeBackgroundColor) ? badgeObj.custom.badgeBackgroundColor : null;
        var badgeFontColor = !empty(badgeObj.custom.badgeFontColor) ? badgeObj.custom.badgeFontColor : null;
        var badgeFontStyle = !empty(badgeObj.custom.badgeFontStyle) ? badgeObj.custom.badgeFontStyle : null;
        var badgeFontWeight = !empty(badgeObj.custom.badgeFontWeight) ? badgeObj.custom.badgeFontWeight : null;

        var resolvedBadgeName = badgeDisplayName || badgeName;
        if (empty(resolvedBadgeName)) {
            return null;
        }

        var badgeStyleData = buildBadgeStyleAndClass(
            badgeClass,
            badgeFontSize,
            badgeBorderColor,
            badgeBackgroundColor,
            badgeFontColor,
            badgeFontStyle,
            badgeFontWeight
        );
        var data = {name: resolvedBadgeName, class: badgeStyleData.className || ''};
        if (!empty(badgeStyleData.style)) {
            data.style = badgeStyleData.style;
        }

        if (empty(badgeStartDateTime) && empty(badgeEndDateTime)) {
            return data;
        }

        var cal = Site.getCalendar();
        var cal_tmp = Site.getCalendar();
        cal_tmp.add(Calendar.DAY_OF_MONTH, 1);
        var bst = empty(badgeStartDateTime) ? cal : new Calendar(badgeStartDateTime);
        var bet = empty(badgeEndDateTime) ? cal_tmp : new Calendar(badgeEndDateTime);

        //The Badge will be visible only if start date is after end date and current time is after or is startDateTime and before and is EndeDateTime.
        return (bet.after(bst) && !(cal.before(bst) || cal.after(bet))) ? data : null;
    } catch (e) {
        return null;
    }
}

function addBadges(apiProduct) {
    var badgesData = []

    if (apiProduct && apiProduct.attributeModel && apiProduct.attributeModel.attributeGroups) {
        // Pulls down the badges product attribute group and converts it to an array
        var badgeNames = !empty(apiProduct.custom) && !empty(apiProduct.custom.badgeNames) ? apiProduct.custom.badgeNames : [];
        badgeNames.forEach(function (badgeName) {
            var resolved = resolveBadge(badgeName);
            if (resolved) {
                badgesData.push(resolved);
            }
        });
    }
    return badgesData;
}

module.exports = function(object, apiProduct) {
    Object.defineProperty(object, 'badges', {
        enumerable: true,
        value: addBadges(apiProduct)
    });
};

module.exports.resolveBadge = resolveBadge;
//Enable Old Behaviour
//var badges = require('rvw_autobahn_core/cartridge/models/product/decorators/badges');
//module.exports = badges;