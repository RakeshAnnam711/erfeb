/* Helper functions for when working with product related data. */
'use strict';

exports.GetMasterProductId = getMasterProductId;

/* ***** Public Functions ***** */
/**
 * Returns the master product Id for the given product.
 * @param {dw.catalog.Product} product: An SFCC Product object
 * @returns {string} A productId or an empty string
 */
 function getMasterProductId(product) {
	if (product.isVariant()) {
		if (product.variationModel !== null) {
			var masterProduct = product.variationModel.getMaster();
			if (masterProduct !== null) {
				return masterProduct.ID;
			}
		}
	// WGACA MODIFICATION - fallback missing for all other product types
	// } else if (product.isMaster()) {
	} else if (!empty(product.ID)) {
		return product.ID;
	}

	return '';
}
