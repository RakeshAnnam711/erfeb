/* eslint-disable no-unused-vars */

'use strict';

/**
 * Job Step Type that processing files inside the archive for configuration check.
 *
 * @module bm_paypal/cartridge/scripts/steps/siteArchiveProcessing.js
 */

const File = require('dw/io/File');
const Site = require('dw/system/Site');
const Status = require('dw/system/Status');
const Resource = require('dw/web/Resource');
const ArrayList = require('dw/util/ArrayList');
const FileReader = require('dw/io/FileReader');
const FileWriter = require('dw/io/FileWriter');
const EnumValue = require('dw/value/EnumValue');
const WebDAVClient = require('dw/net/WebDAVClient');
const XMLIndentingStreamWriter = require('dw/io/XMLIndentingStreamWriter');

const toXML = require('~/cartridge/scripts/xml/toXML');
const xmlParser = require('~/cartridge/scripts/xml/parser');
const coreHelpers = require('~/cartridge/scripts/helpers/coreHelpers');

const INDENT = '    ';
const XML_VERSION = '1.0';
const ENCODING_UTF8 = 'UTF-8';
const ATTRIBUTE_ID = 'attribute-id';

const MASKED_VALUE = '********';
const MASK_EMAILS = ['PP_CWPP_Agent_Login'];
const MASK_PASSWORDS = ['PP_CWPP_Agent_Password'];
const MASK_JSON = ['PP_OCAPI_Config', 'PP_WebDAV_Config', 'PP_WH_ID'];
const MASK_VALUES = ['PP_Credit_Campaign_ID', 'PP_Merchant_Publisher_ID'];

const PATTERN_CUSTOM_SITE_PREFERENCES = /^(?:PP)_/;
const PATTERN_SERVICE = /^int_(?:paypal)\.http\./;
const PATTERN_SERVICE_PROFILE = /^(?:PayPal)_/;
const PATTERN_SERVICE_CREDENTIAL = /^(?:Paypal)_/;
const PATTERN_LOGS = /(error|info|warn|PayPal).*\.log/i;

const CUSTOM_PAYMENT_METHODS = [
    'PayPal', 'Venmo', 'PAYPAL_CREDIT_CARD', 'ApplePay', 'GooglePay',
    'bancontact', 'eps', 'p24', 'ideal', 'mybank', 'blik'
];

const CUSTOM_PAYMENT_CARD_TYPES = [
    'MasterCard', 'American Express',
    'JCB', 'Carte Bancaire',
    'Discover', 'Debit networks'
];

const CUSTOM_PAYMENT_PROCESSORS = ['PAYPAL', 'PAYPAL_LOCAL'];

const CUSTOM_SHIPPINGS = [
    'FREE_EUR', 'FREE_USD', 'FREE_JPY', 'FREE_CNY', 'FREE_GBP', 'FREE_PLN',
    'PLN001', 'PLN002', 'PLN003', 'PLN004', 'PLN005'
];

const files = { length: 0, iterator: {}, list: new ArrayList() };
const status = new Status(Status.ERROR, 'STOPPED', 'Job stopped.');

let params;
let sourceDir;
let archiveFile;

/**
 * Throws an error message containing details from a status object.
 *
 * @param {Object} [error] - The error object that caused the failure.
 * @throws {string} The error message with status details.
 */
const throwError = function(error) {
    if (!status.details.empty) {
        const details = JSON.stringify(status.details.values().toArray());

        throw ['{{', details, '}}'].join('');
    }

    throw error;
};

/**
 * Wraps a callback function in a try-catch block and handles the caught error by adding details to a global `status` object.
 *
 * @param {Function} callback - The callback function to be executed within the try block.
 * @param {Object} optionalData - Optional data to be used for adding details to the status object in case of an error.
 * @param {string} optionalData.callbackName - The name of the callback function (used for error details).
 * @param {string} optionalData.fileName - The file name or location where the error occurred (used for error details).
 */
const tryCatchWrapper = function(callback, optionalData) {
    if (typeof callback !== 'function') {
        throw new Error(Resource.msg('error.callback.be.function', 'errors', null));
    }

    try {
        callback();
    } catch (error) {
        status.addDetail(optionalData.callbackName, Object.assign(error, {
            file: optionalData.fileName
        }));
    }
};

