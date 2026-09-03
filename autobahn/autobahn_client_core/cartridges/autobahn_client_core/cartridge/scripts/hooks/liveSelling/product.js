/* eslint no-unused-vars: "off", no-useless-return: "off", consistent-return: "off" */

'use strict';

var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var liveSellingHelpers = require('*/cartridge/scripts/helpers/liveSellingHelpers');

exports.modifyGETResponse = function (apiProduct, productDocument) {
    try {
        var isLiveSelling = liveSellingHelpers.isLiveSellingProduct(apiProduct);
        productDocument.c_isLiveSellingLineItem = isLiveSelling;

        if (isLiveSelling) {
            var liveSellingHostName = Site.getCurrent().getCustomPreferenceValue('liveSellingHostName');
            if (liveSellingHostName) {
                productDocument.c_liveSellingHostName = liveSellingHostName.value || liveSellingHostName;
            }
        }
    } catch (e) {
        Logger.error('dw.ocapi.shop.product.modifyGETResponse: {0}', e.message);
    }

    return new Status(Status.OK);
};
