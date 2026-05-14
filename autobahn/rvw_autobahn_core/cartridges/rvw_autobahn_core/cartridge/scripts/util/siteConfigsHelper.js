'use strict';

var Site = require('dw/system/Site');
var Collections = require('*/cartridge/scripts/util/collections');

/**
 * This function outputs a JSON object that contains all the custom
 * site preference values that are in the attribute group 'Autobahn Configs'
 *
 * * TYPECODE KEY:
 *
 * 1 "int"
 * 2 integer "double"
 * 3 "string"
 * 4 object "text"
 * 8 "boolean"
 * 23 "set-of-string"
 * 31 "enum-of-int"
 * 33 "enum-of-string"
 */
function buildAbConfigsObject() {
    var sitePrefs = Site.getCurrent().getPreferences();
    var otd = sitePrefs.describe();
    var returnObject = {};

    ['Storefront Configs', 'Autobahn Configs'].forEach(function (attrGroupName) {
        var attrGroup = otd.getAttributeGroup(attrGroupName);
        Collections.forEach(attrGroup.getAttributeDefinitions(), function(attrDef) {
            if (attrDef.valueTypeCode === 33 || attrDef.valueTypeCode === 31) {
                returnObject[attrDef.ID] = Site.getCurrent().getCustomPreferenceValue(attrDef.ID).value;
            } else if (attrDef.valueTypeCode === 4) {
                var pref = Site.getCurrent().getCustomPreferenceValue(attrDef.ID);
                returnObject[attrDef.ID] = !empty(pref) ? pref.toString().replace(/\s/g, '') : '';
            } else if (attrDef.valueTypeCode === 23) {
                returnObject[attrDef.ID] = JSON.stringify(Site.getCurrent().getCustomPreferenceValue(attrDef.ID));
            } else {
                returnObject[attrDef.ID] = Site.getCurrent().getCustomPreferenceValue(attrDef.ID);
            }
        });
    });

    return returnObject;
}

module.exports = {
    buildAbConfigsObject: buildAbConfigsObject
}
