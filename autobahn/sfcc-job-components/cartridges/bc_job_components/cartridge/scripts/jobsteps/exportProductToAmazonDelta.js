'use strict';

var Logger = require('dw/system/Logger').getLogger(
    'custom.amazon.exportDeltaProduct'
);
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var FileReader = require('dw/io/FileReader');
var Status = require('dw/system/Status');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var Calendar = require('dw/util/Calendar');

var last24Hours = new Calendar();
last24Hours.add(Calendar.HOUR, -24);

/**
 * Snapshot folders
 */
var SNAPSHOT_FOLDER =
    File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + 'amazon-snapshots';

var MAINTENANCE_FILE =
    SNAPSHOT_FOLDER + File.SEPARATOR + 'snapshot_maintenance.txt';

var INITIAL_SNAPSHOT_FILE =
    SNAPSHOT_FOLDER + File.SEPARATOR + 'initial_snapshot_complete.txt';

/**
 * Feed folders
 */
var OUTPUT_FOLDER = File.IMPEX + File.SEPARATOR + 'amazon-delta-feed-products';
var ARCHIVE_FOLDER = OUTPUT_FOLDER + File.SEPARATOR + 'archive';
var WORKING_FOLDER = OUTPUT_FOLDER + File.SEPARATOR + 'working';

var SNAPSHOT_REFRESH_DAYS;
var BUCKET_COUNT;

/**
 * Pad number
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
    return n < 10 ? '0' + n : String(n);
}

/**
 * Timestamp
 * yyyyMMdd_HHmmss
 * @returns {string}
 */
function getTimestamp() {
    var now = new Date();

    return (
        now.getFullYear() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) +
        '_' +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds())
    );
}

/**
 * Initial snapshot completed?
 * @returns {boolean}
 */
function isInitialSnapshotCompleted() {
    return new File(INITIAL_SNAPSHOT_FILE).exists();
}

/**
 * Mark initial snapshot completed
 */
function markInitialSnapshotCompleted() {
    var file = new File(INITIAL_SNAPSHOT_FILE);

    var writer = new FileWriter(file, 'UTF-8');

    writer.write(new Date().toISOString());

    writer.close();
}

/**
 * Cleanup old archive files
 * @param {string} baseFileName
 * @param {number} retentionDays
 */
function cleanupOldArchives(baseFileName, retentionDays) {
    var archiveFolder = new File(ARCHIVE_FOLDER);

    if (!archiveFolder.exists()) {
        return;
    }

    var files = archiveFolder.listFiles();

    if (!files || files.length === 0) {
        return;
    }

    var now = new Date().getTime();

    var retentionMillis = retentionDays * 24 * 60 * 60 * 1000;

    var archivePrefix = baseFileName.replace('.json', '_');

    for (var i = 0; i < files.length; i++) {
        var file = files[i];

        if (
            file.getName().indexOf(archivePrefix) === 0 &&
            file.getName().indexOf('.json') > -1
        ) {
            var age = now - file.lastModified();

            if (age > retentionMillis) {
                Logger.info('Deleting old archive file: {0}', file.getName());

                file.remove();
            }
        }
    }
}

/**
 * Archive live feed
 * @param {dw.io.File} outputFolder
 * @param {string} baseFileName
 * @param {number} retentionDays
 */
function archiveExistingFeed(outputFolder, baseFileName, retentionDays) {
    var currentFile = new File(
        outputFolder.fullPath + File.SEPARATOR + baseFileName
    );

    /**
     * No live file exists
     */
    if (!currentFile.exists()) {
        return;
    }

    var archiveFolder = new File(ARCHIVE_FOLDER);

    if (!archiveFolder.exists()) {
        archiveFolder.mkdirs();
    }

    var timestamp = getTimestamp();

    var archivedFile = new File(
        archiveFolder.fullPath +
            File.SEPARATOR +
            baseFileName.replace('.json', '_' + timestamp + '.json')
    );

    var renamed = currentFile.renameTo(archivedFile);

    if (!renamed) {
        Logger.error('Unable to archive live file: {0}', currentFile.fullPath);

        return;
    }

    Logger.info('Archived previous live file: {0}', archivedFile.fullPath);

    cleanupOldArchives(baseFileName, retentionDays);
}

/**
 * Bucket logic
 * @param {string} productId
 * @returns {number}
 */
function getBucket(productId) {
    var hash = 0;
    for (var i = 0; i < productId.length; i++) {
        hash = (hash << 5) - hash + productId.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash % BUCKET_COUNT);
}

/**
 * Snapshot file
 * @param {number} bucketId
 * @returns {dw.io.File}
 */
