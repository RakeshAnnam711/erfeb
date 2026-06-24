'use strict';
// response is global object

module.exports = {
    configResponse: function (res, personalized, hrs, min) {
        // Setup base cache parameters
        res = res || response;

        var preHrs = request.custom.responseCacheHrs;
        var preMin = request.custom.responseCacheMin;

        preHrs = empty(preHrs) ? null : parseInt(preHrs, 10);
        preMin = empty(preMin) ? null : parseInt(preMin, 10);

        hrs = empty(hrs) ? null : parseInt(hrs, 10);
        min = !empty(hrs) || empty(min) ? null : parseInt(min, 10);

        if (!empty(hrs)) {
            // hours must be less than previousHours
            hrs = !empty(preHrs) && preHrs <= hrs ? null : hrs;
            // previousMinutes must be empty
            hrs = !empty(preMin) ? null : hrs;
        }

        if (!empty(min)) {
            // minutes must be less than previousMinutes
            min = !empty(preMin) && preMin <= min ? null : min;
        }

        personalized = !!personalized;

        // hourly relative pagecache
        var expiry = new Date();

        if (!empty(hrs) || !empty(min)) {
            if (!empty(min)) {
                expiry.setMinutes(expiry.getMinutes() + min);
                response.setExpires(expiry);
            } else if (!empty(hrs)) {
                expiry.setHours(expiry.getHours() + hrs);
                response.setExpires(expiry);
            }

            request.custom.responseCacheHrs = hrs;
            request.custom.responseCacheMin = min;
        }

        if (personalized) {
            response.setVaryBy('price_promotion');
        }

        return this;
    },
    applyDefaultCache: function (res) {
        return this.configResponse(res, false, 24);
    },
    applyPromotionSensitiveCache: function (res) {
        return this.configResponse(res, true, 24);
    },
    applyShortPromotionSensitiveCache: function (res) {
        return this.configResponse(res, true, 1);
    },
    applyInventorySensitiveCache: function (res) {
        return this.configResponse(res, false, null, 30);
    }
};
