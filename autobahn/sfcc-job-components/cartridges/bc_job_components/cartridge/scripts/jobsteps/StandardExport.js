var ArrayList = require('dw/util/ArrayList');
var File = require('dw/io/File');
var Logger = require('dw/system/Logger').getLogger('cs.job.StandardExport');
var Pipeline = require('dw/system/Pipeline');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var ProductListMgr = require('dw/customer/ProductListMgr');
var Status = require('dw/system/Status');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');

var FileHelper = require('~/cartridge/scripts/file/FileHelper');
var StepUtil = require('~/cartridge/scripts/util/StepUtil');

var EXPORT_ALL_QUERY = 'UUID != NULL';
var STATUS = {
    FILE_EXIST : 'FILE_ALREADY_EXISTS',
    NO_DATA    : 'NO_DATA_TO_EXPORT'
};

/**
 * Generic export function that is called by all export functions.
 *
 * Takes care of
 *  - Directory creation
 *  - File existence check (in case the Overwrite file arg is set to true)
 *  - Exit status
 *
 * Gets a callback function that does the actual export (Pipeline Call)
 *
 * @param {array} args Job argument list
 * @param {function} callback Callback function to trigger the export Pipeline
 *
 * @return {dw.system.Status} Exit status for a job run
 */
function genericExport(args, callback) {
    if (StepUtil.isDisabled(args)) {
        return new Status(Status.OK, 'OK', 'Step disabled, skip it...');
    }

    var targetFolder = StepUtil.replacePathPlaceholders(File.IMPEX + File.SEPARATOR + args.TargetFolder);
    var filename = StepUtil.replacePathPlaceholders(args.Filename);

    // OverwriteExportFile option
    var OverwriteExportFile = args.OverwriteExportFile;
    if (OverwriteExportFile !== true && FileHelper.isFileExists(targetFolder, filename)) {
        return new Status(Status.OK, STATUS.FILE_EXIST, 'The file already exists and the OverwriteExportFile is not set to active. Abort...');
    }

    // Create target directory
    FileHelper.createDirectory(targetFolder);
    var filePath = targetFolder + File.SEPARATOR + filename;

    var status = new Status(Status.OK, 'OK', 'Export successful');

    // Call the callback function, this will trigger the actual export
    var result = callback(filePath.replace(File.IMPEX + File.SEPARATOR + 'src', ''), args);

    /*
     * {result} is expected to be returned by pipeline execution,
     * but in case of error in JS logic (eg. due validation),
     * we return an instance of dw.system.Status class.
     * Because of that, we need to explicitly check, if {result} from callback() has a property 'Status'
     */
    if (result.hasOwnProperty('Status') && result.Status.getStatus() !== Status.OK) {
        // No data to export, return the custom status NOTHING_TO_EXPORT
        if (result.ErrorCode === 156) {
            return new Status(Status.OK, STATUS.NO_DATA);
        }

        // Export failed: Update status, log message
        status = new Status(Status.ERROR, 'ERROR', result.ErrorCode + ': ' + result.ErrorMsg + '. See log file "' + result.LogFileName + '" for more details.');
        Logger.error('...Error: ' + result.ErrorMsg);
    } else if (result instanceof dw.system.Status && result !== Status.OK) {
        status = result;
    }

    return status;
}

/**
 * Gift Certificates export
 *
 * @param {array} options
 */
var giftCertificates = function giftCertificates(options) {
    var callback = function callback(file, args) {
        var query = args.Query;

        // If the query if empty, return all objects
        if (empty(query)) {
            query = EXPORT_ALL_QUERY;
        }

        var giftCertificatesIterator = SystemObjectMgr.querySystemObjects('GiftCertificate', query, 'UUID DESC');

        return Pipeline.execute('ExportWrapper-GiftCertificates', {
            ExportFile          : file,
            GiftCertificates    : giftCertificatesIterator,
            OverwriteExportFile : !empty(args.OverwriteExportFile) && args.OverwriteExportFile === true
        });
    };

    return genericExport(options, callback);
};

/**
 * Inventory Lists export
 *
 * @param {array} options
 */
var inventoryLists = function inventoryLists(options) {
    var callback = function callback(file, args) {
        // Handle the InventoryLists argument if provided
        var inventoryListsToExport = args.InventoryLists;
        var inventoryListsIterator;
        if (!empty(inventoryListsToExport)) {
            inventoryListsToExport = inventoryListsToExport.split(',').map(function (inventoryListID) {
                return ProductInventoryMgr.getInventoryList(inventoryListID);
            }).filter(function (inventoryList) {
                return !empty(inventoryList);
            });

            if (inventoryListsToExport.length > 0) {
                inventoryListsIterator = new ArrayList(inventoryListsToExport).iterator();
            } else {
                inventoryListsIterator = new ArrayList(ProductInventoryMgr.getInventoryList()).iterator();
            }
        } else {
            inventoryListsIterator = new ArrayList(ProductInventoryMgr.getInventoryList()).iterator();
        }

        return Pipeline.execute('ExportWrapper-InventoryLists', {
            ExportFile          : file,
            InventoryLists      : inventoryListsIterator,
            OverwriteExportFile : !empty(args.OverwriteExportFile) && args.OverwriteExportFile === true
        });
    };

    return genericExport(options, callback);
};

/**
 * Product Lists export
 *
 * @param {array} options
 */
var productLists = function productLists(options) {
    var callback = function callback(file, args) {
        var query = args.Query;

        // If the query if empty, return all objects
        if (empty(query)) {
            query = EXPORT_ALL_QUERY;
        }

        var productListsIterator = ProductListMgr.queryProductLists(query, 'UUID DESC');

        return Pipeline.execute('ExportWrapper-ProductLists', {
            ExportFile          : file,
            ProductLists        : productListsIterator,
            OverwriteExportFile : !empty(args.OverwriteExportFile) && args.OverwriteExportFile === true
        });
    };

    return genericExport(options, callback);
};


/**
 * Slots export
 *
 * @param {array} options
 */
var slots = function slots(options) {
    var callback = function callback(file, args) {
        return Pipeline.execute('ExportWrapper-Slots', {
            ExportFile          : file,
            OverwriteExportFile : !empty(args.OverwriteExportFile) && args.OverwriteExportFile === true
        });
    };

    return genericExport(options, callback);
};

exports.giftCertificates = giftCertificates;
exports.inventoryLists = inventoryLists;
exports.productLists = productLists;
exports.slots = slots;
