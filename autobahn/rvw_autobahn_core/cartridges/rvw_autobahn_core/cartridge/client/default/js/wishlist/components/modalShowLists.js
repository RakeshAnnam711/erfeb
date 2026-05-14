'use strict';

var wishlistHelpers = require('core/wishlist/components/helpers');
var toastHelpers = require('core/components/toast');
var cart = require('core/cart');
var base = require('core/product/base');

var getPid = function() {
    return $('#wishlistModalShowLists').data().pid;
};

var getListItemIds = function() {
    return $('#wishlistModalShowLists').data().listItemIds;
};

var getListId = function() {
    return $('#wishlistModalShowLists').data().listId;
};

var getListAction = function() {
    var $modal = $('#wishlistModalShowLists');
    return (!$modal.data().action? 'add' : $modal.data().action);
};

var getQuantity = function() {
    if ($('#wishlistModalShowLists').data().quantity) {
        return $('#wishlistModalShowLists').data().quantity;
    } else {
        return 1;
    }
};

var updateWishlistProducts = function($html) {
    // if we have a new DOM replace the old DOM
    if ($html) {
        $('#wishlistModalShowLists')
            .find('.wishlist-modal-show-lists-toggle-lists')
            .replaceWith($html);
    // if we don't have a new DOM then just empty it out
    } else {
        $('#wishlistModalShowLists')
            .find('.wishlist-modal-show-lists-toggle-lists')
            .empty();
    }
};

var updateModalListDataState = function() {
    var $modal = $('#wishlistModalShowLists');
    var modalListDataState = $modal.data().modalListDataState;
    var selectedLists = $modal.find('.js-toggle.selected');
    var selectedListIds = [];

    var getListDiff = function(list1, list2) {
        var misses = [];

        for (var item = 0; item < list1.length; item++) {
            var found = false;
            for (var ii = 0; ii < list2.length; ii++) {
                if (list2[ii].wishlistId === list1[item].wishlistId) {
                    found = true
                }
            }
            if (!found) {
                misses.push(list1[item]);
            }
        }

        return misses;
    };

    //get all the lists that are selected
    selectedLists.each(function() {
        selectedListIds.push({
            pid: module.exports.methods.getPid(),
            wishlistId: $(this).data('wishlistId'),
            wishlistName: $(this).data('wishlistName'),
            wishlistQuantities: $(this).data('wishlistPidQuantity'),
            wishlistUrl: $(this).data('wishlistUrl'),
        });
    });

    //save off the initial set of selected lists so we know what we started with
    if (!modalListDataState.listsInitial) {
        modalListDataState.listsInitial = selectedListIds;
    }

    //save the lists as it after a change happened or if this is the initial load
    modalListDataState.listsCurrent = selectedListIds;

    //figure if any lists have been removed
    modalListDataState.removed = getListDiff(modalListDataState.listsInitial, modalListDataState.listsCurrent);

    //figure if any lists have been added
    modalListDataState.added = getListDiff(modalListDataState.listsCurrent, modalListDataState.listsInitial);

    //look to see if anything changed then set the isChange flag
    if (modalListDataState.added.length || modalListDataState.removed.length) {
        modalListDataState.isChanged = true;
    } else {
        modalListDataState.isChanged = false;
    }

    if (modalListDataState.added.length && modalListDataState.removed.length) {
        modalListDataState.wishlistActionType = 'both';
    } else if (modalListDataState.added.length) {
        modalListDataState.wishlistActionType = 'add';
    } else if (modalListDataState.removed) {
        modalListDataState.wishlistActionType = 'remove';
    } else {
        modalListDataState.wishlistActionType = 'none';
    }

    modalListDataState.toast = {}
    if (modalListDataState.wishlistActionType === 'remove' && modalListDataState.removed.length === 1) {
        // only removed 1
        modalListDataState.toast = modalListDataState.removed[0];
        modalListDataState.toast.wishlistActionType = modalListDataState.wishlistActionType;
    } else if (modalListDataState.wishlistActionType === 'remove' && modalListDataState.removed.length > 1) {
        // removed several
        modalListDataState.toast.wishlistId = [];
        modalListDataState.toast.wishlistQuantities = [];
        modalListDataState.toast.pid = module.exports.methods.getPid();

        var i;
        for (i = 0; i < modalListDataState.removed.length; i++) {
            modalListDataState.toast.wishlistId.push(modalListDataState.removed[i].wishlistId);
            modalListDataState.toast.wishlistQuantities.push(modalListDataState.removed[i].wishlistQuantities);
        }

        modalListDataState.toast.wishlistActionType = modalListDataState.wishlistActionType;
    } else if (modalListDataState.wishlistActionType === 'add' && modalListDataState.added.length === 1) {
        // only added 1
        modalListDataState.toast = modalListDataState.added[0];
        modalListDataState.toast.wishlistActionType = modalListDataState.wishlistActionType;
    } else if (modalListDataState.wishlistActionType === 'add' && modalListDataState.added.length > 1) {
        // added several
        modalListDataState.toast.wishlistActionType = 'both';
    } else if (modalListDataState.wishlistActionType === 'both') {
        // multiple adds or multiple removals
        modalListDataState.toast.wishlistActionType = modalListDataState.wishlistActionType;
    } else {
        // no changes
        modalListDataState.toast.wishlistActionType = modalListDataState.wishlistActionType;
    }

    $modal.data().modalListDataState = modalListDataState;
};

