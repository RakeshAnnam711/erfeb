'use strict';

const debounce = require('lodash/debounce');
const VideoHelper = require('./videoHelper');

const PlayerDefaults = {
    autoplay: 0,
    playsinline: 0,
    controls: 1,
    mute: 0,
    loop: 0,
    modal: false,
    hasThumb: false,
    playlist: ''
};

const origin = window.location.protocol + '//' + window.location.host;

/**
 * initDomElements()
 *
 * Saves generalized references to DOM elements needed by the player to operate.
 *
 * player.domElements.$player - div used to init the player API, also holds the configuration data
 * player.domElements.$thumb - thumbnail/preview image that masks the player on screen while not playing
 * player.domElements.$cntr - outer div container used to attach dimensions when needed
 */
function initDomElements() {
    let player = this;
    let $elem = $('#' + player.id);

    player.domElements = {
        $player: $elem,
        $thumb: $elem.siblings('.video-thumbnail'),
        $cntr: $elem.closest('.video-container'),
    };
}

/**
 * initConfig()
 *
 * Parses and stores the configuration data attributes set by the content asset.
 * In case of parse error, fallback to this module's PlayerDefaults.
 */
function initConfig() {
    let player = this;

    let playerAttrData = {};
    try {
        playerAttrData = JSON.parse(player.domElements.$player.attr('data-player-attr'));
    } catch (ex) {
        playerAttrData = PlayerDefaults;
    }

    let videoId = player.domElements.$player.attr('data-video-id');
    let playlist = playerAttrData.loop === 1 ? videoId : '';

    player.config = {
        autoplay: playerAttrData.autoplay,
        playsinline: playerAttrData.autoplay === 1 ? 1 : 0,
        controls: playerAttrData.controls,
        mute: playerAttrData.mute,
        loop: playerAttrData.loop,
        hasThumb: playerAttrData.hasThumb,
        modal: playerAttrData.modal,
        videoId: videoId,
        modestbranding: 1
    };
    if (playlist != '') {
        player.config.playlist = playlist
    }
}

/**
 * createApiPlayer()
 *
 * Create and store the vendor specific API Player.
 * The configurations set in the content asset can be overridden for specific use cases, like turning off autoplay when closing the modal.
 *
 * Also attaches any needed playback events to the player.
 *
 * @param {object} overrides - attributes that can override the defined player.config attributes
 */
function createApiPlayer(overrides) {
    let player = this;
    let config = player.config;

    let onReadyCallback = (e) => {
        commonOnReady.call(player, e);

        if (overrides.onReady) {
            overrides.onReady(e);
            delete overrides['onReady'];
        }
    };

    // apply overrides attributes
    if (overrides) {
        config = $.extend({}, player.config, overrides);
    }

    player.apiObj = new YT.Player(player.id, {
        videoId: config.videoId,
        playerVars: {
            autoplay: config.autoplay,
            playsinline: config.playsinline,
            controls: config.controls,
            mute: config.mute,
            loop: config.loop,
            playlist: config.playlist,
            enablejsapi: 1,
            origin: origin,
            widget_referrer: origin
        },
        host: 'https://www.youtube.com', // prevents 'postMessage' origin mismatch error
        events: {
            onReady: onReadyCallback,
            onStateChange: (e) => {
                if (e.data === YT.PlayerState.PAUSED) {
                    // save the current location
                    player.cache.time = e.target.getCurrentTime();
                } else if (e.data === YT.PlayerState.PLAYING) {
                    // not currently using the on play event, but it's here for future use
                }

                if (e.data === 0) {
                    $('body').trigger('video:ended', player);
                }
            },
            onError: (e) => {
                if (console && console.error) {
                    console.error('onError: ' + e.data);
                }
            }
        }
    });
}

/**
 * initPageEvents()
 *
 * Initializes any page event logic for the player.
 */
