var Site = require('dw/system/Site');
var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');


/**
* Updates product-level attributes based on the custom preference JSON.
*/
function updateProductRestrictions() {
   // Fetch JSON string from custom preference
   var jsonString = Site.getCurrent().getCustomPreferenceValue('globalERestrictedProducts');


   // Validate if preference is set
   if (!jsonString) {
       require('dw/system/Logger').error("Custom preference 'globalERestrictedProducts' is empty or not set.");
       return;
   }


   var productRestrictions;


   try {
       // Parse JSON string to object
       productRestrictions = JSON.parse(jsonString);
   } catch (e) {
       require('dw/system/Logger').error("Error parsing JSON from 'globalERestrictedProducts': " + e.message);
       return;
   }


   // Iterate over each product ID in the JSON
   for (var productId in productRestrictions) {
       if (productRestrictions.hasOwnProperty(productId)) {
           var product = ProductMgr.getProduct(productId);


           // Check if product exists in SFCC
           if (!product) {
               require('dw/system/Logger').warn("Product not found: " + productId);
               continue;
           }


           // Extract restriction details
           var restrictedCountries = productRestrictions[productId].geRestrictedCountries.join(','); // Convert array to comma-separated string
           var isForbidden = productRestrictions[productId].geIsForbidden;


           // Update product attributes inside a transaction
           Transaction.wrap(function () {
               product.custom.geRestrictedCountries = restrictedCountries; // Store as string
               product.custom.geIsForbidden = isForbidden; // Store as boolean
           });


           // Log update
           require('dw/system/Logger').info("Updated product " + productId + " with restrictions.");
       }
   }
}


module.exports = {
   updateProductRestrictions: updateProductRestrictions
};





