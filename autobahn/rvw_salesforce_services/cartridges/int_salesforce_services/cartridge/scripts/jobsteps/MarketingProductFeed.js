/* Script file that is executed by the Export Product Feed for Salesforce Marketing Cloud */

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var JobLogger = Logger.getLogger('Marketing', 'Export.Product');
var Status = require('dw/system/Status');
var FeedHelper = require('~/cartridge/scripts/helpers/FeedHelper');

// Job Level Variables
var JobChunks = 0;
var MasterProductCount = 0;
var VariantProductCount = 0;
var AllSiteProductsIterator;
// WGACA MODIFICATION - utilize independant large collection iterators to bypass quota limit
// var AllSiteProducts;
var AllSiteProductVariantsIterator;
var JobParameters;
var FeedFileWriter;
var AnErrorOccurred = false;

/* ***** Public Functions that are linked to in the steptypes.json Job Definition ***** */
/**
 * Executed Before Processing of Chunk and Validates all required input parameters
 */
 exports.BeforeStep = function () {
	try {
		var args = arguments[0];
		JobParameters = getJobParameters(args);
		logJobParameters(args);

		var file = require('dw/io/File');
		var fileWriter = require('dw/io/FileWriter');

		var fileName = createFileName(JobParameters.FileNamePrefix);
		var folderFile = new file(file.getRootDirectory(file.IMPEX), JobParameters.TargetRelativePath);
		if (!folderFile.exists() && !folderFile.mkdirs()) {
			var errorMessage = 'Cannot create IMPEX folders: ' + file.getRootDirectory(file.IMPEX).fullPath + JobParameters.TargetRelativePath;
			JobLogger.error(errorMessage);
			throw new Error(errorMessage);
		}
		var feedFile = new file(folderFile.fullPath + file.SEPARATOR + fileName);
		FeedFileWriter = new fileWriter(feedFile);

		var headerRow = FeedHelper.GetHeaderRow(JobParameters.Delimiter, JobParameters.CustomProductAttributeIds, JobParameters.OtherPriceBookInfos);
		FeedFileWriter.writeLine(headerRow);

		// WGACA MODIFICATION - direct iterator reference instead of pre-processing
		// AllSiteProducts = FeedHelper.GetAllSiteProducts(JobParameters.IncludeMasterProducts);
		// AllSiteProductsIterator = AllSiteProducts.iterator();
		var ProductMgr = require('dw/catalog/ProductMgr');
		AllSiteProductsIterator = ProductMgr.queryAllSiteProducts();
		AllSiteProductVariantsIterator = ProductMgr.queryAllSiteProducts();
		// END MODIFICATION

	} catch (ex) {
		AnErrorOccurred = true;
		JobLogger.error('An unexpected exception occurred attempting to get job parameters a/o creating folders/file or getting site products. Error: {0}', ex.toString());
	}
 }

/**
 * Executes before the processing of every chunk.
 */
 exports.BeforeChunk = function() {
	JobLogger.info('About to process chunk {0}...', JobChunks + 1);
};

 /**
 * Called by the framework exactly once before chunk processing begins.
 * Allows for better monitoring; e.g. to show that 50 of 100 items have already been processed.
 * @returns {Number} The number of products processed so far
 */
  exports.GetTotalCount = function() {
	// WGACA MODIFICATION - Collection quota limit
	// var count = AllSiteProducts.getLength();
	var count = AllSiteProductsIterator.getCount();
	JobLogger.info('About to process {0} site products.', count);
	return count;
};

/**
 * Returns the next product to be processed
 * Skips over master products unless the job parameter specifies to include them.
 * @returns {dw.catalog.Product} product - Product
 */
 exports.Read = function() {
	// WGACA MODIFICATION - iterate over all products seperatly
	// while (AllSiteProductsIterator.hasNext()) {
	// 	var product = AllSiteProductsIterator.next();
	// 	if (product.isVariant()) {
	// 		VariantProductCount += 1;
	// 	} else {
	// 		MasterProductCount += 1;
	// 	}
	// 	if (product) {
	// 		return product;
	// 	}
	// }

	while (AllSiteProductsIterator.hasNext()) {
		var product = AllSiteProductsIterator.next();
		if (!product.isVariant()) {
			MasterProductCount += 1;

			if (product) {
				return product;
			}
		}
	}

	while (AllSiteProductVariantsIterator.hasNext()) {
		var product = AllSiteProductVariantsIterator.next();
		if (product.isVariant()) {
			VariantProductCount += 1;

			if (product) {
				return product;
			}
		}
	}
	// END MODIFICATION
};

