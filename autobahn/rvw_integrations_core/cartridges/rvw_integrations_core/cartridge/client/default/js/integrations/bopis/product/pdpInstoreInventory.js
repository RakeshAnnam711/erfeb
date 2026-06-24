'use strict';

var storeLocator = require('core/storeLocator/storeLocator');
var base = require('core/product/base');

/**
 * Restores Quantity Selector to its original state.
 * @param {HTMLElement} $quantitySelect - The Quantity Select Element
 */
function restoreQuantityOptions($quantitySelect) {
    var originalHTML = $quantitySelect.data('originalHTML');
    if (originalHTML) {
        $quantitySelect.html(originalHTML);
    }
}

/**
 * Sets the data attribute of Quantity Selector to save its original state.
 * @param {HTMLElement} $quantitySelect - The Quantity Select Element
 */
function setOriginalQuantitySelect($quantitySelect) {
    if (!$quantitySelect.data('originalHTML')) {
        $quantitySelect.data('originalHTML', $quantitySelect.html());
    } // If it's already there, don't re-set it
}

/**
 * Updates the Quantity Selector based on the In Store Quantity.
 * @param {string} $quantitySelector - Quantity Selector
 * @param {number} productAtsValue - Inventory in the selected store
 */
function updateQOptions($quantitySelector, productAtsValue) {
    var selectedQuantity = $quantitySelector.val();
    module.exports.methods.restoreQuantityOptions($quantitySelector);

    $quantitySelector.find('option').each((index, option) => {
        if (index >= productAtsValue) {
            $(option).remove();
        }
    });

    $quantitySelector.find('option[value="' + selectedQuantity + '"]').attr('selected', 'selected');

    // update qty stepper if enabled
    var $qtyStepper = $quantitySelector.closest('.quantity').find('.quantity-stepper');
    if ($qtyStepper.length) {
        $qtyStepper.attr('data-max', productAtsValue);
        base.enableQuantitySteppers($qtyStepper.closest('.quantity'));
    }
}

/**
 * Generates the modal window on the first call.
 */
