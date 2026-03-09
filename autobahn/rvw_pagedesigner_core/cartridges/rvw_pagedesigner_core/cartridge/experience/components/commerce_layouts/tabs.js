'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for layouts.tabs
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var component = context.component;
    var tabMax = 10;

    model.regions = PageRenderHelper.getRegionModelRegistry(context.component);
    model.componentID = component.ID;
    model.containerCustomClass = content.containerCustomClass || '';
    model.tabHeaderCustomClass = content.tabHeaderCustomClass || '';
    model.tabContentCustomClass = content.tabContentCustomClass || '';
    model.activeTab = content.activeTab || 1;
    model.scrollbarClass = content.hideScrollbar ? 'hide-scrollbar' : 'custom-scrollbar';
    model.preventAutoClose = content.preventAutoClose || false;

    switch (content.tabHeaderStyle) {
        case 'Tabs':
            model.tabHeaderStyle = 'nav-tabs';
            break;
        case 'Pills':
            model.tabHeaderStyle = 'nav-pills';
            break;
        case 'Accordion':
            model.tabHeaderStyle = 'accordion';
            model.activeTab = content.activeTab || 0;
            model.expandDrawers = content.expandDrawers || false;
            break;
        default: // Links/none
            model.tabHeaderStyle = 'nav-links';
    }

    let tabs = [];
    for (let i = 0; i < tabMax; i++) {
        let count = i + 1;
        let value = content['tabDisplay' + count];

        if (!empty(value)) {
            tabs.push({
                value: value,
                tabHeaderCustomClass: content['tabCustomClass' + count] || ''
            });
        }
    };

    model.tabs = tabs;

    return new Template('experience/components/commerce_layouts/tabs').render(model).text;
};
