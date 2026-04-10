'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');

function execute(args) {
    var folderPath = File.IMPEX + '/src/som_orders';
    var folder = new File(folderPath);
    var filePath = folderPath + '/orders.csv';
    var file = new File(filePath);
    var fileWriter;

    try {
        if (!folder.exists()) {
            folder.mkdirs();
        }

        fileWriter = new FileWriter(file, 'UTF-8');

        // Write the header line
        var header = [
            'order_number',
            'customer_number'
        ].join(',');
        fileWriter.writeLine(header);

        var orders = OrderMgr.searchOrders('creationDate > {0}', 'creationDate desc', new Date(0));

        while (orders.hasNext()) {
            var order = orders.next();
            var orderData = [
                order.getOrderNo(),
                order.getCustomerNo()
            ].join(',');
            fileWriter.writeLine(orderData);
        }
    } catch (e) {
        Logger.error('Error exporting orders: {0}', e.message);
    } finally {
        if(fileWriter) {
            fileWriter.close();
        }
    }

    return PIPELET_NEXT;
}

exports.execute = execute;
