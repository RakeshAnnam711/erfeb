'use strict';

var AbstractConfig = require('*/cartridge/models/globale/config/AbstractConfig');
var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
var objectUtils = require('*/cartridge/scripts/util/globale/object');

/**
 * Represents CatalogFeedConfig
 * @constructor
 * @param {Object} config - Config object
 */
function CatalogFeedConfig(config) {
    AbstractConfig.call(this, config);
}

/* Inherits AbstractConfig */
CatalogFeedConfig.prototype = Object.create(AbstractConfig.prototype);

/**
 * Returns config for a site
 *
 * @example of config
 * {
 *     "impex": {
 *         "folderPath": "/globale/catalog/",
 *         "archiveFolderPath": "/globale/catalog/archive/"
 *     },
 *     "sftpCredentialIDs": ["Globale-SFTPCatalogFeedUpload"],
 *     "file": {
 *         "name": "globale_catalog_feed_{datetime}",
 *         "type": "csv",
 *         "separator": ",",
 *         "quote": "\"",
 *         "columns": []
 *     },
 *     "feedData": {
 *         "locale": "default",
 *         "catalogId": "site-catalog",
 *         "processProductsPerRunCount": 0,
 *         "processOnlyModifiedProducts": true,
 *         "processOnlyOnlineProducts": false,
 *         "addMasterProducts": false,
 *         "addVariationGroupProducts": false
 *     }
 * }
 *
 * @returns {Object|null} - Site config
 */
CatalogFeedConfig.prototype.getSiteConfig = function () {
    return this.config;
};

/**
 * Returns the IMPEX folder path
 * @return {string|null} - IMPEX folder path
 */
CatalogFeedConfig.prototype.getFolderPath = function () {
    return objectUtils.getValueByPath(this.config, 'impex.folderPath', globaleHelpers.consts.geCatalogFeed.DEFAULT_IMPEX_FOLDER_PATH);
};

/**
 * Returns the IMPEX archive folder path
 * @return {string|null} - IMPEX archive folder path
 */
CatalogFeedConfig.prototype.getArchiveFolderPath = function () {
    return objectUtils.getValueByPath(this.config, 'impex.archiveFolderPath', globaleHelpers.consts.geCatalogFeed.DEFAULT_IMPEX_ARCHIVE_FOLDER_PATH);
};

/**
 * Returns the SFTP credentials IDs
 * @return {Array|null} - SFTP credentials IDs
 */
CatalogFeedConfig.prototype.getSftpCredentialIDs = function () {
    return objectUtils.getValueByPath(this.config, 'sftpCredentialIDs', globaleHelpers.consts.geCatalogFeed.DEFAULT_SFTP_CREDENTIALS_IDS);
};

/**
 * Returns the file name
 * @return {string|null} - File name
 */
CatalogFeedConfig.prototype.getFileName = function () {
    return objectUtils.getValueByPath(this.config, 'file.name', globaleHelpers.consts.geCatalogFeed.DEFAULT_FILE_NAME);
};

/**
 * Returns the file type
 * @return {string} - File type
 */
CatalogFeedConfig.prototype.getFileType = function () {
    return objectUtils.getValueByPath(this.config, 'file.type', globaleHelpers.consts.geCatalogFeed.DEFAULT_FILE_TYPE);
};

/**
 * Returns the file separator
 * @return {string} - File separator
 */
CatalogFeedConfig.prototype.getFileSeparator = function () {
    return objectUtils.getValueByPath(this.config, 'file.separator', globaleHelpers.consts.geCatalogFeed.DEFAULT_FILE_SEPARATOR);
};

/**
 * Returns the file quote
 * @return {string} - File quote
 */
CatalogFeedConfig.prototype.getFileQuote = function () {
    return objectUtils.getValueByPath(this.config, 'file.quote', globaleHelpers.consts.geCatalogFeed.DEFAULT_FILE_QUOTE);
};

/**
 * Returns the columns
 * @return {Array|null} - File columns
 */
