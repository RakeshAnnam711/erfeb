'use strict';

var base = module.superModule;
var baseGetRenderedHtml = base.getRenderedHtml;

var Logger = require('dw/system/Logger');

/**
 * gets the render html for the given isml template
 * @param {Object} templateContext - object that will fill template placeholders
 * @param {string} templateName - the name of the isml template to render.
 * @returns {string} the rendered isml.
 */
base.getRenderedHtml = function(templateContext, templateName) {
    try {
        return baseGetRenderedHtml.apply(this, arguments);
    } catch (error) {
        var t = error;
        error.message += '. \nParams: ' + JSON.stringify(Object.assign({},templateContext)) + '.\nStack: ' + error.stack;
        Logger.error(error);

        return baseGetRenderedHtml.call(this, Object.assign({content: {}}, templateContext), !empty(templateName)? templateName : 'components/content/contentAssetInc');
    }
};

module.exports = base;
