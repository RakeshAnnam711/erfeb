'use strict';

/**
 * Writes Restricted Items by Products SKUs
 * @param {dw.io.FileWriter} fileWriter - File writer
 * @param {dw.io.CSVStreamWriter} streamWriter - StreamWriter
 * @param {Object} data - Input data
 * @returns {dw.io.CSVStreamWriter} streamWriter - StreamWriter
 */
function productsScenario(fileWriter, streamWriter, data) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var logger = globaleHelpers.getLogger();
    var separator = ',';
    var diffCountriesExclusions;
    var currentCountriesExclusions;
    var prevCountriesExclusions;

    try {
        // get exclusions handler
        var key = 'products';
        var productsCO = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coRestrictedItems, key);
        if (!productsCO) {
            Transaction.wrap(function () {
                productsCO = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coRestrictedItems, key);
            });
        }
        if (!productsCO.custom.sourceHandler) {
            logger.error('No Products Source Handler found');
            return streamWriter;
        }
        var sourceHandlerFunc = new Function('product', productsCO.custom.sourceHandler); // eslint-disable-line no-new-func

        // define products iterator
        var catalog = CatalogMgr.getCatalog(data.file.catalogId);
        var productsIterator = catalog ? ProductMgr.queryProductsInCatalog(catalog) : ProductMgr.queryAllSiteProducts();
        if (!productsIterator || productsIterator.count === 0) {
            logger.error('No Products found');
            return streamWriter;
        }

        // shift products iterator
        if (data.deltaMode && data.deltaMode.productsCountPerOneRun > 0) { // set count of processed products
            productsIterator.forward(Number(data.deltaMode.productsStartPosition) || 0, Number(data.deltaMode.productsCountPerOneRun));
        } else if (data.deltaMode && data.deltaMode.productsStartPosition > 0) {
            productsIterator.forward(Number(data.deltaMode.productsStartPosition)); // set start position of processed products
        }

        // write products lines
        var lastExportRunDate = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geRestrictedItemsFeedLastRun);
        var product;
        while (productsIterator.hasNext()) {
            try {
                product = productsIterator.next();

                // process variation products if variationGroup product is categorized
                // skip exported already (not changed after last export) products if "data.deltaMode.processOnlyModifiedProducts" is set to true
                if (product.variationGroup && (product.variationModel.master.categories.length === 0)) {
                    var variantsIterator = product.variants.iterator();
                    var variant;
                    while (variantsIterator.hasNext()) {
                        try {
                            variant = variantsIterator.next();
                            if (data.deltaMode && data.deltaMode.processOnlyModifiedProducts && lastExportRunDate && (variant.getLastModified().getTime() < lastExportRunDate.getTime())) {
                                continue; // eslint-disable-line no-continue
                            }

                            // previous exclusions
                            prevCountriesExclusions = variant.custom[globaleHelpers.customAttr.product.geCountriesExclusions] && variant.custom[globaleHelpers.customAttr.product.geCountriesExclusions].length > 0
                                ? variant.custom[globaleHelpers.customAttr.product.geCountriesExclusions].split(separator)
                                : [];

                            // current exclusions
                            currentCountriesExclusions = sourceHandlerFunc(variant);
                            currentCountriesExclusions = currentCountriesExclusions && currentCountriesExclusions.length > 0
                                ? currentCountriesExclusions.split(separator)
                                : [];

                            // iterate previous exclusions
                            // get exclusions diff
                            diffCountriesExclusions = currentCountriesExclusions.length === 0
                                ? prevCountriesExclusions
                                : arrayUtils.getDiff(prevCountriesExclusions, currentCountriesExclusions);
                            diffCountriesExclusions.forEach(function (countryCode) { // eslint-disable-line no-loop-func
                                streamWriter.writeNext(variant.ID, '', '', 0, countryCode);
                            });

                            if (diffCountriesExclusions && diffCountriesExclusions.length > 0) {
                                this.processedProducts++;
                            }

                            if (this.processedProducts % 100 === 0) {
                                fileWriter.flush();
                            }

                            // iterate current exclusions
                            // get exclusions diff
                            diffCountriesExclusions = prevCountriesExclusions.length === 0
                                ? currentCountriesExclusions
                                : arrayUtils.getDiff(currentCountriesExclusions, prevCountriesExclusions);
                            diffCountriesExclusions.forEach(function (countryCode) { // eslint-disable-line no-loop-func
                                streamWriter.writeNext(variant.ID, '', '', 1, countryCode);
                            });

                            if (diffCountriesExclusions && diffCountriesExclusions.length > 0) {
                                this.processedProducts++;
                            }

                            if (this.processedProducts % 100 === 0) {
                                fileWriter.flush();
                            }

                            // store exclusions
                            Transaction.begin();
                            variant.custom[globaleHelpers.customAttr.product.geCountriesExclusions] = currentCountriesExclusions.join(separator);
                            Transaction.commit();
                        } catch (e) {
                            logger.error('Cannot export product exclusion countries list. Product ID: {0}. Error: {1}', (variant && variant.ID), logger.message(e));
                        }
                    }
                }

                // process variation products if master product is categorized
                // skip exported already (not changed after last export) products if "data.deltaMode.processOnlyModifiedProducts" is set to true
                if (data.deltaMode && data.deltaMode.processOnlyModifiedProducts && lastExportRunDate && (product.getLastModified().getTime() < lastExportRunDate.getTime())) {
                    continue; // eslint-disable-line no-continue
                }

                // previous exclusions
                prevCountriesExclusions = product.custom[globaleHelpers.customAttr.product.geCountriesExclusions] && product.custom[globaleHelpers.customAttr.product.geCountriesExclusions].length > 0
                    ? product.custom[globaleHelpers.customAttr.product.geCountriesExclusions].split(separator)
                    : [];

                // current exclusions
                currentCountriesExclusions = sourceHandlerFunc(product);
                currentCountriesExclusions = currentCountriesExclusions && currentCountriesExclusions.length > 0
                    ? currentCountriesExclusions.split(separator)
                    : [];

                // iterate previous exclusions
                // get exclusions diff
                diffCountriesExclusions = currentCountriesExclusions.length === 0
                    ? prevCountriesExclusions
                    : arrayUtils.getDiff(prevCountriesExclusions, currentCountriesExclusions);
                diffCountriesExclusions.forEach(function (countryCode) { // eslint-disable-line no-loop-func
                    streamWriter.writeNext(product.ID, '', '', 0, countryCode);
                });

                if (diffCountriesExclusions && diffCountriesExclusions.length > 0) {
                    this.processedProducts++;
                }

                if (this.processedProducts % 100 === 0) {
                    fileWriter.flush();
                }

                // iterate current exclusions
                // get exclusions diff
                diffCountriesExclusions = prevCountriesExclusions.length === 0
                    ? currentCountriesExclusions
                    : arrayUtils.getDiff(currentCountriesExclusions, prevCountriesExclusions);
                diffCountriesExclusions.forEach(function (countryCode) { // eslint-disable-line no-loop-func
                    streamWriter.writeNext(product.ID, '', '', 1, countryCode);
                });

                if (diffCountriesExclusions && diffCountriesExclusions.length > 0) {
                    this.processedProducts++;
                }

                if (this.processedProducts % 100 === 0) {
                    fileWriter.flush();
                }

                // store exclusions
                Transaction.begin();
                product.custom[globaleHelpers.customAttr.product.geCountriesExclusions] = currentCountriesExclusions.join(separator);
                Transaction.commit();
            } catch (e) {
                logger.error('Cannot export product exclusion countries list. Product ID: {0}. Error: {1}', (product && product.ID), logger.message(e));
            }
        }
        productsIterator.close();
        fileWriter.flush();
    } catch (e) {
        logger.error('Cannot export products exclusion countries lists Error: {0}', logger.message(e));
    }

    return streamWriter;
}

