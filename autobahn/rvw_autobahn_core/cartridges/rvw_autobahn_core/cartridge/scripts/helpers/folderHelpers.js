'use strict';

var ContentMgr = require('dw/content/ContentMgr');

/**
 * Get a folder's SEO attributes
 * @param {string} folderId - the ID of the parent folder
 * @returns {Object} the folders being requested
 */
function getFolderMetaObject(folderId) {
    var folder = !empty(folderId) ? ContentMgr.getFolder(folderId) : null;
    var metaObject = {
        pageTitle: !empty(folder) && !empty(folder.pageTitle) ? folder.pageTitle : null,
        pageDescription: !empty(folder) && !empty(folder.pageDescription) ? folder.pageDescription : null,
        pageKeywords: !empty(folder) && !empty(folder.pageKeywords) ? folder.pageKeywords : null
    }

    return metaObject;
}

/**
 * Get a folder's online subfolders
 * @param {string} folderId - the ID of the parent folder
 * @returns {Object} the folders being requested
 */
function getSubFolders(folderId) {
    var folder = !empty(folderId) ? ContentMgr.getFolder(folderId) : null;
    var subFolders = !empty(folder) && !empty(folder.onlineSubFolders) ? folder.onlineSubFolders : null;

    return subFolders;
}

// Iterate through folders acting as categories and get a list of the active category hierarchy
function getActiveCategoryIds(categories, activeCategoryId, rootFolderId, activeIds) {
    if (!empty(categories)) {
        var collections = require('*/cartridge/scripts/util/collections');
        var blogCategories = exports.getSubFolders(rootFolderId);

        collections.forEach(categories, function(category) {
            if (category.ID === activeCategoryId) {
                activeIds.push(category.ID);

                // add parent's ID to activeIds array
                if ('parent' in category) {
                    getActiveCategoryIds(blogCategories, category.parent.ID, rootFolderId, activeIds);
                }
            } else if ('subFolders' in category) {
                // check children for active ID
                getActiveCategoryIds(exports.getSubFolders(category.ID), activeCategoryId, rootFolderId, activeIds);
            }
        });
    }
}

// check if folder or its parents are listed in blogParentFolders pref, return object with data for blog landing pages
function getBlogData(folderId) {
    var Resource = require('dw/web/Resource');
    var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
    var blogParentFolders = JSON.parse(abConfigs.blogParentFolders);
    var folder = ContentMgr.getFolder(folderId);
    var parentFoldersArray = [];
    var blogData = {
        isBlogFolder: false,
        blogsPerRowMobile: parseInt(abConfigs.blogsPerRowMobile, 10),
        blogsPerRowDesktop: parseInt(abConfigs.blogsPerRowDesktop, 10)
    }

    // convert blog parent folders site pref to array, falling back to default parent folder if no pref
    for (var key in blogParentFolders) {
        parentFoldersArray.push(blogParentFolders[key]);
    }
    // check if folder is a blog parent folder
    if (folder && parentFoldersArray.includes(folder.ID)) {
        blogData.isBlogFolder = true;
        blogData.rootFolderId = folder.ID;
    } else {
        // check if any of the folder's parents are a blog parent folder
        while (folder && 'parent' in folder && !folder.root) {
            if (parentFoldersArray.includes(folder.ID)) {
                blogData.isBlogFolder = true;
                blogData.rootFolderId = folder.ID;
                break;
            } else {
                folder = ContentMgr.getFolder(folder.parent.ID);
            }
        }
    }

    return blogData;
}


exports.getFolderMetaObject = getFolderMetaObject;
exports.getSubFolders = getSubFolders;
exports.getActiveCategoryIds = getActiveCategoryIds;
exports.getBlogData = getBlogData;