/**
 * Traverse Folders
 * @param {dw.io.File} fileInstance -
 * @param {dw.util.ArrayList} arrayList -
 * @returns {void}
 */
const traverseFolders = function(fileInstance, arrayList) {
    const listFiles = fileInstance.listFiles().toArray();

    listFiles.forEach(function(file) {
        if (file.isDirectory()) {
            traverseFolders(file, arrayList);
        } else {
            arrayList.add1(file);
        }
    });
};

/**
 * Recursively deletes files and folders starting from the specified path.
 * Deletes files first, then folders.
 * @param {dw.io.File} file - The file instance for the folder or file to delete.
 */
const remove = function(file) {
    if (!file.exists()) {
        return;
    }

    if (file.isFile()) {
        file.remove();
    } else if (file.isDirectory()) {
        // Recursively delete all nested files and folders
        const listFiles = file.listFiles();

        listFiles.toArray().forEach(function(nestedFile) {
            remove(nestedFile);
        });

        // Delete the folder after deleting all nested files and folders
        file.remove();
    }
};

/**
 * Get XML as string
 * @param {dw.io.File} file -
 * @returns {string} -
 */
const getXMLString = function(file) {
    let output = '';

    const fileReader = new FileReader(file, ENCODING_UTF8);

    output = fileReader.readString();

    fileReader.close();

    return output;
};

/**
 * Get XML as string
 * @param {dw.io.File} file -
 * @param {Object} obj - xml structure in object
 * @returns {void}
 */
const writeXmlToFile = function(file, obj) {
    const fileWriter = new FileWriter(file, ENCODING_UTF8);

    const xmlString = toXML(obj);

    fileWriter.writeLine(xmlString);
    fileWriter.close();
};

/**
 * Get attribute type
 * @param {Array} list - List of attribute definitions
 * @returns {string} - Return type of attribute or empty string
 */
const getType = function(list) {
    const type = list.find(function(child) {
        return child.name === 'type';
    });

    return type ? type.content : '';
};

/**
 * Masks sensitive data.
 * @param {string} value - The data to mask.
 * @returns {string} The masked data.
 */
const maskValue = function(value) {
    if (typeof value !== 'string' || value === '') {
        return value;
    }

    return /^\*{4}/.test(value) ? value : MASKED_VALUE;
};

/**
 * Masks the host portion of a URL.
 * @param {string} url - The URL to mask.
 * @returns {string} The masked URL.
 */
const maskUrl = function(url) {
    if (typeof url !== 'string') {
        return url;
    }

    const regex = /^(https?:\/\/)([^/]+)(.*)$/;
    const matches = url.match(regex);

    if (!matches) {
        return url;
    }

    const protocol = matches[1];
    const path = matches[3];

    return [protocol, MASKED_VALUE, path].join('');
};

/**
 * Masks an email address.
 * @param {string} email - The email address to be masked.
 * @returns {string} The masked email address.
 */
function maskEmail(email) {
    if (typeof email !== 'string') {
        return email;
    }

    const atIndex = email.indexOf('@');

    if (atIndex === -1) {
        return email;
    }

    const domain = email.slice(atIndex + 1);
    const maskedLogin = MASKED_VALUE;
    const domainParts = domain.split('.');
    const domainType = domainParts.pop();
    const maskedDomain = domainParts.map(part => MASKED_VALUE).join('.');

    return [maskedLogin, '@', maskedDomain, '.', domainType].join('');
}

/**
 * Mask content for attribute id
 * @param {string} content - Text content
 * @param {string} attributeId - Attribute ID
 * @returns {string} - Original or masked content
 */
function maskContentAttribute(content, attributeId) {
    if (MASK_EMAILS.includes(attributeId)) {
        return maskEmail(content);
    }

    if (MASK_PASSWORDS.includes(attributeId) || MASK_VALUES.includes(attributeId)) {
        return maskValue(content);
    }

    if (MASK_JSON.includes(attributeId) && coreHelpers.isJson(content)) {
        const json = coreHelpers.tryParseJSON(content);

        Object.keys(json).forEach(function(key) {
            json[key] = maskValue(json[key]);
        });

        return JSON.stringify(json);
    }

    return content;
}