/**
 * Writes Restricted Items by Brands IDs
 * @param {dw.io.FileWriter} fileWriter - File writer
 * @param {dw.io.CSVStreamWriter} streamWriter - StreamWriter
 * @param {Object} data - Input data
 * @returns {dw.io.CSVStreamWriter} streamWriter - StreamWriter
 */
function brandsScenario(fileWriter, streamWriter, data) {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var logger = globaleHelpers.getLogger();
    var separator = ',';
    var brandID;
    var diffCountriesExclusions;

    try {
        // get previous exclusions
        var key = 'brands';
        var brandsCO = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coRestrictedItems, key);
        if (!brandsCO) {
            Transaction.wrap(function () {
                brandsCO = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coRestrictedItems, key);
            });
        }
        var prevCountriesExclusions = brandsCO.custom.countriesExclusions
            ? JSON.parse(brandsCO.custom.countriesExclusions)
            : null;

        // get current exclusions
        var currentCountriesExclusions = data.countriesExclusions && data.countriesExclusions.brands
            ? data.countriesExclusions.brands
            : null;
        if (!currentCountriesExclusions || Object.keys(currentCountriesExclusions).length === 0) {
            logger.error('No Brands found for processing');
            return streamWriter;
        }

        // iterate previous exclusions
        if (prevCountriesExclusions) {
            for (brandID in prevCountriesExclusions) { // eslint-disable-line guard-for-in, no-restricted-syntax
                try {
                    // get exclusions diff
                    diffCountriesExclusions = !currentCountriesExclusions || !currentCountriesExclusions[brandID] || currentCountriesExclusions[brandID].length === 0
                        ? prevCountriesExclusions[brandID].split(separator)
                        : arrayUtils.getDiff(prevCountriesExclusions[brandID].split(separator), currentCountriesExclusions[brandID].split(separator));

                    // iterate exclusions
                    diffCountriesExclusions.forEach(function (countryCode) { // eslint-disable-line no-loop-func
                        streamWriter.writeNext('', brandID, '', 0, countryCode);
                    });

                    if (diffCountriesExclusions && diffCountriesExclusions.length > 0) {
                        this.processedBrands++;
                    }

                    if (this.processedBrands % 100 === 0) {
                        fileWriter.flush();
                    }
                } catch (e) {
                    logger.error('Cannot export brand exclusion countries list. Brand ID: {0}. Error: {1}', brandID, logger.message(e));
                }
            }
        }

        // iterate current exclusions
        if (currentCountriesExclusions) {
            for (brandID in currentCountriesExclusions) { // eslint-disable-line guard-for-in, no-restricted-syntax
                try {
                    // get exclusions diff
                    diffCountriesExclusions = !prevCountriesExclusions || !prevCountriesExclusions[brandID] || prevCountriesExclusions[brandID].length === 0
                        ? currentCountriesExclusions[brandID].split(separator)
                        : arrayUtils.getDiff(currentCountriesExclusions[brandID].split(separator), prevCountriesExclusions[brandID].split(separator));

                    // iterate exclusions
                    diffCountriesExclusions.forEach(function (countryCode) { // eslint-disable-line no-loop-func
                        streamWriter.writeNext('', brandID, '', 1, countryCode);
                    });

                    if (diffCountriesExclusions && diffCountriesExclusions.length > 0) {
                        this.processedBrands++;
                    }

                    if (this.processedBrands % 100 === 0) {
                        fileWriter.flush();
                    }
                } catch (e) {
                    logger.error('Cannot export brand exclusion countries list. Brand ID: {0}. Error: {1}', brandID, logger.message(e));
                }
            }
        }

        // store exclusions
        if (this.processedBrands > 0) {
            Transaction.wrap(function () {
                brandsCO.custom.countriesExclusions = JSON.stringify(data.countriesExclusions.brands);
            });
        }
    } catch (e) {
        logger.error('Cannot export brands exclusion countries lists. Error: {0}', logger.message(e));
    }

    return streamWriter;
}

