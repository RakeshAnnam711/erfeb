'use strict';

// API
const ContentMgr = require('dw/content/ContentMgr');
const Logger = require('dw/system/Logger');

// Custom Script
const contentSlotHelper = require('*/cartridge/scripts/helpers/contentSlotHelper');

/**
 * Builds an Array of video content asset data
 * 
 * @param {dw.util.Collection|dw.content.Content[]} source - Array of Content system objects that represents videos.  Could come from a slot or Page-Include
 * @return {Object[]} An Array of objects representing video assets
 */
function createVideoItems(source) {
    var items = [];
    
    for (var i = 0; i < source.length; i++) {
        var videoAsset = source[i];
        var online = videoAsset.isOnline();
        var aid = online ? videoAsset.ID : '';
        
        var body = '';
        if (videoAsset.custom.body) {
            body = videoAsset.custom.body.toString();
        }
        
        var template = contentSlotHelper.getClassificationFolderTemplate(videoAsset);
        if (!template) {
            template = '/components/content/contentAssetInc';
        }
        
        var thumb = '';
        if (videoAsset.custom.videoThumbnail && videoAsset.custom.videoThumbnail.URL) {
            thumb = videoAsset.custom.videoThumbnail.URL.toString();
        } else if (videoAsset.custom.videoLocation.value == 'modal') {
            thumb = 'clear';
        }
        
        var playerVars = {
            modal: videoAsset.custom.videoLocation.value == 'modal',
            inline: videoAsset.custom.videoLocation.value == 'inline',
            autoplay: videoAsset.custom.videoAuto.value || 0,
            mute: videoAsset.custom.videoAutoMute.value || 0,
            controls: videoAsset.custom.videoDisplayControls.value || 0,
            loop: videoAsset.custom.videoLoop.value || 0,
            hasThumb: !empty(thumb)
        };
        
        var playerVarStr = '{}';
        try {
            playerVarStr = JSON.stringify(playerVars);
        } catch(ex) {
            Logger.error('Exception caught during JSON.stringify of video attributes for content {0}: {1}', videoAsset.ID, ex.message);
            playerVarStr = '{}';
        }
        
        var videoType = '';
        if (videoAsset.custom.videoType && videoAsset.custom.videoType.value) {
            videoType = videoAsset.custom.videoType.value;
        }
        
        var videoId = '';
        if (videoAsset.custom.videoID) {
            videoId = videoAsset.custom.videoID;
        }

        var videoDisplayControls = true;
        if (videoAsset.custom.videoDisplayControls) {
            videoDisplayControls = videoAsset.custom.videoDisplayControls.value === 0 ? false : true;
        }

        var videoAspectRatio = '16:9';
        var aspectRatioClass;
        if (videoAsset.custom.videoAspectRatio && videoAsset.custom.videoAspectRatio.value) {
            videoAspectRatio = videoAsset.custom.videoAspectRatio.value;
        }
        switch (videoAspectRatio) {
            case '4:3':
                aspectRatioClass = 'aspect-ratio-4-3';
                break;
            default: // 16:9
                aspectRatioClass = 'aspect-ratio-16-9';
        }

        var item = {
            online: online,
            assetId: aid,
            body: body,
            template: template,
            thumbnail: thumb,
            playerVars: playerVarStr,
            videoType: videoType,
            videoId: videoId,
            hideControls: !videoDisplayControls,
            aspectRatioClass: aspectRatioClass
        };
        items.push(item);
    }
    
    return items;
}

/**
 * Represents Video Content assets
 * 
 * @param {Object} params
 *  @param {dw.campaign.SlotContent} params.slotContent - slotcontent object from slot rendering
 *  @param {Object} params.pdictContent - content model object from Page-Include
 *  
 * @return {void}
 * @constructor
 */
module.exports = function(params) {
    var model = {};
    
    try {
        var sourceContent = null;
        var sourceType = '';
        var contentId = '';
        var dataAttribute = '';
        
        if (params.slotContent) {
            sourceContent = params.slotContent.content;
            contentId = params.slotContent.slotID;
            dataAttribute = 'data-slot-id=' + contentId;
            sourceType = 'slot';
        } else if (params.pdictContent) {
            sourceContent = [ContentMgr.getContent(params.pdictContent.ID)];
            contentId = params.pdictContent.ID;
            dataAttribute = 'data-content-id=' + contentId;
            sourceType = 'asset';
        } else {
            throw new Error('Cannot find content object, both slotContent and pdictContent are empty!');
        }
        
        model = {
            type: 'video',
            contentId: contentId,
            dataAttribute: dataAttribute,
            sourceType: sourceType,
            content: createVideoItems(sourceContent)
        };
        
    } catch(ex) {
        Logger.error('Exception caught while creating Video Model: ' + ex.message);
        model = null;
    }
    
    return model;
};
