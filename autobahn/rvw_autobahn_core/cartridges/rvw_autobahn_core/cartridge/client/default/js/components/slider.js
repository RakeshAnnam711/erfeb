'use strict';

var tinySlider = require('tiny-slider/src/tiny-slider');
var zoom = require('jquery-zoom');
var imagesLoaded = require('imagesloaded');
require('jquery.scrollintoview');
var wishlistHelpers = require('core/wishlist/components/helpers');
var SiteConstants = require('constants/SiteConstants');
var mediumBreakpoint = SiteConstants.BreakpointSizes.md;
var largeBreakpoint = SiteConstants.BreakpointSizes.lg;

var abSlider = {};

// Check custom attributes on slider element to get settings, falling back to defaults if not populated
abSlider.getSliderAttributes = function($slider) {
    var attributes = new Object();

    // Autoplay (defaults to false)
    attributes.autoplayDelay = parseInt($slider.attr('data-slider-autoplay'));
    attributes.autoplay = isNaN(attributes.autoplayDelay) ? false : true;
    attributes.autoplayTimeout = attributes.autoplay ? attributes.autoplayDelay : 5000;

    // Loop (defaults to true)
    attributes.loop = $slider.attr('data-slider-loop') === 'false' ? false : true;

    // WGACA MODIFICATION - Additional Touch (defaults to true)
    attributes.touch = $slider.attr('data-slider-touch') === 'false' ? false : true;

    // Number of items to show (defaults to 1 at all breakpoints)
    attributes.itemsNumber = parseInt($slider.attr('data-slider-items'));
    attributes.items = isNaN(attributes.itemsNumber) ? 1 : attributes.itemsNumber;
    attributes.itemsNumberMedium = parseInt($slider.attr('data-slider-items-md'));
    attributes.itemsMedium = isNaN(attributes.itemsNumberMedium) ? 1 : attributes.itemsNumberMedium;
    attributes.itemsNumberLarge = parseInt($slider.attr('data-slider-items-lg'));
    attributes.itemsLarge = isNaN(attributes.itemsNumberLarge) ? 1 : attributes.itemsNumberLarge;

    // Gutter space between items (defaults to 0px)
    attributes.gutter = parseInt($slider.attr('data-slider-gutter')) || 0;
    attributes.gutterMedium = parseInt($slider.attr('data-slider-gutter-md')) || 0;
    attributes.gutterLarge = parseInt($slider.attr('data-slider-gutter-lg')) || 0;

    // Slide animation speed (defaults to 300ms)
    attributes.speed = parseInt($slider.attr('data-slider-speed')) || 300;

    // Slide animation (defaults to standard Carousel behavior)
    attributes.mode = $slider.attr('data-slider-mode') || 'carousel';
    attributes.animateIn = $slider.attr('data-slider-animatein') || 'no-animation';
    attributes.animateOut = $slider.attr('data-slider-animateout') || 'no-animation';

    // Thumbnail settings (defaults to false)
    // If a selector is set for [data-slider-thumbnail container], the rest of the settings populate automatically
    var $thumbnailSlider = $($slider.attr('data-slider-thumbnail-container'));
    attributes.thumbnailContainer = $slider.attr('data-slider-thumbnail-container') || false;
    attributes.navContainer = $thumbnailSlider.length ? $thumbnailSlider.find('.slider')[0] : false;
    attributes.navAsThumbnails = attributes.navContainer === false ? false : true;
    attributes.controlsContainer = $thumbnailSlider.length ? $thumbnailSlider.find('.slider-thumbnail-controls')[0] : false;

    return attributes;
}

// Build parameter object to create a slider
abSlider.getSliderParams = function($slider, slideItems) {
    var attributes = abSlider.getSliderAttributes($slider);
    var params = {
        container: $slider.find('.slider')[0],
        loop: attributes.loop,
        items: attributes.items,
        autoplay: attributes.autoplay,
        autoplayTimeout: attributes.autoplayTimeout,
        autoplayHoverPause: true,
        touch: attributes.touch, // WGACA MODIFICATION
        mode: attributes.mode,
        gutter: attributes.gutter,
        speed: attributes.speed,
        navContainer: attributes.navContainer,
        navAsThumbnails: attributes.navAsThumbnails,
        controlsContainer: attributes.controlsContainer,
        onInit: slideInit(), // WGACA MODIFICATION
        preventScrollOnTouch: 'auto', // prevents mobile errors in chrome
        responsive: {
            [mediumBreakpoint]: {
                items: attributes.itemsMedium,
                gutter: attributes.gutterMedium,
            },
            [largeBreakpoint]: {
                items: attributes.itemsLarge,
                gutter: attributes.gutterLarge,
            }
        }
    }

    if (slideItems) {
        params.slideItems = slideItems;
    }

    if (params.mode === 'gallery') {
        params.animateIn = attributes.animateIn;
        params.animateOut = attributes.animateOut;
    }

    return params;
}