/**
 * Get current site
 * @param {string} siteId - id of the current site
 * @returns {dw.system.Site} - current site
 */
const getCurrentSite = function(siteId) {
    return Site.allSites.toArray().find(function(site) {
        return site.ID === siteId;
    });
};

/**
 * Write XML Element
 * @param {dw.io.XMLIndentingStreamWriter} xsw - XMLIndentingStreamWriter
 * @param {Object} data - Object data
 */
const writeXMLElement = function(xsw, data) {
    Object.keys(data).forEach(function(key) {
        const value = data[key];

        if (!value) {
            return;
        }

        if (coreHelpers.isObject(value)) {
            xsw.writeStartElement('attributes');
            xsw.writeAttribute('name', key);
            writeXMLElement(xsw, value);
            xsw.writeEndElement();
        } else {
            xsw.writeStartElement('attribute');
            xsw.writeAttribute('name', key);
            xsw.writeCharacters(value.toString());
            xsw.writeEndElement();
        }
    });
};

/**
 * Handle Logs
 * @param {string} sourcePath - path to the config directory
 * @returns {void}
 */
const handleLogs = function(sourcePath) {
    const currentSite = getCurrentSite(params.siteId);
    const webDavConfig = JSON.parse(currentSite.getCustomPreferenceValue('PP_WebDAV_Config'));

    const webDavUrl = ['https:/', webDavConfig.host, 'on/demandware.servlet/webdav/Sites'].join(File.SEPARATOR);
    const WebDavClient = new WebDAVClient(webDavUrl, webDavConfig.username, webDavConfig.password);

    const logs = WebDavClient.propfind('Logs');
    const logsToExport = logs.filter(function(file) {
        return PATTERN_LOGS.test(file.name);
    });

    const logsToExportPath = [sourcePath, 'logs'].join(File.SEPARATOR);
    const logsToExportDirectory = new File(logsToExportPath);

    if (!logsToExportDirectory.exists()) {
        logsToExportDirectory.mkdir();
    }

    logsToExport.forEach(function(log) {
        const logName = log.name;
        const logPath = log.path.split(File.SEPARATOR).slice(-2).join(File.SEPARATOR);

        const newLogFilePath = [logsToExportPath, logName].join(File.SEPARATOR);
        const newLogFile = new File(newLogFilePath);

        WebDavClient.get(logPath, newLogFile);
    });
};

/**
 * Handle Additional Data
 * @param {dw.io.File} _sourceDir - Source dir
 * @returns {void}
 */
const handleAdditionalData = function(_sourceDir) {
    const file = new File([_sourceDir.fullPath, 'additional-data.xml'].join(File.SEPARATOR));
    const fileWriter = new FileWriter(file, ENCODING_UTF8);
    const xsw = new XMLIndentingStreamWriter(fileWriter);
    const lineSeparator = fileWriter.getLineSeparator();

    xsw.setIndent(INDENT);
    xsw.setNewLine(lineSeparator);

    xsw.writeStartDocument(ENCODING_UTF8, XML_VERSION);
    xsw.writeStartElement('versions');
    writeXMLElement(xsw, params.additionalData);
    xsw.writeCharacters(lineSeparator);
    xsw.writeEndDocument();

    xsw.close();

    fileWriter.writeLine(lineSeparator);
    fileWriter.close();
};

/**
 * Handle Service Connection Data
 * @param {dw.io.File} _sourceDir - Source dir
 * @returns {void}
 */
const handleConnectionData = function(_sourceDir) {
    const data = params.connectionData.service;
    const file = new File([_sourceDir.fullPath, 'service-connection.xml'].join(File.SEPARATOR));
    const fileWriter = new FileWriter(file, ENCODING_UTF8);
    const xsw = new XMLIndentingStreamWriter(fileWriter);
    const lineSeparator = fileWriter.getLineSeparator();

    xsw.setIndent(INDENT);
    xsw.setNewLine(lineSeparator);

    xsw.writeStartDocument(ENCODING_UTF8, XML_VERSION);
    xsw.writeStartElement('services');
    xsw.writeStartElement('service');
    Object.keys(data).forEach(function(key) {
        const value = data[key];

        xsw.writeStartElement('attribute');
        xsw.writeAttribute('name', key);
        xsw.writeCharacters(value.toString());
        xsw.writeEndElement();
    });
    xsw.writeEndElement();
    xsw.writeCharacters(lineSeparator);
    xsw.writeEndDocument();

    xsw.close();

    fileWriter.writeLine(lineSeparator);
    fileWriter.close();
};