var switchListViewsRegistered = function() {
    $('#wishlistModalShowLists')
        .find('.wishlist-modal-show-lists-toggle-lists, .wishlist-modal-show-lists-toggle-list-form, .modal-footer')
        .toggleClass('d-none');
    $('#wishlistModalShowLists')
        .find('.wishlist-modal-show-lists-header-close, .wishlist-modal-show-lists-header-back')
        .toggleClass('show');
};

var eventShow = function(e) {
    var $this = $(this);
    var action = module.exports.methods.getListAction();
    var dataParams = {};

    $this.data('modalListDataState', {});
    $this.find('.modal-content').spinner().start();
    $('.wishlist-toast').trigger('dismiss');

    if (action === 'move') {
        $('.wishlist-modal-show-lists-add').hide();
        dataParams = {
            listIdOriginal: $this.data().listId,
            listItemIds: JSON.stringify(module.exports.methods.getListItemIds()),
            action: action
        };
    } else {
        $('.wishlist-modal-show-lists-move').hide();
        dataParams = {
            pid: module.exports.methods.getPid(),
            action: action
        };
    }

    $.ajax({
        url: $this.find('.modal-body').data().url,
        type: 'POST',
        dataType: 'html',
        data: dataParams,
        success: function(html) {
            module.exports.methods.updateWishlistProducts($(html));
            module.exports.methods.updateModalListDataState();
            $this.find('.modal-content').spinner().stop();
        }
    });
    module.exports.methods.addListEventListenersWindow();
};

var eventHidden = function(e) {
    module.exports.methods.removeListEventListenersWindow();
    module.exports.methods.updateWishlistProducts();
    wishlistHelpers.openToast(
        $('#wishlistModalShowLists').data().modalListDataState.toast
    );
};

var eventStopPropagation = function(e) {
    e.stopPropagation();
};

var eventClickWindow = function(e) {
    $('#wishlistModalShowLists').modal('toggle');
};

var eventKeyupName = function(e) {
    var $this = $(this);
    var $invalidFeedback = $this.next('.invalid-feedback');
    var $submitButton = $('.wishlist-create-list-form .create');
    var namesExisting = $('#wishlistModalShowLists [data-list-names]').data().listNames.split('|');
    var nameNew = $this.val().replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    if (nameNew !== '' && namesExisting.indexOf(nameNew) !== -1) {
        $submitButton.attr('disabled', 'disabled');
        $invalidFeedback.text($this.data().errorDuplicateName).addClass('d-block');
        $this.addClass('is-invalid');
    } else {
        $submitButton.removeAttr('disabled');
        $invalidFeedback.text('').removeClass('d-block');
        $this.removeClass('is-invalid');
    }
};

