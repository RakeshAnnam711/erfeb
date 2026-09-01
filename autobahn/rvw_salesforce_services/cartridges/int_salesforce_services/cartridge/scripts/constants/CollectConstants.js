'use strict';

/*  This file is for constants related to the Collect.js and customer tracking
	that can be enabled to send data to Marketing Cloud.
*/

/* Constant for all supported types of export data */
exports.EventTypes = {
	"SetOrgId": "setOrgId",
	"SetUserInfo":"setUserInfo",
	"TrackCart": "trackCart",
	"TrackConversion": "trackConversion",
	"TrackPageView": "trackPageView"
};
