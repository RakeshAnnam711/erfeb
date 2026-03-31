'use strict';

function getFolders(folder, folders, collections) {
    var subFolders = folder.getOnlineSubFolders();
    collections.forEach(subFolders, function(subFolder) {
        if (subFolder.onlineContent.length > 0 || subFolder.onlineSubFolders.length > 0) {

            folders.push({
                'id': subFolder.ID,
                'name': subFolder.displayName
            });
            getFolders(subFolder, folders, collections);
        }
    });
}

module.exports.init = editor => {
    var ContentMgr = require('dw/content/ContentMgr');
    var collections = require('*/cartridge/scripts/util/collections');
    var siteLibrary = ContentMgr.getSiteLibrary();
    var siteRootFolder = siteLibrary.getRoot();
    var config = {};
    var folders = [];

    getFolders(siteRootFolder, folders, collections);

    folders.sort(function(a, b) {
        var textA = a.name.toLowerCase();
        var textB = b.name.toLowerCase();
        return textA < textB ? -1 : textA > textB ? 1 : 0;
    });

    config.options = folders;

    config.placeholder = '-- site root folder --';
    config.siteRootFolder = siteRootFolder.ID;


    editor.configuration.put('init', config);
}