var eventToggleProductOnWishlist = function(e) {
    e.preventDefault();
    var $listButton = $(this);
    var $productContainer = $('.product-detail[data-pid='+ $listButton.data().pid +']');
    var options = base.methods.getOptions($productContainer);

    options ? $listButton.attr('data-product-options', JSON.stringify(options)) : '';
    $listButton.closest('.modal-content').spinner().start();

    $.ajax({
        url: $listButton.data().url,
        method: 'POST',
        dataType: 'json',
        data: {
            pid: module.exports.methods.getPid(),
            wishlistId: $listButton.data().wishlistId,
            quantity: module.exports.methods.getQuantity(),
            options: options
        },
        success: function(data) {
            var $html = $(data.renderedTemplate);
            if (!data.error && $html.length) {
                var $modal = $('#wishlistModalShowLists');
                var productListSelectedCount = $html.find('.selected').length;
                module.exports.methods.updateWishlistProducts($html);
                module.exports.methods.updateModalListDataState();
                wishlistHelpers.updateUncachedData({
                    actionType: productListSelectedCount ? 'add' : 'remove',
                    pid: module.exports.methods.getPid()
                });
                wishlistHelpers.updateLinkData();

                if (!$modal.data().multiSelect) {
                    $modal
                        .one('hidden.bs.modal', function () {
                            wishlistHelpers.openToast($listButton.data());
                        })
                        .modal('hide');
                }
                if ($modal.data().removeFromCart && $listButton.data().wishlistActionType === 'add') {
                    var urlParams = {
                        pid: module.exports.methods.getPid(),
                        uuid: $modal.data().cartUUID
                    };

                    cart.removeProductFromCart({
                        url: cart.appendToUrl($modal.data().urlRemoveFromCart, urlParams),
                        uuid: urlParams.uuid,
                        pid: module.exports.methods.getPid()
                    });
                }
            } else {
                toastHelpers.methods.show('danger', data.message, true);
            }

            $listButton.closest('.modal-content').spinner().stop();
        },
        error: function() {
            $listButton.closest('.modal-content').spinner().stop();
        }
    });
};

var eventMoveProductsToWishlist = function(e) {
    e.preventDefault();
    var $modal = $('#wishlistModalShowLists');
    var $listButton = $(this);
    $listButton.closest('.modal-content').spinner().start();

    $.ajax({
        url: $listButton.data().url,
        method: 'POST',
        dataType: 'json',
        data: {
            listItemIds: JSON.stringify($modal.data().listItemIds),
            productListIdOriginal: module.exports.methods.getListId(),
            productListIdNew: $listButton.data().wishlistId,
            keepInOriginalList: $modal.find('.keep').is(':checked')
        },
        success: function(data) {
            var $productsHtml = $(data.renderedTemplate);
            if (!data.error && $productsHtml.length) {
                $('.wishlist-details').trigger('updateProducts', $productsHtml);
                if (!$modal.data().multiSelect) {
                    $modal.modal('hide');
                }
                toastHelpers.methods.show('success', data.message, false);
            } else {
                toastHelpers.methods.show('danger', data.message, true);
            }
            $listButton.closest('.modal-content').spinner().stop();
        },
        error: function() {
            $listButton.closest('.modal-content').spinner().stop();
        }
    });
}

var eventToggleNewWishlistForm = function(e) {
    e.preventDefault();
    module.exports.methods.switchListViewsRegistered();
    $('#wishlistModalShowLists #newProductListName')
        .val('')
        .removeClass('is-invalid')
        .next('.invalid-feedback')
        .text('')
        .removeClass('d-block');
    $('.wishlist-create-list-form .create')
        .removeAttr('disabled');
};

var eventSubmitNewWishlistForm = function(e) {
    e.preventDefault();

    var $newProductListName = $('#newProductListName');
    if ($newProductListName.val() && $newProductListName.val().length > 1) {
        $newProductListName.removeClass('is-invalid');
        $newProductListName.closest('.modal-body').spinner().start();
        $.ajax({
            url: $(e.target).data().url,
            method: 'POST',
            dataType: 'json',
            data: {
                name: $newProductListName.val(),
                pid: module.exports.methods.getPid(),
                view: 'modalShowLists',
                listIdOriginal: module.exports.methods.getListId(),
                action: module.exports.methods.getListAction()
            },
            success: function(data) {
                var $html = $(data.renderedTemplate);
                if (!data.error && $html.length) {
                    module.exports.methods.updateWishlistProducts($html);
                    module.exports.methods.updateModalListDataState();
                } else {
                    toastHelpers.methods.show('danger', data.message, true);
                }
                $newProductListName.closest('.modal-body').spinner().stop();
            },
            error: function() {
                $newProductListName.closest('.modal-body').spinner().stop();
            }
        });
        module.exports.methods.switchListViewsRegistered();
        $newProductListName.val('');
    } else {
        $newProductListName.addClass('is-invalid');
    }
};

