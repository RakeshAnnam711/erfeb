function getContent(slotContent, pdictContent) {
    if (slotContent) {
        var content = slotContent.content;
    }
    else if (pdictContent) {
        var content = [pdictContent.ID];
    }
    return content;
}

function getContentId(slotContent, pdictContent) {
    if (slotContent) {
        var contentId = slotContent.slotID;
    }
    else if (pdictContent) {
        var contentId = pdictContent.ID;
    }
    return contentId;
}

function getDataAttribute(slotContent, pdictContent) {
    if (slotContent) {
        var dataAttribute = "data-slot-id=" + slotContent.slotID;
    }
    else if (pdictContent) {
        var dataAttribute = "data-content-id=" + pdictContent.ID;
    }
    return dataAttribute;
}

function getClassificationFolderTemplate(contentItem) {
    var folder = contentItem.getClassificationFolder();
    var renderTemplate;
    if (!empty(folder) && folder.isOnline()) {
        var folderTemplatName = folder.getTemplate();
        if (folderTemplatName && !empty(folderTemplatName)) {
            renderTemplate = folderTemplatName;
        }
    }
    return renderTemplate;
}

module.exports = {
    getContent: getContent,
    getContentId: getContentId,
    getDataAttribute: getDataAttribute,
    getClassificationFolderTemplate: getClassificationFolderTemplate
};