/**
 * Handle Version
 * @param {dw.io.File} file -
 * @returns {void}
 */
const handleVersion = function(file) {
    file.remove();
};

/**
 * Handle Service Credential
 * @param {Object} credential - Service credential
 * @returns {void}
 */
const handleServiceCredential = function(credential) {
    credential.children.map(function(child) {
        if (child.name === 'url') {
            child.content = maskUrl(child.content);
        } else {
            child.content = maskValue(child.content);
        }

        return child;
    });
};

/**
 * Handle Services
 * @param {dw.io.File} file -
 * @returns {void}
 */
const handleServices = function(file) {
    const obj = xmlParser(getXMLString(file));

    obj.root.children = obj.root.children
        .filter(function(child) {
            const attributes = child.attributes;

            switch (child.name) {
                case 'service':
                    return PATTERN_SERVICE.test(attributes['service-id']);
                case 'service-profile':
                    return PATTERN_SERVICE_PROFILE.test(attributes['service-profile-id']);
                case 'service-credential':
                    const isExportable = PATTERN_SERVICE_CREDENTIAL.test(attributes['service-credential-id']);

                    if (isExportable) {
                        handleServiceCredential(child);
                    }

                    return isExportable;
            }

            return false;
        });

    writeXmlToFile(file, obj);
};

/**
 * Handle Preferences
 * @param {dw.io.File} file -
 * @returns {void}
 */
const handlePreferences = function(file) {
    const obj = xmlParser(getXMLString(file));

    obj.root.children = obj.root.children.filter(function(item) {
        if (item.name === 'standard-preferences') {
            item.children = item.children.filter(function(instance) {
                if (instance.children.length) {
                    instance.children = instance.children.filter(function(preference) {
                        return preference.attributes['preference-id'] === 'CustomCartridges';
                    });

                    return true;
                }

                return false;
            });

            return true;
        }

        return false;
    });

    writeXmlToFile(file, obj);
};

/**
 * Handle Site
 * @param {dw.io.File} file -
 * @returns {void}
 */
const handleSite = function(file) {
    const obj = xmlParser(getXMLString(file));

    obj.root.children = obj.root.children.filter(function(item) {
        return item.name === 'custom-cartridges';
    });

    writeXmlToFile(file, obj);
};

/**
 * Handle Site Shipping
 * @param {dw.io.File} file -
 * @returns {void}
 */
const handleSiteShipping = function(file) {
    const obj = xmlParser(getXMLString(file));

    obj.root.children = obj.root.children.filter(function(item) {
        return CUSTOM_SHIPPINGS.includes(item.attributes['method-id']);
    });

    writeXmlToFile(file, obj);
};

/**
 * Handle Site Preferences
 * @param {dw.io.File} file -
 * @returns {void}
 */
const handleSitePreferences = function(file) {
    const obj = xmlParser(getXMLString(file));

    const customPreferences = obj.root.children.find(function(child) {
        return child.name === 'custom-preferences';
    });

    customPreferences.children = customPreferences.children.filter(function(instance) {
        if (instance.children.length) {
            instance.children = instance.children.filter(function(preference) {
                const attrId = preference.attributes['preference-id'];
                const isExportable = PATTERN_CUSTOM_SITE_PREFERENCES.test(attrId);

                if (isExportable) {
                    if (preference.children.length) {
                        preference.children.forEach(function(item) {
                            item.content = maskContentAttribute(item.content, attrId);
                        });
                    } else {
                        preference.content = maskContentAttribute(preference.content, attrId);
                    }
                }

                return isExportable;
            });

            return true;
        }

        return false;
    });

    obj.root.children = [customPreferences];

    writeXmlToFile(file, obj);
};

