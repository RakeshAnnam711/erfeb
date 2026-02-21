'use strict';

module.exports.init = editor => {
    var catalogMgr = require('dw/catalog/CatalogMgr');
    var sortOptions = catalogMgr.getSortingOptions();
    var collections = require('*/cartridge/scripts/util/collections');
    var config = {};

    config.options = [];
    config.placeholder = '-- category default --';

    collections.forEach(sortOptions, option => {
        config.options.push({
            'id': option.ID,
            'name': option.displayName
        });
    });

    // Pass sort option data to sortOptionsPickerScript.js
    editor.configuration.put('init', config);
}
