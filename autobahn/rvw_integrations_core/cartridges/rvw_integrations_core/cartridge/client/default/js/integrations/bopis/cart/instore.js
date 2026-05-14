'use strict';

function updateEditModalStoreAttribute($modal, storeId) {
    var $updateCartUrl = $modal.find('.update-cart-url');

    if ($updateCartUrl.length > 0) {
        $updateCartUrl.attr('data-store-id', storeId || null);
    }
}

function getUrlParam(name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null){
       return null;
    } else {
       return decodeURI(results[1]) || 0;
    }
}

function onCartUpdate() {
    $('body').on('cart:update', function(e, data, uuid) {
        var hasInstorePickup = false;
        var basket = data.basket || data.cartModel || data;
        if (basket && basket.numItems) {
            for (let item of basket.items) {
                hasInstorePickup = hasInstorePickup || item.fromStoreId;
            }
        }

        $('body').trigger('PaymentMethodObserver:Show', { name: 'bopis', show: hasInstorePickup ? true : false });
    });
}

module.exports = {
    watchForEditModalLaunch: () => {
        $('body').on('quickview:ready', (event, modal) => {
            var $modal = $(modal);
            var isEditModal = $modal.find('.cart-and-ipay').length > 0;
            var storeId = $modal.find('.store-details[data-store-id]').data('store-id');

            if (isEditModal && storeId) {
                updateEditModalStoreAttribute($modal, storeId);
            }
        });
    },
    watchForStoreChange: () => {
        $('body').on('store:selected', (event, data) => {
            updateEditModalStoreAttribute($('#quickViewModal.show'), data.storeID);
        });
        $(document).on('store:afterRemoveStoreSelection', (event, data) => {
            updateEditModalStoreAttribute($('#quickViewModal.show'), null);
        });
    },
    editModalAutoLaunch: () => {
        var lineItemUUID = getUrlParam('editUUID');

        if (lineItemUUID) {
            $('.product-edit .edit[data-uuid="' + lineItemUUID + '"]').trigger('click');
        }
    },
    onCartUpdate: onCartUpdate
}
