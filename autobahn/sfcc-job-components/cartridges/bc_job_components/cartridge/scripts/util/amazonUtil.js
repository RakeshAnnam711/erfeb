'use strict';

const SUCCESS_CODES = [200, 201, 202];

const getAmazonServiceId = function () {
    return 'amazonproductexport_flag_update';
};

module.exports = {
    getAmazonServiceId: getAmazonServiceId,
    SUCCESS_CODES: SUCCESS_CODES
};
