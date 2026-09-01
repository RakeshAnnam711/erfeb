'use strict';

function onStoreSelected() {
    $('body').on('store:selected', function (e, data) {
        $('body').trigger('PaymentMethodObserver:Show', { name: 'bopis', show: true })
    })
}

function onStoreAfterRemoveStoreSelection() {
    $(document).on('store:afterRemoveStoreSelection', function (e, data) {
        $('body').trigger('PaymentMethodObserver:Show', { name: 'bopis', show: false })
    })
}

module.exports = {
    onStoreSelected: onStoreSelected,
    onStoreAfterRemoveStoreSelection: onStoreAfterRemoveStoreSelection
};