/**
 * Writes Restricted Items by Categories IDs
 * @param {dw.io.FileWriter} fileWriter - File writer
 * @param {dw.io.CSVStreamWriter} streamWriter - StreamWriter
 * @param {Object} data - Input data
 * @returns {dw.io.CSVStreamWriter} streamWriter - StreamWriter
 */
function categoriesScenario(fileWriter, streamWriter, data) {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var arrayUtils = require('*/cartridge/scripts/util/globale/array');
    var logger = globaleHelpers.getLogger();
    var separator = ',';
    var categoryID;
    var diffCountriesExclusions;

    try {
        // get previous exclusions
        var key = 'categories';
        var categoriesCO = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coRestrictedItems, key);
        if (!categoriesCO) {
            Transaction.wrap(function () {
                categoriesCO = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coRestrictedItems, key);
            });
        }
        var prevCountriesExclusions = categoriesCO.custom.countriesExclusions
            ? JSON.parse(categoriesCO.custom.countriesExclusions)
            : null;

        // get current exclusions
        var currentCountriesExclusions = data.countriesExclusions && data.countriesExclusions.categories
            ? data.countriesExclusions.categories
            : null;
        if (!currentCountriesExclusions || Object.keys(currentCountriesExclusions).length === 0) {
            logger.error('No Categories found for processing');
            return streamWriter;
        }

        // iterate previous exclusions
        if (prevCountriesExclusions) {
            for (categoryID in prevCountriesExclusions) { // eslint-disable-line guard-for-in, no-restricted-syntax
                try {
                    // get exclusions diff
                    diffCountriesExclusions = !currentCountriesExclusions || !currentCountriesExclusions[categoryID] || !currentCountriesExclusions[categoryID].length === 0
                        ? prevCountriesExclusions[categoryID].split(separator)
                        : arrayUtils.getDiff(prevCountriesExclusions[categoryID].split(separator), currentCountriesExclusions[categoryID].split(separator));

                    // iterate exclusions
                    diffCountriesExclusions.forEach(function (countryCode) { // eslint-disable-line no-loop-func
                        streamWriter.writeNext('', categoryID, '', 0, countryCode);
                    });

                    if (diffCountriesExclusions && diffCountriesExclusions.length > 0) {
                        this.processedCategories++;
                    }

                    if (this.processedCategories % 100 === 0) {
                        fileWriter.flush();
                    }
                } catch (e) {
                    logger.error('Cannot export category exclusion countries list. Category ID: {0}. Error: {1}', categoryID, logger.message(e));
                }
            }
        }

        // iterate current exclusions
        if (currentCountriesExclusions) {
            for (categoryID in currentCountriesExclusions) { // eslint-disable-line guard-for-in, no-restricted-syntax
                try {
                    // get exclusions diff
                    diffCountriesExclusions = !prevCountriesExclusions || !prevCountriesExclusions[categoryID] || !prevCountriesExclusions[categoryID].length === 0
                        ? currentCountriesExclusions[categoryID].split(separator)
                        : arrayUtils.getDiff(currentCountriesExclusions[categoryID].split(separator), prevCountriesExclusions[categoryID].split(separator));

                    // iterate exclusions
                    diffCountriesExclusions.forEach(function (countryCode) { // eslint-disable-line no-loop-func
                        streamWriter.writeNext('', categoryID, '', 1, countryCode);
                    });

                    if (diffCountriesExclusions && diffCountriesExclusions.length > 0) {
                        this.processedCategories++;
                    }

                    if (this.processedCategories % 100 === 0) {
                        fileWriter.flush();
                    }
                } catch (e) {
                    logger.error('Cannot export category exclusion countries list. Category ID: {0}. Error: {1}', categoryID, logger.message(e));
                }
            }
        }

        // store exclusions
        if (this.processedCategories > 0) {
            Transaction.wrap(function () {
                categoriesCO.custom.countriesExclusions = JSON.stringify(data.countriesExclusions.categories);
            });
        }
    } catch (e) {
        logger.error('Cannot export categories exclusion countries lists. Error: {0}', logger.message(e));
    }

    return streamWriter;
}