// Uses scrollintoview jQuery plugin (needed for IE11 support) to scroll the active thumbnail into view
// Note: Thumbnail container needs to be scrollable (overflow: auto) for this to work
abSlider.slideIntoView = function(slider) {
    if (slider.navContainer !== false && $(slider.navContainer).hasClass('slider')) {
        var $activeThumbnail = $(slider.navContainer).find('.tns-nav-active');
        $activeThumbnail.scrollintoview();
    }
}

// Build out slide html for replacing images on variant selection
abSlider.getUpdatedSlideItems = function(images, assets, isThumbnail) {
    var slideItems = [];

    images['large'].forEach(image => {
        var $slideElement = $('<div></div>').attr('class', 'slide');
        var $imageElement = $('<img/>');

        if (!isThumbnail) {
            $slideElement.attr('data-zoom-image', images['hi-res'].length ? images['hi-res'][image.index].url : images['large'][image.index].url);
        }

        $imageElement.attr({
            'src': image.url,
            'alt': image.alt + ' image number ' + (parseInt(image.index) + 1).toFixed(0),
            'class': 'd-block img-fluid',
            'itemprop': 'image'
        });

        if (images['large-no-image']?.url?.length > 0) {
            $imageElement.attr('onerror', 'this.onerror=null;this.src=\'' + images['large-no-image'].url + '\';');
        }

        $slideElement.append($imageElement);
        slideItems.push($slideElement[0]);
    });

    abSlider.getPDPGalleryAssetSlides(slideItems, assets, isThumbnail);

    return slideItems;
}

// Fetch any additional slides needed from PDP Gallery Asset IDs attribute
abSlider.getPDPGalleryAssetSlides = function(slideItems, assets, isThumbnail) {
    let slideCount = slideItems.length;
    let hasVideo = false;

    assets.forEach((asset, index) => {
        var $slideElement = $('<div class="pdp-gallery-asset"></div>');
        var $imageElement = $('<img/>');
        var $videoButton = $('<span class="video-thumbnail-button"></span>');

        if (asset.isVideo) {
            hasVideo = true;
        }

        if (!isThumbnail) {
            $slideElement.attr('class', 'slide no-zoom');
            // ajax call to get html for asset
            $.ajax({
                url: asset.assetRenderUrl,
                method: 'GET',
                success: data => {
                    var $sliderContainer = $slideElement.closest('.slider-container');
                    $slideElement.html(data);

                    // after all assets are added, reinit any necessary javascript
                    if (index + 1 >= assets.length) {
                        $slideElement.trigger('tooltip:init'); // reinit tooltips in case of hotspot asset

                        if (hasVideo) {
                            $('body').trigger('ajax:load.ajaxEvents', [$sliderContainer]); // reinit videos in video/index.js
                            $('body').trigger('slider:videosLoaded'); // trigger custom event set up in bindSliderUpdateEvent
                        }
                    }
                },
                error: err => {
                    console.error('There was an issue retrieving this asset: ', err);
                }
            });
        } else {
            $slideElement.attr('class', 'slide video-container');
            $imageElement.attr({
                'src': asset.thumbnail,
                'alt': 'image number ' + (slideCount + 1).toFixed(0),
                'class': 'd-block img-fluid',
                'itemprop': 'image'
            });
        }

        slideCount++;
        $slideElement.append($imageElement);

        if (asset.isVideo) {
            $slideElement.append($videoButton);
        }

        slideItems.push($slideElement[0]);
    });
}

