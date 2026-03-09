'use strict';

/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["model"] }] */
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');


/**
 * Helper to encapsulate common code for building a carousel
 *
 * @param {Object} model - model object for a component
 * @param {Object} context - model object for a component
 * @return {Object} model - prepared model
 */
function init(model, context) {
    model.regions = PageRenderHelper.getRegionModelRegistry(context.component);

    var numberOfSlides = 0;

    if (model.regions && model.regions.slides) {
        model.regions.slides.setClassName('slider');
        model.regions.slides.setComponentClassName('slide');

        numberOfSlides = model.regions.slides.region.size;
        model.numberOfSlides = model.regions.slides.region.size;
    } else {
        model.numberOfSlides = parseInt(context.content.count, 10) || 1;
    }

    for (var i = 0; i < numberOfSlides; i++) {
        model.regions.slides.setComponentAttribute('data-position', i, { position: i });
    }

    if (context.component.typeID === 'einstein.einsteinCarousel'
        || context.component.typeID === 'einstein.einsteinCarouselProduct'
        || context.component.typeID === 'einstein.einsteinCarouselCategory') {
        numberOfSlides = context.content.count;
    }

    model.id = 'slider-' + context.component.getID();

    model.slidesToDisplay = {
        sm: context.content.smCarouselSlidesToDisplay,
        md: context.content.mdCarouselSlidesToDisplay,
        lg: context.content.lgCarouselSlidesToDisplay
    };

    model.displayIndicators = {
        sm: context.content.smCarouselIndicators ? '' : 'slider-bullets-hidden',
        md: context.content.mdCarouselIndicators ? '' : 'slider-bullets-hidden-md',
        lg: context.content.lgCarouselIndicators ? '' : 'slider-bullets-hidden-lg'
    };

    model.insideIndicators = {
        sm: context.content.smInsideIndicators ? 'slider-bullets-inside' : '',
        md: context.content.mdInsideIndicators ? 'slider-bullets-inside-md' : '',
        lg: context.content.lgInsideIndicators ? 'slider-bullets-inside-lg' : ''
    };

    model.displayControls = {
        sm: context.content.smCarouselControls ? '' : 'slider-buttons-hidden',
        md: context.content.mdCarouselControls ? '' : 'slider-buttons-hidden-md',
        lg: context.content.lgCarouselControls ? '' : 'slider-buttons-hidden-lg'
    };

    model.insideControls = {
        sm: context.content.smInsideControls ? 'slider-buttons-inside' : '',
        md: context.content.mdInsideControls ? 'slider-buttons-inside-md' : '',
        lg: context.content.lgInsideControls ? 'slider-buttons-inside-lg' : ''
    };

    model.gutters = {
        sm: context.content.smGutter,
        md: context.content.mdGutter,
        lg: context.content.lgGutter,
    };

    model.percentageOfPrevSlide = {
        sm: 'prev-slide-' + calculateSliderPadding('sm', context.content.smGutter, context.content.smCarouselSlidesToDisplay, context.content.smPercentageOfPrevSlide),
        md: 'prev-slide-md-' + calculateSliderPadding('md', context.content.mdGutter, context.content.mdCarouselSlidesToDisplay, context.content.mdPercentageOfPrevSlide),
        lg: 'prev-slide-lg-' + calculateSliderPadding('lg', context.content.lgGutter, context.content.lgCarouselSlidesToDisplay, context.content.lgPercentageOfPrevSlide)
    };

    model.percentageOfNextSlide = {
        sm: 'next-slide-' + calculateSliderPadding('sm', context.content.smGutter, context.content.smCarouselSlidesToDisplay, context.content.smPercentageOfNextSlide),
        md: 'next-slide-md-' + calculateSliderPadding('lg', context.content.mdGutter, context.content.mdCarouselSlidesToDisplay, context.content.mdPercentageOfNextSlide),
        lg: 'next-slide-lg-' + calculateSliderPadding('lg', context.content.lgGutter, context.content.lgCarouselSlidesToDisplay, context.content.lgPercentageOfNextSlide),
    };

    if (context.component.typeID === 'einstein.einsteinCarousel'
        || context.component.typeID === 'einstein.einsteinCarouselProduct'
        || context.component.typeID === 'einstein.einsteinCarouselCategory') {
        model.numberOfSlides = context.content.count - 1;
    }

    model.containerClass = context.content.containerClass || '';
    model.title = context.content.textHeadline ? context.content.textHeadline : null;
    model.titleAlign = context.content.textHeadlineAlignment;
    model.titleClass = context.content.textHeadlineClass || '';
    model.titleFontSize  = context.content.titleFontSize ? context.content.titleFontSize : null;
    model.titleColor  = context.content.titleColor ? context.content.titleColor : null;
    model.disableLoop = context.content.disableLoop;
    model.speed = context.content.speed;
    model.mode = context.content.animation || 'carousel';
    model.animateIn = '';
    model.animateOut = '';
    model.paginationStyle = context.content.paginationStyle;
    model.pauseButtonPlacement = context.content.pauseButtonPlacement.toLowerCase().split(' ').join('-');
    model.controlsTheme = context.content.controlsTheme;

    switch (context.content.autoplay) {
        case "1 Second":
            model.autoplay = 1000;
            break;
        case "2 Seconds":
            model.autoplay = 2000;
            break;
        case "3 Seconds":
            model.autoplay = 3000;
            break;
        case "4 Seconds":
            model.autoplay = 4000;
            break;
        case "5 Seconds":
            model.autoplay = 5000;
            break;
        default:
            model.autoplay = false;
    };

    switch (context.content.animation) {
        case "None":
            model.mode = 'gallery';
            model.speed = '1';
            break;
        case "Fade In":
            model.mode = 'gallery';
            model.animateIn = 'fade-in';
            break;
        case "Zoom In":
            model.mode = 'gallery';
            model.animateIn = 'zoom-in';
            break;
        default:
            model.mode = 'carousel';
    }

    return model;
}

/**
 * Helper to calculate the percentage of the entire slider that a chosen percentage of a single slide equals based on static breakpoints
 *
 * @param {Object} screenSize - string for selecting the breakpoint to calculate for
 * @param {Object} gutterWidth - number of px selected as the slider gutter width
 * @param {Object} numberOfSlidesDisplayed - number of slides selected to display on the screen at one time
 * @param {Object} percentToDisplay - string representing the % of the next/previous slide to display
 * @return {Object} number - represents the percentage of the total slider width (at a static breakpoint) that is equal to percentToDisplay of a single slide
 */
function calculateSliderPadding(screenSize, gutterWidth, numberOfSlidesDisplayed, percentToDisplay) {
    if (percentToDisplay === '0%') {
        return '0';
    } else {
        var siteConstants = require('*/cartridge/scripts/constants/SiteConstants');
        var percentToDisplayToDecimal = (percentToDisplay.split('%')[0])/100;
        var sliderWidth = siteConstants.BreakpointSizes[screenSize];
        var slideWidth = (sliderWidth - ((numberOfSlidesDisplayed - 1)*gutterWidth))/numberOfSlidesDisplayed;

        var sliderPadding = Math.round((((slideWidth*percentToDisplayToDecimal)+(gutterWidth/2))/sliderWidth)*100);
        if (sliderPadding > 40) {
            sliderPadding = 40;
        }
        return sliderPadding;
    }
}

module.exports = {
    init: init
};