CatalogFeedConfig.prototype.getFileColumns = function () {
    return objectUtils.getValueByPath(this.config, 'file.columns', globaleHelpers.consts.geCatalogFeed.DEFAULT_COLUMNS);
};

/**
 * Returns the locale ID
 * @return {string|null} - Locale ID
 */
CatalogFeedConfig.prototype.getLocaleId = function () {
    return objectUtils.getValueByPath(this.config, 'feedData.localeId', globaleHelpers.consts.geCatalogFeed.DEFAULT_LOCALE_ID);
};

/**
 * Returns the catalog ID
 * @return {string|null} - Catalog ID
 */
CatalogFeedConfig.prototype.getCatalogId = function () {
    return objectUtils.getValueByPath(this.config, 'feedData.catalogId', globaleHelpers.consts.geCatalogFeed.DEFAULT_CATALOG_ID);
};

/**
 * Returns processed products count per run
 * @return {number} - Processed products count per run
 */
CatalogFeedConfig.prototype.getProcessProductsPerRunCount = function () {
    return objectUtils.getValueByPath(this.config, 'feedData.processProductsPerRunCount', globaleHelpers.consts.geCatalogFeed.DEFAULT_PROCESS_PRODUCTS_PER_RUN_COUNT);
};

/**
 * Returns the flag which indicates whether to process only modified products
 * @return {boolean|null} - Flag which indicates whether to process only modified products
 */
CatalogFeedConfig.prototype.getProcessOnlyModifiedProducts = function () {
    return objectUtils.getValueByPath(this.config, 'feedData.processOnlyModifiedProducts', globaleHelpers.consts.geCatalogFeed.DEFAULT_PROCESS_ONLY_MODIFIED_PRODUCTS);
};

/**
 * Returns the flag which indicates whether to process only online products
 * @return {boolean} - Flag which indicates whether to process only online products
 */
CatalogFeedConfig.prototype.getProcessOnlyOnlineProducts = function () {
    return objectUtils.getValueByPath(this.config, 'feedData.processOnlyOnlineProducts', globaleHelpers.consts.geCatalogFeed.DEFAULT_PROCESS_ONLY_ONLINE_PRODUCTS);
};

/**
 * Returns the flag which indicates whether to add master products
 * @return {boolean} - Flag which indicates whether to add master products
 */
CatalogFeedConfig.prototype.getAddMasterProducts = function () {
    return objectUtils.getValueByPath(this.config, 'feedData.addMasterProducts', globaleHelpers.consts.geCatalogFeed.DEFAULT_ADD_MASTER_PRODUCTS);
};

/**
 * Returns the flag which indicates whether to add variation group products
 * @return {boolean} - Flag which indicates whether to add variation group products
 */
CatalogFeedConfig.prototype.getAddVariationGroupProducts = function () {
    return objectUtils.getValueByPath(this.config, 'feedData.addVariationGroupProducts', globaleHelpers.consts.geCatalogFeed.DEFAULT_ADD_VARIATION_GROUP_PRODUCTS);
};

/**
 * Returns config output data
 * @returns {Object} - Config output data
 */
CatalogFeedConfig.prototype.getConfigOutputData = function () {
    return {
        siteConfig: this.getSiteConfig(),
        folderPath: this.getFolderPath(),
        archiveFolderPath: this.getArchiveFolderPath(),
        sftpCredentialIDs: this.getSftpCredentialIDs(),
        fileName: this.getFileName(),
        fileType: this.getFileType(),
        fileSeparator: this.getFileSeparator(),
        fileQuote: this.getFileQuote(),
        fileColumns: this.getFileColumns(),
        localeId: this.getLocaleId(),
        catalogId: this.getCatalogId(),
        processProductsPerRunCount: this.getProcessProductsPerRunCount(),
        processOnlyModifiedProducts: this.getProcessOnlyModifiedProducts(),
        processOnlyOnlineProducts: this.getProcessOnlyOnlineProducts(),
        addMasterProducts: this.getAddMasterProducts(),
        addVariationGroupProducts: this.getAddVariationGroupProducts()
    };
};

module.exports = CatalogFeedConfig;
