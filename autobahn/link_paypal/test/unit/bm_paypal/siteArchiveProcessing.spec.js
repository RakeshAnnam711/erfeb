const { bm_paypal: { siteArchiveProcessingPath } } = require('../path.json');
const { expect } = require('chai');
const { stub, spy } = require('sinon');
const {
    it, describe, before, after, afterEach
} = require('mocha');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({ plugins: ['babel-plugin-rewire'] });

const fakeIsObject = stub();
const fakeMkdir = stub();
const fakeExists = stub();
const fakeUnzip = stub();
const fakePropfind = stub();
const fakeGet = stub();
const fakeClose = stub();
const fakeToXML = stub();
const fakeParser = stub();
const fakeWriteLine = stub();
const fakeReadString = stub();
const fakeGetLineSeparator = stub();

class EnumValue extends dw.value.EnumValue {
    constructor(value) {
        super(value);
        this.value = value;
    }
}

const siteArchiveProcessing = proxyquire(siteArchiveProcessingPath, {
    'dw/io/File': function() {
        return {
            SEPARATOR: dw.io.File.SEPARATOR,
            exists: fakeExists,
            mkdir: fakeMkdir,
            unzip: fakeUnzip
        };
    },
    'dw/system/Site': {
        allSites: {
            toArray: () => [{ ID: 'RefArch' }, { ID: 'RefArchGlobal' }]
        }
    },
    'dw/system/Status': dw.system.Status,
    'dw/util/ArrayList': dw.util.ArrayList,
    'dw/io/FileReader': function() {
        return {
            close: fakeClose,
            readString: fakeReadString
        };
    },
    'dw/io/FileWriter': function() {
        return {
            close: fakeClose,
            writeLine: fakeWriteLine,
            getLineSeparator: fakeGetLineSeparator
        };
    },
    'dw/io/XMLIndentingStreamWriter': dw.io.XMLIndentingStreamWriter,
    'dw/value/EnumValue': dw.value.EnumValue,
    'dw/net/WebDAVClient': function() {
        return {
            propfind: fakePropfind,
            get: fakeGet
        };
    },
    '~/cartridge/scripts/xml/toXML': fakeToXML,
    '~/cartridge/scripts/xml/parser': fakeParser,
    '~/cartridge/scripts/helpers/coreHelpers': {
        isJson: () => true,
        isObject: fakeIsObject,
        tryParseJSON: (json) => JSON.parse(json)
    },
    '*/cartridge/scripts/paypal/bmUtils': {
        createErrorLog: () => {}
    }
});

