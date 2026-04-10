'use strict';

var prefs = {
    custom: {
        geDefaultShippingMethod: 'GLOBALE',
        geParseCountryCodeFromRequestUrl: null,
        geOCAPIVersion: 'v_23_1'
    },
    getCustom: function () {
        return this.custom;
    }
};

var site = {
    current: {
        ID: 'RefArchGlobal',
        getCustomPreferenceValue: function (pref) {
            return (pref in prefs.custom) ? prefs.custom[pref] : null;
        },
        getPreferences: function () {
            return prefs;
        },
        getID: function () {
            return this.ID;
        }
    },
    getCurrent: function () {
        return this.current;
    }
};

module.exports = site;
