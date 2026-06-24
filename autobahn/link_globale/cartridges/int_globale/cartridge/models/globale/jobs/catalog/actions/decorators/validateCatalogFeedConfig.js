'use strict';

/**
 * Validates the catalog feed configuration
 * @param {Object} config - Catalog feed configuration
 * @return {dw.system.Status} - Status object indicating the result of the validation
 */
function validateCatalogFeedConfig(config) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var fieldMgr = require('*/cartridge/scripts/globale/catalogFeed/fieldMgr');
    var logger = globaleHelpers.getLogger();

    try {
        if (!config || !config.siteConfig || Object.keys(config.siteConfig).length === 0) {
            throw new Error('Site configuration is invalid!');
        }

        Object.keys(config).forEach(function (field) {
            var value = config[field];
            switch (field) {
                case 'folderPath':
                case 'archiveFolderPath':
                case 'fileName':
                case 'fileType':
                case 'fileSeparator':
                case 'fileQuote':
                case 'localeId':
                case 'catalogId':
                    if (typeof value !== 'string' || value.length === 0) {
                        throw new Error('Configuration of ' + field + ' is invalid! Expected value: \'String\' type with not empty value.');
                    }
                    break;
                case 'processOnlyModifiedProducts':
                case 'processOnlyOnlineProducts':
                case 'addMasterProducts':
                case 'addVariationGroupProducts':
                    if (typeof value !== 'boolean') {
                        throw new Error('Configuration of ' + field + ' is invalid! Expected value: \'Boolean\' type.');
                    }
                    break;
                case 'processProductsPerRunCount':
                    if (typeof value !== 'number' || value < 0) {
                        throw new Error('Configuration of ' + field + ' is invalid! Expected value: \'Number\' type with not negative value.');
                    }
                    break;
                case 'sftpCredentialIDs':
                    if (!Array.isArray(value) || value.length === 0) {
                        throw new Error('Configuration of ' + field + ' is invalid!  Expected value: \'Array\' type with not empty value.');
                    }
                    break;
                case 'fileColumns':
                    if (!Array.isArray(value) || value.length === 0) {
                        throw new Error('Configuration of ' + field + ' is invalid!  Expected value: \'Array\' type with not empty value.');
                    }
                    value.forEach(function (column) {
                        var fieldColumn = fieldMgr.createField(column, null);
                        if (!fieldColumn.isValidColumn()) {
                            throw new Error('Configuration of file columns is invalid! The error in \'column\' ' + JSON.stringify(column));
                        }
                    });
                    break;
                default:
                    break;
            }
        });

        logger.info('Configuration was validated successfully!');
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        validateCatalogFeedConfig: {
            enumerable: true,
            value: validateCatalogFeedConfig
        }
    });
};
