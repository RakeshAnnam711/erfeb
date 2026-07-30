'use strict';

var abSlider = require('./slider');

function handleTabSliders() {
    var $tabPane = $('.tab-pane');
    var $sliders = $tabPane.find('.slider-container');

    $sliders.each((_i, slider) => {
        var $tab = $(slider).closest('.nav-tabs-container').find('a[data-toggle="tab"]');
        $tab.on('shown.bs.tab', event => {
            var scrollTop = $(document).scrollTop();
            var $newTab = $(event.target.hash);
            var $newTabSlider = $newTab.find('.slider-container .slider');
            $newTabSlider.trigger('slider:destroy');
            abSlider.initializeSliders($newTab);
            $(document).scrollTop(scrollTop); // reset to original scroll position
        });
    });
};

function handleTabVideos() {
    var $tabPane = $('.tab-pane');
    var $videos = $tabPane.find('.hero-media.video-container, .background-image.video-container, .experience-commerce_assets-video>.video-container');

    if ($videos.length) {
        $('a[data-toggle="tab"]').on('show.bs.tab', event => {
            var $newTab = $(event.target.hash);
            var newTabVideoId = $newTab.find('.video-player').attr('id');
            var videoToPlay = window.Players[newTabVideoId];
            var $oldTab = $(event.relatedTarget.hash);
            var oldTabVideoId = $oldTab.find('.video-player').attr('id');
            var videoToPause = window.Players[oldTabVideoId];

            if (videoToPause) {
                videoToPause.pause();
            }

            if (videoToPlay) {
                videoToPlay.play();
            }
        });
    }
};

function updateTabOverflowClass($tabsContainer) {
    $tabsContainer.each((_index, tabContainer) => {
        var $navContainer = $(tabContainer).find('.nav');
        var $containerWidth = Math.floor($navContainer.outerWidth());
        var $tabsWidth = 0;
        var $tabs = $navContainer.children();

        $(tabContainer).css('--nav-tabs-height', $navContainer.height() + 'px');

        $tabs.each((_index, tab) => {
            $tabsWidth += Math.floor($(tab).outerWidth());
        });

        if ($tabsWidth > $containerWidth) {
            $(tabContainer).addClass('has-overflow');
        } else {
            $(tabContainer).removeClass('has-overflow');
        }
    });
}

function handleTabOverflow() {
    var $tabsContainer = $('.nav-tabs-container');

    if ($tabsContainer.length && $tabsContainer.find('.nav').length) {
        module.exports.methods.updateTabOverflowClass($tabsContainer);

        $(window).resize(() => {
            module.exports.methods.updateTabOverflowClass($tabsContainer);
        });
    }
};

module.exports = {
    methods: {
        updateTabOverflowClass: updateTabOverflowClass
    },
    handleTabSliders: handleTabSliders,
    handleTabVideos: handleTabVideos,
    handleTabOverflow: handleTabOverflow
};