var eventClickRemove = function(e) {
    e.preventDefault();
    var target = e.currentTarget;
    var pid = target.dataset.pid

    $(target).closest('.modal-body').spinner().start();

    $.ajax({
        url: target.dataset.url,
        method: 'POST',
        dataType: 'json',
        data: {
            pid: pid
        },
        success: function(data) {
            if (!data.error) {
                wishlistHelpers.updateUncachedData({
                    actionType: 'remove',
                    pid: pid
                });
                wishlistHelpers.updateLinkData();
                $('.wishlist-modal-show-lists').modal('hide');

                wishlistHelpers.openToast({
                    pid: pid,
                    wishlistId: data.wishlistIds,
                    wishlistQuantities: data.wishlistsQuantities,
                    wishlistName: data.wishlistName,
                    wishlistUrl: data.wishlistUrl,
                    wishlistActionType: 'remove'
                });
            } else {
                toastHelpers.methods.show('danger', data.message, true);
            }
            $(target).closest('.modal-body').spinner().stop();
        },
        error: function() {
            $('.wishlist-modal-show-lists').modal('hide');
            $(target).closest('.modal-body').spinner().stop();
        }
    });
};

var addListEventListenersWindow = function() {
    $(window).on('click', module.exports.methods.eventClickWindow);
};

var removeListEventListenersWindow = function() {
    $(window).off('click', module.exports.methods.eventClickWindow);
};

var addListEventListeners = function() {
    $('#wishlistModalShowLists')
        .on('click', module.exports.methods.eventStopPropagation)
        .on('show.bs.modal', module.exports.methods.eventShow)
        .on('hidden.bs.modal', module.exports.methods.eventHidden)
        .on('keyup', '#newProductListName', module.exports.methods.eventKeyupName)
        .on('click', '.js-header-back', module.exports.methods.eventToggleNewWishlistForm)
        .on('click', '.wishlist-show-new-list-form-btn, .wishlist-modal-show-lists-toggle-list-form .cancel', module.exports.methods.eventToggleNewWishlistForm)
        .on('click', '.js-toggle', module.exports.methods.eventToggleProductOnWishlist)
        .on('click', '.js-move', module.exports.methods.eventMoveProductsToWishlist)
        .on('submit', '.wishlist-modal-show-lists-toggle-list-form form', module.exports.methods.eventSubmitNewWishlistForm)
        .on('click', '.js-remove-from-all', module.exports.methods.eventClickRemove);

    $('#wishlistModalShowLists').data('modalListDataState', {});
};

$(document).ready(function () {
        $('#wishlistModalShowLists').on('click', '.wishlist-favorite-product-btn', function () {
            var $button = $(this);
            var pid = $button.data('pid');
            var action = $button.data('wishlist-action-type');
            if (pid && action && action === 'remove') {
                $('.wishlist-card-product[data-pid="' + pid + '"]')
                    .closest('.wishlist-details-products-column')
                    .remove();
               
                setTimeout(function () {
                    if ($('.wishlist-details-products-row').children('.wishlist-details-products-column').length === 0) {
                        $('#wishlistEmptyMessage').removeClass('d-none');
                    }
                }, 300); 

            }
        });
});

module.exports = {
    methods: {
        getPid: getPid,
        getListItemIds: getListItemIds,
        getListId: getListId,
        getListAction: getListAction,
        getQuantity: getQuantity,
        updateWishlistProducts: updateWishlistProducts,
        updateModalListDataState: updateModalListDataState,
        switchListViewsRegistered: switchListViewsRegistered,
        eventShow: eventShow,
        eventHidden: eventHidden,
        eventStopPropagation: eventStopPropagation,
        eventClickWindow: eventClickWindow,
        eventKeyupName: eventKeyupName,
        eventToggleProductOnWishlist: eventToggleProductOnWishlist,
        eventMoveProductsToWishlist: eventMoveProductsToWishlist,
        eventToggleNewWishlistForm: eventToggleNewWishlistForm,
        eventSubmitNewWishlistForm: eventSubmitNewWishlistForm,
        eventClickRemove: eventClickRemove,
        addListEventListenersWindow: addListEventListenersWindow,
        removeListEventListenersWindow: removeListEventListenersWindow
    },
    addListEventListeners: addListEventListeners
};
