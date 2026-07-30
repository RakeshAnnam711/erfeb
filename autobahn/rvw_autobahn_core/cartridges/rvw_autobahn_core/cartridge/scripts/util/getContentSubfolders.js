/**
 * This script gets all of the folders/content assets for a base folder
 *
 * @input folderID : String - the classification Folder ID of the top lvl folder 
 * @input getBaseContent : Bool - usefull if you are trying to get all the content at the root of the folder
 * @output ContentFolders : Object the target
 * @output BaseContentArray :  Object the target
 */

var ContentMgr = require('dw/content/ContentMgr');
var Util = require('dw/util');

function getAssets(folder) {
    var onlineContent = folder.getOnlineContent();

    if (onlineContent != null) {
        var it = onlineContent.iterator();
        var contentList = new Util.ArrayList();

        while (it.hasNext()) {
            var content = it.next();
            contentList.add(content);
        }

        return contentList;
    }
}

function getSubFolders(baseFolder, contentFolders) {
    var folders = baseFolder.getOnlineSubFolders();
    var foldersIterator = folders.iterator();
    
    while (foldersIterator.hasNext()) {
        var folder = foldersIterator.next();
        var contentList = getAssets(folder, contentFolders);
        var subFolders = new Util.LinkedHashMap();

        contentFolders.put(folder.displayName, {contentList: contentList, subFolders: subFolders});

        // recurse into same function to populate any subfolder content
        var contentSubFolders = contentFolders[folder.displayName].subFolders;
        getSubFolders(folder, contentSubFolders);

    }
}

function GetFolders(folderID) {
    // get the top level folder
    var baseFolder = ContentMgr.getFolder(folderID);
    var contentFolders = new Util.LinkedHashMap();

    if (empty(baseFolder)) {
        return;
    }

    getSubFolders(baseFolder, contentFolders);
    
    return {ContentFolders : contentFolders};
}

module.exports = {
    GetFolders: GetFolders
}
