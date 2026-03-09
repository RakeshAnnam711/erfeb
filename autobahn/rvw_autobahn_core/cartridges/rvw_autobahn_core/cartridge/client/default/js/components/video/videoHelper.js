'use strict';

// Checks if a video player is visible in the viewport
function isPlayerVisible($playerContainer, onlyPlayWhenFullyInView) {
    let fitsInViewport = ($playerContainer.height() - 10) <= $(window).height();
    let pageTop = $(window).scrollTop();
    let pageBottom = pageTop + $(window).height();
    let elementTop = $playerContainer.offset() ? $playerContainer.offset().top : 0;
    let elementBottom = elementTop + ($playerContainer.height() || 0);

    if (onlyPlayWhenFullyInView && fitsInViewport) {
        return ((pageTop <= elementTop) && (pageBottom >= elementBottom));
    } else {
        return ((elementTop <= pageBottom) && (elementBottom >= pageTop));
    }
}

// Checks if a video player is inside an inactive slide within a slider
function isPlayerInInactiveSlide($playerContainer) {
    return !!$playerContainer.closest('.slider').length
           && !$playerContainer.closest('.tns-slide-active').length
           && !$playerContainer.closest('.hero-button').length;
}

// Checks if a video player is inside an inactive tab within a tab component
function isPlayerInInactiveTab($playerContainer) {
    return !!$playerContainer.closest('.tab-pane').length
           && !$playerContainer.closest('.tab-pane.active').length;
}

// Check if a video should be played
function shouldPlay($playerContainer) {
    let onlyPlayWhenFullyInView = $playerContainer.data('play-when-fully-in-view');

    return isPlayerVisible($playerContainer, onlyPlayWhenFullyInView)
           && !isPlayerInInactiveSlide($playerContainer)
           && !isPlayerInInactiveTab($playerContainer);
}


module.exports = {
    shouldPlay: shouldPlay
}
