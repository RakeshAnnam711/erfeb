'use strict';

module.exports = {};

/**
 * Validates and Return the cquotient namespace provided by the commerce cloud platform
 * @returns {Object} - einsteinUtils or null
 */
module.exports.getEinsteinUtils = function () {
    var einsteinUtils = window.CQuotient;
    if (einsteinUtils && (typeof einsteinUtils.getCQUserId === 'function') && (typeof einsteinUtils.getCQCookieId === 'function')) {
        return einsteinUtils;
    }
    return null;
}

 /**
 * Processes a recommendation tile, with an already initialized category specific anchors array
 * @param {Object} data object to carry info to CQuotient calls
 * @param {Function} callback handler function
 */
module.exports.getRecommendations = function(data, callback) {
    var einsteinUtils = module.exports.getEinsteinUtils();

    var params = {
        userId: einsteinUtils.getCQUserId(),
        cookieId: einsteinUtils.getCQCookieId(),
        ccver: '1.01'
    };

    if (data.anchors && data.anchors.length > 0) {
        params.anchors = data.anchors;
    }

    if (einsteinUtils.getRecs) {
        einsteinUtils.getRecs(einsteinUtils.clientId, data.recommender, params, callback);
    } else {
        einsteinUtils.widgets = einsteinUtils.widgets || []; // eslint-disable-line no-param-reassign
        einsteinUtils.widgets.push({
            recommenderName: data.recommender,
            parameters: params,
            callback: callback
        });
    }
}

/**
 * Processes a response and format data structure
 * @param {Object} request object to carry info to CQuotient calls
 * @param {Object} response data returned from CQuotient calls
 * @returns {Object}
 */
module.exports.interpretResponse = function (request, response) {
    return response[request.recommender].recs;
}