describe('siteArchiveProcessing file', () => {
    describe('getCurrentSite', () => {
        const getCurrentSite = siteArchiveProcessing.__get__('getCurrentSite');

        it('current site - RefArch should be returned', () => {
            const result = getCurrentSite('RefArch');

            expect(result).to.be.an('object');
            expect(result).to.deep.equal({ ID: 'RefArch' });
        });
    });

    describe('handleLogs', () => {
        const handleLogs = siteArchiveProcessing.__get__('handleLogs');

        const sourcePath = 'IMPEX/src/instance/plugin_configuration';
        const logs = [
            {
                name: 'custom-PayPal.log',
                path: '/on/demandware.servlet/webdav/Sites/Logs/custom-PayPal.log'
            },
            {
                name: 'custom-Braintree.log',
                path: '/on/demandware.servlet/webdav/Sites/Logs/custom-Braintree.log'
            },
            {
                name: 'warn-213-dkasd.log',
                path: '/on/demandware.servlet/webdav/Sites/Logs/warn-213-dkasd.log'
            },
            {
                name: 'error-imfref-231.log',
                path: '/on/demandware.servlet/webdav/Sites/Logs/error-imfref-231.log'
            },
            {
                name: 'service-Braintree_grapqh-231.log',
                path: '/on/demandware.servlet/webdav/Sites/Logs/service-Braintree_grapqh-231.log'
            },
            {
                name: 'security-data.log',
                path: '/on/demandware.servlet/webdav/Sites/Logs/security-data.log'
            }
        ];

        before(() => {
            siteArchiveProcessing.__set__('params', { siteId: 'RefArch' });
            siteArchiveProcessing.__set__('getCurrentSite', () => {
                return {
                    getCustomPreferenceValue: () => {
                        return JSON.stringify({
                            host: 'xxxx-000.xx.commercecloud.salesforce.com',
                            username: 'user',
                            password: 'secret-password'
                        });
                    }
                };
            });

            fakePropfind.returns(logs);
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('params');
            siteArchiveProcessing.__ResetDependency__('getCurrentSite');
        });

        afterEach(() => {
            fakeMkdir.reset();
            fakeGet.reset();
        });

        it('if directory for logs exporting does not exist, the one should be created', () => {
            fakeExists.returns(false);

            handleLogs(sourcePath);

            expect(fakeMkdir.calledOnce).to.be.true;
            expect(fakeGet.callCount).to.equal(3);
        });

        it('if directory for logs exporting exists, the one should not be created', () => {
            fakeExists.returns(true);
            fakePropfind.returns(logs.slice(2));

            handleLogs(sourcePath);

            expect(fakeMkdir.calledOnce).to.be.false;
            expect(fakeGet.callCount).to.equal(2);
        });

        it('if there are no log files to export', () => {
            fakePropfind.returns(logs.slice(-1));

            handleLogs(sourcePath);

            expect(fakeGet.notCalled).to.be.true;
        });
    });

    describe('throwError', () => {
        const error = new Error('message');
        const throwError = siteArchiveProcessing.__get__('throwError');

        before(() => {
            siteArchiveProcessing.__set__('status', {
                details: {
                    empty: false,
                    values: () => ({
                        toArray: () => [{ file: '.log' }, { file: 'site.xml' }]
                    })
                }
            });
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('status');
        });

        it('should throw a string with details', () => {
            expect(() => throwError(error)).throw('{{[{"file":".log"},{"file":"site.xml"}]}}');
        });

        it('should throw an error', () => {
            siteArchiveProcessing.__set__('status', { details: { empty: true } });

            expect(() => throwError(error)).throw(Error, 'message');
        });
    });

    describe('tryCatchWrapper', () => {
        const fakeAddDetail = stub();
        const optionalData = { fileName: 'site.xml', callbackName: 'handleSite' };
        const tryCatchWrapper = siteArchiveProcessing.__get__('tryCatchWrapper');

        before(() => {
            stub(dw.web.Resource, 'msg');

            siteArchiveProcessing.__set__('status', { addDetail: fakeAddDetail });
        });

        after(() => {
            dw.web.Resource.msg.restore();
            siteArchiveProcessing.__ResetDependency__('status');
        });

        it('should throw an error with message', () => {
            const resourceMsg = 'Callback must be a function.';

            dw.web.Resource.msg.withArgs('error.callback.be.function', 'errors', null).returns(resourceMsg);

            expect(() => tryCatchWrapper(null, optionalData)).to.throw(Error, resourceMsg);
        });

        it('should run callback function', () => {
            const callback = stub();

            expect(tryCatchWrapper(callback, optionalData)).to.be.undefined;
            expect(callback.calledOnce).to.be.true;
        });

        it('should handle catch block', () => {
            const callback = stub().throws(new Error('Test error'));

            expect(tryCatchWrapper(callback, optionalData)).to.be.undefined;
            expect(callback.calledOnce).to.be.true;
            expect(fakeAddDetail.calledOnce).to.be.true;
        });
    });

    describe('traverseFolders', () => {
        const arrayList = new dw.util.ArrayList();
        const fileInstance = {
            listFiles: () => ({
                toArray: () => ([{
                    name: 'folder',
                    isDirectory: () => true,
                    listFiles: () => ({ toArray: () => ([]) })
                }, {
                    name: 'file.xml',
                    isDirectory: () => false
                }])
            })
        };

        arrayList.add1 = () => {};

        before(() => {
            stub(arrayList, 'add1');
        });

        after(() => {
            arrayList.add1.restore();
        });

        const traverseFolders = siteArchiveProcessing.__get__('traverseFolders');

        it('should fill arrayList with all files', () => {
            expect(traverseFolders(fileInstance, arrayList)).to.be.undefined;
            expect(arrayList.add1.calledOnce).to.be.true;
        });
    });

    describe('remove', () => {
        const file = {
            exists: () => true,
            isFile: () => false,
            isDirectory: () => true,
            listFiles: () => ({
                toArray: () => ([{
                    exists: () => false
                }])
            }),
            remove: () => undefined
        };

        const remove = siteArchiveProcessing.__get__('remove');

        it('should delete all files and folders recursively', () => {
            expect(remove(file)).to.be.undefined;
        });

        it('should delete the file if it exists and it is a file', () => {
            file.isFile = () => true;

            expect(remove(file)).to.be.undefined;
        });

        it('should return undefined and do nothing', () => {
            file.isFile = () => false;
            file.isDirectory = () => false;

            expect(remove(file)).to.be.undefined;
        });

        it('should return undefined if file does not exist', () => {
            file.exists = () => false;

            expect(remove(file)).to.be.undefined;
        });
    });

    describe('getXMLString', () => {
        const file = new dw.io.File();
        const getXMLString = siteArchiveProcessing.__get__('getXMLString');

        before(() => {
            fakeReadString.returns('');
        });

        afterEach(() => {
            fakeClose.reset();
            fakeReadString.reset();
        });

        it('should return xml empty string', () => {
            expect(getXMLString(file)).to.be.a('string').that.is.empty;
            expect(fakeClose.calledOnce).to.be.true;
            expect(fakeReadString.calledOnce).to.be.true;
        });

        it('should return xml string', () => {
            fakeReadString.returns('<root></root>');

            expect(getXMLString(file)).to.be.equal('<root></root>');
            expect(fakeReadString.calledOnce).to.be.true;
            expect(fakeClose.calledOnce).to.be.true;
        });
    });

    describe('writeXmlToFile', () => {
        const file = new dw.io.File();
        const writeXmlToFile = siteArchiveProcessing.__get__('writeXmlToFile');

        after(() => {
            fakeToXML.reset();
            fakeClose.reset();
            fakeWriteLine.reset();
        });

        it('should write xml object data into file as string', () => {
            expect(writeXmlToFile(file, {})).to.be.undefined;
            expect(fakeToXML.calledOnce).to.be.true;
            expect(fakeWriteLine.calledOnce).to.be.true;
            expect(fakeClose.calledOnce).to.be.true;
        });
    });

    describe('getType', () => {
        const list = [
            { description: '', content: 'description' }
        ];

        const getType = siteArchiveProcessing.__get__('getType');

        it('should return an empty string', () => {
            expect(getType(list)).to.be.equal('');
        });

        it('should return value of type', () => {
            list.push({ name: 'type', content: 'string' });

            expect(getType(list)).to.be.equal('string');
        });
    });

    describe('maskValue', () => {
        const maskValue = siteArchiveProcessing.__get__('maskValue');

        it('should return an empty string if value empty', () => {
            const arr = [];
            const obj = {};

            expect(maskValue(null)).to.be.null;
            expect(maskValue(undefined)).to.be.undefined;
            expect(maskValue(false)).to.be.false;
            expect(maskValue(arr)).to.be.equal(arr);
            expect(maskValue(obj)).to.be.equal(obj);
            expect(maskValue('')).to.be.equal('');
        });

        it('should return the same mask if value already masked', () => {
            expect(maskValue('******')).to.be.equal('******');
        });

        it('should return masked value (********)', () => {
            expect(maskValue('John Doe')).to.be.equal('********');
        });
    });

    describe('maskUrl', () => {
        const maskUrl = siteArchiveProcessing.__get__('maskUrl');

        it('should return the same value as was passed if the URL does not match', () => {
            const arr = [];
            const obj = {};

            expect(maskUrl(null)).to.be.null;
            expect(maskUrl(undefined)).to.be.undefined;
            expect(maskUrl(false)).to.be.false;
            expect(maskUrl(arr)).to.be.equal(arr);
            expect(maskUrl(obj)).to.be.equal(obj);
            expect(maskUrl('')).to.be.equal('');
            expect(maskUrl('/search?query=John')).to.be.equal('/search?query=John');
        });

        it('should return masked url', () => {
            expect(maskUrl('http://test.com/path')).to.be.equal('http://********/path');
            expect(maskUrl('https://google.com/search')).to.be.equal('https://********/search');
        });
    });

    describe('maskEmail', () => {
        const maskEmail = siteArchiveProcessing.__get__('maskEmail');

        it('should return the same value as was passed if the email had string type', () => {
            const arr = [];
            const obj = {};

            expect(maskEmail(null)).to.be.null;
            expect(maskEmail(undefined)).to.be.undefined;
            expect(maskEmail(false)).to.be.false;
            expect(maskEmail(arr)).to.be.equal(arr);
            expect(maskEmail(obj)).to.be.equal(obj);
        });

        it('should return the passed value if it does not match the format of the email', () => {
            expect(maskEmail('test.test.com')).to.be.equal('test.test.com');
        });

        it('should return masked email', () => {
            expect(maskEmail('test@test.com')).to.be.equal('********@********.com');
        });
    });

    describe('maskContentAttribute', () => {
        const maskContentAttribute = siteArchiveProcessing.__get__('maskContentAttribute');

        it('should return masked email', () => {
            expect(maskContentAttribute('test@test.com', 'PP_CWPP_Agent_Login')).to.be.equal('********@********.com');
        });

        it('should return masked password', () => {
            expect(maskContentAttribute('qwer1234tyui!@#', 'PP_CWPP_Agent_Password')).to.be.equal('********');
            expect(maskContentAttribute('********', 'PP_CWPP_Agent_Password')).to.be.equal('********');
        });

        it('should return masked JSON', () => {
            expect(maskContentAttribute(JSON.stringify({
                clientId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                clientPassword: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                apiVersion: '23.2',
                bmUserLogin: 'test@test.com',
                bmUserPassword: 'random-password-12345-!@#'
            }), 'PP_OCAPI_Config')).to.be.equal(JSON.stringify({
                clientId: '********',
                clientPassword: '********',
                apiVersion: '********',
                bmUserLogin: '********',
                bmUserPassword: '********'
            }));
        });

        it('should return unmasked content unless it matches the conditions', () => {
            expect(maskContentAttribute('Sale', 'PP_Payment_Model')).to.be.equal('Sale');
        });
    });

    describe('writeXMLElement', () => {
        const fakeWriteXMLElement = stub();
        const xsw = new dw.io.XMLIndentingStreamWriter();
        const writeXMLElement = siteArchiveProcessing.__get__('writeXMLElement');

        before(() => {
            stub(xsw, 'writeStartElement');
            stub(xsw, 'writeAttribute');
            stub(xsw, 'writeCharacters');
            stub(xsw, 'writeEndElement');

            siteArchiveProcessing.__set__('writeXMLElement', fakeWriteXMLElement);
        });

        after(() => {
            fakeIsObject.reset();
            xsw.writeStartElement.restore();
            xsw.writeAttribute.restore();
            xsw.writeCharacters.restore();
            xsw.writeEndElement.restore();
            siteArchiveProcessing.__ResetDependency__('writeXMLElement');
        });

        afterEach(() => {
            xsw.writeStartElement.reset();
            xsw.writeAttribute.reset();
            xsw.writeCharacters.reset();
            xsw.writeEndElement.reset();
        });

        it('should terminates execution if value is "false" value', () => {
            expect(writeXMLElement(xsw, {
                SFRA: null,
                PLUGIN: '',
                REST: 0,
                PAYPAL: NaN,
                INSTANCE_TYPE: undefined,
                COMPATIBILITY_MODE: false
            })).to.be.undefined;

            expect(xsw.writeStartElement.notCalled).to.be.true;
            expect(xsw.writeAttribute.notCalled).to.be.true;
            expect(xsw.writeCharacters.notCalled).to.be.true;
            expect(xsw.writeEndElement.notCalled).to.be.true;
        });

        it('should write start element attribute with name and characters value', () => {
            fakeIsObject.returns(false);

            expect(writeXMLElement(xsw, {
                SFRA: '7.0.0',
                PLUGIN: '25.3.0'
            })).to.be.undefined;

            expect(xsw.writeStartElement.calledTwice).to.be.true;
            expect(xsw.writeAttribute.calledTwice).to.be.true;
            expect(xsw.writeCharacters.calledTwice).to.be.true;
            expect(xsw.writeEndElement.calledTwice).to.be.true;
        });

        it('should write an attribute of the start element with a name, and if it is an object, run the recursive function', () => {
            fakeIsObject.returns(true);

            expect(writeXMLElement(xsw, {
                PAYPAL: {
                    PARTNER_ATTRIBUTION_ID: 'SFCC_EC_B2C_25_3_0'
                },
                REST: null
            })).to.be.undefined;

            expect(xsw.writeStartElement.calledOnce).to.be.true;
            expect(xsw.writeAttribute.calledOnce).to.be.true;
            expect(xsw.writeEndElement.calledOnce).to.be.true;
            expect(fakeWriteXMLElement.calledOnce).to.be.true;
        });
    });

    describe('handleAdditionalData', () => {
        const writeXMLElement = stub();
        const handleAdditionalData = siteArchiveProcessing.__get__('handleAdditionalData');

        before(() => {
            siteArchiveProcessing.__set__('params', {
                additionalData: {}
            });

            siteArchiveProcessing.__set__('writeXMLElement', writeXMLElement);
        });

        after(() => {
            fakeGetLineSeparator.reset();
            siteArchiveProcessing.__ResetDependency__('params');
            siteArchiveProcessing.__ResetDependency__('writeXMLElement');
        });

        it('should write xml element into XMLIndentingStreamWriter', () => {
            const sourceDir = {
                fullPath: 'IMPEX/src/instance/plugin-configuration'
            };

            expect(handleAdditionalData(sourceDir)).to.be.undefined;
            expect(fakeGetLineSeparator.calledOnce).to.be.true;
            expect(writeXMLElement.calledOnce).to.be.true;
        });
    });

    describe('handleConnectionData', () => {
        const handleConnectionData = siteArchiveProcessing.__get__('handleConnectionData');

        before(() => {
            siteArchiveProcessing.__set__('params', {
                connectionData: {
                    service: {
                        id: 'int_paypal.http.rest',
                        status: 'OK'
                    }
                }
            });
        });

        after(() => {
            fakeGetLineSeparator.reset();
            siteArchiveProcessing.__ResetDependency__('params');
        });

        it('should write xml element into XMLIndentingStreamWriter', () => {
            const sourceDir = {
                fullPath: 'IMPEX/src/instance/plugin-configuration'
            };

            expect(handleConnectionData(sourceDir)).to.be.undefined;
            expect(fakeGetLineSeparator.calledOnce).to.be.true;
        });
    });

    describe('handleVersion', () => {
        const file = { remove: () => {} };
        const handleVersion = siteArchiveProcessing.__get__('handleVersion');

        before(() => {
            spy(file, 'remove');
        });

        after(() => {
            file.remove.restore();
        });

        it('should be an undefined', () => {
            expect(handleVersion(file)).to.be.undefined;
            expect(file.remove.calledOnce).to.be.true;
        });
    });

    describe('handleServiceCredential', () => {
        const credential = {
            children: [
                {
                    name: 'url',
                    content: 'https://test.test.com/search?query=John'
                },
                {
                    name: 'user-id',
                    content: 'test-user-id'
                }
            ]
        };

        const handleServiceCredential = siteArchiveProcessing.__get__('handleServiceCredential');

        it('should mask content value for service credential', () => {
            expect(handleServiceCredential(credential)).to.be.undefined;

            expect(credential).to.deep.equal({
                children: [
                    { name: 'url', content: 'https://********/search?query=John' },
                    { name: 'user-id', content: '********' }
                ]
            });
        });
    });

    describe('handleServices', () => {
        const file = {};
        const fakeGetXMLString = stub();
        const fakeWriteXmlToFile = stub();
        const fakeHandleServiceCredential = stub();
        const handleServices = siteArchiveProcessing.__get__('handleServices');

        before(() => {
            siteArchiveProcessing.__set__('xmlParser', () => ({
                root: {
                    children: [{
                        attributes: { 'service-id': 'int_paypal.http.rest' },
                        name: 'service'
                    }, {
                        attributes: { 'service-profile-id': 'PayPal_Profile' },
                        name: 'service-profile'
                    }, {
                        attributes: { 'service-credential-id': 'Paypal_Sandbox_Credentials' },
                        name: 'service-credential'
                    }, {
                        attributes: { 'service-credential-id': 'Stripe_Credentials' },
                        name: 'service-credential'
                    }, {
                        name: 'service-test'
                    }]
                }
            }));

            siteArchiveProcessing.__set__('getXMLString', fakeGetXMLString);
            siteArchiveProcessing.__set__('writeXmlToFile', fakeWriteXmlToFile);
            siteArchiveProcessing.__set__('handleServiceCredential', fakeHandleServiceCredential);
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('xmlParser');
            siteArchiveProcessing.__ResetDependency__('getXMLString');
            siteArchiveProcessing.__ResetDependency__('writeXmlToFile');
            siteArchiveProcessing.__ResetDependency__('handleServiceCredential');
        });

        it('should filter and store the required services', () => {
            expect(handleServices(file)).to.be.undefined;
            expect(fakeGetXMLString.calledOnce).to.be.true;
            expect(fakeWriteXmlToFile.calledOnce).to.be.true;
            expect(fakeHandleServiceCredential.calledOnce).to.be.true;
        });
    });

    describe('handlePreferences', () => {
        const file = {};
        const fakeGetXMLString = stub();
        const fakeWriteXmlToFile = stub();

        const handlePreferences = siteArchiveProcessing.__get__('handlePreferences');

        const parsedObj = {
            root: {
                children: [{
                    name: 'standard-preferences',
                    children: [{
                        name: 'all-instances',
                        children: [{
                            attributes: { 'preference-id': 'ActiveLocales' },
                            name: 'preference',
                            content: 'default:en_GB:en_CA:en_US'
                        }, {
                            attributes: { 'preference-id': 'CustomCartridges' },
                            name: 'preference',
                            content: 'bm_paypal:bm_app_storefront_base'
                        }]
                    }, {
                        name: 'development',
                        children: []
                    }]
                }, {
                    name: 'custom-preferences'
                }]
            }
        };

        before(() => {
            siteArchiveProcessing.__set__('xmlParser', () => parsedObj);
            siteArchiveProcessing.__set__('getXMLString', fakeGetXMLString);
            siteArchiveProcessing.__set__('writeXmlToFile', fakeWriteXmlToFile);
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('xmlParser');
            siteArchiveProcessing.__ResetDependency__('getXMLString');
            siteArchiveProcessing.__ResetDependency__('writeXmlToFile');
        });

        it('should be an undefined', () => {
            expect(handlePreferences(file)).to.be.undefined;

            expect(parsedObj.root.children).to.deep.equal([{
                name: 'standard-preferences',
                children: [{
                    name: 'all-instances',
                    children: [{
                        attributes: { 'preference-id': 'CustomCartridges' },
                        name: 'preference',
                        content: 'bm_paypal:bm_app_storefront_base'
                    }]
                }]
            }]);

            expect(fakeGetXMLString.calledOnce).to.be.true;
            expect(fakeWriteXmlToFile.calledOnce).to.be.true;
        });
    });

    describe('handleSite', () => {
        const file = {};
        const fakeGetXMLString = stub();
        const fakeWriteXmlToFile = stub();

        const handleSite = siteArchiveProcessing.__get__('handleSite');

        const parsedObj = {
            root: {
                children: [{
                    name: 'currency',
                    content: 'USD'
                }, {
                    name: 'custom-cartridges',
                    content: 'int_paypal:app_storefront_base'
                }]
            }
        };

        before(() => {
            siteArchiveProcessing.__set__('xmlParser', () => parsedObj);
            siteArchiveProcessing.__set__('getXMLString', fakeGetXMLString);
            siteArchiveProcessing.__set__('writeXmlToFile', fakeWriteXmlToFile);
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('xmlParser');
            siteArchiveProcessing.__ResetDependency__('getXMLString');
            siteArchiveProcessing.__ResetDependency__('writeXmlToFile');
        });

        it('should be an undefined', () => {
            expect(handleSite(file)).to.be.undefined;

            expect(parsedObj.root.children).to.deep.equal([{
                name: 'custom-cartridges',
                content: 'int_paypal:app_storefront_base'
            }]);

            expect(fakeGetXMLString.calledOnce).to.be.true;
            expect(fakeWriteXmlToFile.calledOnce).to.be.true;
        });
    });

    describe('handleSiteShipping', () => {
        const file = {};
        const fakeGetXMLString = stub();
        const fakeWriteXmlToFile = stub();

        const handleSiteShipping = siteArchiveProcessing.__get__('handleSiteShipping');

        const parsedObj = {
            root: {
                children: [{
                    attributes: { 'method-id': 'FREE_USD' },
                    currency: 'USD'
                }, {
                    attributes: { 'method-id': '001' },
                    currency: 'USD'
                }, {
                    attributes: { 'method-id': 'FREE_EUR' },
                    currency: 'EUR'
                }, {
                    attributes: { 'method-id': 'EUR001' },
                    currency: 'EUR'
                }]
            }
        };

        before(() => {
            siteArchiveProcessing.__set__('xmlParser', () => parsedObj);
            siteArchiveProcessing.__set__('getXMLString', fakeGetXMLString);
            siteArchiveProcessing.__set__('writeXmlToFile', fakeWriteXmlToFile);
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('xmlParser');
            siteArchiveProcessing.__ResetDependency__('getXMLString');
            siteArchiveProcessing.__ResetDependency__('writeXmlToFile');
        });

        it('should be an undefined', () => {
            expect(handleSiteShipping(file)).to.be.undefined;

            expect(parsedObj.root.children).to.deep.equal([{
                attributes: { 'method-id': 'FREE_USD' },
                currency: 'USD'
            }, {
                attributes: { 'method-id': 'FREE_EUR' },
                currency: 'EUR'
            }]);

            expect(fakeGetXMLString.calledOnce).to.be.true;
            expect(fakeWriteXmlToFile.calledOnce).to.be.true;
        });
    });

    describe('handleSitePreferences', () => {
        const file = {};
        const fakeGetXMLString = stub();
        const fakeWriteXmlToFile = stub();
        const fakeMaskContentAttribute = stub();
        const handleSitePreferences = siteArchiveProcessing.__get__('handleSitePreferences');

        before(() => {
            siteArchiveProcessing.__set__('xmlParser', () => ({
                root: {
                    children: [{
                        name: 'custom-preferences',
                        children: [{
                            name: 'all-instances',
                            children: []
                        }, {
                            name: 'development',
                            children: [{
                                attributes: {
                                    'preference-id': 'PP_Card_Fields_Styles'
                                },
                                children: [],
                                content: '{"color":"black","invalidColor":"red","validColor":"green","fontSize":"12"}'
                            }, {
                                attributes: {
                                    'preference-id': 'Smart_Button_Styles'
                                },
                                children: []
                            }]
                        }]
                    }]
                }
            }));

            siteArchiveProcessing.__set__('getXMLString', fakeGetXMLString);
            siteArchiveProcessing.__set__('writeXmlToFile', fakeWriteXmlToFile);
            siteArchiveProcessing.__set__('maskContentAttribute', fakeMaskContentAttribute);
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('xmlParser');
            siteArchiveProcessing.__ResetDependency__('getXMLString');
            siteArchiveProcessing.__ResetDependency__('writeXmlToFile');
            siteArchiveProcessing.__ResetDependency__('maskContentAttribute');
        });

        it('should filter and store the required site preferences', () => {
            expect(handleSitePreferences(file)).to.be.undefined;
            expect(fakeGetXMLString.calledOnce).to.be.true;
            expect(fakeWriteXmlToFile.calledOnce).to.be.true;
            expect(fakeMaskContentAttribute.calledOnce).to.be.true;
        });
    });

    describe('handleSitePaymentMethods', () => {
        const file = {};
        const fakeGetXMLString = stub();
        const fakeWriteXmlToFile = stub();
        const handleSitePaymentMethods = siteArchiveProcessing.__get__('handleSitePaymentMethods');

        before(() => {
            siteArchiveProcessing.__set__('xmlParser', () => ({
                root: {
                    children: [{
                        attributes: { 'method-id': 'PAYPAL_CREDIT_CARD' }
                    }, {
                        attributes: { 'method-id': 'BANK_TRANSFER' }
                    }, {
                        attributes: { 'card-type': 'UnionPay' }
                    }, {
                        attributes: { 'card-type': 'Discover' }
                    }]
                }
            }));

            siteArchiveProcessing.__set__('getXMLString', fakeGetXMLString);
            siteArchiveProcessing.__set__('writeXmlToFile', fakeWriteXmlToFile);
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('xmlParser');
            siteArchiveProcessing.__ResetDependency__('getXMLString');
            siteArchiveProcessing.__ResetDependency__('writeXmlToFile');
        });

        it('should filter and store the required site payment methods', () => {
            expect(handleSitePaymentMethods(file)).to.be.undefined;
            expect(fakeGetXMLString.calledOnce).to.be.true;
            expect(fakeWriteXmlToFile.calledOnce).to.be.true;
        });
    });

    describe('handleSitePaymentProcessors', () => {
        const file = {};
        const fakeGetXMLString = stub();
        const fakeWriteXmlToFile = stub();
        const handleSitePaymentProcessors = siteArchiveProcessing.__get__('handleSitePaymentProcessors');

        before(() => {
            siteArchiveProcessing.__set__('xmlParser', () => ({
                root: {
                    children: [{
                        attributes: { 'processor-id': 'PAYPAL_CREDIT_CARD' }
                    }, {
                        attributes: { 'processor-id': 'PAYPAL' }
                    }]
                }
            }));

            siteArchiveProcessing.__set__('getXMLString', fakeGetXMLString);
            siteArchiveProcessing.__set__('writeXmlToFile', fakeWriteXmlToFile);
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('xmlParser');
            siteArchiveProcessing.__ResetDependency__('getXMLString');
            siteArchiveProcessing.__ResetDependency__('writeXmlToFile');
        });

        it('should filter and store the required site payment processors', () => {
            expect(handleSitePaymentProcessors(file)).to.be.undefined;
            expect(fakeGetXMLString.calledOnce).to.be.true;
            expect(fakeWriteXmlToFile.calledOnce).to.be.true;
        });
    });

    describe('handleSystemObjectTypeExtensions', () => {
        const file = {};
        const fakeMaskValue = stub();
        const fakeGetXMLString = stub();
        const fakeGetCurrentSite = stub();
        const fakeWriteXmlToFile = stub();
        const fakeMaskContentAttribute = stub();
        const handleSystemObjectTypeExtensions = siteArchiveProcessing.__get__('handleSystemObjectTypeExtensions');

        before(() => {
            siteArchiveProcessing.__set__('xmlParser', () => ({
                root: {
                    children: [{
                        attributes: {
                            'type-id': 'SitePreferences'
                        },
                        name: 'type-extension',
                        children: [{
                            name: 'custom-attribute-definitions',
                            children: [{
                                attributes: {
                                    'attribute-id': 'PP_CWPP_Agent_Password'
                                },
                                children: [{
                                    name: 'type',
                                    content: 'password'
                                }]
                            }, {
                                attributes: {
                                    'attribute-id': 'PP_CWPP_Button_Styles'
                                },
                                children: []
                            }, {
                                attributes: {
                                    'attribute-id': 'PP_Card_Fields_Styles'
                                },
                                children: []
                            }, {
                                attributes: {
                                    'attribute-id': 'PP_Button_Location'
                                },
                                children: []
                            }, {
                                attributes: {
                                    'attribute-id': 'PP_BA_Description'
                                },
                                children: []
                            }]
                        }]
                    }]
                }
            }));

            fakeGetCurrentSite.returns({
                preferences: {
                    custom: {
                        PP_CWPP_Button_Styles: '{"billing":{"theme":"blue","buttonShape":"pill","buttonType":"CWP","buttonSize":"lg"},"login":{"theme":"blue","buttonShape":"pill","buttonType":"LWP","buttonSize":"lg"}}',
                        PP_Card_Fields_Styles: '{"color":"black","invalidColor":"red","validColor":"green","fontSize":"12"}',
                        PP_CWPP_Agent_Password: 'qwer1234tyu!@#',
                        PP_Button_Location: new EnumValue('Cart'),
                        PP_BA_Description: null
                    }
                }
            });

            siteArchiveProcessing.__set__('params', {});
            siteArchiveProcessing.__set__('maskValue', fakeMaskValue);
            siteArchiveProcessing.__set__('getXMLString', fakeGetXMLString);
            siteArchiveProcessing.__set__('getCurrentSite', fakeGetCurrentSite);
            siteArchiveProcessing.__set__('writeXmlToFile', fakeWriteXmlToFile);
            siteArchiveProcessing.__set__('maskContentAttribute', fakeMaskContentAttribute);
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('params');
            siteArchiveProcessing.__ResetDependency__('maskValue');
            siteArchiveProcessing.__ResetDependency__('xmlParser');
            siteArchiveProcessing.__ResetDependency__('getXMLString');
            siteArchiveProcessing.__ResetDependency__('getCurrentSite');
            siteArchiveProcessing.__ResetDependency__('writeXmlToFile');
            siteArchiveProcessing.__ResetDependency__('maskContentAttribute');

            delete dw.value.EnumValue.value;
        });

        it('should filter and store the required system object type extensions', () => {
            expect(handleSystemObjectTypeExtensions(file)).to.be.undefined;
            expect(fakeGetCurrentSite.calledOnce).to.be.true;
            expect(fakeGetXMLString.calledOnce).to.be.true;
            expect(fakeWriteXmlToFile.calledOnce).to.be.true;
            expect(fakeMaskValue.calledOnce).to.be.true;
            expect(fakeMaskContentAttribute.callCount).to.be.equal(4);
        });

        it('should return only SitePreferences without filtering and processing if the current site is not found', () => {
            fakeGetCurrentSite.returns(null);

            expect(handleSystemObjectTypeExtensions(file)).to.be.undefined;
        });
    });

    describe('invokeFileHandler', () => {
        const file = {
            name: 'services.xml',
            fullPath: 'IMPEX/src/instance/plugin-configuration/services'
        };

        const fakeHandleServices = stub();
        const fakeHandleSitePaymentMethods = stub();
        const invokeFileHandler = siteArchiveProcessing.__get__('invokeFileHandler');

        before(() => {
            siteArchiveProcessing.__set__('Handlers', {
                handleServices: fakeHandleServices,
                handleSitePaymentMethods: fakeHandleSitePaymentMethods
            });
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('Handlers');
        });

        it('should call handleServices by function name', () => {
            expect(invokeFileHandler(file)).to.be.undefined;
            expect(fakeHandleServices.calledOnce).to.be.true;
        });

        it('should call handleSitePaymentMethods by function name', () => {
            file.name = 'payment-methods.xml';
            file.fullPath = 'IMPEX/src/instance/plugin-configuration/sites/RefArch';

            expect(invokeFileHandler(file)).to.be.undefined;
            expect(fakeHandleSitePaymentMethods.calledOnce).to.be.true;
        });

        it('should not call a handle by function name if it does not exist in the Handlers object ', () => {
            file.name = 'error-ecom-sandbox-appserver.log';
            file.fullPath = 'Logs';

            expect(invokeFileHandler(file)).to.be.undefined;
        });
    });

    describe('beforeStep', () => {
        const params = {
            fileName: 'plugin-configuration.xml',
            logs: true,
            additionalData: {},
            connectionData: {}
        };

        const parameters = { get: () => JSON.stringify(params) };

        const fakeHandleLogs = stub();
        const fakeTraverseFolders = stub();
        const fakeHandleAdditionalData = stub();
        const fakeHandleConnectionData = stub();

        before(() => {
            siteArchiveProcessing.__set__('files', {
                list: {
                    length: 0,
                    iterator: () => dw.util.Iterator
                }
            });

            siteArchiveProcessing.__set__('traverseFolders', fakeTraverseFolders);
            siteArchiveProcessing.__set__('Handlers', {
                handleLogs: fakeHandleLogs,
                handleAdditionalData: fakeHandleAdditionalData,
                handleConnectionData: fakeHandleConnectionData
            });
        });

        after(() => {
            fakeUnzip.reset();
            fakeTraverseFolders.reset();
            siteArchiveProcessing.__ResetDependency__('files');
            siteArchiveProcessing.__ResetDependency__('Handlers');
            siteArchiveProcessing.__ResetDependency__('traverseFolders');
        });

        it('should extract the archive to a folder, collect file list', () => {
            expect(siteArchiveProcessing.beforeStep(parameters)).to.be.undefined;
            expect(fakeUnzip.calledOnce).to.be.true;
            expect(fakeHandleLogs.calledOnce).to.be.true;
            expect(fakeHandleAdditionalData.calledOnce).to.be.true;
            expect(fakeHandleConnectionData.calledOnce).to.be.true;
            expect(fakeTraverseFolders.calledOnce).to.be.true;
        });

        it('should not run the function if logs are disabled', () => {
            params.logs = false;
            fakeHandleLogs.reset();

            expect(siteArchiveProcessing.beforeStep(parameters)).to.be.undefined;
            expect(fakeHandleLogs.callCount).to.be.equal(0);
        });

        it('should catch an error if it throws an exception', () => {
            fakeTraverseFolders.throwsException(new Error('Traverse folders failed'));

            expect(() => siteArchiveProcessing.beforeStep(parameters)).to.throw();
        });
    });

    describe('getTotalCount', () => {
        it('should return the number of files', () => {
            siteArchiveProcessing.__set__('files', { length: 0 });

            expect(siteArchiveProcessing.getTotalCount()).to.be.a('number').that.equal(0);

            siteArchiveProcessing.__ResetDependency__('files');
        });
    });

    describe('read', () => {
        before(() => {
            siteArchiveProcessing.__set__('files', {
                iterator: {
                    hasNext: () => true,
                    next: () => ({})
                }
            });
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('files');
        });

        it('should return an object if there is a next element in the iterator', () => {
            expect(siteArchiveProcessing.read()).to.be.an('object');
        });

        it('should return undefined if there is no next element', () => {
            siteArchiveProcessing.__set__('files', { iterator: { hasNext: () => false } });

            expect(siteArchiveProcessing.read()).to.be.undefined;
        });
    });

    describe('process', () => {
        const file = {};
        const fakeInvokeFileHandler = stub();

        before(() => {
            siteArchiveProcessing.__set__('invokeFileHandler', fakeInvokeFileHandler);
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('invokeFileHandler');
        });

        it('should call the invokeFileHandler function and return the object', () => {
            expect(siteArchiveProcessing.process(file)).to.be.an('object');
            expect(fakeInvokeFileHandler.calledOnce).to.be.true;
        });
    });

    describe('write', () => {
        it('shoud return undefined', () => {
            expect(siteArchiveProcessing.write()).to.be.undefined;
        });
    });

    describe('afterStep', () => {
        const fakeZip = stub();
        const fakeRemove = stub();
        const fakeThrowError = stub();

        before(() => {
            siteArchiveProcessing.__set__('status', {
                details: { empty: true }
            });
            siteArchiveProcessing.__set__('sourceDir', { zip: fakeZip });
            siteArchiveProcessing.__set__('remove', fakeRemove);
            siteArchiveProcessing.__set__('throwError', fakeThrowError);
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('status');
            siteArchiveProcessing.__ResetDependency__('sourceDir');
            siteArchiveProcessing.__ResetDependency__('remove');
            siteArchiveProcessing.__ResetDependency__('throwError');
        });

        it('should create an archive and delete the source folder', () => {
            expect(siteArchiveProcessing.afterStep()).to.be.undefined;
            expect(fakeZip.calledOnce).to.be.true;
            expect(fakeRemove.calledOnce).to.be.true;
        });

        it('should throw an error if status.details is not empty', () => {
            siteArchiveProcessing.__set__('status', { details: { empty: false } });

            expect(siteArchiveProcessing.afterStep()).to.be.undefined;
            expect(fakeThrowError.calledOnce).to.be.true;
        });
    });

    describe('handleSitePreferences - nested preference children', () => {
        const handleSitePreferences = siteArchiveProcessing.__get__('handleSitePreferences');
        const file = {};
        const fakeGetXMLString = stub();
        const fakeWriteXmlToFile = stub();
        const fakeMaskContentAttribute = stub();

        before(() => {

            siteArchiveProcessing.__set__('xmlParser', () => ({
                root: {
                    children: [{
                        name: 'custom-preferences',
                        children: [{
                            name: 'development',
                            children: [{
                                attributes: {
                                    'preference-id': 'PP_Card_Fields_Styles'
                                },
                                children: [{
                                    content: '{"color":"black"}'
                                }],
                                content: 'SHOULD_BE_IGNORED'
                            }]
                        }]
                    }]
                }
            }));

            siteArchiveProcessing.__set__('getXMLString', fakeGetXMLString);
            siteArchiveProcessing.__set__('writeXmlToFile', fakeWriteXmlToFile);
            siteArchiveProcessing.__set__('maskContentAttribute', fakeMaskContentAttribute);
        });

        after(() => {
            siteArchiveProcessing.__ResetDependency__('xmlParser');
            siteArchiveProcessing.__ResetDependency__('getXMLString');
            siteArchiveProcessing.__ResetDependency__('writeXmlToFile');
            siteArchiveProcessing.__ResetDependency__('maskContentAttribute');
        });

        it('should mask nested preference children values correctly', () => {
            expect(handleSitePreferences(file)).to.be.undefined;
            expect(fakeMaskContentAttribute.calledOnce).to.be.true;

            const callArg = fakeMaskContentAttribute.firstCall.args[0];

            expect(callArg).to.equal('{"color":"black"}');
        });
    });
});
