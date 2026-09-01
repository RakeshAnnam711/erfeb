'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var FileReader = require('dw/io/FileReader');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Logger = require('dw/system/Logger');
var zetaSFTPservice = require('*/cartridge/scripts/services/zetaSFTPservice');
var Status = require('dw/system/Status');

function getLastRunTime(filePath) {
    var file = new File(filePath);

    if (!file.exists()) {
        return new Date(0); // FIRST RUN
    }

    var reader = new FileReader(file);
    var content = reader.readString();
    reader.close();

    return content ? new Date(content.trim()) : new Date(0);
}


// Save Last Run Time
function saveLastRunTime(filePath, date) {
    var file = new File(filePath);
    var writer = new FileWriter(file, false);
    writer.writeLine(date.toISOString());
    writer.close();
}

// Timestamp for file name
function getTimeStamp() {
    var now = new Date();
    return now.getFullYear() + "-" +
        ("0" + (now.getMonth() + 1)).slice(-2) + "-" +
        ("0" + now.getDate()).slice(-2) + "_" +
        ("0" + now.getHours()).slice(-2) + "-" +
        ("0" + now.getMinutes()).slice(-2);
}
function exportZetaDeltaCustomers() {
    try {
        var baseFolder = new File(File.IMPEX + "/src/zeta/CustomerFeed");
        if (!baseFolder.exists()) baseFolder.mkdirs();

        var deltaFolder = new File(baseFolder.fullPath + "/delta");
        if (!deltaFolder.exists()) deltaFolder.mkdirs();

        var fullFolder = new File(baseFolder.fullPath + "/full");
        if (!fullFolder.exists()) fullFolder.mkdirs();

        var lastRunFilePath = baseFolder.fullPath + "/lastRun.txt";

        var lastRunTime = getLastRunTime(lastRunFilePath);
        var now = new Date();

        var bufferTime = new Date(lastRunTime.getTime() - (10 * 60 * 1000));
        var isFirstRun = (lastRunTime.getTime() === 0);

        Logger.info('Zeta Customer Job - Last Run Time: ' + lastRunTime);

        var timestamp = getTimeStamp();
        var exportFile;

        if (isFirstRun) {
            exportFile = new File(fullFolder.fullPath + "/Customers_full_" + timestamp + ".csv");
        } else {
            exportFile = new File(deltaFolder.fullPath + "/Customers_delta_" + timestamp + ".csv");
        }

        var writer = new CSVStreamWriter(new FileWriter(exportFile));

        // CSV HEADER
        writer.writeNext([
            'email',
            'first_name',
            'last_name',
            'source',
            'phone_number'
        ]);

        var records = CustomObjectMgr.queryCustomObjects(
            'ZetaNewsletterSubscriber',
            'creationDate >= {0}',
            'creationDate asc',
            bufferTime
        );

        var count = 0;
        var latestProcessedDate = null;

        while (records.hasNext()) {

            var rec = records.next();

            var email = rec.custom.Email;

            if (!email) {
                Logger.warn('Skipping record with empty email');
                continue;
            }

            var source = rec.custom.source || '';

            var firstName = '';
            var lastName = '';
            var phone = '';

            var customer = CustomerMgr.getCustomerByLogin(email);

            if (customer && customer.profile) {
                firstName = customer.profile.firstName || '';
                lastName = customer.profile.lastName || '';
                phone = customer.profile.phoneHome || '';
            }

            // WRITE CSV
            writer.writeNext([
                email,
                firstName,
                lastName,
                source,
                phone
            ]);

            // Track latest date
            if (!latestProcessedDate || rec.creationDate > latestProcessedDate) {
                latestProcessedDate = rec.creationDate;
            }

            count++;
        }

        writer.close();

        Logger.info('Zeta Customer Job - Records: ' + count);

        if (count > 0 || isFirstRun) {

            zetaSFTPservice.uploadToZetaSFTP(
                exportFile,
                isFirstRun,
                '/file_share/subscriber_data'
            );
            saveLastRunTime(lastRunFilePath, now);

        } else {
            // No records → remove file
            exportFile.remove();
        }

        return new Status(Status.OK, "OK", "Customer export completed. Records: " + count);

    } catch (e) {

        Logger.error('Zeta Customer Job Failed: ' + e.message);
        return new Status(Status.ERROR, "ERROR", e.message);
    }
}

exports.exportZetaDeltaCustomers = exportZetaDeltaCustomers;