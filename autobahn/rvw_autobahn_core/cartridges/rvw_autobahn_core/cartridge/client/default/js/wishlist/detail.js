'use strict';

var productBase = require('core/product/base');
var toastHelpers = require('core/components/toast');
var wishlistHelpers = require('core/wishlist/components/helpers');

const shareUrlHelpTimeout = 2000;

var unsetSelectedProductsState = function () {
    $('.wishlist-details-nav').addClass('open');
    $('.wishlist-details-deselect').addClass('d-none');
    $('.wishlist-details-public-toggle').removeClass('d-none').addClass('show');
    $('#wishlistOverlayDetailSelected').trigger('close');
    $('.wishlist-details')
        .find('.wishlist-card-product')
        .trigger('unselect');
};

var toggleSelectedProductsState = function () {
    if ($('.wishlist-card-product[data-selected="true"]').length) {
        $('.wishlist-details-nav').removeClass('open');
        $('.wishlist-details-deselect').removeClass('d-none');
        $('.wishlist-details-public-toggle').removeClass('show').addClass('d-none');
        if (
            $('.wishlist-card-product.product-type-master[data-selected="true"]').length
            || $('.wishlist-card-product.unavailable[data-selected="true"]').length
        ) {
            $('.wishlist-overlay-detail-selected-add').attr('disabled', true);
        } else {
            $('.wishlist-overlay-detail-selected-add').attr('disabled', false);
        }
        $('#wishlistOverlayDetailSelected').trigger('open');
    } else {
        unsetSelectedProductsState();
    }
};

var eventKeyPressEscapeWindow = function (e) {
    if (e.key && e.key === 'Escape') {
        unsetSelectedProductsState();
    }
};

var eventUpdateProducts = function (e, $products) {
    $.spinner().start();
    unsetSelectedProductsState();
    $('.wishlist-details')
        .find('.wishlist-details-products')
        .replaceWith($products);
    productBase.enableQuantitySteppers();
    $.spinner().stop();
};

var eventClickSelectAll = function (e) {
    e.preventDefault();
    $('.wishlist-details')
        .find('.wishlist-card-product')
        .trigger('select');
    toggleSelectedProductsState();
};

var eventClickDeselect = function (e) {
    e.preventDefault();
    unsetSelectedProductsState();
};

var eventClickShare = function (e) {
    e.preventDefault();
};

