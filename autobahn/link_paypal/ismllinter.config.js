'use strict';

var config = {
    enableCache: true,
    rules: {
        'no-space-only-lines': {},
        'no-tabs': {},
        'no-trailing-spaces': {},
        'no-git-conflict': {},
        'no-inline-style': {},
        'enforce-require': {},
        'enforce-security': {},
        'no-embedded-isml': {},
        'max-lines': {
            max: 350
        },
        'no-deprecated-attrs': {},
        'contextual-attrs': {},
        'empty-eof': {},
        'no-div-without-class': {}
    },
    ignore: ['app_storefront_base', 'socialIcons.isml', 'scripts.isml', 'pageTemplatePreferences.isml']
};

module.exports = config;
