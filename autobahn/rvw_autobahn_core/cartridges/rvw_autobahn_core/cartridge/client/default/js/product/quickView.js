'use strict';

var focusHelper = require('base/components/focus');
var modal = require('../components/modal');
const { updateAddAllToCart } = require('./detail');

/**
 * @typedef {Object} QuickViewHtml
 * @property {string} body - Main Quick View body
 * @property {string} footer - Quick View footer content
 */

/**
 * replaces the content in the modal window on for the selected product variation.
 * @param {string} selectedValueUrl - url to be used to retrieve a new product model
 */
function fillModalElement(selectedValueUrl) {
    var $modal = $('#quickViewModal');
    $modal.find('.modal-body').spinner().start();
    $.ajax({
        url: selectedValueUrl,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            var parsedHtml = modal.parseHtml(data.renderedTemplate);

            $modal.find('.modal-body').empty();
            $modal.find('.modal-body').html(parsedHtml.body);

            // Append assets from PDP Gallery Asset IDs attribute
            if ('pdpGalleryAssets' in data.product) {
                var pdpGalleryAssets = data.product.pdpGalleryAssets;
                var $assetSlides = $modal.find('.primary-images-main .pdp-gallery-asset');
                let hasVideo = false;

                $assetSlides.each((index, slide) => {
                    var $slideElement = $(slide);
                    var asset = pdpGalleryAssets[index];
                    if (asset.isVideo) {
                        hasVideo = true;
                    }

                    $.ajax({
                        url: asset.assetRenderUrl,
                        method: 'GET',
                        success: assetData => {
                            var $sliderContainer = $slideElement.closest('.slider-container');
                            $slideElement.html(assetData);

                            // after all assets are added, reinit any necessary javascript
                            if (index + 1 >= pdpGalleryAssets.length) {
                                $('body').trigger('quickview:ready', $('#quickViewModal')); // sending custom event for slider init
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
                });
            }

            $modal.find('.modal-footer').html(parsedHtml.footer);
            $modal.find('.full-pdp-link').text(data.quickViewFullDetailMsg);
            $modal.find('.full-pdp-link').attr('href', data.productUrl);
            $modal.find('.modal-header .close .sr-only').text(data.closeButtonText);
            $modal.find('.enter-message').text(data.enterDialogMessage);
            $modal.find('#quickViewModal').modal('show');

            if (data.dialogTitle) {
                $modal.find('.modal-header').prepend('<div class="modal-title">' + data.dialogTitle + '</div>')
            }

            if (data.product.productType === 'set') {
                updateAddAllToCart();
            }

            $('body').trigger('modal:loaded', $('#quickViewModal')); // sending custom event for scroll body sizing
            $('body').trigger('quickview:ready', $('#quickViewModal')); // sending custom event for slider init
            $('body').trigger('tooltip:init');

            $.spinner().stop();
        },
        error: function() {
            $.spinner().stop();
        }
    });
}

/**
 * replaces the content in the popover for the selected product.
 */
 function fillPopoverElement(quickAddToCartUrl, popover) {
    var $popover = $('#' + popover);
    $.ajax({
        url: quickAddToCartUrl,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            $popover.find('.popover-body').html(data.renderedTemplate);
            $popover.popover('update');
        }
    });
}

module.exports = {
    showQuickview: function() {
        $('body').on('click', '.quickview', function (e) {
            e.preventDefault();
            var selectedValueUrl = $(this).closest('a.quickview').attr('href');
            $(e.target).trigger('quickview:show');
            modal.getModalHtmlElement('quickViewModal', 'quick-view-dialog');
            fillModalElement(selectedValueUrl);
        });
    },
    showQuickAddToCart: function() {
        $('body').on('click', '.quick-add-to-cart', function (e) {
            e.preventDefault();
            var quickAddToCartUrl = $(this).closest('.quick-add-to-cart').data('url');
            var popover = $(this).closest('.quick-add-to-cart').attr('aria-describedby');
            $(e.target).trigger('quickAddToCart:show');
            fillPopoverElement(quickAddToCartUrl, popover);
        });
    },
    reInitShowQuickAddToCart: function() {
        $('body').on('search:sort--success search:showMore--success search:filter--success', function () {
            $('body').trigger('tooltip:init');
        })
    },
    hideQuickAddToCartSingleSelect: function() {
        $('body').on('product:afterAttributeSelect', function (e, response) {
            if ($(response.container).hasClass('product-quick-add-to-cart') && $('.product-quick-add-to-cart .single-select-quick-add-to-cart').length) {
                $('body').trigger('product:singleSelectQuickAddToCart', response);
                $('[data-toggle="popover"].interactive').popover('hide');
            }
        });
    },
    hideQuickAddToCart: function() {
        $('body').on('product:afterAddToCart', function (e) {
            $('[data-toggle="popover"].interactive').popover('hide');
        });
    },
    focusQuickview: function() {
        $('body').on('shown.bs.modal', '#quickViewModal', function() {
            $('#quickViewModal').siblings().attr('aria-hidden', 'false');
            $('#quickViewModal .close').focus();
        });
    },
    trapQuickviewFocus: function() {
        $('body').on('keydown', '#quickViewModal', function (e) {
            var focusParams = {
                event: e,
                containerSelector: '#quickViewModal',
                firstElementSelector: '.full-pdp-link',
                lastElementSelector: '.qv-product-edit-add',
                nextToLastElementSelector: '.modal-footer .quantity-select'
            };
            focusHelper.setTabNextFocus(focusParams);
        });
    },
    showSpinner: function() {
        $('body').on('product:beforeAddToCart', function (e, data) {
            $(data).closest('.modal-content').spinner().start();
        });
    },
    hideDialog: function() {
        $('body').on('product:afterAddToCart', function () {
            $('#quickViewModal').modal('hide');
            $('#quickViewModal').siblings().attr('aria-hidden', 'true');
        });
    },
    beforeUpdateAttribute: function() {
        $('body').on('product:beforeAttributeSelect', function () {
            $('.modal.show .modal-content').spinner().start();
        });
    }
};