// Listen for the slider:update event and reinitialize slider with new slides
abSlider.bindSliderUpdateEvent = function($sliderContainer, slider) {
    $sliderContainer.off('slider:update').on('slider:update', '.slider', (event, data) => {
        var $updatedSliderContainer = $(event.target).closest('.slider-container');
        var isThumbnail = $updatedSliderContainer.hasClass('slider-thumbnails');
        var updatedSlideItems = data !== undefined ? abSlider.getUpdatedSlideItems(data.images, data.assets, isThumbnail) : null;
        var updatedParams = abSlider.getSliderParams($updatedSliderContainer, updatedSlideItems);

        // Update carousel classes to handle number of images changing
        if (isThumbnail) {
            var $thumbnailContainer = $updatedSliderContainer.closest('.primary-images-thumbnails');
            var $mainImageContainer = $thumbnailContainer.prev('.primary-images-main');

            if (data.images.small && data.images.small.length > 1) {
                $thumbnailContainer.removeClass('d-none');
                $mainImageContainer.addClass('product-has-thumbnails col-lg-9');
            } else {
                $thumbnailContainer.addClass('d-none');
                $mainImageContainer.removeClass('product-has-thumbnails col-lg-9');
            }
        }

        // Remove and re-add slider markup if there are new slides to show
        if (updatedParams.slideItems) {
            var $newSliderElement = $('<div></div>').attr({
                'class': 'slider',
                'id': updatedParams.container.id
            });
            var $newSliderControls = $updatedSliderContainer.find('.slider-thumbnail-controls').addClass('d-none');
            $newSliderElement.html(updatedParams.slideItems);
            $updatedSliderContainer.html($newSliderElement);
            updatedParams.container = $newSliderElement[0];

            // If this is a thumbnails slider, also add the arrow controls and update the item count
            if (isThumbnail) {
                $updatedSliderContainer.append($newSliderControls);
                updatedParams.items = updatedParams.slideItems.length;
                updatedParams.responsive[mediumBreakpoint].items = updatedParams.slideItems.length;
                updatedParams.responsive[largeBreakpoint].items = updatedParams.slideItems.length;
            }
        }

        // Reinitialize slider using new params
        slider = tinySlider.tns(updatedParams);
        slider.events.on('transitionEnd', abSlider.slideIntoView);
        abSlider.enableImageZoom($updatedSliderContainer);

        if (isThumbnail) {
            abSlider.handleThumbnailArrows($updatedSliderContainer, slider);
        } else {
            // listen for videos getting updated from getUpdatedSlideItems function
            $('body').on('slider:videosLoaded', () => {
                abSlider.handleSliderVideos($updatedSliderContainer, slider);
            });
        }
    });
}

// Listen for the slider:destroy event
abSlider.bindSliderDestroyEvent = function($sliderContainer, slider) {
    $sliderContainer.off('slider:destroy').on('slider:destroy', '.slider', () => {
        slider.destroy();
    });
}

// Enables zoomed images using jquery-zoom
abSlider.enableImageZoom = function($sliderContainer) {
    if ($sliderContainer.closest('.primary-images').length
        && !$sliderContainer.hasClass('slider-thumbnails')
        && !window.isMobile()) {
        var $slides = $sliderContainer.find('.slide');
        $slides.each((index, slide) => {
            var $slide = $(slide);

            if (!$slide.hasClass('no-zoom')) {
                var zoomImageUrl = $slide.data('zoom-image') || $slide.find('img').attr('src');
                $slide.zoom({
                    url: zoomImageUrl,
                    magnify: 1,
                    touch: false
                });
            }
        });
    }
}

// Determine whether to show thumbnail arrows based on overflow state
abSlider.handleThumbnailArrows = function($sliderContainer, slider) {
    if ($sliderContainer.hasClass('slider-thumbnails')) {
        var $slider = $sliderContainer.find('.slider');
        var $arrows = $sliderContainer.find('.slider-thumbnail-controls');
        var buffer = 5; // adding a buffer to prevent arrows from showing if the last slide is mostly visible
        var containerSize;
        var sliderSize;

        $slider.imagesLoaded().done(() => {
            if (window.isMobile()) {
                containerSize = $sliderContainer.outerWidth();
                sliderSize = $slider[0].scrollWidth;
            } else {
                containerSize = $sliderContainer.outerHeight();
                sliderSize = $slider[0].scrollHeight;
            }

            if (sliderSize - buffer >= containerSize) {
                $arrows.removeClass('d-none');
            }
        });
    }
}

// Check for videos and pause them when they're not in the active slide
abSlider.handleSliderVideos = function($sliderContainer, slider) {
    var $videos = $sliderContainer.find('.hero-media.video-container, .experience-commerce_assets-video>.video-container');

    if ($videos.length) {
        slider.events.on('indexChanged', () => {
            $videos.each((_i, element) => {
                var $videoContainer = $(element);
                var videoID = $videoContainer.find('.video-player').attr('id');
                var player = window.Players[videoID];

                if (player) {
                    if (!$videoContainer.closest('.tns-slide-active').length) {
                        player.pause();
                    } else if (player.config.autoplay) {
                        player.play();
                    }
                }
            });
        });
    }
}

