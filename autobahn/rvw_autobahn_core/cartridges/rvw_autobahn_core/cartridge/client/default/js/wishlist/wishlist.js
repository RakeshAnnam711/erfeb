'use strict';

var modal = require('core/components/modal');
var base = require('core/product/base');
var focusHelper = require('base/components/focus');
var processInclude = require('base/util');
var wishlistHelpers = require('core/wishlist/components/helpers');

const editWishlistProductModalSelector = '#editWishlistProductModal';

//TODO RVW: theres some old functions in here from the deprecated wishlist that should be removed
/**
 * shows wishlist toast message
 * @param {string} data - data returned from the server's ajax call
 */
function displayMessage(data) {
    $.spinner().stop();
    var status = data.success ? 'alert-success' : 'alert-danger';

    if ($('.add-to-wishlist-messages').length === 0) {
        $('body').append('<div class="add-to-wishlist-messages toast-messages"></div>');
    }

    $('.add-to-wishlist-messages').append('<div class="alert text-center add-to-wishlist-alert text-center ' + status + '">' + (data.message || data.msg) + '</div>');

    setTimeout(function () {
        $('.add-to-wishlist-messages').remove();
    }, 5000);
}

function displayWishlistToast(data) {
    $.spinner().stop();
    wishlistHelpers.openToast(data);
}

/**
 * update window wishlist data
 * @param {string} data - data returned from the server's ajax call
 */
function updateWishlistUncachedData(data) {
    if (data.success) {
        var wishlistPIDs = new Set(window.UncachedData.wishlistPIDs);
        if (data.wishlistActionType && data.wishlistActionType === 'add') {
            wishlistPIDs.add(data.pid);
        } else {
            wishlistPIDs.delete(data.pid);
        }

        window.UncachedData.wishlistPIDs = Array.from(wishlistPIDs);
    }
}

/**
 * update clicked links attributes and text
 * @param {Object} specificLinks - jQuery object representing selection of wishlist links
 */
function updateWishlistLinkData(specificLinks) {
    if (!window || !window.UncachedData || !window.UncachedData.wishlistPIDs) {
        return;
    }

    // WGACA MODIFICATION - Enhanced prop selector
    // var wishlistLinks = specificLinks || $('a.wishlist');
    var wishlistLinks = specificLinks || $('button.wishlist, a.wishlist, button.wishlist-toggle-product');
    if (!wishlistLinks || !wishlistLinks.length) {
        return;
    }

    var wishlistPIDs = new Set(window.UncachedData.wishlistPIDs);

    wishlistLinks.each((_i, wishlistLink) => {
        var $wishlistLink = $(wishlistLink);
        var wishlistpid = $wishlistLink.attr('data-wishlistpid');
        if (wishlistpid) {
            var isInWishlist = wishlistPIDs.has(wishlistpid);

            $wishlistLink.attr('data-inwishlist', isInWishlist);
            if (isInWishlist) {
                $wishlistLink.attr('title', $wishlistLink.attr('data-removemessage'));
                if ($wishlistLink.data('includetext') === true) {
                    $wishlistLink.find('span').html($wishlistLink.attr('data-removemessage'));
                }
            } else {
                $wishlistLink.attr('title', $wishlistLink.attr('data-addmessage'));
                if ($wishlistLink.data('includeicon') === true) {
                    $wishlistLink.find('span').html($wishlistLink.attr('data-addmessage'));
                }
            }

            var icon = $wishlistLink.find('.wishlist-icon');
            if (icon && icon.length) {
                $(icon).toggleClass('selected', isInWishlist);
            }
        }
    });
}


/**
 * update clicked links attributes and text
 * @param {string} data - data returned from the server's ajax call
 * @param {Object} $targetElement - the element that needs caused the need for a modal change
 */
function updateWishlistCartStatus(data, $targetElement) {
    if (data.success && data.add && $targetElement.hasClass('move')) {
        var itemToMove = {
            actionUrl: $targetElement.data('nextaction'),
            productID: $targetElement.data('wishlistpid'),
            productName: $targetElement.data('productname'),
            uuid: $targetElement.data('uuid')
        };

        // listener prefills #removeProductModal
        $('body').trigger('afterRemoveFromCart', itemToMove);

        setTimeout(function () {
            $('#removeProductModal').modal();
        }, 1000);
    }
}

