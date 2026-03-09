'use strict';

module.exports = {
    createFile: require('*/cartridge/models/globale/jobs/catalog/actions/decorators/createFile'),
    uploadFile: require('*/cartridge/models/globale/jobs/catalog/actions/decorators/uploadFile'),
    moveToArchieve: require('*/cartridge/models/globale/jobs/catalog/actions/decorators/moveToArchieve'),
    setLocale: require('*/cartridge/models/globale/jobs/catalog/actions/decorators/setLocale'),
    writeRestrictedItemsFeedFile: require('*/cartridge/models/globale/jobs/catalog/actions/decorators/writeRestrictedItemsFeedFile'),
    writeCachePriceBooksXmlFile: require('*/cartridge/models/globale/jobs/catalog/actions/decorators/writeCachePriceBooksXmlFile'),
    validateCatalogFeedConfig: require('*/cartridge/models/globale/jobs/catalog/actions/decorators/validateCatalogFeedConfig'),
    getProductsIterator: require('*/cartridge/models/globale/jobs/catalog/actions/decorators/getProductsIterator'),
    writeCatalogFeedFile: require('*/cartridge/models/globale/jobs/catalog/actions/decorators/writeCatalogFeedFile')
};