/**
 * Processes the given product into a JSON object of the standard and custom (if specified) attributes
 * that will be included in the product feed.
 * @param {dw.catalog.Product} product - A SFCC Product system object
 * @returns {Object} productInfo : A JSON object containing Product data
 */
 exports.Process = function(product) {
	var productInfo = {};
	try {
		productInfo = FeedHelper.GetEmptyProductInfo(JobParameters.CustomProductAttributeIds);
		FeedHelper.PopulateProductInfoForFeed(product, productInfo, JobParameters);
	} catch (ex) {
		AnErrorOccurred = true;
		JobLogger.error('Unable to process product {0} due to unexpected error: {1}', product.ID, ex.toString());
	}

	return productInfo;
};

/**
 * Receives a list of products, the length (count) of which is the chunk size or smaller,
 * if the number of products in the last available chunk is less.
 * @param {dw.util.List} productInfos Product data to write to the feed file
 */
exports.Write = function(productInfos) {
	JobLogger.info("Write Step executing for product info. Count for this write step is: {0}", productInfos.length);

	for (var index = 0; index < productInfos.length; index++) {
		if (JobParameters.LogAllProductsWritten) {
			JobLogger.info("Product Id: {0}, Name: {1}", productInfos[index].ProductId, productInfos[index].ProductName);
		}
		var valuesRow = FeedHelper.GetValuesRow(JobParameters.Delimiter, JobParameters.CustomProductAttributeIds, JobParameters.OtherPriceBookInfos, productInfos[index]);
		FeedFileWriter.writeLine(valuesRow);
	}
};

/**
 * Executed after a chunk finishes.
 */
exports.AfterChunk = function() {
	JobChunks++;
	JobLogger.info('Chunk {0} has been processed successfully.', JobChunks);
};

/**
 * Executes after processing all the chunks, cleans up objects such as the product
 * iterator and file writer and returns the job status.
 * @returns {Object} A Status object with a value of OK or ERROR
 */
exports.AfterStep = function() {
	// WGACA MODIFICATION - close seekable iterators
	AllSiteProductsIterator.close();
	AllSiteProductVariantsIterator.close();
	// END MODIFICATION
	FeedFileWriter.flush();
	FeedFileWriter.close();
	JobLogger.info('The Marketing Cloud Export Product Feed iterated through {0} master and {1} variant products.', MasterProductCount, VariantProductCount);
	if (AnErrorOccurred === false) {
		JobLogger.info('The Marketing Cloud Export Product Feed completed successfully.');
		return new Status(Status.OK, 'OK', 'Marketing Cloud Export Product Feed Successful.');
	} else {
		JobLogger.error('The Marketing Cloud Export Product Feed completed with errors.');
		return new Status(Status.ERROR, 'ERROR', 'Marketing Cloud Export Product Feed completed with errors.');
	}
};

