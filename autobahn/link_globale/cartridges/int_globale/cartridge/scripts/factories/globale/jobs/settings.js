'use strict';

var Status = require('dw/system/Status');

/**
 * This Job fetches Global-e AppSettings
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function fetchAppSettings(args) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var AppSettingsOperationData = require('*/cartridge/models/globale/jobs/settings/requests/AppSettingsOperationData');
    var AppSettingsOperationResult = require('*/cartridge/models/globale/jobs/settings/responses/AppSettingsOperationResult');

    var operationData = new AppSettingsOperationData();
    var operationResult = new AppSettingsOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var AppSettingsOperation = require('*/cartridge/models/globale/jobs/settings/actions/AppSettingsOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/settings/actions/decorators/index');

        var operationHandler = new AppSettingsOperation(operationData, operationResult);
        operationHandlerDecorators.getServiceResponse(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_fetchAppSettings: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * This Job fetches Global-e Countries configuration
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function fetchCountries(args) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var CountriesOperationData = require('*/cartridge/models/globale/jobs/settings/requests/CountriesOperationData');
    var CountriesOperationResult = require('*/cartridge/models/globale/jobs/settings/responses/CountriesOperationResult');

    var operationData = new CountriesOperationData();
    var operationResult = new CountriesOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var CountriesOperation = require('*/cartridge/models/globale/jobs/settings/actions/CountriesOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/settings/actions/decorators/index');

        var operationHandler = new CountriesOperation(operationData, operationResult);
        operationHandlerDecorators.getServiceResponse(operationHandler);
        operationHandlerDecorators.dataCleanUp(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_fetchCountries: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * This Job fetches Global-e CountryCoefficients configuration
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function fetchCountryCoefficients(args) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var CountryCoefficientsOperationData = require('*/cartridge/models/globale/jobs/settings/requests/CountryCoefficientsOperationData');
    var CountryCoefficientsOperationResult = require('*/cartridge/models/globale/jobs/settings/responses/CountryCoefficientsOperationResult');

    var operationData = new CountryCoefficientsOperationData();
    var operationResult = new CountryCoefficientsOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var CountryCoefficientsOperation = require('*/cartridge/models/globale/jobs/settings/actions/CountryCoefficientsOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/settings/actions/decorators/index');

        var operationHandler = new CountryCoefficientsOperation(operationData, operationResult);
        operationHandlerDecorators.getServiceResponse(operationHandler);
        operationHandlerDecorators.dataCleanUp(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_fetchCountryCoefficients: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * This Job fetches Global-e Cultures configuration
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function fetchCultures(args) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var CulturesOperationData = require('*/cartridge/models/globale/jobs/settings/requests/CulturesOperationData');
    var CulturesOperationResult = require('*/cartridge/models/globale/jobs/settings/responses/CulturesOperationResult');

    var operationData = new CulturesOperationData();
    var operationResult = new CulturesOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var CulturesOperation = require('*/cartridge/models/globale/jobs/settings/actions/CulturesOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/settings/actions/decorators/index');

        var operationHandler = new CulturesOperation(operationData, operationResult);
        operationHandlerDecorators.getServiceResponse(operationHandler);
        operationHandlerDecorators.dataCleanUp(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_fetchCultures: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * This Job fetches Global-e Currencies configuration
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function fetchCurrencies(args) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var CurrenciesOperationData = require('*/cartridge/models/globale/jobs/settings/requests/CurrenciesOperationData');
    var CurrenciesOperationResult = require('*/cartridge/models/globale/jobs/settings/responses/CurrenciesOperationResult');

    var operationData = new CurrenciesOperationData();
    var operationResult = new CurrenciesOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var CurrenciesOperation = require('*/cartridge/models/globale/jobs/settings/actions/CurrenciesOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/settings/actions/decorators/index');

        var operationHandler = new CurrenciesOperation(operationData, operationResult);
        operationHandlerDecorators.getServiceResponse(operationHandler);
        operationHandlerDecorators.dataCleanUp(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_fetchCurrencies: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * This Job fetches Global-e CurrencyRates configuration
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function fetchCurrencyRates(args) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var CurrencyRatesOperationData = require('*/cartridge/models/globale/jobs/settings/requests/CurrencyRatesOperationData');
    var CurrencyRatesOperationResult = require('*/cartridge/models/globale/jobs/settings/responses/CurrencyRatesOperationResult');

    var operationData = new CurrencyRatesOperationData();
    var operationResult = new CurrencyRatesOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var CurrencyRatesOperation = require('*/cartridge/models/globale/jobs/settings/actions/CurrencyRatesOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/settings/actions/decorators/index');

        var operationHandler = new CurrencyRatesOperation(operationData, operationResult);
        operationHandlerDecorators.getServiceResponse(operationHandler);
        operationHandlerDecorators.dataCleanUp(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_fetchCurrencyRates: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * This Job fetches Global-e RoundingRules configuration
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function fetchRoundingRules(args) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var RoundingRulesOperationData = require('*/cartridge/models/globale/jobs/settings/requests/RoundingRulesOperationData');
    var RoundingRulesOperationResult = require('*/cartridge/models/globale/jobs/settings/responses/RoundingRulesOperationResult');

    var operationData = new RoundingRulesOperationData();
    var operationResult = new RoundingRulesOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var RoundingRulesOperation = require('*/cartridge/models/globale/jobs/settings/actions/RoundingRulesOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/settings/actions/decorators/index');

        var operationHandler = new RoundingRulesOperation(operationData, operationResult);
        operationHandlerDecorators.getServiceResponse(operationHandler);
        operationHandlerDecorators.dataCleanUp(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_fetchRoundingRules: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * This Job fetches Global-e ActiveHubDetails configuration
 * @param {dw.util.Map} args - Job Arguments
 * @param {dw.job.JobStepExecution} jobStepExecution - Job Step Execution
 * @returns {dw.system.Status} - SFCC Status
 */
function fetchActiveHubDetails(args) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var ActiveHubDetailsOperationData = require('*/cartridge/models/globale/jobs/settings/requests/ActiveHubDetailsOperationData');
    var ActiveHubDetailsOperationResult = require('*/cartridge/models/globale/jobs/settings/responses/ActiveHubDetailsOperationResult');

    var operationData = new ActiveHubDetailsOperationData();
    var operationResult = new ActiveHubDetailsOperationResult();

    if (args && ('geDisableJobStep' in args) && args.geDisableJobStep) {
        return new Status(Status.OK);
    }

    try {
        // create operation handler
        var ActiveHubDetailsOperation = require('*/cartridge/models/globale/jobs/settings/actions/ActiveHubDetailsOperation');
        var operationHandlerDecorators = require('*/cartridge/models/globale/jobs/settings/actions/decorators/index');

        var operationHandler = new ActiveHubDetailsOperation(operationData, operationResult);
        operationHandlerDecorators.getServiceResponse(operationHandler);
        operationHandlerDecorators.dataCleanUp(operationHandler);

        // invoke operation handler
        operationHandler.run();
    } catch (e) {
        logger.error('SFCC_to_GE_fetchActiveHubDetails: {0}', e.message + '; ' + e.stack);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

module.exports = {
    fetchAppSettings: fetchAppSettings,
    fetchCountries: fetchCountries,
    fetchCountryCoefficients: fetchCountryCoefficients,
    fetchCultures: fetchCultures,
    fetchCurrencies: fetchCurrencies,
    fetchCurrencyRates: fetchCurrencyRates,
    fetchRoundingRules: fetchRoundingRules,
    fetchActiveHubDetails: fetchActiveHubDetails
};