/**
 * Handle Site Payment Methods
 * @param {dw.io.File} file -
 * @returns {void}
 */
const handleSitePaymentMethods = function(file) {
    const obj = xmlParser(getXMLString(file));

    obj.root.children = obj.root.children.filter(function(payment) {
        const methodId = payment.attributes['method-id'];
        const cardType = payment.attributes['card-type'];

        return CUSTOM_PAYMENT_METHODS.includes(methodId) || CUSTOM_PAYMENT_CARD_TYPES.includes(cardType);
    });

    writeXmlToFile(file, obj);
};

/**
 * Handle Payment Processors
 * @param {dw.io.File} file -
 * @returns {void}
 */
const handleSitePaymentProcessors = function(file) {
    const obj = xmlParser(getXMLString(file));

    obj.root.children = obj.root.children.filter(function(processor) {
        processor.children = [];

        return CUSTOM_PAYMENT_PROCESSORS.includes(processor.attributes['processor-id']);
    });

    writeXmlToFile(file, obj);
};

/**
 * Handle System Object Type Extensions
 * @param {dw.io.File} file -
 * @returns {void}
 */
const handleSystemObjectTypeExtensions = function(file) {
    const obj = xmlParser(getXMLString(file));

    const sitePreferences = obj.root.children.find(function(child) {
        return child.name === 'type-extension' && child.attributes['type-id'] === 'SitePreferences';
    });

    const siteCurrent = getCurrentSite(params.siteId);

    if (siteCurrent) {
        const customPreferences = siteCurrent.preferences.custom;

        const customAttributes = sitePreferences.children.find(function(child) {
            return child.name === 'custom-attribute-definitions';
        });

        customAttributes.children = customAttributes.children
            .filter(function(child) {
                return PATTERN_CUSTOM_SITE_PREFERENCES.test(child.attributes[ATTRIBUTE_ID]);
            })
            .map(function(child) {
                const attrId = child.attributes[ATTRIBUTE_ID];

                let content = customPreferences[attrId];

                if (![null, undefined].includes(content)) {
                    if (content instanceof EnumValue) {
                        content = content.value;
                    } else if (!['string', 'boolean', 'number'].includes(typeof content)) {
                        content = content.join(',');
                    }

                    if (getType(child.children) === 'password') {
                        content = maskValue(content);
                    }

                    content = maskContentAttribute(content, attrId);

                    child.children.push({
                        children: [],
                        attributes: {},
                        content: String(content),
                        name: 'current-value'
                    });
                }

                return child;
            });
    }

    obj.root.children = [sitePreferences];

    writeXmlToFile(file, obj);
};

const Handlers = {
    handleLogs: handleLogs,
    handleSite: handleSite,
    handleVersion: handleVersion,
    handleServices: handleServices,
    handlePreferences: handlePreferences,
    handleSiteShipping: handleSiteShipping,
    handleConnectionData: handleConnectionData,
    handleAdditionalData: handleAdditionalData,
    handleSitePreferences: handleSitePreferences,
    handleSitePaymentMethods: handleSitePaymentMethods,
    handleSitePaymentProcessors: handleSitePaymentProcessors,
    handleSystemObjectTypeExtensions: handleSystemObjectTypeExtensions
};

/**
 * Invoke File Handler
 * @param {dw.io.File} file -
 * @returns {void}
 */
const invokeFileHandler = function(file) {
    let funcName = 'handle' + (!/^site/.test(file.name) && /sites/.test(file.fullPath) ? 'Site' : '');

    funcName += file.name.slice(0, -4).split('-').map(function(word) {
        return word[0].toUpperCase() + word.slice(1);
    }).join('');

    if (funcName in Handlers) {
        tryCatchWrapper(() => Handlers[funcName](file), {
            fileName: file.name,
            callbackName: funcName
        });
    }
};

/**
 * Before step function
 * @param {dw.util.HashMap} parameters that are available as scriptable objects for each exposed module function and for the dw.job.JobStepExecution object.
 * @param {dw.job.JobStepExecution} _stepExecution object allows read-only access to information about the current step execution and job execution
 */
