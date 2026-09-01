'use strict';

const Site = require('dw/system/Site');

const bannerStyles = JSON.parse(Site.current.getCustomPreferenceValue('PP_Pay_Later_Messaging_Styles'));

module.exports = bannerStyles;
