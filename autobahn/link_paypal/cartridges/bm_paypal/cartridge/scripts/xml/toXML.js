/* eslint-disable valid-jsdoc */

'use strict';

/**
 * Build an XML tag string.
 *
 * @param {Object} tag
 * @param {number} level
 * @return {String}
 */
function buildTag(tag, level) {
    let attr;
    let indent = '';

    for (let i = 0; i < level; i++) {
        indent += '    ';
    }

    let xml = [indent, tag.name].join('<');

    for (attr in tag.attributes) {
        xml += [' ', attr, '="', tag.attributes[attr], '"'].join('');
    }

    if (tag.children.length === 0 && !tag.content) {
        xml += '/>\n';
    } else {
        xml += '>';

        if (tag.content) {
            xml += tag.content.trim();
        }

        if (tag.children.length > 0) {
            xml += '\n';

            let child;

            for (child of tag.children) {
                xml += buildTag(child, level + 1);
            }

            xml += indent;
        }

        xml += ['</', tag.name, '>\n'].join('');
    }

    return xml;
}

/**
 * Convert the given object to an XML string.
 *
 * @param {Object} obj
 * @return {String}
 */
function toXML(obj) {
    let attr;
    let xml = '';

    if (obj.declaration) {
        xml += '<?xml';

        for (attr in obj.declaration.attributes) {
            xml += [' ', attr, '="', obj.declaration.attributes[attr], '"'].join('');
        }

        xml += '?>\n';
    }

    xml += buildTag(obj.root, 0);

    return xml;
}

module.exports = toXML;
