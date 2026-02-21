'use strict';

const debounce = require('lodash/debounce');
const VideoHelper = require('./videoHelper');

const PlayerDefaults = {
    autoplay: false,
    controls: true,
    muted: false,
    loop: false,
    modal: false,
    hasThumb: false
};

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
        $cntr: $elem.closest('.video-container')
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

    player.config = {
        autoplay: !!playerAttrData.autoplay,
        controls: !!playerAttrData.controls,
        muted: !!playerAttrData.mute,
        loop: !!playerAttrData.loop,
        background: !!playerAttrData.autoplay && !playerAttrData.controls && !!playerAttrData.mute && !!playerAttrData.loop,
        autopause: !(!!playerAttrData.autoplay && !playerAttrData.controls && !!playerAttrData.mute),
        hasThumb: playerAttrData.hasThumb,
        modal: !!playerAttrData.modal,
        videoId: player.domElements.$player.attr('data-video-id')
    };
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
 * @returns {Promise} - Vimeo player ready() Promise is returned so we don't make any calls too early
 */
function createApiPlayer(overrides) {
    let player = this;
    let config = player.config;

    // apply overrides attributes
    if (overrides) {
        config = $.extend({}, player.config, overrides);
    }

    player.apiObj = new Vimeo.Player(player.id, {
        id: config.videoId,
        autoplay: config.autoplay,
        controls: config.controls,
        loop: config.loop,
        muted: config.muted,
        background: config.background,
        autopause: config.autopause
    });

    player.apiObj.on('pause', () => {
        // save the current location
        player.apiObj.getCurrentTime().then((seconds) => {
            player.cache.time = seconds;
        });
    });

    player.apiObj.on('ended', () => {
        $('body').trigger('video:ended', player);
    });

    return player.apiObj.ready();
}

/**
 * initPageEvents()
 *
 * Initializes any page load event logic for the player.
 */
function initPageEvents() {
    let player = this;
    let $playerContainer = player.domElements.$player.closest('.video-container');

    // pause all players at init, before deciding if they should play
    player.pause();

    if (player.config.hasThumb) {
        //handle thumbnail click
        player.domElements.$thumb.on('click', event => {
            event.preventDefault();

            if (player.config.modal) {
                player.launchModal();
            } else {
                player.apiObj.getPaused().then(paused => {
                    if (!paused) {
                        player.pause();
                    } else {
                        player.play();
                    }
                }).catch(error => console.error('error getting paused status:', error));
            }
        });
    }

    if (player.domElements.$cntr.closest('.modal').length) {
        $(window).on('resize', debounce(() => player.removeSize(), 100));
    }

    if (VideoHelper.shouldPlay($playerContainer) && player.config.autoplay && !player.config.modal) {
        player.play();

        // retrigger play method to ensure iOS autoplays
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            setTimeout(() => {
                player.play();
            }, 500);
        }
    }

    $(window).on('scrollUpdate', () => {
        if (VideoHelper.shouldPlay($playerContainer)) {
            if (player.config.autoplay && !player.config.modal) {
                player.apiObj.getPaused().then(paused => {
                    if (paused) {
                        player.play();
                    }
                }).catch(error => console.error('error getting paused status:', error));
            }
        } else {
            player.apiObj.getPaused().then(paused => {
                if (!paused) {
                    player.pause();
                }
            }).catch(error => console.error('error getting paused status:', error));
        }
    });
}

module.exports = function(playerId) {
    var player = this;
    this.id = playerId;
    this.type = 'vimeo';
    this.cache = {};

    /**********************************************************
     **  Calls to initialize the player and event listeners  **
     **********************************************************/

    initDomElements.call(player);

    initConfig.call(player);

    createApiPlayer.call(player).then(() => initPageEvents.call(player));


    /**************************************
     **  Generalized playback functions  **
     **************************************/

    this.play = () => {
        player.apiObj.play()
        if (player.domElements.$thumb.length && !player.config.modal) {
            player.domElements.$thumb.addClass('faded');
        }
    };

    this.pause = () => {
        player.apiObj.pause();
        if (player.domElements.$thumb.length) {
            player.domElements.$thumb.removeClass('faded');
        }
    }

    this.mute = () => {
        player.apiObj.getVolume().then((volume) => {
            player.cache.volume = volume;
        });

        player.apiObj.setVolume(0);
    };

    this.unmute = () => {
        let volume = 1;
        if (player.cachedVolume) {
            volume = player.cache.volume;
        }

        player.apiObj.setVolume(volume);
    };


    /*********************************************************
     **  Functions to support playing the video in a modal  **
     *********************************************************/

    this.setSize = () => {
        player.domElements.$cntr.css({
            height: player.domElements.$cntr.outerHeight(),
            width: player.domElements.$cntr.outerWidth()
        });
    };

    this.removeSize = () => {
        player.domElements.$cntr.css({
            height: 'auto',
            width: 'auto'
        });
    };

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
        let $modal = player.modal.getModalObj();
        let $body = $('.modal-body', $modal).empty().removeClass();
        $body.addClass('modal-body ' + player.domElements.$cntr.attr('class'));
        player.domElements.$player.appendTo($body);

        player.apiObj.destroy().then(() => createApiPlayer.call(player)).then(() => {
            // set the current location if one is saved
            if (player.cache.time) {
                player.apiObj.setCurrentTime(player.cache.time);
            }
            player.play();
        });
    };

    this.getHideEventHandler = () => {
        // save the current location
        player.apiObj.getCurrentTime().then((seconds) => {
            player.cache.time = seconds;
        }).then(() => {
            // vimeo doesnt like to be moved around the DOM, and loses all its event listeners
            // so lets destroy and re-init whenever we move it to and from a modal
            player.domElements.$player.prependTo(player.domElements.$cntr);

            player.apiObj.destroy().then(() => {
                //create a new api player but dont let it autoplay
                createApiPlayer.call(player, {autoplay: false});
            });
        });
    };

    return this;
}