/**
 * update display of items after a cart update (edit item in modal on cart show)
 */
function cartUpdate() {
    $('body').on('cart:update', function(e, data, uuid) {
        var updatedProduct = $('a.wishlist[data-uuid=' + uuid + ']');
        if (updatedProduct.length) {
            //TODO RVW is this good enough or do I need to update wishlist icon name/messaging etc...
            updatedProduct.attr('data-wishlistpid', data.newProductId);
            module.exports.updateWishlistLinkData();
        }
    });
}

/**
 * attach onclick for wishlist icon toggle functionality
 */
function toggleWishlist() {
    // WGACA MODIFICATION - Enhanced prop selector
    // $('body').on('click', 'a.wishlist', function (e) {
    $('body').on('click', 'button.wishlist, a.wishlist', function (e) {
        var clicked = $(this);
        e.preventDefault();
        // WGACA MODIFICATION - Enhanced prop selector
        // var url = clicked.attr('href');
        var url = clicked.data('href') || clicked.attr('href');
        var wishlistpid = clicked.attr('data-wishlistpid');
        if (!url || !wishlistpid) {
            return;
        }

        var core = require('core/product/base');

        $.spinner().start();
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: {
                pid: wishlistpid,
                quantity: 1
            },
            success: function (data) {
                module.exports.methods.displayWishlistToast(data);
                module.exports.methods.updateWishlistUncachedData(data);
                module.exports.updateWishlistLinkData();
                module.exports.methods.updateWishlistCartStatus(data, clicked);
            },
            error: function (err) {
                module.exports.methods.displayMessage(err);
            }
        });
    });
}

/**
 * make link button work on wishlist social icons to create a sharing url
 */
function copyWishlistLink() {
    $('body').on('click', '.wl-social .share-link', function () {
        var $temp = $('<input>');
        $('body').append($temp);
        $temp.val($('#wlShareUrl').val()).select();
        document.execCommand('copy');
        $temp.remove();
        $('.copy-link-message').removeClass('d-none');
        setTimeout(function () {
            $('.copy-link-message').addClass('d-none');
        }, 3000);
    });
}

/**
 * attach on quickview:ready listener so that icon is correct in quickview on load
 */
function updateQuickView(e) {
    $('body').on('quickview:ready', function() {
        module.exports.updateWishlistLinkData();
    });
}

/**
 * attach on click on wishlist-show edit button to launch modal
 */
function viewProductViaEdit() {
    $('body').on('click', '.edit-add-to-wishlist .edit', function (e) {
        e.preventDefault();

        var editProductUrl = $(this).attr('href');
        $(e.target).trigger('editwishlistproduct:show');
        modal.getModalHtmlElement('editWishlistProductModal', 'quick-view-dialog');
        fillModalElement(editProductUrl);
    });
}

/**
 * replaces the content in the modal window for product variation to be edited.
 * @param {string} editProductUrl - url to be used to retrieve a new product model
 */
