/**
 * Bulk product attribute update form CSV files
 */

'use strict';

importPackage(dw.system);
importPackage(dw.io);
var Logger = require('dw/system/Logger').getLogger('custom.bulk.updateProduct');
var File = require('dw/io/File');
var Status = require('dw/system/Status');
var FileWriter = require('dw/io/FileWriter');
var Site = require("dw/system/Site");
const CSVStreamReader = require('dw/io/CSVStreamReader');
const FileReader = require('dw/io/FileReader');
const Transaction = require('dw/system/Transaction');
var ProductMgr = require('dw/catalog/ProductMgr');

/**
 * Bootstrap function for the Job
 *
 * @return {dw.system.Status} Exit status for a job run
 */
var productBulkUpdate = function (args) {
    var rowData;
            try {
                var j = 0;
                var csvFile = new File(File.IMPEX  + File.SEPARATOR + args.folder + File.SEPARATOR + args.fileName + '.csv');
                // Getting the current file contents
                var streamReader = new CSVStreamReader(new FileReader(csvFile));

                while (rowData = streamReader.readNext()) {
                    if (j > 0) {
                        var productId = rowData[0];
                        var earringDesign = rowData[1];
                        let product = ProductMgr.getProduct(productId);
                        if (product) {
                            Transaction.wrap(function () {
                                product.custom.amazonEarring_Design = earringDesign;
                            });
                        }
                    }
                    j++
                }

                Logger.info('Product List Updated');
                return new Status(Status.OK);

            }catch (ex){
                Logger.error('Error during productBulkUpdate job execution at:: ' + new Date());
                Logger.error('Error during productBulkUpdate job execution:: ' + JSON.stringify(ex));
                return new Status(Status.ERROR);
            }

}

exports.productBulkUpdate = productBulkUpdate;
