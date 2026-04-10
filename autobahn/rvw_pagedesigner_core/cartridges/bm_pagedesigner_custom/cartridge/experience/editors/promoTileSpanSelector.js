'use strict';

module.exports.init = editor => {
    var config = {};

    config.rows = 4; // countPicker;
    config.options = [
        {
            displayValue: '1 column (default)',
            value: 1
        },
        {
            displayValue: '2 column',
            value: 2
        },
        {
            displayValue: '3 column',
            value: 3
        },
        {
            displayValue: '4 columns (if site/brand config allows)',
            value: 4
        }
    ];

    // Pass options to plpProductsPerRowSelectorScript.js
    editor.configuration.put('init', config);
}
