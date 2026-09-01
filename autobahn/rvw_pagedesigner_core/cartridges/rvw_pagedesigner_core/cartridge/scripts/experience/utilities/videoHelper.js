'use strict';

function getFileType(url) {
    var fileNameArray = url.split('.');
    return fileNameArray[fileNameArray.length - 1];
}

function isSupportedVideoType(url) {
    var supportedVideoTypes = ['ogg', 'webm', 'mp4'];
    var fileType = getFileType(url);
    return supportedVideoTypes.indexOf(fileType) > -1;
}

/**
 * Helper to extract data from video URLs
 *
 * @param {String} url - The URL a user has entered
 * @return {Object} videoData - An object containing the video type and ID
 */
function getVideoDataFromUrl(url) {
    var videoData = {
        fileType: null,
        valid: false
    };

    // Check if YouTube
    if (url.match('^https?://(www.)?youtube|youtu\.be')) {
        if (url.match('embed')) {
            var youtubeID = url.split(/embed\//)[1].split('"')[0];
        } else {
            var youtubeID = url.split(/v\/|v=|youtu\.be\//)[1].split(/[?&]/)[0];
        }
        videoData.type = "youtube";
        videoData.id = youtubeID;
        videoData.valid = true;
    }

    // Check if Vimeo
    else if (url.match('^https?://(player.)?vimeo\.com')) {
        var vimeoID = url.split(/video\/|^https?:\/\/vimeo\.com\//)[1].split(/[?&]/)[0];
        videoData.type = "vimeo";
        videoData.id = vimeoID;
        videoData.valid = true;
    }
    
    // Check if video file
    else if (isSupportedVideoType(url)) {
        videoData.type = "hosted";
        videoData.id = url;
        videoData.fileType = getFileType(url);
        videoData.valid = true;
    }

    return videoData;
}

module.exports = {
    getVideoDataFromUrl: getVideoDataFromUrl
};
