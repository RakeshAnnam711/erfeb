'use strict';

var base = module.superModule;

/**
 * @constructor
 * @classdesc SearchPhraseSuggestions class
 *
 * @param {dw.suggest.SuggestModel} suggestions - Suggest Model
 * @param {number} maxItems - Maximum number of categories to retrieve
 */
function SearchPhraseSuggestions(suggestions, maxItems) {
    this.phrases = [];

    base.apply(this, arguments);
}

module.exports = SearchPhraseSuggestions;