// Check if there are enough items to trigger slider indicators and add class to adjust space if not
abSlider.handleInactiveSliders = function (params, $sliderContainer, tslider) {
    var info = tslider.getInfo();
    var mobileItems = params.items;
    var tabletItems = params.responsive[mediumBreakpoint].items;
    var desktopItems = params.responsive[largeBreakpoint].items;
    var actualItems = info.slideCount;

    if (actualItems <= mobileItems) {
        $sliderContainer.addClass('slider-bullets-hidden slider-buttons-hidden');
    }
    if (actualItems <= tabletItems) {
        $sliderContainer.addClass('slider-bullets-hidden-md slider-buttons-hidden-md');
    }
    if (actualItems <= desktopItems) {
        $sliderContainer.addClass('slider-bullets-hidden-lg slider-buttons-hidden-lg');
    }
}

// Handle Pause/Play Button
abSlider.bindPauseButton = function($sliderContainer, slider) {
    var sliderButtonPlacement = $sliderContainer.attr('data-slider-pause-button-placement');

    if ($sliderContainer[0].hasAttribute('data-slider-autoplay') && $sliderContainer.attr('data-slider-autoplay') != 'false' && $sliderContainer[0].hasAttribute('data-slider-pause-button-placement') && $sliderContainer.attr('data-slider-pause-button-placement') != "none")  {
        if (sliderButtonPlacement == 'with-pagination') {
            $sliderContainer.find('.tns-nav').addClass('with-pagination-btn').append('<a href="#" class="tns-nav-controller"><span class="sr-only">stop and start slider</span></a>');
        } else {
            $sliderContainer.prepend('<a href="#" class="tns-nav-controller"><span class="sr-only">stop and start slider</span></a>');
        };

        $('.tns-nav-controller').addClass(sliderButtonPlacement);

        $sliderContainer.on('click', '.tns-nav-controller', function() {
            event.preventDefault();
            $(this).toggleClass('pause');
            $sliderContainer.toggleClass('slider-pause');

            if ($sliderContainer.hasClass('slider-pause')) {
                slider.pause();
            } else {
                slider.play();
            }
        });
    }
};

abSlider.initializeSliders = function($context = $('body')) {
    var scope = this;
    // delay-init is different from replace-content
    var $sliderContainers = $context.find('.slider-container:not(.delay-init)');

    $sliderContainers.each((i, slider) => {
        var $sliderContainer = $(slider);
        var params = scope.getSliderParams($sliderContainer);
        var promisegroup = [];
        var $replace = $sliderContainer.find('[data-replace-content]');

        $replace.each(function (i, replace) {
            var $target = $(replace);
            var deferment = $target.data('deferment');

            if (deferment && !deferment.isResolved && deferment.state() === 'pending') {
                promisegroup.push(deferment);
            }
        });

        // Done will also execute if promisegroup is empty []
        $.when.apply($, promisegroup).done(function () {
            scope.applyTinySlider($sliderContainer, params);
        });
    });
    // WGACA MODIFICAITON - additional event slider
    $('.icon-arrow-left-thin, .icon-arrow-right-thin, .tns-slide-active').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $(this).trigger('click');
        }
    });
    // END MODIFICATION
}

abSlider.applyTinySlider = function ($container, params) {
    if (!$container) return;

    var tslider = tinySlider.tns(params);

    if (!!tslider) {
        tslider.events.on('transitionStart', this.slideIntoView);

        this.bindPauseButton($container, tslider);
        this.bindSliderUpdateEvent($container, tslider);
        this.bindSliderDestroyEvent($container, tslider);
        this.enableImageZoom($container);
        this.handleThumbnailArrows($container, tslider);
        this.handleSliderVideos($container, tslider);
        this.handleInactiveSliders(params, $container, tslider);

        $('body').trigger('slider:init.sliderEvents', [$container]);
        wishlistHelpers.updateLinkData();
    }

    $container.data('tns', tslider);
    $container.trigger('tooltip:init');
    $container.find('[data-controls="next"], [data-controls="prev"]').attr('tabindex', 0);
}

abSlider.initializeQuickviewModalSliders = function() {
    $('body').off('quickview:ready').on('quickview:ready', (event, modal) => {
        abSlider.initializeSliders($(modal));
    });
}

abSlider.initializeWishlistModalSliders = function() {
    $('body').off('editwishlistproduct:ready').on('editwishlistproduct:ready', (event, modal) => {
        abSlider.initializeSliders($(modal));
    });
}

abSlider.initializeTargetSliders = function() {
    $('body').off('targetslider:ready').on('targetslider:ready', (event, target) => {
        abSlider.initializeSliders($(target));
    });
}

