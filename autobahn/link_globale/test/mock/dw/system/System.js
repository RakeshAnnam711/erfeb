'use strict';

var prefs = {
    custom: {},
    getCustom: function () {
        return this.custom;
    }
};

var System = {
    instanceHostname: 'test-001.sandbox.us01.dx.commercecloud.salesforce.com',
    getPreferences: function () {
        return prefs;
    },
    getInstanceHostname: function () {
        return this.instanceHostname;
    }
};

module.exports = System;
