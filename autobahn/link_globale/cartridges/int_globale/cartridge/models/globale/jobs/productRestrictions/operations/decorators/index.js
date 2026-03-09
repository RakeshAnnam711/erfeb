'use strict';

var genericDecorators = require('*/cartridge/models/globale/jobs/generic/decorators/index');

module.exports = {
    getServiceResponse: genericDecorators.getServiceResponse,
    updateProductRestrictions: require('*/cartridge/models/globale/jobs/productRestrictions/operations/decorators/updateProductRestrictions'),
    updateProductVatRates: require('*/cartridge/models/globale/jobs/productRestrictions/operations/decorators/updateProductVatRates')
};