// WGACA MODIFICATION - onInit modification
function slideInit(){
    $('.tns-controls').attr('tabindex', -1);
    $('[data-controls="prev"]').attr('tabindex', 0);
    $('[data-controls="next"]').attr('tabindex', 0);
}
// END MODIFICATION

abSlider.init =  function() {
    abSlider.initializeSliders();
    abSlider.initializeQuickviewModalSliders();
    abSlider.initializeWishlistModalSliders();
    abSlider.initializeTargetSliders();
}

// WGACA MODIFICATION - Extended Dot Navigation
function displayDotNavigation(){
    const mobileSlider = document.querySelector('.mobile-slider');
    const tns3mwDiv = mobileSlider ? mobileSlider.querySelector('#tns3-mw') : null;    //parent component of mobile carousel

    if (!tns3mwDiv) {
        console.error('tns3mwDiv not found');
        return; // Exit the function if tns3mwDiv is not found
    }

    // Create a new div element for dot navigation and add it to parent component
    const dotNavigationDiv = document.createElement('div');
    dotNavigationDiv.id = 'dot-navigation';
    tns3mwDiv.appendChild(dotNavigationDiv);

    //carousel container
    const container = document.getElementById('tns3');
    if (!container) {
        console.error('Carousel container not found');
        return; // Exit if the carousel container is not found
    }

    container.style.position = 'relative';
    const cards = document.querySelectorAll('#tns3 > .tns-item');

    // Create dots based on the number of cards
    cards.forEach((card, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) {
            dot.classList.add('active');
        }
        dotNavigationDiv.appendChild(dot);
    });

    // Function to set the active dot
    function setActiveDot(index) {
        const dots = document.querySelectorAll('.dot');
        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');
    }

    // Function to get current translateX value of the container
    function getTranslateXValue(element) {
        const transformValue = window.getComputedStyle(element).transform; // Get computed transform value
        const match = transformValue.match(/matrix\(1, 0, 0, 1, (-?\d+(\.\d+)?),/); // Adjust for translate3d or matrix format
        if (match && match[1]) {
            return parseFloat(match[1]); // Convert the extracted value to a number
        }
        return 0; // Default to 0 if no match found
    }

    //To set active dot based on user swiping the container
    container.addEventListener('transitionend', () => {
        const translateX = getTranslateXValue(container);
        if(!(-translateX > container.offsetWidth)){     //upper limit
            // Calculate the index of the current card based on translateX
            const cardWidth = cards[0].offsetWidth + 10; // width + margin
            if(Math.round(-translateX / cardWidth) >= 0){   ////lower limit
                const index = Math.round(-translateX / cardWidth);
                setActiveDot(index); // Set active dot
            }
        }
    });
}

let keepChecking = true;  // This flag will control when to stop checking element tns3mwDiv
function checkElementsAndRun() {
    const mobileSlider = document.querySelector('.mobile-slider');
    const tns3mwDiv = mobileSlider ? mobileSlider.querySelector('#tns3-mw') : null;

    if (mobileSlider && tns3mwDiv) {
        displayDotNavigation();  // Call the function once the elements are available
    } else if (keepChecking) {
        // If the elements are not yet available, keep checking
        requestAnimationFrame(checkElementsAndRun);
    }
}

// Start checking tns3mwDiv as soon as the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    requestAnimationFrame(checkElementsAndRun);
    const sliderObserver = new MutationObserver(() => {
        const navButtons = document.querySelectorAll('.tns-outer .tns-nav button');
        if (navButtons.length > 0) {
            // Set initial tabindex for all buttons
            navButtons.forEach(btn => btn.setAttribute('tabindex', '0'));

            // Disconnect this observer as buttons are found
            sliderObserver.disconnect();

            // Function to update aria-selected on buttons
            function updateAriaSelected() {
                navButtons.forEach(btn => {
                    const isActive = btn.classList.contains('tns-nav-active');
                    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
                    btn.setAttribute('tabindex', '0');
                });
            }

            updateAriaSelected(); // Initial update

            // Observe class attribute changes on each button
            navButtons.forEach(btn => {
                const sliderBtnObserver = new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                        if (mutation.attributeName === 'class') {
                            updateAriaSelected();
                        }
                    });
                });
                sliderBtnObserver.observe(btn, { attributes: true });
            });
        }
    });

    sliderObserver.observe(document.body, { childList: true, subtree: true });
});

// Stop checking once the window has fully loaded (all resources are loaded)
window.onload = function() {
    keepChecking = false;  // Stop the checking once the window is fully loaded
};
// END MODIFICATION

module.exports = abSlider;
