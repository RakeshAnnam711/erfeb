'use strict';

/**
 * Generates the Shipping Methods XML file using the Flow Api
 * @returns {dw.system.Status} OK Status Code
 */
function generateShippingMethodsImportFile() {
    var FileWriter = require('dw/io/FileWriter');
    var Status = require('dw/system/Status');
    var File = require('dw/io/File');
    var experiences = require('*/cartridge/config/flowExperiences');
    var JobHelper = require('*/cartridge/scripts/flow/helpers/jobHelper');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var flowApi = require('*/cartridge/scripts/flow/api/api');

    var time = (new Date()).toISOString().substring(11, 19).replace(/:/g, '');
    var out;
    var file;
    var tiers;

    var createShippingMethodXML = function (id, name, currency) {
        var result = '';

        result += '<shipping-method method-id="' + id + '-' + currency + '" default="false">\n';
        result += '<display-name xml:lang="x-default">' + name + '</display-name>\n';
        result += '<description xml:lang="x-default">' + name + '</description>\n';
        result += '<online-flag>true</online-flag>\n<price-table/>\n';
        result += '<custom-attributes>\n';
        result += '<custom-attribute attribute-id="storePickupEnabled">false</custom-attribute>\n';
        result += '<custom-attribute attribute-id="isFlowShippingMethod">true</custom-attribute>\n';
        result += '</custom-attributes>\n';
        result += '<currency>' + currency + '</currency>\n';
        result += '</shipping-method>\n';

        return result;
    };

    if (!FlowHelper.isFlowEnabled && !FlowHelper.enableJobs) {
        return new Status(Status.OK, null, 'Flow is disabled');
    }

    JobHelper.createFolders();
    file = new File(JobHelper.getJobFilePath(JobHelper.paths.SHIPPINGMETHODS_FOLDER + '/' + time + '_shipping_methods.xml'));
    file.createNewFile();

    out = new FileWriter(file);
    out.write('<?xml version="1.0" encoding="UTF-8"?>\n');
    out.write('<shipping xmlns="http://www.demandware.com/xml/impex/shipping/2007-03-31">\n');

    experiences.forEach(function (experience) {
        tiers = flowApi.configuration.getShippingTiers(experience.shippingConfigurationKey);

        if (!tiers || !tiers.length) {
            FlowHelper.logger.info('Skipping experience ' + experience.id + ', No shipping tiers found.');
        } else {
            tiers.forEach(function (tier) {
                out.write(createShippingMethodXML(tier.id, tier.name, experience.currencyCode));
                out.write(createShippingMethodXML(tier.id, tier.name, FlowHelper.defaultCurrencyCode));
            });
        }
    });

    out.write('</shipping>');
    out.flush();
    out.close();

    return new Status(Status.OK, null, 'Process finished. Shipping Methods XML import file generated.');
}

exports.generateShippingMethodsImportFile = generateShippingMethodsImportFile;
