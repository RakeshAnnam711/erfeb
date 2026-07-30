var ImageTransformation = {};
var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
var ContentImageBreakpoints = require('*/cartridge/experience/breakpoints');
var ContentImageQuality = abConfigs.contentImageQuality || 80;
var ContentImageFormat = abConfigs.contentImageFormat || 'jpg';  // can be 'webp'
var Image = require('dw/experience/image/Image');
var MediaFile = require('dw/content/MediaFile');

var transformationCapabilities = [
    'scaleWidth',
    'scaleHeight',
    'scaleMode',
    'imageX',
    'imageY',
    'imageURI',
    'cropX',
    'cropY',
    'cropWidth',
    'cropHeight',
    'format',
    'quality',
    'strip'
];

/**
 * Calculates the DIS transformation object based on device breakpoints.
 *
 * @param {Object} metaData the image meta data containing width/height
 * @param {string} device supported values: mobile, tablet, desktop
 * @return {Object} The scaled object
 */
ImageTransformation.scale = function (metaData, device) {
    var transformObj = null;

    if (metaData && device) {
        var targetWidth = ContentImageBreakpoints[device];

        // Downscale only if original is larger
        if (targetWidth && targetWidth < metaData.width) {
            transformObj = {
                scaleWidth: targetWidth,
                quality: ContentImageQuality,
                scaleMode: 'fit'
            };

            // Apply AB config format (default jpg)
            if (ContentImageFormat !== 'none') {
                transformObj.format = ContentImageFormat.toLowerCase();
            }
        }
    }

    return transformObj;
};

/**
 * Cleans up transformation object and only applies valid DIS parameters.
 *
 * @param {Object} options transformation params from caller
 * @param {Object} transform base transformation object
 * @return {Object} cleaned transformation object
 */
function constructTransformationObject(options, transform) {
    var result = transform || {};

    Object.keys(options).forEach(function (element) {
        // Must strictly check indexOf !== -1
        if (transformationCapabilities.indexOf(element) !== -1) {
            result[element] = options[element];
        }
    });

    return result;
}

/**
 * Provides a transformed URL for a given image.
 *
 * @param {Image|MediaFile} image the target image
 * @param {Object} options transformation options (may include device)
 * @return {string} Absolute URL
 */
ImageTransformation.url = function (image, options) {
    var transform = {};
    var mediaFile = image instanceof MediaFile ? image : image.file;

    // Device-based scaling
    if (image instanceof Image && options.device) {
        transform = ImageTransformation.scale(image.metaData, options.device) || {};
    }

    // Allow override of width/height
    if (options && options.scaleWidth) {
        transform.scaleWidth = options.scaleWidth;
    }
    if (options && options.scaleHeight) {
        transform.scaleHeight = options.scaleHeight;
    }

    // Merge allowed transformation parameters
    transform = constructTransformationObject(options || {}, transform);

    // Force WebP globally via AB config
    if (ContentImageFormat.toLowerCase() === 'webp') {
        transform.format = 'webp';
    }

    // Apply transformations if any exist
    if (transform && Object.keys(transform).length) {
        return mediaFile.getImageURL(transform);
    }

    return mediaFile.getAbsURL();
};

/**
 * Returns a full scaled image object (mobile/tablet/desktop)
 * including alt text + focal point.
 *
 * @param {Image} image experience Image object
 * @return {Object} image data object
 */
ImageTransformation.getScaledImage = function (image) {

    var mobileOptions = {
        device: 'mobile',
        format: 'webp',
        q: 80    
    };
    // Desktop forced WebP
    var desktopOptions = {
        device: 'desktop',
        format: 'webp', 
        q: 80
    };

    return {
        src: {
            mobile: ImageTransformation.url(image.file, mobileOptions),
            tablet: ImageTransformation.url(image.file, { device: 'tablet' }),
            desktop: ImageTransformation.url(image.file, desktopOptions)
        },
        alt: image.file.getAlt(),
        focalPointX: (image.focalPoint.x * 100) + '%',
        focalPointY: (image.focalPoint.y * 100) + '%'
    };
};

module.exports = ImageTransformation;