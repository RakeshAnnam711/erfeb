'use strict';

module.exports = function() {
    // add class to sliders containing animated hero banners
    if ($('.slider').find('.hero-text[data-animation]')) {
        var heroAnimationSliders = $('.slider').find('.hero-text[data-animation]').closest('.slider-container');

        for (var i = 0; i < heroAnimationSliders.length; i++) {
            heroAnimationSliders[i].classList.add('hero-has-animation');
        }
    }

    // if hero background video is set to play once, hide when finished and show replay button
    $('body').on('video:ended', (event, player) => {
        var $playerContainer = player.domElements.$cntr;

        if ($playerContainer.hasClass('hero-media') && $playerContainer.data('play-once') === true) {
            var $replayButton = $playerContainer.next('.replay-video');
            $playerContainer.addClass('video-stopped');

            $replayButton.click(event => {
                $playerContainer.removeClass('video-stopped');
                player.config.autoplay = true;
                if (player.type === 'youtube') {
                    player.apiObj.seekTo(0);
                }
                if (player.type === 'hosted') {
                    player.apiObj.currentTime(0);
                }
                if (player.type === 'vimeo') {
                    player.apiObj.setCurrentTime(0);
                }
                player.play();
            });
        }
    });

};