//TODO RVW unified in some way with quickView.js fillModalElement function?
function fillModalElement(editProductUrl) {
    var $modal = $(editWishlistProductModalSelector);
    $modal.find('.modal-body').spinner().start();
    $.ajax({
        url: editProductUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            var parsedHtml = modal.parseHtml(data.renderedTemplate);

            $modal.find('.modal-body').empty();
            $modal.find('.modal-body').html(parsedHtml.body);
            $modal.find('.modal-footer').html(parsedHtml.footer);
            $modal.find('.modal-header .close .sr-only').text(data.closeButtonText);
            $modal.find('.enter-message').text(data.enterDialogMessage);
            $modal.find(editWishlistProductModalSelector).modal('show');

            $('body').trigger('editwishlistproduct:ready', $(editWishlistProductModalSelector));

            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}


/**
 * handles opening wishlist modal
 */
function focusEditWishlistProductModal() {
    $('body').on('shown.bs.modal', editWishlistProductModalSelector, function () {
        $(editWishlistProductModalSelector).siblings().attr('aria-hidden', 'true');
        $(editWishlistProductModalSelector + ' .close').focus();
    });
}

/**
 * handles closing wishlist modal
 */
function onClosingEditWishlistProductModal() {
    $('body').on('hidden.bs.modal', editWishlistProductModalSelector, function () {
        $(editWishlistProductModalSelector).remove();
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open');

        $(editWishlistProductModalSelector).siblings().attr('aria-hidden', 'false');
    });
}

/**
 * handles tabbing on wishlist modal
 */
function trapEditWishlistProductModalFocus() {
    $('body').on('keydown', editWishlistProductModalSelector, function (e) {
        var focusParams = {
            event: e,
            containerSelector: editWishlistProductModalSelector,
            firstElementSelector: '.close',
            lastElementSelector: '.btn-update-wishlist',
            nextToLastElementSelector: '.select-size'
        };
        focusHelper.setTabNextFocus(focusParams);
    });
}



/**
 * renders the list up to a given page number
 * @param {number} pageNumber - current page number
 * @param {boolean} spinner - if the spinner has already started
 * @param {string} focusElementSelector - selector of the element to focus on
 */
function renderNewPageOfItems(pageNumber, spinner, focusElementSelector) {
    var publicView = $('.wishlist-item-cards-data').data('public-view');
    var listUUID = $('.wishlist-item-cards-data').data('uuid');
    var url = $('.wishlist-item-cards-data').data('href');
    if (spinner) {
        $.spinner().start();
    }
    var scrollPosition = document.documentElement.scrollTop;
    var newPageNumber = pageNumber;
    $.ajax({
        url: url,
        method: 'get',
        data: {
            pageNumber: ++newPageNumber,
            publicView: publicView,
            id: listUUID
        }
    }).done(function (data) {
        $('.wishlist-item-cards').empty();
        $('body .wishlist-item-cards').parent().html(data);
        base.enableQuantitySteppers();

        if (focusElementSelector) {
            $(focusElementSelector).focus();
        } else {
            document.documentElement.scrollTop = scrollPosition;
        }
    }).fail(function () {
        $('.more-wl-items').remove();
    });
    $.spinner().stop();
}

/**
 * handles add to cart on click for add to cart button on wishlist-show and others
 */
function addToCartFromWishlist() {
    $('body').on('click', '.add-to-cart', function () {
        var pid;
        var addToCartUrl;
        var pidsQty;

        $('body').trigger('product:beforeAddToCart', this);

        pid = $(this).data('pid');
        addToCartUrl = $(this).data('url');
        pidsQty = parseInt($(this).closest('.product-info').find('.quantity').val(), 10);

        var form = {
            pid: pid,
            quantity: pidsQty
        };

        if ($(this).data('option')) {
            form.options = JSON.stringify($(this).data('option'));
        }

        $(this).trigger('updateAddToCartFormData', form);
        if (addToCartUrl) {
            $.ajax({
                url: addToCartUrl,
                method: 'POST',
                data: form,
                success: function (data) {
                    module.exports.methods.handlePostCartAdd(data);
                    $('body').trigger('product:afterAddToCart', data);
                    $.spinner().stop();
                    base.methods.miniCartReportingUrl(data.reportingURL, data.error);
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    });
}


/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';

    if ($('.add-to-cart-messages').length === 0) {
        $('body').append(
            '<div class="add-to-cart-messages"></div>'
        );
    }

    $('.add-to-cart-messages').append(
        '<div class="alert ' + messageType + ' add-to-basket-alert text-center" role="alert">'
        + response.message
        + '</div>'
    );

    setTimeout(function () {
        $('.add-to-basket-alert').remove();
    }, 5000);
}


/**
 * attaches on click for checkbox to toggle public status for whole list on wishslist show
 */
function toggleWishlistStatus() {
    $('#isPublicList').on('click', function () {
        var listID = $('#isPublicList').data('id');
        module.exports.methods.updatePublicStatus(listID, null, null);
    });
}

/**
 * attaches on click for checkbox to toggle public status for individual items on wishlist show
 */
function toggleWishlistItemStatus() {
    $('body').on('click', '.wishlist-item-checkbox', function () {
        var itemID = $(this).closest('.wishlist-hide').find('.custom-control-input').data('id');
        var el = $(this).siblings('input');
        var resetCheckBox = function () {
            return el.prop('checked')
                ? el.prop('checked', false)
                : el.prop('checked', true);
        };

        module.exports.methods.updatePublicStatus(null, itemID, resetCheckBox);
    });
}

/**
 * attaches on click for checkbox to toggle disabled status on button for list
 */
function toggleDisabled(btn) {
    //btn.attr('disabled', (true ? false : true))
    btn[btn.attr('disabled') ? 'removeAttr' : 'attr']('disabled', true);
}

/**
 * toggles the public / private status of the item or wishlist item
 * @param {string} listID - the order model
 * @param {string} itemID - the customer model
 * @param {Object} callback - function to run if the ajax call returns with an
 *                        error so that the checkbox can be reset to it's original state
 */
function updatePublicStatus(listID, itemID, callback) {
    var url = $('#isPublicList').data('url');
    $.spinner().start();
    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: {
            listID: listID,
            itemID: itemID
        },
        success: function (data) {
            if (callback && !data.success) { callback(); }
            if ($('.wishlist-details-share').length) { toggleDisabled($('.wishlist-details-share')); }
            module.exports.methods.displayMessage(data, null);
        },
        error: function (err) {
            if (callback) { callback(); }
            module.exports.methods.displayMessage(err);
        }
    });
}

/**
 * attaches on click for clicking the "x" from wishlist show or account show
 */
function removeFromWishlist() {
    $('body').on('click', '.remove-from-wishlist', function (e) {
        e.preventDefault();
        var url = $(this).data('url');
        var elMyAccount = $('.account-page').length;

        // If user is in my account page, call Wishlist-RemoveProductAccount() end point and replace html with response
        if (elMyAccount > 0) {
            $('.wishlist-account-card').spinner().start();
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'html',
                data: {},
                success: function (html) {
                    $('.wishlist-account-card>.order-card').remove();
                    $('.wishlist-account-card').append(html);
                    $('.wishlist-account-card').spinner().stop();
                },
                error: function () {
                    var $elToAppend = $('.wishlist-account-card');
                    $elToAppend.spinner().stop();
                    var msg = $elToAppend.data('error-msg');
                    module.exports.methods.displayMessage($elToAppend, msg);
                }
            });
        // else user is in wishlist landing page, call Wishlist-RemoveProduct() end point and re-render container page
        } else {
            $.spinner().start();
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                data: {},
                success: function () {
                    var pageNumber = $('.wishlist-item-cards-data').data('page-number') - 1;
                    module.exports.methods.renderNewPageOfItems(pageNumber, false);
                },
                error: function () {
                    $.spinner().stop();
                    var $elToAppendWL = $('.wishlist-item-cards');
                    var msg = $elToAppendWL.data('error-msg');
                    module.exports.methods.displayMessage($elToAppendWL, msg);
                }
            });
        }
    });
}

