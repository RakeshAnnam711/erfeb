'use strict';

const YouTube = require('./youtube');
const Vimeo = require('./vimeo');
const Hosted = require('./hosted');
const VideoModal = require('./videoModal');
const videojs = require('video.js/dist/video.min.js');

window.Players = {};

var initPlayers = ($context = $('body'), isAjaxEvent = false) => {
    let $ytElements = $context.find('.video-player[data-video=youtube]');
    let $vimeoElements = $context.find('.video-player[data-video=vimeo]');
    let $hostedElements = $context.find('video[data-video=hosted]');

    if ($vimeoElements.length) {
        loadVimeoAPI().then(() => {
            $vimeoElements.each((index, element) => {
                // don't create player for videos in sliders until slider has been initialized
                if (!$(element).closest('.slider-container').length
                    || $context.is('.slider-container') && $(element).closest($context).length) {
                    let playerId = getUniquePlayerId(index, element, isAjaxEvent);

                    if (!window.Players.hasOwnProperty(playerId) || isAjaxEvent) {
                        window.Players[playerId] = new Vimeo(playerId);
                        window.Players[playerId].setModal(VideoModal);
                    }
                }
            });
        }).catch((err) => {
            if (console && console.error) {
                console.error(err);
            }
        });
    }

    if ($ytElements.length) {
        loadYouTubeAPI().then(() => {
            $ytElements.each((index, element) => {
                // don't create player for videos in sliders until slider has been initialized
                if (!$(element).closest('.slider-container').length
                    || $context.is('.slider-container') && $(element).closest($context).length) {
                    let playerId = getUniquePlayerId(index, element, isAjaxEvent);

                    if (!window.Players.hasOwnProperty(playerId) || isAjaxEvent) {
                        window.Players[playerId] = new YouTube(playerId);
                        window.Players[playerId].setModal(VideoModal);
                    }
                }
            });
        }).catch((err) => {
            if (console && console.error) {
                console.error(err);
            }
        });
    }

    if ($hostedElements.length) {
        window.videojs = videojs;

        $hostedElements.each((index, element) => {
            // don't create player for videos in sliders until slider has been initialized
            if (!$(element).closest('.slider-container').length
                || $context.is('.slider-container') && $(element).closest($context).length) {
                let playerId = getUniquePlayerId(index, element, isAjaxEvent);

                if (!window.Players.hasOwnProperty(playerId) || isAjaxEvent) {
                    window.Players[playerId] = new Hosted(playerId);
                    window.Players[playerId].setModal(VideoModal);
                }
            }
        });
    }

    if ($vimeoElements.length || $ytElements.length || $hostedElements.length) {
        $('body').on('video:ended', (event, player) => {
            if (player.domElements.$thumb.length) {
                player.domElements.$thumb.removeClass('faded');
            }

            // prevent videos from replaying on scroll if they've already finished
            player.config.autoplay = false;
        });

        // Reinitialze videos if slider loads, to allow creation of unique IDs
        $('body').off('.sliderEvents').on('slider:init.sliderEvents', (event, $sliderContainer) => {
            initPlayers($sliderContainer);
        });
    }

    // Initialize/reinitialize videos in case of ajax partial page load 
    $('body').off('.ajaxEvents').on('ajax:load.ajaxEvents', (event, $container) => {
        initPlayers($container, true);
    });
}

let ytPromise = null;

var loadYouTubeAPI = () => {
    if (ytPromise) {
        return ytPromise;
    }

    return ytPromise = new Promise((resolve) => {
        let tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        tag.onerror = () => {
            throw new Error('YouTube iframe API load error');
        };

        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => resolve();
    });
}

var loadVimeoAPI = () => {
    return new Promise(function(resolve) {
        let tag = document.createElement('script');
        tag.src = "https://player.vimeo.com/api/player.js";
        tag.onload = resolve;
        tag.onerror = () => {
            throw new Error('Vimeo player SDK load error');
        };

        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    });
}

// handle cases where multiple videos with the same ID exist, like looping sliders
var getUniquePlayerId = (index, element, isAjaxEvent) => {
    let playerId = $(element).attr('id');

    if (window.Players.hasOwnProperty(playerId) && !isAjaxEvent) {
        playerId = playerId + '-' + index;
        $(element).attr('id', playerId);
    }

    return playerId;
}

/**
 * TODO:
 *     - document everything
 *     - Youtube API pageload errors
 */
module.exports = () => initPlayers();