/* ***** Private Functions that directly support the job ***** */
function getJobParameters(args) {
	var otherPriceBookInfos = [];
	if (!empty(args.OtherPriceBookIds)) {
		var otherPriceBooks = args.OtherPriceBookIds.split(',');
		for (var index = 0; index < otherPriceBooks.length; index++) {
			var otherPriceBookValues = otherPriceBooks[index].split('~');
			if (otherPriceBookValues.length === 2) {
				otherPriceBookInfos.push({
					'PriceBookId': otherPriceBookValues[0], 'ColumnHeaderValue': otherPriceBookValues[1]
				});
			}
		}
	}

	var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
	let backInStockEnabled = abConfigs.viewBackInStockNotificationForm || abConfigs.DataExtensionExternalKeyForBackInStock || false;
	var customProductAttributeIds = args.CustomProductAttributeIds || '';
	var disConfigurationJSON = {};
	var disConfigurationJSONString = Site.getCurrent().getCustomPreferenceValue("disConfiguration");
	if (!empty(disConfigurationJSONString)) {
		try {
			disConfigurationJSON = JSON.parse(disConfigurationJSONString);
		} catch (ex) {
			JobLogger.info('JSON configuration for DIS could not be parsed: ' + ex.toString());
		}
	}

	var hostValueMapping = {};
	if (!empty(args.ProductAttributeHostValueMapping)) {
		hostValueMapping = JSON.parse(args.ProductAttributeHostValueMapping);
	}
	return {
		TargetRelativePath: args.TargetRelativePath,
		FileNamePrefix: args.FileNamePrefix,
		IncludeMasterProducts: args.IncludeMasterProducts,
		Delimiter: getDelimiterCharacter(args.Delimiter),
		CustomProductAttributeIds: customProductAttributeIds,
		LogAllProductsWritten: args.LogAllProductsWritten,
		RegularPriceBookId: args.RegularPriceBookId,
		OtherPriceBookInfos: otherPriceBookInfos,
		BackInStockEnabled: backInStockEnabled,
		HostValueMapping: hostValueMapping,
		DISConfigurationJSON: disConfigurationJSON
	}
}

function getDelimiterCharacter(delimiter) {
	switch (delimiter) {
		case 'Pipe':
		   return '|';
		case 'Tab':
			return '\t';
		default:
			return ',';
	}
}

function logJobParameters(args) {
	var otherPriceBooks = 'none';
	if (args.OtherPriceBookIds !== null) {
		otherPriceBooks = args.OtherPriceBookIds;
	}
	var message = "Given job parameters are: ";
	message += "Relative Folder Path: '" + JobParameters.TargetRelativePath + "', ";
	message += "File Name Prefix: '" + JobParameters.FileNamePrefix + "', ";
	message += "Delimiter: '" + JobParameters.Delimiter + "', ";
	message += "Include Master Products: '" + JobParameters.IncludeMasterProducts + "', ";
	message += "Regular PriceBook Id: '" + JobParameters.RegularPriceBookId + "', ";
	message += "Log all Products Written: '" + JobParameters.LogAllProductsWritten + "', ";
	message += "Custom Product AttributeIds: '" + JobParameters.CustomProductAttributeIds + "', ";
	message += "Back in Stock Enabled (Site Pref.): '" + JobParameters.BackInStockEnabled + "', ";
	message += "Other PriceBooks: '" + otherPriceBooks + "', ";
	message += "ProductAttributeHostValueMapping: '" + args.ProductAttributeHostValueMapping + "'.";

	JobLogger.info(message);
}

/**
 * Creates the file name using the given prefix and adding the siteId and a timestamp.
 * @param {string} fileNamePrefix : e.g . export-product
 * @returns {string} The fileName that will look something line "ProductCatalog_siteId_20220506.csv
 */
 function createFileName(fileNamePrefix) {
	var site = require('dw/system/Site');
	var siteId = site.current.ID;
	// NOTE: Marketing Cloud cannot handle the time for processing this file. The stamp should only include year, month & day
	var timestamp = '_' + getDateStringAsYearMonthDay();
	return fileNamePrefix + siteId + timestamp + '.csv';
}

/* 	Takes the given date object and transforms it to a string in the format
 * 	of Year Month Day, using the delimiter to separate them. Time is ignored.
 *  If no date is passed in, then the current date and time will be used.
 *	If no delimiter is passed in, then the return string will be numbers only.
 *  For example, if the the date object passed in is May 4, 2022 20:46:34
 *	and the delimiter is '-' then the return string will be 2022-05-04'
 *  if no delimiter is passed in then '20220504' will be returned.
 */
 function getDateStringAsYearMonthDay(dateObject, delimiter) {
	var localDate = dateObject || new Date();
	var localDelimiter = delimiter || '';

	var calendar = require('dw/util/Calendar');
	var calendarDate = new calendar(localDate);
	var stringUtils = require('dw/util/StringUtils');
	var dateFormat = 'yyyy' + localDelimiter + 'MM' + localDelimiter + 'dd';

	return stringUtils.formatCalendar(calendarDate, dateFormat);
}