const beforeStep = function(parameters, _stepExecution) { // eslint-disable-line no-unused-vars
    try {
        params = JSON.parse(parameters.get('Options'));
        params.connectionData = JSON.parse(parameters.get('ConnectionData'));

        const folderName = params.fileName.slice(0, -4);
        const archivePath = [File.IMPEX, 'src', 'instance'].join(File.SEPARATOR);
        const sourcePath = [archivePath, folderName].join(File.SEPARATOR);
        const archiveFilePath = [archivePath, params.fileName].join(File.SEPARATOR);

        const archiveDir = new File(archivePath);

        archiveFile = new File(archiveFilePath);

        archiveFile.unzip(archiveDir);

        sourceDir = new File(sourcePath);

        traverseFolders(sourceDir, files.list);

        if (params.logs) {
            tryCatchWrapper(() => Handlers.handleLogs(sourcePath), {
                fileName: '.log',
                callbackName: 'handleLogs'
            });
        }

        tryCatchWrapper(() => Handlers.handleAdditionalData(sourceDir), {
            fileName: 'additional-data.xml',
            callbackName: 'handleAdditionalData'
        });

        tryCatchWrapper(() => Handlers.handleConnectionData(sourceDir), {
            fileName: 'service-connection.xml',
            callbackName: 'handleConnectionData'
        });

        files.length = files.list.length;
        files.iterator = files.list.iterator();
    } catch (error) {
        const paypalUtils = require('*/cartridge/scripts/paypal/utils');

        error.name = Object.getPrototypeOf(error).name;
        paypalUtils.createErrorLog(JSON.stringify(error, null, 4));

        throwError(error);
    }
};

/**
 * Total count function
 * @param {dw.util.HashMap} _parameters that are available as scriptable objects for each exposed module function and for the dw.job.JobStepExecution object.
 * @param {dw.job.JobStepExecution} _stepExecution object allows read-only access to information about the current step execution and job execution
 * @returns {number} Returns the total number of items that are available.
 */
const getTotalCount = function(_parameters, _stepExecution) { // eslint-disable-line no-unused-vars
    return files.length;
};

/**
 * Read function
 * @param {dw.util.HashMap} _parameters that are available as scriptable objects for each exposed module function and for the dw.job.JobStepExecution object.
 * @param {dw.job.JobStepExecution} _stepExecution object allows read-only access to information about the current step execution and job execution
 * @returns {Object} Returns the next element from the Iterator.
 */
const read = function(_parameters, _stepExecution) { // eslint-disable-line no-unused-vars
    return files.iterator.hasNext() ? files.iterator.next() : undefined;
};

/**
 * Process function
 * @param {Object} file receives the item returned by the read function (file)
 * @param {dw.util.HashMap} _parameters that are available as scriptable objects for each exposed module function and for the dw.job.JobStepExecution object.
 * @param {dw.job.JobStepExecution} _stepExecution object allows read-only access to information about the current step execution and job execution
 * @returns {Object} number of merged items
 */
const process = function(file, _parameters, _stepExecution) { // eslint-disable-line no-unused-vars
    invokeFileHandler(file);

    return file;
};

/**
 * Write function
 * @param {dw.util.List} lines a list of items
 * @param {dw.util.HashMap} _parameters that are available as scriptable objects for each exposed module function and for the dw.job.JobStepExecution object.
 * @param {dw.job.JobStepExecution} _stepExecution object allows read-only access to information about the current step execution and job execution
 */
const write = function(lines, _parameters, _stepExecution) { // eslint-disable-line no-unused-vars
};

/**
 * After step function
 * @param {boolean} _success step status
 * @param {dw.util.HashMap} _parameters that are available as scriptable objects for each exposed module function and for the dw.job.JobStepExecution object.
 * @param {dw.job.JobStepExecution} _stepExecution object allows read-only access to information about the current step execution and job execution
 */
const afterStep = function(_success, _parameters, _stepExecution) { // eslint-disable-line no-unused-vars
    sourceDir.zip(archiveFile);

    remove(sourceDir);

    if (!status.details.empty) {
        throwError();
    }
};

module.exports = {
    beforeStep: beforeStep,
    getTotalCount: getTotalCount,
    read: read,
    process: process,
    write: write,
    afterStep: afterStep
};