/**
 * Writes Restricted Items Feed File
 * @param {dw.io.FileWriter} fileWriter - File writer
 * @param {dw.io.CSVStreamWriter} streamWriter - StreamWriter
 * @param {Object} data - Input data
 * @returns {dw.system.Status} - operation status
 */
function writeRestrictedItemsFeedFile(fileWriter, streamWriter, data) {
    var Status = require('dw/system/Status');

    try {
        // check processed scenarios
        if (!data.scenarios.enabledProductsScenario && !data.scenarios.enabledBrandsScenario && !data.scenarios.enabledCategoriesScenario) {
            throw new Error('No enabled scenarios for processing');
        }

        // writes restricted items by Products SKUs
        if (data.scenarios.enabledProductsScenario) {
            streamWriter = productsScenario.call(this, fileWriter, streamWriter, data); // eslint-disable-line no-param-reassign
        }

        // writes restricted items by Brands IDs
        if (data.scenarios.enabledBrandsScenario) {
            streamWriter = brandsScenario.call(this, fileWriter, streamWriter, data); // eslint-disable-line no-param-reassign
        }

        // writes restricted items by Categories IDs~
        if (data.scenarios.enabledCategoriesScenario) {
            streamWriter = categoriesScenario.call(this, fileWriter, streamWriter, data); // eslint-disable-line no-param-reassign
        }
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        writeRestrictedItemsFeedFile: {
            enumerable: true,
            value: writeRestrictedItemsFeedFile
        }
    });
};
