'use strict';

/**
 * Generates the configuration json files using the Flow API mapped to the SFCC system config
 * @returns {dw.system.Status} Status Code
 */
function generateConfigurationJsonFiles() {
    var FileWriter = require('dw/io/FileWriter');
    var Locale = require('dw/util/Locale');
    var Status = require('dw/system/Status');
    var File = require('dw/io/File');
    var JobHelper = require('*/cartridge/scripts/flow/helpers/jobHelper');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var ExperienceHelper = require('*/cartridge/scripts/flow/helpers/experienceHelper');
    var flowApi = require('*/cartridge/scripts/flow/api/api');

    var experiences = flowApi.experience.getExperiences();
    var allowedCurrencies = FlowHelper.allowedCurrencies;
    var allowedLocales = FlowHelper.allowedLocales;
    var defaultLocaleCode = FlowHelper.defaultLocaleCode;
    var defaultLocale = Locale.getLocale(defaultLocaleCode);
    var defaultCurrencyCode = FlowHelper.defaultCurrencyCode;
    var excludedLocales = JSON.parse(FlowHelper.excludedLocalesJSON);
    var cleanCountries = [];
    var cleanExperiences = [];
    var cleanCountryPicker = {
        type: 'modal',
        logo: true,
        containerId: 'flow-country-picker-container',
        countries: [],
        modalTitle: 'Select Country',
        isDestination: false
    };
    var finalCountryCheck = [];
    var countryToLocalesMap = {};
    var countriesFile;
    var countriesWriter;
    var countryPickerFile;
    var countryPickerWriter;
    var experiencesFile;
    var experiencesWriter;
    var logFile;
    var logWriter;

    if (!FlowHelper.isFlowEnabled && !FlowHelper.enableJobs) {
        return new Status(Status.OK, null, 'Flow is disabled');
    }

    if (!experiences || !experiences.length) {
        return new Status(Status.ERROR, null, 'Flow experiences could not be loaded');
    }

    JobHelper.createFolders();

    countriesFile = new File(JobHelper.getJobFilePath(JobHelper.paths.CONFIGURATION_FOLDER + '/countries.json'));
    countriesFile.createNewFile();
    countriesWriter = new FileWriter(countriesFile);

    countryPickerFile = new File(JobHelper.getJobFilePath(JobHelper.paths.CONFIGURATION_FOLDER + '/countryPickerOptions.json'));
    countryPickerFile.createNewFile();
    countryPickerWriter = new FileWriter(countryPickerFile);

    experiencesFile = new File(JobHelper.getJobFilePath(JobHelper.paths.CONFIGURATION_FOLDER + '/flowExperiences.json'));
    experiencesFile.createNewFile();
    experiencesWriter = new FileWriter(experiencesFile);

    logFile = new File(JobHelper.getJobFilePath(JobHelper.paths.CONFIGURATION_FOLDER + '/flowExperiences.log'));
    logFile.createNewFile();
    logWriter = new FileWriter(logFile);

    cleanCountries.push({
        id: defaultLocaleCode,
        currencyCode: defaultCurrencyCode
    });

    cleanCountryPicker.countries.push({
        iso_3166_3: defaultLocale.ISO3Country,
        iso_3166_2: defaultLocale.country,
        currency: defaultCurrencyCode,
        name: defaultLocale.displayCountry,
        language: defaultLocale.language,
        logoUrl: 'https://flowcdn.io/util/icons/flags-v2/svg/' + defaultLocale.country + '.svg'
    });

    allowedLocales.forEach(function (localeCode) {
        var locale = localeCode !== 'default' ? Locale.getLocale(localeCode) : defaultLocale;

        if (locale && locale.getISO3Country()) {
            if (!countryToLocalesMap[locale.getISO3Country()]) {
                countryToLocalesMap[locale.getISO3Country()] = [locale.ID];
            } else if (countryToLocalesMap[locale.getISO3Country()].indexOf(locale.ID) < 0) {
                countryToLocalesMap[locale.getISO3Country()].push(locale.ID);
            }
        } else if (localeCode !== 'default') {
            logWriter.writeLine('The locale ' + localeCode + ' has no country, skipping.');
        }
    });

    experiences.forEach(function (experience) {
        var cleanExperience = {};
        var defaultExperienceLocale;
        var region;
        var experiencePricing;

        if (FlowHelper.defaultLocaleExperiences.indexOf(experience.key) > -1) {
            defaultExperienceLocale = Locale.getLocale(defaultLocaleCode);
        } else {
            defaultExperienceLocale = Locale.getLocale(experience.language + '_' + ExperienceHelper.convertCountryCode(experience.country));
        }

        if (experience.status !== 'active') {
            logWriter.writeLine('The experience ' + experience.key + ' is not active. Not creating experience.');
            return;
        }

        if (!experience.settings.logistics_settings || !experience.settings.logistics_settings.shipping_configuration) {
            logWriter.writeLine('The experience ' + experience.key + ' has no shipping configuration. Not creating experience.');
            return;
        }

        if (allowedCurrencies.indexOf(experience.currency) < 0) {
            logWriter.writeLine('The currency ' + experience.currency + ' for experience ' + experience.key + ' is not active for the site. Not creating experience.');
            return;
        }

        if (!defaultExperienceLocale || (allowedLocales.indexOf(defaultExperienceLocale.ID) < 0 && defaultExperienceLocale.ID !== defaultLocaleCode)) {
            logWriter.writeLine('The default locale ' + defaultExperienceLocale + ' for experience ' + experience.key + ' does not exist. Not creating experience.');
            return;
        }

        region = flowApi.configuration.getRegion(experience.region.id);
        if (!region || !region.countries) {
            logWriter.writeLine('The region ' + experience.region.id + ', for experience ' + experience.key + ' not found. Not creating experience.');
            return;
        }

        experiencePricing = flowApi.experience.getPricing(experience.key);

        cleanExperience.id = experience.key;
        cleanExperience.currencyCode = experience.currency;
        cleanExperience.shippingConfigurationKey = experience.settings.logistics_settings.shipping_configuration.key;
        cleanExperience.defaultLanguage = experience.language;
        cleanExperience.defaultCountry = experience.country;
        cleanExperience.defaultSfccLocale = defaultExperienceLocale.ID;
        cleanExperience.countries = region.countries.slice(0);
        cleanExperience.sfccLocales = [];
        cleanExperience.sfccLocalesCountryMap = {};

        if (experiencePricing && experiencePricing.vat !== 'ignored') {
            cleanExperience.taxIncluded = 'Includes ' + ExperienceHelper.getCountryTax(experience.country);
        }

        cleanExperience.countries.forEach(function (country) {
            if (countryToLocalesMap[country]) {
                (countryToLocalesMap[country]).forEach(function (locale) {
                    if (defaultLocaleCode !== locale) {
                        if (!cleanCountries.some(function (c) { return c.id === locale; })) {
                            cleanCountries.push({
                                id: locale,
                                currencyCode: experience.currency
                            });
                        }
                    }

                    cleanExperience.sfccLocales.push(locale);
                });
                cleanExperience.sfccLocalesCountryMap[country] = countryToLocalesMap[country];
            }
        });

        logWriter.writeLine('Experience ' + experience.key + ' created.');
        cleanExperiences.push(cleanExperience);

        if (defaultLocale.getISO3Country() !== experience.country) {
            if (!cleanCountryPicker.countries.some(function (c) { return c.iso_3166_3 === experience.country; })) {
                cleanCountryPicker.countries.push({
                    iso_3166_3: experience.country,
                    iso_3166_2: ExperienceHelper.convertCountryCode(experience.country),
                    currency: experience.currency,
                    name: experience.name,
                    language: experience.language,
                    logoUrl: 'https://flowcdn.io/util/icons/flags-v2/svg/' + ExperienceHelper.convertCountryCode(experience.country) + '.svg'
                });
            }
        }
    });

    cleanCountries.forEach(function (country) {
        finalCountryCheck.push(country.id);
    });

    allowedLocales.forEach(function (localeCode) {
        if (finalCountryCheck.indexOf(localeCode) < 0) {
            if (excludedLocales[localeCode] && defaultLocaleCode !== localeCode) {
                cleanCountries.push({
                    id: localeCode,
                    currencyCode: excludedLocales[localeCode]
                });
            } else if (localeCode !== 'default') {
                logWriter.writeLine('Site Locale ' + localeCode + ' did not match any experience.');
            }
        }
    });

    countriesWriter.write(JSON.stringify(cleanCountries, null, 2));
    experiencesWriter.write(JSON.stringify(cleanExperiences, null, 2));
    countryPickerWriter.write(JSON.stringify(cleanCountryPicker, null, 2));

    countriesWriter.close();
    experiencesWriter.close();
    countryPickerWriter.close();
    logWriter.close();

    return new Status(Status.OK, null, 'flowExperiences.json file successfully generated.');
}

exports.generateConfigurationJsonFiles = generateConfigurationJsonFiles;