function moreWLItems() {
    $('body').on('click', '.more-wl-items', function () {
        var pageNumber = $('.wishlist-item-cards-data').data('page-number');
        module.exports.methods.renderNewPageOfItems(pageNumber, true);
    });
}

module.exports = {
    methods: {
        updateWishlistUncachedData: updateWishlistUncachedData,
        updateWishlistCartStatus: updateWishlistCartStatus,
        displayMessage: displayMessage,
        displayWishlistToast: displayWishlistToast,
        renderNewPageOfItems: renderNewPageOfItems,
        handlePostCartAdd: handlePostCartAdd,
        updatePublicStatus: updatePublicStatus
    },
    cartUpdate: cartUpdate,
    toggleWishlist: toggleWishlist,
    updateWishlistLinkData: updateWishlistLinkData,
    copyWishlistLink: copyWishlistLink,
    updateQuickView: updateQuickView,
    viewProductViaEdit: viewProductViaEdit,
    focusEditWishlistProductModal: focusEditWishlistProductModal,
    onClosingEditWishlistProductModal: onClosingEditWishlistProductModal,
    trapEditWishlistProductModalFocus: trapEditWishlistProductModalFocus,
    addToCartFromWishlist: addToCartFromWishlist,
    toggleWishlistStatus: toggleWishlistStatus,
    toggleWishlistItemStatus: toggleWishlistItemStatus,
    removeFromWishlist: removeFromWishlist,
    moreWLItems: moreWLItems,
    baseFiles: {
        wishlistLanding: require('core/wishlist/landing'),
        wishlistDetail: require('core/wishlist/detail'),
        wishlistShowLists: require('core/wishlist/components/modalShowLists'),
        wishlistToggleProduct: require('core/wishlist/components/toggleProduct'),
        wishlistToast: require('core/wishlist/components/toast')
    }
};

$(() => {
    Object.keys(module.exports.baseFiles).forEach(key => {
        processInclude(module.exports.baseFiles[key]);
    });
});