function getSnapshotFile(bucketId) {
    return new File(
        SNAPSHOT_FOLDER + File.SEPARATOR + 'snapshot_' + bucketId + '.json'
    );
}

/**
 * Load snapshot
 * @param {number} bucketId
 * @param {Object} cache
 * @returns {Object}
 */
function loadSnapshot(bucketId, cache) {
    if (cache[bucketId]) {
        return cache[bucketId];
    }

    var file = getSnapshotFile(bucketId);

    if (!file.exists()) {
        cache[bucketId] = {};
        return cache[bucketId];
    }

    try {
        var reader = new FileReader(file);

        var content = reader.readString();

        reader.close();

        cache[bucketId] = content ? JSON.parse(content) : {};
    } catch (e) {
        Logger.error(
            'Error reading snapshot file for bucket {0}: {1}',
            bucketId,
            e.message
        );
        cache[bucketId] = {};
    }

    return cache[bucketId];
}

/**
 * Save snapshot
 * @param {number} bucketId
 * @param {Object} data
 */
function saveSnapshot(bucketId, data) {
    var file = getSnapshotFile(bucketId);
    var tempFile = new File(file.fullPath + '.tmp');
    var writer = new FileWriter(tempFile, 'UTF-8');
    writer.write(JSON.stringify(data));
    writer.close();
    if (file.exists()) {
        file.remove();
    }
    tempFile.renameTo(file);
}

/**
 * Snapshot refresh check
 * @returns {boolean}
 */
function shouldRefreshSnapshots() {
    var file = new File(MAINTENANCE_FILE);
    if (!file.exists()) {
        return true;
    }
    var now = new Date().getTime();
    var ageInDays = (now - file.lastModified()) / (1000 * 60 * 60 * 24);
    return ageInDays >= SNAPSHOT_REFRESH_DAYS;
}

/**
 * Update maintenance file
 */
function updateMaintenanceFile() {
    var file = new File(MAINTENANCE_FILE);
    var writer = new FileWriter(file, 'UTF-8');
    writer.write(new Date().toISOString());
    writer.close();
}

/**
 * Product disabled check
 * @param {dw.catalog.Product} product
 * @returns {boolean}
 */
function isDisabledInAnyCatalog(product) {
    if (!product) {
        return false;
    }
    var categories = product.getAllCategories().iterator();
    while (categories.hasNext()) {
        if (categories.next().ID === 'disabled-skus') {
            return true;
        }
    }
    return false;
}

/**
 * Main export
 * @param {Object} args
 * @returns {dw.system.Status}
 */
