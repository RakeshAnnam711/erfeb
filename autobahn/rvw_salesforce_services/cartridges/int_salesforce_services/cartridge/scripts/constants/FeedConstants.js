'use strict';

/*  This file is for constants related to the feeds that will provide data to Salesforce,
	such as a product feed to Marketing Cloud.
*/

/* Constant for all supported types of export data */
exports.ExportTypes = {
	"Catalog": "Catalog"
};

/* Constant delimiters that can be used to separate multiple values for the same attribute;
e.g. several values in a multi-select enum */
exports.MultipleValueDelimiters = {
	"Tilda": "~"
};

exports.ImageTypes = {
	"Large": 'large',
	"Medium": 'medium',
	"Small": 'small'
};

/*  A constant for specifying what the 'Standard' product attributes are that should be sent to Marketing Cloud.
	Some of the attributes may line up exactly with product attributes, such as 'OnlineFrom' or 'PageTitle',
	while others are summations of data, such as 'Variations'.
	The value for each attribute listed below is what is written to the header row */
exports.ProductInfoKeys = {
	"ProductId": "ProductId",
	"ProductName": "ProductName",
	"MasterProductId": "MasterProductId",
	"RegularPrice": "RegularPrice",
	"SalesPrice": "SalesPrice",
	"Online": "Online",
	"BackInStockEnabled": "BackInStockEnabled",
	"PrimaryCategory": "PrimaryCategory",
	"ClassificationCategory": "ClassificationCategory",
	"Brand": "Brand",
	"PageTitle": "PageTitle",
	"PageDescription": "PageDescription",
	"InventoryQuantity": "InventoryQuantity",
	"InventoryInStockDate": "InventoryInStockDate",
	"AvailabilityStatus": "AvailabilityStatus",
	"IsOrderable": "IsOrderable",
	"OnlineFrom": "OnlineFrom",
	"OnlineTo": "OnlineTo",
	"IsBundle": "IsBundle",
	"ProductDescription": "ProductDescription",
	"ProductDetailPageUrl": "ProductDetailPageUrl",
	"ProductImageLarge": "ProductImageLarge",
	"ProductImageMedium": "ProductImageMedium",
	"ProductImageSmall": "ProductImageSmall",
	"Variations": "Variations"
};
