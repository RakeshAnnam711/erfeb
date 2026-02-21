'use strict';

function swatchSwitch(el) {
    var $swatch = el;
    var $tileParent = $swatch.parents('.product-tile');
    var pid = $tileParent.attr('data-pid');
    var $tileImage = $tileParent.find('.product-tile-image');
    var $tileImageHover = $tileParent.find('.product-tile-image-secondary');

    $tileParent.find('.swatch.selected').removeClass('selected');
    $swatch.addClass('selected');

    // Replace main image and secondary image
    if ($swatch.data('hover-image') && [null, undefined, '', $tileImage.attr('src')].indexOf($swatch.data('hover-image')) === -1) {
        var swatchImageUrl = $swatch.data('hover-image');
        $tileImage.attr('src', swatchImageUrl);

        if ($tileImageHover.length > 0 && $swatch.data('hover-image-secondary')) {
            var swatchSecondaryImageUrl = $swatch.data('hover-image-secondary');
            $tileImage.data('alt-img-url', swatchSecondaryImageUrl);
            $tileImageHover.attr('src', swatchSecondaryImageUrl);
        }
    }

    // Replace main link and Quickview link
    var swatchLink = $swatch.parents('.swatch-link');
    var splitSwatchLink = swatchLink.attr('href').split('?');
    var swatchLinkAttributes = splitSwatchLink[1];

    // Main Image Link
    var mainImageLink = $tileParent.find('.product-tile-image-link');
    var mainImageLinkSplit = mainImageLink.attr('href').split('?');
    mainImageLink.attr('href', mainImageLinkSplit[0] + '?' + swatchLinkAttributes);

    // Main Quickview Link
    var mainQuickViewLink = $tileParent.find('a.quickview');
    if (mainQuickViewLink.length) {
        // strip pid from params for quickview (gets added when Storefront URLs are disabled)
        var quickviewSwatchUrl = new URL(swatchLink.attr('href'), window.location.origin);
        quickviewSwatchUrl.searchParams.delete('pid');
        var quickviewQueryString = quickviewSwatchUrl.search.split('?')[1];

        mainQuickViewLink.attr('href', mainQuickViewLink.attr('href').split('?')[0] + '?' + 'pid=' + pid + '&' + quickviewQueryString);
    }

}

function hijackSwatchClick() {
    if (window.isMobile()) {
        $('body').on('click.swatch-link', '.product-tile .swatch-link', function(e) {
            e.preventDefault();
            var $swatch = $(this).find('.swatch');
            module.exports.methods.swatchSwitch($swatch);
        })
    }
    else {
        $('body').off('click.swatch-link');
    }
}

module.exports = {
    hijackSwatchClick: hijackSwatchClick,
    mouseEnter: function() {
        $('body').on('mouseenter', '.product-tile .swatch', function(e) {
            var $swatch = $(this);
            module.exports.methods.swatchSwitch($swatch);
        });
    },
    resize: function() {
        $(window).on('resize',function() {
            module.exports.hijackSwatchClick();
        });
    },
    methods: {
        swatchSwitch: swatchSwitch
    }
};
