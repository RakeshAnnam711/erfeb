'use strict';

/**
 * Writes an xml element
 * @param {dw.io.XMLIndentingStreamWriter} xswHandle - XML stream writer
 * @param {string} elementName - element name
 * @param {string} chars - chars to be written
 * @param {string} attrKey - attribute key
 * @param {string} attrValue - attribute value
 * @returns {void}
 */
function writeElement(xswHandle, elementName, chars, attrKey, attrValue) {
    xswHandle.writeStartElement(elementName);
    if (attrKey && attrValue) {
        xswHandle.writeAttribute(attrKey, attrValue);
    }
    xswHandle.writeCharacters(chars);
    xswHandle.writeEndElement();
}

/**
 * Writes Cache Price Books XML File
 * @param {dw.io.FileWriter} fileWriter - File writer
 * @param {dw.io.CSVStreamWriter} streamWriter - StreamWriter
 * @param {Object} data - Input data
 * @returns {dw.system.Status} - operation status
 */
function writeCachePriceBooksXmlFile(fileWriter, streamWriter, data) {
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    try {
        // XML definition & first node
        streamWriter.writeStartDocument('UTF-8', '1.0');
        streamWriter.writeStartElement('pricebooks');
        streamWriter.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/pricebook/2006-10-31');

        Object.keys(data).forEach(function (priceBookId) {
            // XML write price books
            streamWriter.writeStartElement('pricebook');
            streamWriter.writeStartElement('header');
            streamWriter.writeAttribute('pricebook-id', priceBookId);
            writeElement(streamWriter, 'currency', globaleHelpers.getMerchantBaseCurrencyCode());
            writeElement(streamWriter, 'display-name', priceBookId, 'xml:lang', 'x-default');
            writeElement(streamWriter, 'online-flag', 'true');

            // XML write custom attributes
            streamWriter.writeStartElement('custom-attributes');
            writeElement(streamWriter, 'custom-attribute', data[priceBookId].join(','), 'attribute-id', 'geCachePriceBookCombinations');
            writeElement(streamWriter, 'custom-attribute', 'true', 'attribute-id', globaleHelpers.customAttr.pricebook.geCachePriceBook);
            writeElement(streamWriter, 'custom-attribute', globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsMerchantId), 'attribute-id', globaleHelpers.customAttr.pricebook.geApplicableToMerchantId);
            streamWriter.writeEndElement();

            streamWriter.writeEndElement();
            streamWriter.writeEndElement();
        });

        streamWriter.writeEndElement();
        streamWriter.writeEndDocument();
        streamWriter.flush();

        fileWriter.flush();
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        writeCachePriceBooksXmlFile: {
            enumerable: true,
            value: writeCachePriceBooksXmlFile
        }
    });
};
