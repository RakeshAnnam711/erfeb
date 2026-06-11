'use strict';

// TODO: REVISIT ON IF THIS SHOULD BE DONE SERVER SIDE
/**
 * update window product list experience data
 * @param {string} data - data returned from the server's ajax call
 */
 var updateUncachedData = function(data) {
    var wishlistPIDs = new Set(window.UncachedData.wishlistPIDs);
    var updatedPid = data.pid.toString();

    if (data.actionType === 'change') {
        var newPid = data.pidUpdated.toString();
        wishlistPIDs.delete(updatedPid);
        wishlistPIDs.add(newPid);
    } else if (data.actionType === 'add') {
        wishlistPIDs.add(updatedPid);
    } else if (data.actionType === 'remove') {
        wishlistPIDs.delete(updatedPid);
    }
    window.UncachedData.wishlistPIDs = Array.from(wishlistPIDs);
};

/**
 * update clicked links attributes and text
 * @param {Object} specificLinks - jQuery object representing selection of product list experience links
 */
var updateLinkData = function(specificLinks, data) {
    if (!window || !window.UncachedData || !window.UncachedData.wishlistPIDs) {
        return;
    }
    var wishlistLinks = specificLinks || $('[data-wishlistpid]');
    if (!wishlistLinks || !wishlistLinks.length) {
        return;
    }
    var wishlistPIDs = new Set(window.UncachedData.wishlistPIDs);
    wishlistLinks.each((_i, wishlistLink) => {
        var $wishlistLink = $(wishlistLink);
        var wishlistpid = $wishlistLink.attr('data-wishlistpid');
        if (wishlistpid) {
            var isInWishlist = (wishlistPIDs.has(wishlistpid));
            $wishlistLink.attr('data-inwishlist', isInWishlist);
            if (isInWishlist) {
                $wishlistLink.attr('title', $wishlistLink.attr('data-removemessage'));
                if ($wishlistLink.data('includetext') === true) {
                    $wishlistLink.find('span').html($wishlistLink.attr('data-removemessage'));
                }
            } else {
                $wishlistLink.attr('title', $wishlistLink.attr('data-addmessage'));
                if ($wishlistLink.data('includetext') === true) {
                    $wishlistLink.find('span').html($wishlistLink.attr('data-addmessage'));
                }
            }
            var icon = $wishlistLink.find('.wishlist-icon');
            if (icon && icon.length) {
                $(icon).toggleClass('selected', isInWishlist);
            }
            if (data && data.wishlistQuantities) {
                $wishlistLink
                    .attr('data-wishlistquantity', data.wishlistQuantities)
                    .data('wishlistquantity', data.wishlistQuantities);
            } else {
                $wishlistLink
                    .attr('data-wishlistquantity', 1)
                    .data('wishlistquantity', 1);
            }
        }
    });
};

var openToast = (data) => {
    if (data.pid) {
        if (data.wishlistActionType === 'add') {
            var _pid = String(data.pid);
            var _now = Date.now();
            var _btn = document.querySelector('[data-wishlistpid="' + _pid + '"][data-gtmdata],[data-pid="' + _pid + '"][data-gtmdata]');
            var _raw = _btn ? _btn.getAttribute('data-gtmdata') : '';
            var _item = { item_id: _pid, quantity: 1, affiliation: 'WGACA' };
            if (_raw) { try { Object.assign(_item, JSON.parse(_raw)); } catch (e) {} }
            _item.item_id = _item.item_id || _pid;
            var _last = window.wgacaLastWishlistEvent || {};
            if (!(_last.key === _item.item_id && _now - _last.time < 10000)) {
                window.wgacaLastWishlistEvent = { key: _item.item_id, time: _now };
                var _currentPage = sessionStorage.getItem('currentPageType') || '';
                var _prevPage = sessionStorage.getItem('previousPageType') || '';
                if (!_currentPage) {
                    try {
                        var _dlArr = window.dataLayer || [];
                        for (var _dlIdx = 0; _dlIdx < _dlArr.length; _dlIdx++) {
                            if (_dlArr[_dlIdx] && _dlArr[_dlIdx].pageType) { _currentPage = _dlArr[_dlIdx].pageType; break; }
                        }
                    } catch (_dlErr) {}
                }
                var _listPage = _currentPage === 'PDP Page' ? _prevPage : _currentPage;
                _item.item_list_id = _item.item_list_id || _listPage.toLowerCase().replace(/\s+/g, '_');
                _item.item_list_name = _item.item_list_name || _listPage;
                var _currency = _item.currency || _item.currencyCode || 'USD';
                delete _item.currencyCode;
                delete _item.currency;
                var _eid = 'add_to_wishlist-' + _item.item_id + '-' + _now;
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({ ecommerce: null });
                window.dataLayer.push({ event: 'add_to_wishlist', event_id: _eid, ecommerce: { currency: _currency, value: Number(_item.price) || 0, items: [_item] } });
            }
        }

        $('.wishlist-toast').trigger('show', function($toast) {

            if (data.wishlistName) {
                $toast.find('.wishlist-name').html(data.wishlistName);
            } else {
                $toast.find('.wishlist-name').html($toast.data().defaultWishlistName);
            }

            $toast
                .find('.message .manage')
                .attr('href', data.wishlistUrl);

            if (data.manageLabel) {
                $toast.find('.message .manage').html(data.manageLabel);
            } else {
                $toast.find('.message .manage').html($toast.data().defaultManageLabelWishlist);
            }

            $toast
                .attr({
                    'data-product-id': data.pid,
                    'data-wishlist-id': data.wishlistId
                })
                .data('product-id', data.pid)
                .data('wishlist-id', data.wishlistId);

            if (data.wishlistQuantities) {
                $toast
                    .attr('data-wishlist-quantities', data.wishlistQuantities)
                    .data('wishlist-quantities', data.wishlistQuantities);
            }

            if (data.productOptions) {
                $toast
                    .attr({
                        'data-product-options': data.productOptions
                    })
                    .data('product-options', data.productOptions);
            }

            if(!data.error) {
                $('#toast-alert-status').removeClass('alert-danger').addClass('alert-success');
                if (data.wishlistActionType === 'add') {
                    $toast.find('.message.remove, .message.both, .message.error').addClass('d-none');
                    $toast.find('.message.add').removeClass('d-none');
                } else if (data.wishlistActionType === 'remove') {
                    $toast.find('.message.remove').removeClass('d-none');
                    $toast.find('.message.add, .message.both, .message.error').addClass('d-none');
                } else {
                    $toast.find('.message.both').removeClass('d-none');
                    $toast.find('.message.add, .message.remove, .message.error').addClass('d-none');
                }
            } else {
                $toast.find('.message.add, .message.remove, .message.both').addClass('d-none');
                $toast.find('.message.error').removeClass('d-none');
                $('#toast-alert-status').removeClass('alert-success').addClass('alert-danger');
            }

            // dismiss wishlist toast notification after 5 seconds
            setTimeout(function () {
                $('.wishlist-toast').removeClass('show');
            }, 5000);
        });
    }
};

var getUrlParam = (paramName) => {
    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString);
    return urlParams.get(paramName);
}

module.exports = {
    openToast: openToast,
    updateLinkData: updateLinkData,
    updateUncachedData: updateUncachedData,
    getUrlParam: getUrlParam
};
