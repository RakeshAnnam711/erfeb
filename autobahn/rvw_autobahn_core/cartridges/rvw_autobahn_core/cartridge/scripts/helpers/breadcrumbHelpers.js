'use strict';

var Logger = require('dw/system/Logger');

/**
 * Updates the "Home" breadcrumb url to reference the current site home url
 *
 * @param {Object} viewData - The current res viewData
 * @return {Array} - Breadcrumb data with the updated Home URL
 */
function updateHomeURL(viewData) {
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var updatedBreadcrumbs = [];

    try {
        var homeURL = viewData && viewData.siteContext && viewData.siteContext.url ? viewData.siteContext.url : URLUtils.home().toString();

        if (viewData && viewData.breadcrumbs) {
            updatedBreadcrumbs = viewData.breadcrumbs;
            updatedBreadcrumbs[0].url = homeURL; // first in array is always the home url
        } else {
            updatedBreadcrumbs.push( {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: homeURL
            })
        }
    } catch (e) {
        Logger.error('There was an issue updating the Home URL on the breadcrumb. {0}', e.toString());
    }

    return updatedBreadcrumbs;
}

module.exports = {
    updateHomeURL: updateHomeURL
};
