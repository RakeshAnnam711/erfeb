'use strict';

var base = module.superModule;

var collections = require('*/cartridge/scripts/util/collections');

/**
 * Updates the search model with the preference refinement values
 *
 * @param {dw.catalog.SearchModel} search - SearchModel instance
 * @param {Object} preferences - Query params map
 */
function addRefinementValues(search, preferences) {
    // Access current search refinements
    search.search();

    var availableRefinements = search.refinements.refinementDefinitions;

    Object.keys(preferences).forEach(function (key) {
        // Do not apply refinement to category without refinement definition
        var refinementDefinition = availableRefinements && collections.find(availableRefinements, function (rdef) { return rdef.attributeID === key; });

        if (empty(availableRefinements) || availableRefinements.length === 0 || !empty(refinementDefinition)) {
            search.addRefinementValues(key, preferences[key]);
        }
    });
}

base.addRefinementValues = addRefinementValues;

module.exports = base;