'use strict';

var genericDecorators = require('*/cartridge/models/globale/jobs/generic/decorators/index');

module.exports = {
    getServiceResponse: genericDecorators.getServiceResponse,
    dataCleanUp: require('*/cartridge/models/globale/jobs/settings/actions/decorators/dataCleanUp')
};
