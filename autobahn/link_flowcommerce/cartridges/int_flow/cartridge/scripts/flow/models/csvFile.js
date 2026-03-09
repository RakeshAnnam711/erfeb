/* global empty:false */
'use strict';

/**
 * A CSV File class
 * @param {string} filename - File path to the CSV File
 * @constructor
 */
function CSVFile(filename) {
    var CSVStreamWriter = require('dw/io/CSVStreamWriter');
    var FileWriter = require('dw/io/FileWriter');
    var File = require('dw/io/File');

    this.file = new File(filename);
    this.file.createNewFile();

    this.writer = new FileWriter(this.file, 'UTF-8');
    this.csw = new CSVStreamWriter(this.writer);
}

/**
 * Writes the columns to a CSV row
 * @param {Array} cols - CSV Columns
 */
CSVFile.prototype.row = function (cols) {
    this.csw.writeNext(cols);
};

/**
 * Closes the CSV File Writers
 */
CSVFile.prototype.close = function () {
    if (!empty(this.csw)) {
        this.csw.close();
    }

    if (!empty(this.writer)) {
        this.writer.close();
    }
};

module.exports = CSVFile;
