const { bm_paypal: { toXMLPath } } = require('../path.json');

const { expect } = require('chai');
const { it, describe } = require('mocha');

const proxyquire = require('proxyquire').noCallThru();
const toXML = proxyquire(toXMLPath, {});

describe('toXML file', () => {
    describe('toXML()', () => {
        const declarationAttributes = {
            version: '1.0',
            encoding: 'UTF-8',
            standalone: 'yes'
        };

        const innerChild = {
            name: 'innerParam1',
            attributes: {},
            children: [],
            content: 'innerParam1Value'
        };

        const rootAttributes = {
            attribute1: 'attrubite1value'
        };

        const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        const expectedXMLBody = '<param1 attribute1="attrubite1value">\n    <innerParam1>innerParam1Value</innerParam1>\n</param1>\n';

        it('should parse xml object with declaration and nested content', () => {
            const input = {
                declaration: { attributes: declarationAttributes },
                root: {
                    name: 'param1',
                    attributes: rootAttributes,
                    children: [innerChild],
                    content: ''
                }
            };

            const expectedResult = xmlDeclaration + expectedXMLBody;

            expect(toXML(input)).to.equal(expectedResult);
        });

        it('should handle tag without children and content (self-closing)', () => {
            const input = {
                root: {
                    name: 'selfclose',
                    attributes: { id: '123' },
                    children: [],
                    content: ''
                }
            };

            const expectedResult = '<selfclose id="123"/>\n';

            expect(toXML(input)).to.equal(expectedResult);
        });

        it('should handle xml without declaration', () => {
            const input = {
                root: {
                    name: 'simple',
                    attributes: {},
                    children: [],
                    content: 'Hello'
                }
            };

            const expectedResult = '<simple>Hello</simple>\n';

            expect(toXML(input)).to.equal(expectedResult);
        });
    });
});