var eventClickAddToCart = function (e) {
    e.preventDefault();
    var $this = $(this);
    var $products = $this.parents('.wishlist-details').find('.wishlist-card-product:not(.unavailable):not(.product-type-master)');
    var addToCartUrl = $this.data().url;
    var pidsObj = [];

    $products.each(function () {
        var $product = $(this);
        if ($product.hasClass('product-type-set')) {
            var toastMessage = $product.data('message');
            toastHelpers.methods.show('danger', toastMessage, true);
        } else {
            pidsObj.push({
                pid: $product.data().pid,
                qty: $product.find('.wishlist-card-product-quantity').val(),
                options: $product.find('.wishlist-card-product-add').attr('data-options')
            });
        }
    });

    if (pidsObj.length) {
        $.spinner().start();
        pidsObj = JSON.stringify(pidsObj);
        $.ajax({
            url: addToCartUrl,
            method: 'POST',
            data: {
                pidsObj
            },
            success: function (data) {
                productBase.methods.handlePostCartAdd(data);
                $('body').trigger('product:afterAddToCart', data);
                productBase.methods.miniCartReportingUrl(data.reportingURL, data.error);

                 // Loop through pidsObj to update button state
                JSON.parse(pidsObj).forEach(function (product) {
                    var productID = product.pid;
                    $(`div.card.wishlist-card-product.product-tile[data-pid="${productID}"]`)
                        .find('button.wishlist-card-product-add')
                        .text('Added To Cart')
                        .addClass('disabled');
                });

                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
};

var eventShowMore = function (e) {
    e.stopPropagation();
    e.preventDefault();

    var showMoreUrl = $(this).data('url');
    $.spinner().start();

    $.ajax({
        url: showMoreUrl,
        data: { selectedUrl: showMoreUrl },
        method: 'GET',
        success: function (response) {
            var $updatedProducts = $(response).find('.wishlist-details-products');
            $('.wishlist-details-products').replaceWith($updatedProducts);
            window.history.replaceState(null, '', showMoreUrl);
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
};

var addDetailEventListeners = function () {
    if ($('.wishlist-details').length) {
        $(window)
            .on('keydown', module.exports.methods.eventKeyPressEscapeWindow);
        $('.wishlist-details')
            .on('updateProducts', module.exports.methods.eventUpdateProducts)
            .on('afterSelectProduct', module.exports.methods.toggleSelectedProductsState)
            .on('unselectAllProducts', module.exports.methods.unsetSelectedProductsState)
            .on('click', '.wishlist-details-select-all', module.exports.methods.eventClickSelectAll)
            .on('click', '.wishlist-details-share', module.exports.methods.eventClickShare)
            .on('click', '.wishlist-details-add-cart', module.exports.methods.eventClickAddToCart)
            .on('click', '.wishlist-details-deselect', module.exports.methods.eventClickDeselect)
            .on('click', '.show-more-wishlist-products .btn', module.exports.methods.eventShowMore)
    }
};

/**
 * Share List Modal
 */
var shareListModalEventSubmitCopy = function (e) {
    e.preventDefault();

    var $shareUrlHelp = $('#wishlistExperienceShareUrlHelp');
    var copyText = document.getElementById('wishlistExperienceShareUrl');

    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    $shareUrlHelp.removeClass('d-none');

    setTimeout(() => {
        $shareUrlHelp.addClass('d-none');
    }, shareUrlHelpTimeout);
};

var shareListModalEventClose = function () {
    //reset the forms
    var $shareUrl = $('#wishlistExperienceShareUrl');
    $shareUrl.val($shareUrl.data().url);
    $('#wishlistExperienceShareEmail').val('');
};

var addShareListModalEventListeners = function() {
    if ($('.wishlist-details').length) {
        $('#wishlistModalShareList')
            .on('submit', '.copy', module.exports.methods.shareListModalEventSubmitCopy)
            .on('hidden.bs.modal', module.exports.methods.shareListModalEventClose);
    }
};

/**
 * Delete Products Modal
 */
var deleteProductsModalEventClose = function(e) {
    $(this).data({listId: '', listItemIds: ''});
};

var deleteProductsModalEventClickDelete = function(e) {
    e.preventDefault();
    var $modal = $('#wishlistModalDeleteProducts');
    var detailPageSize = wishlistHelpers.getUrlParam('sz') ? Number(wishlistHelpers.getUrlParam('sz')) : null;
    $.spinner().start();
    $.ajax({
        url: $modal.data().url,
        method: 'POST',
        dataType: 'json',
        data: {
            listId: $modal.data().listId,
            listItemIds: JSON.stringify($modal.data().listItemIds),
            detailPageSize: detailPageSize
        },
        success: function(data) {
            var $productsHtml = $(data.renderedTemplate);
            if (!data.error && $productsHtml.length) {
                $('.wishlist-details').trigger('updateProducts', $productsHtml);
                $('.wishlist-overlay-detail-selected').trigger('close');
            } else {
                toastHelpers.methods.show('danger', data.message, true);
                $.spinner().stop();
            }
            $modal.modal('hide');
        },
        error: function() {
            $modal.modal('hide');
            $.spinner().stop();
        }
    });
}

var addDeleteProductsModalEventListeners = function() {
    if ($('.wishlist-details').length) {
        $('#wishlistModalDeleteProducts')
            .on('click', '.wishlist-modal-delete-list-delete-button', module.exports.methods.deleteProductsModalEventClickDelete)
            .on('hidden.bs.modal', module.exports.methods.deleteProductsModalEventClose);
    }
};

/**
 * Overlay Detail Selected
 */
var closeOverlay = function() {
    $('.wishlist-overlay-detail-selected')
        .attr('tabindex', -1)
        .attr('aria-hidden', 'true')
        .removeClass('open');
};

var overlayDeselectAll = function() {
    $('.wishlist-details').trigger('unselectAllProducts');
};

var overlayGetSelectedListAndProducts = function() {
    var $productListDetail = $('.wishlist-details');
    var $products = $productListDetail.find('.wishlist-card-product[data-selected="true"]');
    var listId = $productListDetail.data().listId;
    var pids = [];
    var listItemIds = [];
    var pidsObj = [];
    $products.each(function() {
        var $product = $(this);
        pids.push($product.data().pid);
        listItemIds.push($product.data().listItemId);
        pidsObj.push({
            pid: $product.data().pid,
            qty: $product.find('.wishlist-card-product-quantity').val(),
            options: $product.find('.wishlist-card-product-add').attr('data-options')
        });
    });
    return {
        listId,
        listItemIds,
        pids,
        pidsObj
    };
};

var eventOpenOverlay = function() {
    $(this)
        .attr('tabindex', 0)
        .attr('aria-hidden', 'false')
        .addClass('open');
};

var eventOverlayClickAddToCart = function(e) {
    e.preventDefault();
    var selectedListAndProducts = module.exports.methods.overlayGetSelectedListAndProducts();
    var addToCartUrl = $(this).data().url;
    if (selectedListAndProducts.pidsObj.length) {
        $.spinner().start();
        var originalPidsObj = selectedListAndProducts.pidsObj.slice(); 
        selectedListAndProducts.pidsObj = JSON.stringify(selectedListAndProducts.pidsObj);
        $.ajax({
            url: addToCartUrl,
            method: 'POST',
            data: {
                pidsObj: selectedListAndProducts.pidsObj
            },
            success: function (data) {
                productBase.methods.handlePostCartAdd(data);
                $('body').trigger('product:afterAddToCart', data);
                module.exports.methods.overlayDeselectAll();
                productBase.methods.miniCartReportingUrl(data.reportingURL, data.error);

                originalPidsObj.forEach(function (product) {
                    var productID = product.pid;
                    $(`div.card.wishlist-card-product.product-tile[data-pid="${productID}"]`)
                        .find('button.wishlist-card-product-add')
                        .text('Added To Cart')
                        .addClass('disabled');
                });

                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
};

var eventOverlayClickShare = function(e) {
    e.preventDefault();
};

var eventOverlayClickMove = function(e) {
    e.preventDefault();
    var selectedListAndProducts = module.exports.methods.overlayGetSelectedListAndProducts();
    $('#wishlistModalShowLists')
        .data('listId', selectedListAndProducts.listId)
        .data('listItemIds', selectedListAndProducts.listItemIds)
        .data('multiSelect', false)
        .data('action', 'move')
        .modal('show');
    module.exports.methods.overlayDeselectAll();
};

var eventOverlayClickRemove = function(e) {
    e.preventDefault();
    var selectedListAndProducts = module.exports.methods.overlayGetSelectedListAndProducts();
    $('#wishlistModalDeleteProducts')
        .data('listId', selectedListAndProducts.listId)
        .data('listItemIds', selectedListAndProducts.listItemIds)
        .modal('show');
};

var addOverlayDetailSelectedEventListeners = function() {
    if ($('.wishlist-details').length) {
        $('.wishlist-overlay-detail-selected')
            .on('open', module.exports.methods.eventOpenOverlay)
            .on('close', module.exports.methods.closeOverlay)
            .on('click', '.wishlist-overlay-detail-selected-close', module.exports.methods.overlayDeselectAll)
            .on('click', '.wishlist-overlay-detail-selected-add', module.exports.methods.eventOverlayClickAddToCart)
            .on('click', '.wishlist-overlay-detail-selected-share', module.exports.methods.eventOverlayClickShare)
            .on('click', '.wishlist-overlay-detail-selected-move', module.exports.methods.eventOverlayClickMove)
            .on('click', '.wishlist-overlay-detail-selected-remove', module.exports.methods.eventOverlayClickRemove);
    }
};

/**
 * Card Product
 */
var cardProductEventSelect = function(e) {
    $(e.target)
        .attr('data-selected', true)
        .data('selected', true)
        .find('.wishlist-card-product-toggle')
        .addClass('selected');
};

var cardProductEventUnselect = function(e) {
    $(e.target)
        .attr('data-selected', false)
        .data('selected', false)
        .find('.wishlist-card-product-toggle')
        .removeClass('selected');
};

var cardProductEventChangeQuantity = function(e) {
    var $this = $(this);
    var $cardProduct = $this.parents('.wishlist-card-product');
    $.ajax({
        url: $cardProduct.data().url,
        method: 'POST',
        data: {
            quantity: $this.val(),
            wishlistId: $cardProduct.data().listId,
            productListItemId: $cardProduct.data().listItemId
        },
        dataType: 'json',
        success: function (data) {
            if (data.error) {
                toastHelpers.methods.show('danger', data.message, true);
            }
        }
    });
};

var cardProductEventClickAddCart = function(e) {
    e.preventDefault();
    $.spinner().start();
    var $this = $(this);
    var $cardProduct = $this.parents('.wishlist-card-product');
    var addToCartUrl = $this.data().url;
    var pid = $cardProduct.data('pid');
    var quantity = $cardProduct.find('.wishlist-card-product-quantity').val();
    var options = JSON.stringify($this.data().options);
    $.ajax({
        url: addToCartUrl,
        method: 'POST',
        data: {
            pid,
            quantity,
            options
        },
        dataType: 'json',
        success: function (data) {
            try {
                $(e.target).text('Added To Cart').prop('disabled', true);
            } catch (error) {
                console.error('Failed to update Add to Cart button:', error);
            }
            productBase.methods.handlePostCartAdd(data);
            $('body').trigger('product:afterAddToCart', data);
            productBase.methods.miniCartReportingUrl(data.reportingURL, data.error);
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
};

var cardProductEventClickRemove = function(e) {
    e.preventDefault();
    $('#wishlistModalDeleteProduct')
        .modal('show', $(this));
};

var cardProductEventClickCheckbox = function(e) {
    e.preventDefault();
    var $this = $(this);
    var $cardProduct = $this.parents('.wishlist-card-product');
    if ($cardProduct.data().selected === true) {
        $this.removeClass('selected');
        $cardProduct
            .attr('data-selected', false)
            .data('selected', false);
    } else {
        $this.addClass('selected');
        $cardProduct
            .attr('data-selected', true)
            .data('selected', true);
    }
    $('.wishlist-details').trigger('afterSelectProduct');
};

var addCardProductEventListeners = function() {
    if ($('.wishlist-details').length) {
        $('body')
            .on('select', '.wishlist-card-product', module.exports.methods.cardProductEventSelect)
            .on('unselect', '.wishlist-card-product', module.exports.methods.cardProductEventUnselect)
            .on('click', '.wishlist-card-product-toggle', module.exports.methods.cardProductEventClickCheckbox)
            .on('change', '.wishlist-card-product-quantity', module.exports.methods.cardProductEventChangeQuantity)
            .on('click', '.wishlist-card-product-add', module.exports.methods.cardProductEventClickAddCart)
            .on('click', '.wishlist-card-product-remove', module.exports.methods.cardProductEventClickRemove);
    }
};

/**
 * Delete Product Modal
 */
var deleteProductModalEventShow = function(e) {
    $(this)
        .attr({
            'data-list-id': e.relatedTarget.data().listId,
            'data-list-item-id': e.relatedTarget.data().listItemId
        })
        .data({
            listId: e.relatedTarget.data().listId,
            listItemId: e.relatedTarget.data().listItemId
        });
};

var deleteProductModalEventClose = function(e) {
    $(this)
        .attr({
            'data-list-id': '',
            'data-list-item-id': ''
        })
        .data({
            listId: '',
            listItemId: ''
        });
};

var deleteProductModalEventClickDelete = function(e) {
    e.preventDefault();
    var $modal = $('#wishlistModalDeleteProduct');
    var detailPageSize = wishlistHelpers.getUrlParam('sz') ? Number(wishlistHelpers.getUrlParam('sz')) : null;
    $.spinner().start();
    $.ajax({
        url: $modal.data().url,
        method: 'POST',
        dataType: 'json',
        data: {
            listId: $modal.data().listId,
            listItemId: $modal.data().listItemId,
            detailPageSize: detailPageSize
        },
        success: function(data) {
            var $productsHtml = $(data.renderedTemplate);
            if (!data.error && $productsHtml.length) {
                $('.wishlist-details').trigger('updateProducts', $productsHtml);
            } else {
                toastHelpers.methods.show('danger', data.message, true);
                $.spinner().stop();
            }
            $modal.modal('hide');
        },
        error: function() {
            $modal.modal('hide');
            $.spinner().stop();
        }
    });
}

var addModalDeleteProductEventListeners = function() {
    if ($('.wishlist-details').length) {
        $('#wishlistModalDeleteProduct')
            .on('click', '.wishlist-modal-delete-product-delete-btn', module.exports.methods.deleteProductModalEventClickDelete)
            .on('show.bs.modal', module.exports.methods.deleteProductModalEventShow)
            .on('hidden.bs.modal', module.exports.methods.deleteProductModalEventClose);
    }
};

/**
 * Quickview Modal
 */
var quickviewModalEventClickUpdate = function(e) {
    e.preventDefault(e);

    var $this = $(this);
    var $modal = $('#quickViewModal');
    var detailPageSize = wishlistHelpers.getUrlParam('sz') ? Number(wishlistHelpers.getUrlParam('sz')) : null;
    var form = {
        pid: $this.data().pid,
        pidUpdated: $this.data().pidUpdated,
        uuid: $this.data().uuid,
        listId: $('.wishlist-details').data().listId,
        selectedOptionValueIds: productBase.methods.getOptions($modal),
        detailPageSize: detailPageSize
    };

    $modal.find('.modal-content').spinner().start();
    $.ajax({
        url: $this.data().url,
        type: 'POST',
        data: form,
        dataType: 'json',
        success: function (data) {
            var $productsHtml = $(data.renderedTemplate);
            if (!data.error && $productsHtml.length) {
                $('.wishlist-details').trigger('updateProducts', $productsHtml);
                wishlistHelpers.updateUncachedData({
                    actionType: 'change',
                    pid: form.pid,
                    pidUpdated: form.pidUpdated
                });
            } else {
                toastHelpers.methods.show('danger', data.message, true);
                $modal.find('.modal-content').spinner().stop();
            }
            $modal.modal('hide');
        },
        error: function () {
            $modal.modal('hide');
            $modal.find('.modal-content').spinner().stop();
        }
    });
};

var quickviewModalEventUpdateFromQuickView = function(e, payload) {
    var $updateButton = payload.container.closest('.modal').find('.btn-update-wishlist');
    if (payload.data.product.masterId) {
        $updateButton
            .data('pid-updated', payload.data.product.id)
            .attr('data-pid-updated', payload.data.product.id)
            .removeAttr('disabled');
    } else {
        $updateButton
            .data('pid-updated', payload.data.product.id)
            .attr('data-pid-updated', payload.data.product.id)
    }
};

var addQuickviewModalventListeners = function() {
    if ($('.wishlist-details').length) {
        $('body')
            .on('click', '.btn-update-wishlist', module.exports.methods.quickviewModalEventClickUpdate)
            .on('product:afterAttributeSelect', module.exports.methods.quickviewModalEventUpdateFromQuickView);
    }
};

/**
 * Detail Notes
 */
var addDetailNotesEventListeners = function() {
    if ($('.wishlist-details').length) {
        $('#wishlistDetailNotes').data('currentNoteText', $('#wishlistDetailNotesText').val());
    
        $('#wishlistDetailNotes')
            .on('click', '.wishlist-detail-notes-toggle', (event) => {
                event.preventDefault();
                $('.wishlist-detail-notes-text-show').add($('.wishlist-detail-notes-text-hide')).toggleClass('d-none');
            })
            .on('blur', '#wishlistDetailNotesText', () => {
                var $detailNotes = $('#wishlistDetailNotes');
                var $detailNotesTextarea = $detailNotes.find('#wishlistDetailNotesText');
                var currentNoteText = $detailNotes.data('currentNoteText').trim();
                var updatedNoteText = $detailNotesTextarea.val().trim();

                if (updatedNoteText !== currentNoteText) {
                    $detailNotes.data('currentNoteText', updatedNoteText);
                    $.ajax({
                        url: $detailNotes.data().url,
                        method: 'POST',
                        dataType: 'json',
                        data: {
                            wishlistId: $detailNotes.data().wishlistId,
                            productListDescription: updatedNoteText
                        },
                        success: function(data) {
                            if (data.error) {
                                toastHelpers.methods.show('danger', data.message, true);
                            }
                        }
                    });
                }
            }
        );
    }
}

module.exports = {
    methods: {
        unsetSelectedProductsState: unsetSelectedProductsState,
        toggleSelectedProductsState: toggleSelectedProductsState,
        eventKeyPressEscapeWindow: eventKeyPressEscapeWindow,
        eventUpdateProducts: eventUpdateProducts,
        eventClickSelectAll: eventClickSelectAll,
        eventClickDeselect: eventClickDeselect,
        eventClickShare: eventClickShare,
        eventClickAddToCart: eventClickAddToCart,
        eventShowMore: eventShowMore,
        shareListModalEventSubmitCopy: shareListModalEventSubmitCopy,
        shareListModalEventClose: shareListModalEventClose,
        deleteProductsModalEventClose: deleteProductsModalEventClose,
        deleteProductsModalEventClickDelete: deleteProductsModalEventClickDelete,
        closeOverlay: closeOverlay,
        overlayDeselectAll: overlayDeselectAll,
        overlayGetSelectedListAndProducts: overlayGetSelectedListAndProducts,
        eventOpenOverlay: eventOpenOverlay,
        eventOverlayClickAddToCart: eventOverlayClickAddToCart,
        eventOverlayClickShare: eventOverlayClickShare,
        eventOverlayClickMove: eventOverlayClickMove,
        eventOverlayClickRemove: eventOverlayClickRemove,
        cardProductEventSelect: cardProductEventSelect,
        cardProductEventUnselect: cardProductEventUnselect,
        cardProductEventChangeQuantity: cardProductEventChangeQuantity,
        cardProductEventClickAddCart: cardProductEventClickAddCart,
        cardProductEventClickRemove: cardProductEventClickRemove,
        cardProductEventClickCheckbox: cardProductEventClickCheckbox,
        deleteProductModalEventShow: deleteProductModalEventShow,
        deleteProductModalEventClose: deleteProductModalEventClose,
        deleteProductModalEventClickDelete: deleteProductModalEventClickDelete,
        quickviewModalEventClickUpdate: quickviewModalEventClickUpdate,
        quickviewModalEventUpdateFromQuickView: quickviewModalEventUpdateFromQuickView
    },
    addDetailEventListeners: addDetailEventListeners,
    addShareListModalEventListeners: addShareListModalEventListeners,
    addDeleteProductsModalEventListeners: addDeleteProductsModalEventListeners,
    addOverlayDetailSelectedEventListeners: addOverlayDetailSelectedEventListeners,
    addCardProductEventListeners: addCardProductEventListeners,
    addModalDeleteProductEventListeners: addModalDeleteProductEventListeners,
    addQuickviewModalventListeners: addQuickviewModalventListeners,
    addDetailNotesEventListeners: addDetailNotesEventListeners
};
