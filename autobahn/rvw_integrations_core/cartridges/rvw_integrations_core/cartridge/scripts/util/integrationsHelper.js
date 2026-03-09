var Site = require('dw/system/Site');
var Collections = require('*/cartridge/scripts/util/collections');

/**
 * This function outputs a JSON object that contains all the custom
 * site preference values that are in the attribute group 'Autobahn Integrations'
 */
function buildIntegrationsConfigObject() {
    var sitePrefs = Site.getCurrent().getPreferences();
    var otd = sitePrefs.describe();
    var attrGroup = otd.getAttributeGroup("Autobahn Integrations");
    var returnObject = {};
    Collections.forEach(attrGroup.getAttributeDefinitions(), function(attrDef) {
        returnObject[attrDef.ID] = Site.getCurrent().getCustomPreferenceValue(attrDef.ID);
    });
    return returnObject;
}

/**
 * avataxEnabled
 * @returns true if the taxCalculation setting in ATSettings is true otherwise false.
 */
function avataxEnabled() {
    var avaTaxEnabled = false;
    try {
        var settings = JSON.parse(dw.system.Site.current.getCustomPreferenceValue('ATSettings'));
        avaTaxEnabled = settings.taxCalculation;
    } catch(e) {
        avaTaxEnabled = false;
    }
    return avataxEnabled;
}

module.exports = {
    buildIntegrationsConfigObject: buildIntegrationsConfigObject,
    avataxEnabled: avataxEnabled
}