function exportProductToAmazonDelta(args) {
    try {
        SNAPSHOT_REFRESH_DAYS = parseInt(args.SnapshotRefreshDays, 10);

        if (isNaN(SNAPSHOT_REFRESH_DAYS)) {
            SNAPSHOT_REFRESH_DAYS = 25;
        }

        BUCKET_COUNT = parseInt(args.BucketCount, 10);

        if (isNaN(BUCKET_COUNT)) {
            BUCKET_COUNT = 200;
        }
        var catalog = CatalogMgr.getCatalog(args.MasterCatalogID);
        var inventoryList = ProductInventoryMgr.getInventoryList(
            args.InventoryID
        );
        if (!catalog) {
            Logger.error('Catalog not found');
            return new Status(Status.ERROR);
        }

        var initialSnapshotCompleted = isInitialSnapshotCompleted();

        /**
         * Snapshot folder
         */
        var snapshotFolder = new File(SNAPSHOT_FOLDER);
        if (!snapshotFolder.exists()) {
            snapshotFolder.mkdirs();
        }

        /**
         * Output folder
         */
        var outputFolder = new File(OUTPUT_FOLDER);

        if (!outputFolder.exists()) {
            outputFolder.mkdirs();
        }

        /**
         * Working folder
         */
        var workingFolder = new File(WORKING_FOLDER);

        if (!workingFolder.exists()) {
            workingFolder.mkdirs();
        }

        /**
         * Live file
         */
        var liveFile = new File(
            outputFolder.fullPath + File.SEPARATOR + 'wgaca-amazon-OH-feed.json'
        );

        /**
         * Working file
         */
        var workingFile = new File(
            workingFolder.fullPath +
                File.SEPARATOR +
                'wgaca-amazon-OH-feed.json'
        );

        /**
         * Remove old working file
         */
        if (workingFile.exists()) {
            workingFile.remove();
        }

        /**
         * Generate in working area
         */
        var writer = new FileWriter(workingFile, 'UTF-8');

        writer.writeLine('[');

        var first = true;

        var count = 0;

        var snapshotCache = {};

        var updatedBuckets = {};

        var forceRefresh = shouldRefreshSnapshots();

        var products = ProductMgr.queryProductsInCatalog(catalog);

        while (products.hasNext()) {
            var product = products.next();

            try {
                if (!product || !product.isProduct()) {
                    continue;
                }

                var bucketId = getBucket(product.ID);

                var bucketData = loadSnapshot(bucketId, snapshotCache);

                var snapshot = bucketData[product.ID];

                var inventoryRecord = inventoryList
                    ? inventoryList.getRecord(product.ID)
                    : null;

                var isProductUpdated =
                    product.getLastModified() >= last24Hours.getTime();

                var isInventoryUpdated =
                    inventoryRecord &&
                    inventoryRecord.getLastModified() >= last24Hours.getTime();

                var priceModel = product.getPriceModel();

                var standardPrice = priceModel.getPriceBookPrice(
                    args.StandardPriceBookID
                );

                var discountPrice = priceModel.getPriceBookPrice(
                    args.DiscountPriceBookID
                );

                var std = standardPrice ? standardPrice.value : '';

                var sale =
                    discountPrice && discountPrice.value !== 0
                        ? discountPrice.value
                        : std;

                var isDisabled = isDisabledInAnyCatalog(product);

                /**
                 * ONLY compare if snapshot exists
                 */
                var priceChanged =
                    snapshot &&
                    (snapshot.std !== std || snapshot.sale !== sale);

                var disabledChanged =
                    snapshot && snapshot.disabled !== isDisabled;

                /**
                 * Initial snapshot mode
                 * Build baseline only
                 */
                if (
                    !initialSnapshotCompleted &&
                    !isProductUpdated &&
                    !isInventoryUpdated
                ) {
                    bucketData[product.ID] = {
                        std: std,
                        sale: sale,
                        disabled: isDisabled,
                        lastSeen: new Date().getTime()
                    };

                    updatedBuckets[bucketId] = true;

                    continue;
                }

                /**
                 * Delta check
                 */
                var isNewProduct = !snapshot;
                if (
                    !(
                        isNewProduct ||
                        isProductUpdated ||
                        isInventoryUpdated ||
                        priceChanged ||
                        disabledChanged
                    )
                ) {
                    continue;
                }

                var ats = inventoryRecord ? inventoryRecord.getATS().value : 0;

                var quantity = (isDisabled || !product.searchable) ? 0 : ats;

                var row = {
                    item_sku: product.ID,
                    external_product_id_type:
                        product.manufacturerName || product.UPC,
                    quantity: quantity,
                    product_type: product.custom.amazonProduct_Type || '',
                    amazon_today:
                        product.custom.amazonTodayProductExport || false,
                    location:
                        product.custom.location &&
                        product.custom.location.length > 0
                            ? product.custom.location[0].value
                            : '',
                    currency: 'USD',
                    standard_price: std,
                    sale_price: sale
                };

                if (!first) {
                    writer.writeLine(',');
                }

                writer.write(JSON.stringify(row));

                first = false;

                count++;

                /**
                 * Update snapshot
                 */
                bucketData[product.ID] = {
                    std: std,
                    sale: sale,
                    disabled: isDisabled,
                    lastSeen: new Date().getTime()
                };

                updatedBuckets[bucketId] = true;
            } catch (e) {
                Logger.error(
                    'Error processing product {0}: {1}',
                    product.ID,
                    e.message
                );
            }
        }

        products.close();

        /**
         * Save snapshots
         */
        Object.keys(snapshotCache).forEach(function (bucketId) {
            if (forceRefresh || updatedBuckets[bucketId]) {
                saveSnapshot(bucketId, snapshotCache[bucketId]);
            }
        });

        if (forceRefresh) {
            updateMaintenanceFile();
            Logger.info('Snapshot maintenance refresh completed');
        }

        writer.writeLine('');
        writer.writeLine(']');
        writer.close();

        /**
         * Existing live file remains available
         * until new file fully generated
         */

        /**
         * Archive current live file
         */
        archiveExistingFeed(outputFolder, 'wgaca-amazon-OH-feed.json', 20);

        /**
         * Promote working file
         * to live file
         */
        var promoted = workingFile.renameTo(liveFile);

        if (!promoted) {
            Logger.error('Failed promoting working file to live file');

            return new Status(Status.ERROR);
        }

        /**
         * Mark baseline complete
         */
        if (!initialSnapshotCompleted) {
            markInitialSnapshotCompleted();

            Logger.info('Initial snapshot baseline completed');
        }

        Logger.info('Amazon delta export completed. Count: {0}', count);
        return new Status(Status.OK);
    } catch (e) {
        Logger.error('Job failed: {0}', e.message);

        return new Status(Status.ERROR);
    }
}

exports.exportProductToAmazonDelta = exportProductToAmazonDelta;