function getModalHtmlElement() {
    if ($('#inStoreInventoryModal').length !== 0) {
        $('#inStoreInventoryModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal " id="inStoreInventoryModal" role="dialog">'
        + '<div class="modal-dialog modal-lg in-store-inventory-dialog">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header justify-content-end">'
        + '    <button type="button" class="close pull-right" data-dismiss="modal" title="'
        +          $('.btn-get-in-store-inventory').data('modal-close-text') + '">'    // eslint-disable-line
        + '        <span aria-hidden="true">&times;</span>'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
    $('#inStoreInventoryModal').modal('show');
}

/**
 * Replaces the content in the modal window with find stores components and
 * the result store list.
 * @param {string} pid - The product ID to search for
 * @param {number} quantity - Number of products to search inventory for
 * @param {number} selectedPostalCode - The postal code to search for inventory
 * @param {number} selectedRadius - The radius to search for inventory
 */
function fillModalElement(pid, quantity, selectedPostalCode, selectedRadius) {
    var requestData = {};
    if (pid && quantity){
        requestData.products = pid + ':' + quantity;
    };

    if (selectedRadius) {
        requestData.radius = selectedRadius;
    }

    if (selectedPostalCode) {
        requestData.postalCode = selectedPostalCode;
    }

    $('#inStoreInventoryModal').spinner().start();
    $.ajax({
        url: $('.btn-get-in-store-inventory').data('action-url'),
        data: requestData,
        method: 'GET',
        success: function (response) {
            $('#inStoreInventoryModal .modal-body').empty();
            $('#inStoreInventoryModal .modal-body').html(response.storesResultsHtml);

            $('.btn-storelocator-search').attr('data-search-pid', pid);

            if (selectedRadius) {
                $('#radius').val(selectedRadius);
            }

            if (selectedPostalCode) {
                $('#store-postal-code').val(selectedPostalCode);
            }

            $('#inStoreInventoryModal').modal('show');
            $('#inStoreInventoryModal').spinner().stop();
        },
        error: function () {
            $('#inStoreInventoryModal').spinner().stop();
        }
    });
}

/**
 * Remove the selected store.
 * @param {HTMLElement} $container - the target html element
 */
function deselectStore($container) {
    var storeElement = $($container).find('.selected-store-with-inventory');
    $(storeElement).find('.card-body').empty();
    $(storeElement).closest('.row').addClass('d-none');
    $($container).find('.btn-get-in-store-inventory').closest('.row').removeClass('d-none');
    $($container).find('.quantity-select').removeData('originalHTML');
}

/**
 * Update quantity options. Only display quantity options that are available for the store.
 * @param {sring} searchPID - The product ID of the selected product.
 * @param {number} storeId - The store ID selected for in store pickup.
 */
function updateQuantityOptions(searchPID, storeId) {
    if (!searchPID) {
        return false;
    }
    var selectorPrefix = '.product-detail[data-pid="' + searchPID + '"]';
    var $productIdSelector = $(selectorPrefix).find('.product-id').first();
    var $quantitySelector = $(selectorPrefix).closest('.modal').length
                            ? $(selectorPrefix).closest('.modal').find('.modal-footer .quantity-select')
                            : $(selectorPrefix).find('.quantity-select');

    setOriginalQuantitySelect($quantitySelector);

    var requestData = {
        pid: $productIdSelector.text(),
        quantitySelected: $quantitySelector.val(),
        storeId: storeId
    };

    $.ajax({
        url: $('.btn-get-in-store-inventory').data('ats-action-url'),
        data: requestData,
        method: 'GET',
        success: function (response) {
            // Update Quantity dropdown, Remove quantity greater than inventory
            var productAtsValue = response.atsValue;
            var availabilityValue = '';
            var $productContainer = $('.product-detail[data-pid="' + searchPID + '"]');

            if (!response.product.readyToOrder) {
                availabilityValue = '<li><div>' + response.resources.info_selectforstock + '</div></li>';
            } else {
                response.product.messages.forEach(function (message) {
                    availabilityValue += '<li><div>' + message + '</div></li>';
                });
            }

            $productContainer.trigger('product:updateAvailability', {
                product: response.product,
                $productContainer: $productContainer,
                message: availabilityValue,
                resources: response.resources
            });

            $('button.add-to-cart, button.add-to-cart-global, button.update-cart-product-global').trigger('product:updateAddToCart', {
                product: response.product, $productContainer: $productContainer
            });

            module.exports.methods.updateQOptions($quantitySelector, productAtsValue);
        }
    });
}

function getQuantitySelect($target) {
    var $quantitySelect;

    if ($target.closest('#quickViewModal').length) {
        $quantitySelect = $target.closest('#quickViewModal').find('.modal-footer .quantity-select');
    } else {
        $quantitySelect = $target.closest('.product-detail').find('.quantity-select');
    }

    return $quantitySelect;
}

module.exports = {
    updateSelectStore: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            $('.btn-get-in-store-inventory', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available ||
                !response.product.availableForInStorePickup));
        });
    },
    updateSelectedStoreOnAttributeChange: function () {
        $('body').on('product:afterAttributeSelect', function (e, response) {
            var storeId = $(response.container).find('.selected-store-with-inventory [data-store-id]').data('store-id');
            response.container.attr('data-pid', response.data.product.id);

            if (storeId) {
                module.exports.methods.updateQuantityOptions(response.data.product.id, storeId)
            } else {
                module.exports.methods.deselectStore(response.container);

                // update qty stepper if enabled
                var $qtyStepper = $(response.container).closest('.modal').length
                                  ? (response.container).closest('.modal').find('.modal-footer .quantity-stepper')
                                  : (response.container).find('.quantity-stepper');
                if ($qtyStepper.length) {
                    var qtyMax = $qtyStepper.closest('.quantity').find('[class*="quantity-select"] option').length;
                    $qtyStepper.attr('data-max', qtyMax);
                    base.enableQuantitySteppers($qtyStepper.closest('.quantity'));
                }
            }
        });
    },
    updateAddToCartFormData: function () {
        $('body').on('updateAddToCartFormData', function (e, form) {
            if (form.pidsObj) {
                var pidsObj = JSON.parse(form.pidsObj);
                pidsObj.forEach(function (product) {
                    var storeElement = $('.product-detail[data-pid="' +
                        product.pid
                        + '"]').find('.store-name');
                    product.storeId = $(storeElement).length// eslint-disable-line no-param-reassign
                        ? $(storeElement).attr('data-store-id')
                        : null;
                });

                form.pidsObj = JSON.stringify(pidsObj);// eslint-disable-line no-param-reassign
            }

            var storeElement = $('.product-detail[data-pid="'
                + form.pid
                + '"]');

            if ($(storeElement).length) {
                form.storeId = $(storeElement).find('.store-name') // eslint-disable-line
                    .attr('data-store-id');
            }
        });
    },
    showInStoreInventory: function () {
        $('body').on('click', '.btn-get-in-store-inventory', event => {
            var $target = $(event.target);
            var pid = $target.closest('.product-detail').attr('data-pid');
            var $quantitySelect = module.exports.methods.getQuantitySelect($target);
            var quantity = $quantitySelect.val();

            module.exports.methods.getModalHtmlElement();
            module.exports.methods.fillModalElement(pid, quantity);
            event.stopPropagation();
        });
    },
    removeStoreSelection: function () {
        $('body').on('click', '#remove-store-selection', event => {
            var $target = $(event.target);
            var $quantitySelect = module.exports.methods.getQuantitySelect($target);

            module.exports.methods.deselectStore($target.closest('.product-detail'));
            $(document).trigger('store:afterRemoveStoreSelection', $quantitySelect);
        });
    },
    selectStoreWithInventory: function () {
        $('body').on('store:selected', function (e, data) {
            if (data.scope.parents('#inStoreInventoryModal').length) {
                var searchPID = data.scope.find('.btn-storelocator-search').attr('data-search-pid');
                if (searchPID) {
                    var $storeElement = $('.product-detail[data-pid="' + searchPID + '"]');
                    $storeElement.find('.selected-store-with-inventory .card-body').empty();
                    $storeElement.find('.selected-store-with-inventory .card-body').append(data.storeDetailsHtml);
                    $storeElement.find('.store-name').attr('data-store-id', data.storeID);
                    $storeElement.find('.selected-store-with-inventory').closest('.row').removeClass('d-none');

                    var $changeStoreButton = $storeElement.find('.change-store');
                    $changeStoreButton.data('postal', data.searchPostalCode);
                    $changeStoreButton.data('radius', data.searchRadius);

                    $storeElement.find('.btn-get-in-store-inventory').closest('.row').addClass('d-none');

                    module.exports.methods.updateQuantityOptions(searchPID, data.storeID);

                    data.scope.closest('.modal').modal('hide');
                    data.scope.closest('.modal').remove();
                }
            }
        });
    },
    changeStore: function () {
        $('body').on('click', '.change-store', event => {
            var $target = $(event.target);
            var pid = $target.closest('.product-detail').attr('data-pid');
            var $quantitySelect = module.exports.methods.getQuantitySelect($target);
            var quantity = $quantitySelect.val();

            module.exports.methods.getModalHtmlElement();
            module.exports.methods.fillModalElement(pid, quantity, $target.data('postal'), $target.data('radius'));
        });
    },
    methods:  {
        restoreQuantityOptions: restoreQuantityOptions,
        setOriginalQuantitySelect: setOriginalQuantitySelect,
        updateQOptions: updateQOptions,
        getModalHtmlElement: getModalHtmlElement,
        fillModalElement: fillModalElement,
        deselectStore: deselectStore,
        updateQuantityOptions: updateQuantityOptions,
        getQuantitySelect: getQuantitySelect
    }
};