function initPageEvents() {
    let player = this;
    let $playerContainer = player.domElements.$player.closest('.video-container');

    // pause all players at init, before deciding if they should play
    player.pause();

    // honor the auto mute settings when launching modal
    if (player.config.mute === 1) {
        player.mute();
    } else {
        player.unmute();
    }

    if (player.config.hasThumb) {
        //handle thumbnail click
        player.domElements.$thumb.on('click', event => {
            event.preventDefault();

            if (player.config.modal) {
                player.launchModal();
            } else {
                let playerState = player.apiObj.getPlayerState();
                let playing = playerState === 1;

                if (playing) {
                    player.pause();
                } else {
                    player.play();
                }
            }
        });
    }

    if (player.domElements.$cntr.closest('.modal').length) {
        $(window).on('resize', debounce(() => player.removeSize(), 100));
    }

    if (VideoHelper.shouldPlay($playerContainer) && player.config.autoplay && !player.config.modal) {
        player.play();
    }

    $(window).on('scrollUpdate', () => {
        let playerState = player.apiObj.getPlayerState();
        let playing = playerState === 1;

        if (VideoHelper.shouldPlay($playerContainer)) {
            if (player.config.autoplay && !playing && !player.config.modal) {
                player.play();
            }
        } else if (playing) {
            player.pause();
        }
    });
}

function commonOnReady(e) {
    let player = this;

    // update player dom reference
    player.domElements.$player = $('#' + player.id);

    // if we have an auto play, auto mute, modal, then honor the config,
    // else let the app maintain the volume state
    if (typeof player.cache.mute !== 'undefined') {
        if (player.cache.mute === 1) {
            e.target.mute();
        } else {
            e.target.unMute();
        }

        delete player.cache.mute;
    }
}


module.exports = function(playerId) {
    var player = this;
    this.id = playerId;
    this.type = 'youtube';
    this.cache = {};

    /**********************************************************
     **  Calls to initialize the player and event listeners  **
     **********************************************************/

    initDomElements.call(player);

    initConfig.call(player);

    createApiPlayer.call(player, {onReady: () => initPageEvents.call(player)});


    /***************************************
     **  Generalized playback functions  **
     ***************************************/

    this.play = () => {
        player?.apiObj?.playVideo?.();
        if (player.domElements.$thumb.length && !player.config.modal) {
            player.domElements.$thumb.addClass('faded');
        }
    }

    this.pause = () => {
        player?.apiObj?.pauseVideo?.();
        if (player.domElements.$thumb.length) {
            player.domElements.$thumb.removeClass('faded');
        }
    }

    this.mute = () => {
        player?.apiObj?.mute?.();
        player.cache.mute = 1;
    };

    this.unmute = () => {
        player?.apiObj?.unMute?.();
        player.cache.mute = 0;
    };


    /*********************************************************
     **  Functions to support playing the video in a modal  **
     *********************************************************/

    this.setSize = () => player.domElements.$cntr.css({
        height: player.domElements.$cntr.outerHeight(),
        width: player.domElements.$cntr.outerWidth()
    });

    this.removeSize = () => player.domElements.$cntr.css({
        height: 'auto',
        width: 'auto'
    });

    this.setModal = (VideoModal) => {
        player.modal = VideoModal;
    };

    this.launchModal = () => {
        player.setSize();
        player.modal.launch(player);
    };


    /*****************************************************
     **  Event Handlers for the Bootstrap modal events  **
     *****************************************************/

    this.getShowEventHandler = () => {
        // move the video player to the modal body
        let $modal = player.modal.getModalObj();
        let $body = $('.modal-body', $modal).empty().removeClass();
        $body.addClass('modal-body ' + player.domElements.$cntr.attr('class'));
        player.domElements.$player.appendTo($body);

        // rebuild the API player to maintain event handlers
        if (player.apiObj && player.apiObj.destroy) {
            player.apiObj.destroy();
        }
        createApiPlayer.call(player, {
            onReady: (e) => {
                // set the current location if one is saved
                if (player.cache.time) {
                    player.apiObj.seekTo(player.cache.time, true);
                }
                player.play();
            }
        });
    };

    this.getHideEventHandler = () => {
        // save current location
        player.cache.time = player.apiObj.getCurrentTime();

        // move the video player from the modal back to its page container
        player.domElements.$player.prependTo(player.domElements.$cntr);

        // rebuild the API player to maintain event handlers
        if (player.apiObj && player.apiObj.destroy) {
            player.apiObj.destroy();
        }
        createApiPlayer.call(player, {autoplay: 0});
    };

    return this;
}