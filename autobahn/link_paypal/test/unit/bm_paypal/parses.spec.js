const { bm_paypal: { parserPath } } = require('../path.json');

const { expect } = require('chai');
const {
    it,
    describe
} = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

const parser = proxyquire(parserPath, {});

describe('parser file', () => {
    describe('parse', () => {
        const xmlContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>'
            + '<param1 attribute1="attrubite1value"><innerParam1>innerParam1Value</innerParam1></param1>';

        const expectedResult = {
            declaration: {
                attributes: {
                    version: '1.0',
                    encoding: 'UTF-8',
                    standalone: 'yes'
                }
            },
            root: {
                name: 'param1',
                attributes: {
                    attribute1: 'attrubite1value'
                },
                children: [
                    {
                        name: 'innerParam1',
                        attributes: {
                        },
                        children: [
                        ],
                        content: 'innerParam1Value'
                    }
                ],
                content: ''
            }
        };

        it('should parse xml string to object', () => {
            expect(new parser(xmlContent)).to.deep.equals(expectedResult);
        });

        it('should support self-closing tags', () => {
            const xml = '<?xml?><br />';
            const result = new parser(xml);

            expect(result.root.name).to.equal('br');
            expect(result.root.children).to.deep.equal([]);
        });

        it('should return node with partial attributes if some attributes are invalid in tag', () => {
            const xml = '<tag valid="yes" broken ></tag>';
            const result = new parser(xml);

            expect(result.root.attributes).to.have.property('valid', 'yes');
        });

        it('should return node with partial attributes if some attributes are invalid in declaration', () => {
            const xml = '<?xml version="1.0" invalid ?>';
            const result = new parser(xml);

            expect(result.declaration.attributes).to.have.property('version', '1.0');
        });
    });
});
