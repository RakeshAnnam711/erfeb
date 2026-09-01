/* eslint-disable valid-jsdoc */
/* eslint-disable no-cond-assign */
/* eslint-disable no-use-before-define */

'use strict';

/**
 * Parse the given string of `xml`.
 *
 * @param {String} xml
 * @return {Object}
 */
const parse = function parse(xml) {
    xml = xml.trim();

    return document();

    /**
     * XML document.
     */
    function document() {
        return {
            declaration: declaration(),
            root: tag()
        };
    }

    /**
     * Declaration.
     */
    function declaration() {
        const m = match(/^<\?xml\s*/);

        if (!m) {
            return undefined;
        }

        // tag
        const node = {
            attributes: {}
        };

        let attr;

        // attributes
        while (!(eos() || is('?>'))) {
            attr = attribute();

            if (!attr) {
                return node;
            }

            node.attributes[attr.name] = attr.value;
        }

        match(/\?>\s*/);

        return node;
    }

    /**
     * Tag.
     */
    function tag() {
        const m = match(/^<([\w-:.]+)\s*/);

        if (!m) {
            return undefined;
        }

        // name
        const node = {
            name: m[1],
            attributes: {},
            children: []
        };

        let attr;

        // attributes
        while (!(eos() || is('>') || is('?>') || is('/>'))) {
            attr = attribute();

            if (!attr) {
                return node;
            }

            node.attributes[attr.name] = attr.value;
        }

        // self closing tag
        if (match(/^\s*\/>\s*/)) {
            return node;
        }

        match(/\??>\s*/);

        // content
        node.content = content();

        // children
        let child;

        while (child = tag()) {
            node.children.push(child);
        }

        // closing
        match(/^<\/[\w-:.]+>\s*/);

        return node;
    }

    /**
     * Text content.
     */
    function content() {
        const m = match(/^([^<]*)/);

        if (m) {
            return m[1];
        }

        return '';
    }

    /**
     * Attribute.
     */
    function attribute() {
        const m = match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/);

        if (!m) {
            return undefined;
        }

        return { name: m[1], value: strip(m[2]) };
    }

    /**
     * Strip quotes from `val`.
     */
    function strip(val) {
        return val.replace(/^['"]|['"]$/g, '');
    }

    /**
     * Match `re` and advance the string.
     */
    function match(re) {
        const m = xml.match(re);

        if (!m) {
            return undefined;
        }

        xml = xml.slice(m[0].length);

        return m;
    }

    /**
     * End-of-source.
     */
    function eos() {
        return xml.length === 0;
    }

    /**
     * Check for `prefix`.
     */
    function is(prefix) {
        return xml.indexOf(prefix) === 0;
    }
};

/**
 * Expose `parse`.
 */
module.exports = parse;
