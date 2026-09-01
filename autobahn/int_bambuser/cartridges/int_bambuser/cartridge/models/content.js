'use strict';

/**
 * Extends existing content model with custom attribute
 * @param  {dw.content.Content} contentValue - result of ContentMgr.getContent call
 * @param  {string} renderingTemplate - rendering template for the given content
 * @return {content} content model instance
 * @constructor
 */
module.exports = function Content(contentValue, renderingTemplate) {
    if (module.superModule) {
        module.superModule.call(this, contentValue, renderingTemplate);
    }

    if (this && 'bambuserStreamId' in contentValue.custom) {
        this.bambuserStreamId = contentValue.custom.bambuserStreamId;
    }

    return this;
};
