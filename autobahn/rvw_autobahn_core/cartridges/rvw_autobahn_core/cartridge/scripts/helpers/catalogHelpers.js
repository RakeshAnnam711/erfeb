'use strict';

/**
 * Find matching online sub category
 * @param {Category} category - the category to search onlineSubCategories of
 * @param {string} matchingCategoryID - the ID of the category you are searching for
 * @returns {Category} the matching online sub category or null
 */
function findMatchingOnlineSubCategory(category, matchingCategoryID) {
    for (var subCat of category.onlineSubCategories.toArray()) {
        if (subCat.ID === matchingCategoryID) {
           return subCat;
        } else {
           var matching = findMatchingOnlineSubCategory(subCat, matchingCategoryID);
           if (matching) {
               return matching;
           }
        }
    }

    return null;
}

exports.findMatchingOnlineSubCategory = findMatchingOnlineSubCategory;
