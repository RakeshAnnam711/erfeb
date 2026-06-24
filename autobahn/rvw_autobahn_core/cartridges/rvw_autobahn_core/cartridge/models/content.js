'use strict';

var base = module.superModule;

/**
 * Represents content model
 * @param  {dw.content.Content} contentValue - result of ContentMgr.getContent call
 * @param  {string} renderingTemplate - rendering template for the given content
 * @return {void}
 * @constructor
 */
function content(contentValue, renderingTemplate) {
    base.call(this,contentValue, renderingTemplate);

    //search for asset's classification folder and attempt to get the rendering template
    if (!empty(contentValue)) {
        var folder = contentValue.getClassificationFolder();
        if (!empty(folder) && folder.isOnline()) {
            this.primaryFolderID = folder.ID;

            var folderTemplate = folder.getTemplate();
            if (!empty(folderTemplate)) {
                this.folderTemplate = folderTemplate;
            }
        }
    }

    return this;
}

content.prototype.setPrimaryFolderID = function (folderID) {
    this.primaryFolderID = folderID || this.primaryFolderID;
}

content.prototype.setRenderingTemplate = function (renderingTemplate) {
    this.template = renderingTemplate || this.template || 'components/content/contentAssetInc';
}

module.exports = content;
