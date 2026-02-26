'use strict';

/**
 * Controller : VertexInc
 *
 * @module controllers/VertexInc
 */

/* API includes */
var ISML = require('dw/template/ISML');
var URLUtils = require('dw/web/URLUtils');
var API = require('*/cartridge/scripts/libVertex');

/**
 * @description Shows VertexInc BM extension
 */
function show() {
    var config = API.getConfig();

    var templateData = {
        configurationContinueUrl : URLUtils.https('VertexInc-HandleForm'),
        healthCheckUrl           : URLUtils.https('VertexInc-Show'),
        form                     : config
    };
    if (request.httpParameterMap.isParameterSubmitted('job')) {
        var jobTitle = request.httpParameterMap.job.stringValue;
        if (jobTitle === 'lookupService' || jobTitle === 'taxService') {
            templateData.healthCheckResult = API.healthCheck();
        }
    }
    ISML.renderTemplate('index', templateData);
}

/**
 * @argument {Object} jobResult Status
 * @description Job Handle
 * @returns {string} status
 */
function handleJob(jobResult) {
    if (!jobResult.ok) {
        throw new Error(jobResult.msg || jobResult.errorMessage);
    }
    return jobResult.ok;
}

/**
 * @description Test call Tax Area
 * @returns {string} status
 */
function healthCheckTaxArea() {
    return handleJob(API.checkTaxAreaLookupService());
}

/**
 * @argument {Object} arg HttpParamenter
 * @description Test call Tax Calculation
 * @returns {string} status
 */
function healthCheckTaxCalculation(arg) {
    var productID = arg && arg.productID;
    return handleJob(API.checkTaxCalculateService(productID));
}

/**
 * @description Form Handle
 */
function handleForm() {
    var result = API.saveForm(request.httpParameterMap);
    response.redirect(URLUtils.https('VertexInc-Show', 'error', result || ''));
}

exports.Show = show;
exports.Show.public = true;

exports.HandleForm = handleForm;
exports.HandleForm.public = true;

exports.HealthCheckTaxArea = healthCheckTaxArea;
exports.HealthCheckTaxCalculation = healthCheckTaxCalculation;
