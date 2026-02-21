/* This class encapsulates working with Custom Objects. */

'use strict';

var XMLStreamConstants = require('dw/io/XMLStreamConstants');
var XMLStreamReader = require('dw/io/XMLStreamReader');

exports.SetNode = setNode;
exports.ReaderToJSON = readerToJSON;
exports.XMLListToArrayFn = xmlListToArrayFn;
exports.XMLListToJSON = xmlListToJSON;
exports.XMLListToObjectAttributes = xmlListToObjectAttributes;

/* Public Methods */

/**
 * Reusable node creation pattern applying namspaces
 * @param {Object} node - Required. Non-namespaced node name. XML Format expected, Ex: '<XMLNode></XMLNode>'
 * @param {Namespace} setNamespace - Optional. Applicable namespace
 * @param {Array} addNamespaces - Optional. Additional namespaces to be used by sub-nodes
 * @returns {XML} - A commercecloud native XML class object.
 */
function setNode(node, setNamespace, addNamespaces) {
    node = typeof node === 'string' ? new XML(node) : node;

    if (setNamespace) node.setNamespace(setNamespace);

    if (!empty(addNamespaces) && !Array.isArray(addNamespaces)) {
        addNamespaces = [addNamespaces];
    }

    (addNamespaces || []).forEach(function (namespace) {
        node.addNamespace(namespace);
    });

    return node;
};


function readerToJSON(reader) {
    var xmlStreamReader = new XMLStreamReader(reader),
        results = [];

    while (xmlStreamReader.hasNext()) {
        var node = xmlStreamReader.next();

        if (node === XMLStreamConstants.START_ELEMENT) {
            var nodeXML = xmlStreamReader.readXMLObject();

            results.push(exports.XMLListToJSON(nodeXML));
        }
    }

    return results;
};

function xmlListToJSON(XMLList) {
    var nodeObj = {
            name: XMLList.localName(),
            attributes: exports.XMLListToObjectAttributes(XMLList)
        };

    // Setup Simple XML Object
    if (XMLList.hasSimpleContent()) {
        //nodeObj.isSimple = true;
        nodeObj.text = XMLList.toString();
    }
    // Setup Complex Object w/ Recursive Info
    if (XMLList.hasComplexContent()) {
        //nodeObj.isComplex = true;
        nodeObj.elements = [];

        exports.XMLListToArrayFn(XMLList.elements()).forEach(function (elementXML) {
            nodeObj.elements.push(exports.XMLListToJSON(elementXML));
        });
    }

    return nodeObj;
}

function xmlListToArrayFn(XMLList) {
    var result = [];

    for (var i = 0; i < XMLList.length(); i++) result.push(XMLList[i]);

    return result;
};

function xmlListToObjectAttributes(XMLList) {
    var result = {};

    exports.XMLListToArrayFn(XMLList.attributes()).forEach(function (attributeXML) {
        var name = attributeXML.localName();

        if (name) {
            result[name] = attributeXML.toString();
        }
    });

    return result;
};


