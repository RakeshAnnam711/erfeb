/**
 * Job Step Type that moves (or copies) files from folder A to folder B
 */

'use strict';

importPackage(dw.system);
importPackage(dw.io);
var Logger = require('dw/system/Logger').getLogger('custom.tiktok.updateproduct');
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
var updateProductTiktok = function (args) {
    var rowData;
    try {
        var j = 0;
        var imagePath = args.Imagefolder;
        var csvFile = new File(File.IMPEX  + File.SEPARATOR + args.folder + File.SEPARATOR + args.fileName + '.csv');
        var streamReader = new CSVStreamReader(new FileReader(csvFile));
        var pdfPathroot = File.IMPEX + '/src/tiktok/LOA/';

        while (rowData = streamReader.readNext()) {
            if (j > 0) {
                var productId = rowData[0];
                var BagSilhouette = rowData[1];
                var isTiktokEnabledurl = rowData[4];
                var product = ProductMgr.getProduct(productId);
                var outputFileName = args.loaPath + '/LOA_'+productId+'.jpg';
                isTiktokEnabledurl = (isTiktokEnabledurl == 'Yes') ? true : false;
                if (product) {
                    Transaction.wrap(function () {
                        product.custom.isTiktokEnabled = isTiktokEnabledurl;
                        product.custom.bagSilhouette = BagSilhouette;
                        product.custom.imagepathLOA = outputFileName;
                    });
                }
            }
            j++
        }
        Logger.info('Product List Updated');
        return new Status(Status.OK);
    }catch (ex){
        Logger.error('Error during updateProductTiktok job execution at:: ' + new Date());
        Logger.error('Error during updateProductTiktok job execution:: ' + JSON.stringify(ex));
        return new Status(Status.ERROR);
    }
}

exports.updateProductTiktok = updateProductTiktok;