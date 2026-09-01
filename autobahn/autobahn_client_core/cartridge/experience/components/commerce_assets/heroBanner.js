'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');
var VideoHelper = require('*/cartridge/scripts/experience/utilities/videoHelper.js');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var SiteConstants = require('*/cartridge/scripts/constants/SiteConstants');

/**
 * Render logic for the assets.heroBanner
 */
module.exports.render = function (context, modelIn) {
    var model = modelIn || new HashMap();
    var content = context.content;
    var component = context.component;
    var buttonVideoParams = {
        modal: true,
        inline: false,
        autoplay: 0,
        mute: 0,
        controls: 1,
        loop: 0,
        hasThumb: true
    }
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    response.setExpires(expiry);
    model.componentID = context.component.ID;
    model.backgroundImage = null;
    model.backgroundImageAlt = content.backgroundImageAlt || '';
    model.backgroundClass = content.backgroundClass || '';
    model.backgroundLink = content.backgroundLink || null;
    model.backgroundLinkIsExternalLink = model.backgroundLink !== null && model.backgroundLink.indexOf(request.httpHost) === -1;
    model.backgroundLinkOpenNewTab = content.backgroundLinkOpenNewTab || false;
    model.containerClass = content.containerClass || '';
    model.bannerType = content.bannerType.toLowerCase().split(' ').join('-');
    model.bannerHeight = content.bannerHeight.toLowerCase().split(' ').join('-');
    model.textblockBackground = content.textblockBackground.toLowerCase();
    model.textblockClass = content.textblockClass || '';
    model.textAlignment = 'text-' + content.textAlignment.toLowerCase();
    model.subtitle = content.subtitle || '';
    model.subtitleColor = content.subtitleColor ? 'color:' + content.subtitleColor + ';' : '';
    model.subtitleBackgroundColor = content.subtitleBackgroundColor ? 'background-color:' + content.subtitleBackgroundColor + ';' : '';
    model.title = content.title || '';
    model.titleColor = content.titleColor ? 'color:' + content.titleColor + ';' : '';
    model.titleBackgroundColor = content.titleBackgroundColor ? 'background-color:' + content.titleBackgroundColor + ';' : '';
    model.body = content.body || '';
    model.subtitleClass = content.subtitleClass || '';
    model.titleClass = content.titleClass || '';
    model.bodyClass = content.bodyClass || '';
    model.buttonsClass = content.buttonsClass || '';
    model.backgroundVideoPlayOnce = content.backgroundVideoPlayOnce || false;
    model.backgroundVideoPlayWhenFullyInView = content.backgroundVideoPlayWhenFullyInView || false;

    switch (content.contentStack) {
        case "Text in front of image (default)":
            model.contentStack = 'flex-row';
            break;
        case "Text below image on tablet and smaller":
            model.contentStack = 'flex-column flex-md-column';
            break;
        case "Text below image on mobile":
            model.contentStack = 'flex-column flex-md-row';
            break;
        default: // Text in front of image (default)
            model.contentStack = 'flex-row';
    }


    if (content.backgroundImage) {
        model.backgroundImage = {
            alt: content.backgroundImage.file.getAlt() || '',
            focalPointX: (content.backgroundImage.focalPoint.x * 100) + '%',
            focalPointY: (content.backgroundImage.focalPoint.y * 100) + '%',
            src: {
                mobile: ImageTransformation.url(content.backgroundImage, { device: 'mobile', format: 'webp', q:80 }),
                mobile2x: ImageTransformation.url(content.backgroundImage, { device: 'mobile2x', format: 'webp', q:80 }),
                tablet: ImageTransformation.url(content.backgroundImage, { device: 'tablet', format: 'webp', q:80 }),
                tablet2x: ImageTransformation.url(content.backgroundImage, { device: 'tablet2x', format: 'webp', q:80 }),
                desktop: ImageTransformation.url(content.backgroundImage, { device: 'desktop', format: 'webp', q:80 }),
                desktop2x: ImageTransformation.url(content.backgroundImage, { device: 'desktop2x', format: 'webp', q:80 })
            }
        };
    }

    if (model.backgroundLink) {
        var backgroundLinkVideoData = VideoHelper.getVideoDataFromUrl(model.backgroundLink);
        if (backgroundLinkVideoData.valid) {
            model.backgroundLinkVideo = {
                type: backgroundLinkVideoData.type,
                id: backgroundLinkVideoData.id,
                fileType: backgroundLinkVideoData.fileType,
                params: JSON.stringify(buttonVideoParams)
            }
        }
    }

    switch (content.textPlacement) {
        case "Top Left":
            model.textPlacement = 'align-items-start justify-content-md-start';
            model.textMobilePlacement = 'align-self-start';
            break;
        case "Top Center":
            model.textPlacement = 'align-items-start justify-content-md-center';
            model.textMobilePlacement = 'align-self-center';
            break;
        case "Top Right":
            model.textPlacement = 'align-items-start justify-content-md-end';
            model.textMobilePlacement = 'align-self-end';
            break;
        case "Middle Left":
            model.textPlacement = 'align-items-center justify-content-md-start';
            model.textMobilePlacement = 'align-self-start';
            break;
        case "Middle Right":
            model.textPlacement = 'align-items-center justify-content-md-end';
            model.textMobilePlacement = 'align-self-end';
            break;
        case "Bottom Left":
            model.textPlacement = 'align-items-end justify-content-md-start';
            model.textMobilePlacement = 'align-self-start';
            break;
        case "Bottom Center":
            model.textPlacement = 'align-items-end justify-content-md-center';
            model.textMobilePlacement = 'align-self-center';
            break;
        case "Bottom Right":
            model.textPlacement = 'align-items-end justify-content-md-end';
            model.textMobilePlacement = 'align-self-end';
            break;
        default: // Middle Center
            model.textPlacement = 'align-items-center justify-content-md-center';
            model.textMobilePlacement = 'align-self-center';
    }

    switch (content.textWidth) {
        case "1/4":
            model.textWidth = 'width-1-4';
            break;
        case "1/3":
            model.textWidth = 'width-1-3';
            break;
        case "1/2":
            model.textWidth = 'width-1-2';
            break;
        case "2/3":
            model.textWidth = 'width-2-3';
            break;
        case "3/4":
            model.textWidth = 'width-3-4';
            break;
        case "100%":
            model.textWidth = 'width-1';
            break;
        default: // 2/3
            model.textWidth = 'width-2-3';
    }

    if (content.colorTheme) {
        var theme = content.colorTheme;
        if (theme == "Light theme with black text") {
            model.colorTheme = "light-theme";
            model.textClass = "text--black";
        }
        else if (theme == "Dark theme with white text") {
            model.colorTheme = "dark-theme";
            model.textClass = "text--white";
        }
    }

    if (content.button1Action) {
        model.button1Action = content.button1Action;
        model.button1Text = content.button1Text;
        model.button1Color = content.button1Color ? 'color:' + content.button1Color + ';' : '';
        model.button1BackgroundColor = content.button1BackgroundColor ? 'background-color:' + content.button1BackgroundColor + ';' : '';
        model.button1Style = 'btn-' + content.button1Style.toLowerCase();
        model.button1Class = content.button1Class || '';
        model.button1IsExternalLink = content.button1Action.indexOf(request.httpHost) === -1;
        model.button1OpenNewTab = content.button1OpenNewTab || false;

        var button1VideoData = VideoHelper.getVideoDataFromUrl(model.button1Action);
        if (button1VideoData.valid) {
            model.button1Video = {
                type: button1VideoData.type,
                id: button1VideoData.id,
                fileType: button1VideoData.fileType,
                params: JSON.stringify(buttonVideoParams)
            }
        }
    }

    if (content.button2Action) {
        model.button2Action = content.button2Action;
        model.button2Text = content.button2Text;
        model.button2Style = 'btn-' + content.button2Style.toLowerCase();
        model.button2Class = content.button2Class || '';
        model.button2IsExternalLink = content.button2Action.indexOf(request.httpHost) === -1;
        model.button2OpenNewTab = content.button2OpenNewTab || false;

        var button2VideoData = VideoHelper.getVideoDataFromUrl(model.button2Action);
        if (button2VideoData.valid) {
            model.button2Video = {
                type: button2VideoData.type,
                id: button2VideoData.id,
                fileType: button2VideoData.fileType,
                params: JSON.stringify(buttonVideoParams)
            }
        }
    }

    if (content.button3Action) {
        model.button3Action = content.button3Action;
        model.button3Text = content.button3Text;
        model.button3Style = 'btn-' + content.button3Style.toLowerCase();
        model.button3Class = content.button3Class || '';
        model.button3IsExternalLink = content.button3Action.indexOf(request.httpHost) === -1;
        model.button3OpenNewTab = content.button3OpenNewTab || false;

        var button3VideoData = VideoHelper.getVideoDataFromUrl(model.button3Action);
        if (button3VideoData.valid) {
            model.button3Video = {
                type: button3VideoData.type,
                id: button3VideoData.id,
                fileType: button3VideoData.fileType,
                params: JSON.stringify(buttonVideoParams)
            }
        }
    }

    if (content.backgroundVideoURL) {
        var backgroundVideoData = VideoHelper.getVideoDataFromUrl(content.backgroundVideoURL);

        if (backgroundVideoData.valid) {
            var params = {
                modal: false,
                inline: true,
                autoplay: 1,
                mute: 1,
                controls: 0,
                loop: model.backgroundVideoPlayOnce ? 0 : 1,
                hasThumb: false
            }
            model.backgroundVideo = {
                type: backgroundVideoData.type,
                id: backgroundVideoData.id,
                fileType: backgroundVideoData.fileType,
                params: JSON.stringify(params)
            }
        }
    }

    switch (content.backgroundVideoAspectRatio) {
        case '4:3':
            model.backgroundVideoAspectRatioClass = 'aspect-ratio-4-3';
            break;
        case '3:4':
            model.backgroundVideoAspectRatioClass = 'aspect-ratio-3-4';
            break;
        case '9:16':
            model.backgroundVideoAspectRatioClass = 'aspect-ratio-9-16';
            break;
        case '1:1':
            model.backgroundVideoAspectRatioClass = 'aspect-ratio-1-1';
            break;
        default: // 16:9
            model.backgroundVideoAspectRatioClass = 'aspect-ratio-16-9';
    }

    // animations
    var animationDistance = content.textAnimationDistance.toLowerCase();
    model.subtitleAnimationDelay = content.subtitleAnimationDelay || SiteConstants.ComponentAnimationDelay;
    model.titleAnimationDelay = content.titleAnimationDelay || SiteConstants.ComponentAnimationDelay;
    model.embeddedAnimationDelay = content.embeddedAnimationDelay || SiteConstants.ComponentAnimationDelay;
    model.bodyAnimationDelay = content.bodyAnimationDelay || SiteConstants.ComponentAnimationDelay;
    model.buttonsAnimationDelay = content.buttonsAnimationDelay || SiteConstants.ComponentAnimationDelay;
    model.textAnimationPlayOnce = content.textAnimationPlayOnce || false;
    model.disableMobileAnimation = content.disableMobileAnimation || false;

    switch (content.textAnimation) {
        case 'Zoom in':
            model.textAnimation = 'scale-in-center--' + animationDistance;
            break;
        case 'Hinge drop':
            model.textAnimation = 'hinge-drop--' + animationDistance;
            break;
        case 'Flip in top':
            model.textAnimation = 'flip-in-hor-top--' + animationDistance;
            break;
        case 'Flip in bottom':
            model.textAnimation = 'flip-in-hor-bottom--' + animationDistance;
            break;
        case 'Slide in from top':
            model.textAnimation = 'slide-in-top--' + animationDistance;
            break;
        case 'Slide in from left':
            model.textAnimation = 'slide-in-left--' + animationDistance;
            break;
        case 'Slide in from right':
            model.textAnimation = 'slide-in-right--' + animationDistance;
            break;
        case 'Slide in from bottom':
            model.textAnimation = 'slide-in-bottom--' + animationDistance;
            break;
        case 'Fade in':
            model.textAnimation = 'fade-in--' + animationDistance;
            break;
        default:
            model.textAnimation = '';
    }

    model.regions = PageRenderHelper.getRegionModelRegistry(component);

    return new Template('experience/components/commerce_assets/heroBanner').render(model).text;
};
