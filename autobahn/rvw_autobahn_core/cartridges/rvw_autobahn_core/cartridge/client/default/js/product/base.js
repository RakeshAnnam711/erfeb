'use strict';
var focusHelper = require('base/components/focus');
var toastHelpers = require('core/components/toast');
var abSlider = require('core/components/slider');
var siteIntegrations = require('../integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();
var wishlistHelpers = require('../wishlist/components/helpers');

/**
 * Retrieves the relevant pid value
 * @param {jquery} $el - DOM container for a given add to cart button
 * @return {string} - value to be used when adding product to cart
 */
function getPidValue($el) {
    var pid;

    if ($('#quickViewModal').hasClass('show') && !$('.product-set').length) {
        pid = $($el).closest('.modal-content').find('.product-quickview').data('pid');
    } else if ($('.product-set-detail').length || $('.product-set').length) {
        pid = $($el).closest('.product-detail').find('.product-id').text();
    } else  if (($el).hasClass('single-variant-quick-add-to-cart')) {
        pid = $($el).data('pid');
    } else  if (($el).parents('.popover').length) {
        pid = $($el).closest('.product-detail.product-quick-add-to-cart').data('pid');
    } else {
        pid = $('.product-detail:not(".bundle-item")').data('pid');
    }

    return pid;
}

/**
 * Retrieve contextual quantity selector
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {jquery} - quantity selector DOM container
 */
function getQuantitySelector($el) {
    var quantitySelected;
    if ($el && $('.set-items').length) {
        quantitySelected = $($el).closest('.product-detail').find('.quantity-select');
    } else if ($el && $('.product-bundle').length) {
        var quantitySelectedModal = $($el).closest('.modal-footer').find('.quantity-select');
        var quantitySelectedPDP = $($el).closest('.bundle-footer').find('.quantity-select');
        if (quantitySelectedModal.val() === undefined) {
            quantitySelected = quantitySelectedPDP;
        } else {
            quantitySelected = quantitySelectedModal;
        }
    } else {
        quantitySelected = $('.quantity-select');
    }
    return quantitySelected;
}

/**
 * Retrieves the value associated with the Quantity pull-down menu
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {string} - value found in the quantity input
 */
function getQuantitySelected($el) {
    return this.getQuantitySelector($el).val();
}

/**
 * Process the attribute values for an attribute that has image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 * @param {Object} msgs - object containing resource messages
 */
function processSwatchValues(attr, $productContainer, msgs) {
    if (attr.attributeId == 'color') {
        $productContainer.find('.color-display-value').text(attr.displayValue || '');
    };

    if (attr.attributeId == 'size') {
        $productContainer.find('[data-attr="size"]').find('.non-color-display-value').text(attr.displayValue || '');
    };

    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer.find('[data-attr="' + attr.id + '"] [data-attr-value="' + attrValue.value + '"]');

        var $swatchButton = $attrValue.parent('button');

        if (attrValue.selected) {
            $attrValue.addClass('selected');
            $attrValue.siblings('.selected-assistive-text').text(msgs.assistiveSelectedText);
            $attrValue.attr('selected', 'selected');
        } else {
            $attrValue.removeClass('selected');
            $attrValue.siblings('.selected-assistive-text').empty();
            $attrValue.removeAttr('selected');
        }

        if (attrValue.url) {
            $swatchButton.attr('data-url', attrValue.url);
        } else {
            $swatchButton.removeAttr('data-url');
        }

        // Disable if not selectable
        $attrValue.removeClass('selectable unselectable available unavailable out-of-stock');

        $attrValue.addClass(attrValue.selectable ? 'selectable' : 'unselectable');
        $attrValue.addClass(attrValue.available ? 'available' :  toggleObject.viewOutOfStockItems ? 'out-of-stock' : 'unavailable');

        $attrValue.attr('value', attrValue.url).removeAttr('disabled');
        if (!attrValue.selectable) {
            $attrValue.attr('disabled', true);
        }
    });
}

/**
 * Check to see if the attribute button element can be clicked
 *
 * @param {Object} $attributeButtonElement - Attribute element button
 */
function checkForClickableAttribute($attributeButtonElement) {
    return ($attributeButtonElement.attr('disabled') || $attributeButtonElement.data('url') === null || $attributeButtonElement.find('.unselectable').length || $attributeButtonElement.find('.selected').length);
}


/**
 * Process attribute values associated with an attribute that does not have image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function processNonSwatchValues(attr, $productContainer, msgs, currentTarget) {
    var viewOutOfStockItems = window.CachedData.siteIntegrations.viewOutOfStockItems;
    var $attr = '.custom-select[data-attr="' + attr.id + '"]';
    var $defaultOption = $productContainer.find($attr + '.select-' + $.escapeSelector(attr.id) + ' option:first-child');
    $defaultOption.attr('value', attr.resetUrl).attr('disabled', true);

    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer.find($attr + ' [data-attr-value="' + attrValue.value + '"]');
        $attrValue.attr('value', attrValue.url).removeAttr('disabled');
        var currentSelectedOption = $(currentTarget).find('option:selected');

        if (!viewOutOfStockItems && (!attrValue.selectable || !attrValue.available)) {
            if (!attrValue.selectable) {
                $attrValue.attr('disabled', true);
            }
            //check if selected value is now unavailable, if so select the default option
            if (currentSelectedOption.data('attr-value') == attrValue.value) {
                $attrValue.removeAttr('selected');
                $($attr).prop('selectedIndex', 0);
            }
            // append a msg to option to tell user its not available with selected options
            $attrValue.html(attrValue.displayValue + msgs.unavailableMsg);
        } else {
            $attrValue.html(attrValue.displayValue);
            if (currentSelectedOption.text() == attrValue.displayValue) {
                $(currentSelectedOption).attr('selected', 'selected');
                $productContainer.find($attr).prop('selectedIndex', $(currentSelectedOption).index());
            }
        }
        $attrValue[attrValue.available ? 'addClass' : 'removeClass']('available');
        $attrValue.removeClass('unavailable out-of-stock');

        if (!attrValue.available) {
            $attrValue.addClass(toggleObject.viewOutOfStockItems ? 'out-of-stock' : 'unavailable');
            $attrValue.append(' ' + msgs.unavailableMsg);
        }
    });
}

/**
 * Routes the handling of attribute processing depending on whether the attribute has image
 *     swatches or not
 *
 * @param {Object} attrs - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {jQuery} $productContainer - DOM element for a given product
 * @param {Object} msgs - object containing resource messages
 */
function updateAttrs(attrs, $productContainer, msgs, currentTarget) {
    var methods = this;

    //Get the available swatchable attribute array ['color','size'] (currently defined as a site pref, and added as a data attribute to the product container element
    var attrsWithSwatches = $productContainer.data('swatchable-attributes');

    attrs.forEach(function (attr) {
        if (attrsWithSwatches && attrsWithSwatches.indexOf(attr.attributeId) > -1) {
            methods.processSwatchValues(attr, $productContainer, msgs);
        } else {
            methods.processNonSwatchValues(attr, $productContainer, msgs, currentTarget);
        }
    });
}

/**
 * Updates the availability status in the Product Detail Page
 *
 * @param {Object} response - Ajax response object after an
 *                            attribute value has been [de]selected
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function updateAvailabilityProcess(response, $productContainer) {
    var availabilityValue = '';
    var availabilityMessages = response.product.availability.messages;
    if (!response.product.readyToOrder) {
        availabilityValue = '<li><div>' + response.resources.info_selectforstock + '</div></li>';
    } else {
        availabilityMessages.forEach(function (message) {
            availabilityValue += '<li><div>' + message + '</div></li>';
        });
    }

    $($productContainer).trigger('product:updateAvailability', {
        product: response.product,
        $productContainer: $productContainer,
        message: availabilityValue,
        resources: response.resources
    });
}

/**
 * Generates html for product attributes section
 *
 * @param {array} attributes - list of attributes
 * @return {string} - Compiled HTML
 */
function getAttributesHtml(attributes) {
    if (!attributes) {
        return '';
    }

    var html = '';

    attributes.forEach(function (attributeGroup) {
        if (attributeGroup.ID === 'mainAttributes') {
            attributeGroup.attributes.forEach(function (attribute) {
                html += '<div class="attribute-values">' + attribute.label + ': '
                    + attribute.value + '</div>';
            });
        }
    });

    return html;
}

/**
 * @typedef UpdatedOptionValue
 * @type Object
 * @property {string} id - Option value ID for look up
 * @property {string} url - Updated option value selection URL
 */

/**
 * @typedef OptionSelectionResponse
 * @type Object
 * @property {string} priceHtml - Updated price HTML code
 * @property {Object} options - Updated Options
 * @property {string} options.id - Option ID
 * @property {UpdatedOptionValue[]} options.values - Option values
 */

/**
 * Updates DOM using post-option selection Ajax response
 *
 * @param {OptionSelectionResponse} optionsHtml - Ajax response optionsHtml from selecting a product option
 * @param {jQuery} $productContainer - DOM element for current product
 */
function updateOptions(optionsHtml, $productContainer) {
	// Update options
    $productContainer.find('.product-options').empty().html(optionsHtml);
}

/**
 * Updates slider for PDP main images and thumbnails from response containing images
 * @param {Object[]} imgs - Array of large product images,along with related information
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function createSlider(images, assets, $productContainer) {
    var $sliderContainers = $productContainer.find('.slider-container');
    var data = images !== null ? {images} : null;
    data.assets = assets || null;

    // Reversing order in which to update sliders so that thumbnails get initialized first
    $($sliderContainers.get().reverse()).each((index, sliderContainer) => {
        var $slider = $(sliderContainer).find('.slider');
        $slider.trigger('slider:update', data);
    });
}

/**
 * Parses JSON from Ajax call made whenever an attribute value is [de]selected
 * @param {Object} response - response from Ajax call
 * @param {Object} response.product - Product object
 * @param {string} response.product.id - Product ID
 * @param {Object[]} response.product.variationAttributes - Product attributes
 * @param {Object[]} response.product.images - Product images
 * @param {boolean} response.product.hasRequiredAttrsSelected - Flag as to whether all required
 *     attributes have been selected.  Used partially to
 *     determine whether the Add to Cart button can be enabled
 * @param {jQuery} $productContainer - DOM element for a given product.
 */
function handleVariantResponse(response, $productContainer, currentTarget) {
    var isChoiceOfBonusProducts = $productContainer.parents('.choose-bonus-product-dialog').length > 0;
    var isVariant;
    var isSetItem = $productContainer.hasClass('product-set-item-detail') ? true : false;

    if (response.product.variationAttributes) {
        this.updateAttrs(response.product.variationAttributes, $productContainer, response.resources, currentTarget);
        isVariant = response.product.productType === 'variant';
        if (isChoiceOfBonusProducts && isVariant) {
            $productContainer.parent('.bonus-product-item').data('pid', response.product.id);
            $productContainer.parent('.bonus-product-item').data('ready-to-order', response.product.readyToOrder);
        }
    }

    // Update primary images
    var primaryImages = response.product.images;
    var pdpGalleryAssets = response.product.pdpGalleryAssets;
    var $oldWishlistIcon = $productContainer.find('div.slide .wishlist-toggle-product').first().clone(true);

    this.createSlider(primaryImages, pdpGalleryAssets, $productContainer);
    // if variant is a product set item, update the sample image
    if (isSetItem) {
        $productContainer
            .find('.product-set-item-main-image')
            .attr('src', primaryImages.large[0].url)
            .attr('alt', primaryImages.large[0].alt);
    }

    // Update pricing
    if (!isChoiceOfBonusProducts) {
        var $priceSelector = $('.prices .price', $productContainer).length
            ? $('.prices .price', $productContainer)
            : $('.prices .price');
        $priceSelector.replaceWith(response.product.price.html);
    }

    // Update promotions
    $productContainer.find('.promotions').empty().html(response.product.promotionsHtml);

    this.updateAvailabilityProcess(response, $productContainer);

    if (isChoiceOfBonusProducts) {
        var $selectButton = $productContainer.find('.select-bonus-product');
        $selectButton.trigger('bonusproduct:updateSelectButton', {
            product: response.product, $productContainer: $productContainer
        });
    } else {
        // Enable "Add to Cart" button if all required attributes have been selected
        $('button.add-to-cart, button.add-to-cart-global, button.update-cart-product-global').trigger('product:updateAddToCart', {
            product: response.product, $productContainer: $productContainer
        }).trigger('product:statusUpdate', response.product);
    }

    // Update attributes
    $productContainer.find('.main-attributes').empty().html(this.getAttributesHtml(response.product.attributes));

    // Update wishlist
    if ($oldWishlistIcon && $oldWishlistIcon.length) {
        var $newWishlistIcon = $oldWishlistIcon;
        $newWishlistIcon.attr('data-wishlistpid', response.product.wishlistpid);

        //Make heart icon accurate
        var wishlist = require('../wishlist/components/helpers.js');
        wishlist.updateLinkData($newWishlistIcon);

        var $newSliderMainImages = $productContainer.find('div.primary-images-main div.slide img');
        $newSliderMainImages.each((_i, newImage) => {
            var $newImage = $(newImage);
            $newImage.after($newWishlistIcon.clone(true));
        });
    }
}

/**
 * @typespec UpdatedQuantity
 * @type Object
 * @property {boolean} selected - Whether the quantity has been selected
 * @property {string} value - The number of products to purchase
 * @property {string} url - Compiled URL that specifies variation attributes, product ID, options,
 *     etc.
 */

/**
 * Updates the quantity DOM elements post Ajax call
 * @param {UpdatedQuantity[]} quantities -
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function updateQuantities(quantities, $productContainer) {
    if ($productContainer.parent('.bonus-product-item').length <= 0) {
        var optionsHtml = quantities.map(function (quantity) {
            var selected = quantity.selected ? ' selected ' : '';
            return '<option value="' + quantity.value + '"  data-url="' + quantity.url + '"' +
                selected + '>' + quantity.value + '</option>';
        }).join('');
        this.getQuantitySelector($productContainer).empty().html(optionsHtml);
    }
}

/**
 * Fetch html updates for variation -- SFCC struggles to parse waincludes
 *
 * @param {Object} data the data from attributeSelect ajax call
 * @param {jQuery} $productContainer - DOM element for current product
 */
function updateAttributeContent (data, $productContainer) {
    if (data && data.product && ((data.product.collapsibleContent != '') || (data.product.tabs != ''))) {
        var processInclude = require('base/util');
        // This list should include any JS files that check for specific nodes in DOM that may be added to tabs/collapsible content
        var reinitFiles = require('core/utilities/ajaxHelpers');

        $.ajax({
            url: data.product.variationHtmlUrl,
            method: 'GET',
            dataType: 'html'
        })
            .then((html) => {
                const $html = $(html);
                const $collapseHtml = $html.find('.main-content-item');
                const $tabHtml = $html.find('.tabs');

                $productContainer.find('.main-content-item')[$collapseHtml.length ? 'replaceWith' : 'hide']($collapseHtml);
                $productContainer.find('.tabs')[$tabHtml.length ? 'replaceWith' : 'hide']($tabHtml);
            })
            .then(() => {
                // reset the collapsible content
                if ($productContainer.find('.main-content-item').length) {
                    $('body').trigger('product:afterAttributeContentSwap', { container: $productContainer.find('.main-content-item') });
                }
            })
            .then(() => {
                Object.keys(reinitFiles).forEach(function (key) {
                    if (typeof reinitFiles[key] == 'object') return;

                    if (key === 'slider') {
                        ['.main-content-item', '.tabs'].forEach(function (section) {
                            let productSection = $productContainer.find(section);
                            if (productSection.length) {
                                reinitFiles[key].initializeSliders(productSection);
                            }
                        })
                    } else {
                        processInclude(reinitFiles[key]);
                    }
                });
            })
            .then(() => {
                // reinit video events
                ['.main-content-item', '.tabs'].forEach(function (section) {
                    let productSection = $productContainer.find(section);
                    if (productSection.length) {
                        let sliderSection = $productContainer.find(section + ' .slider-container');
                        if (sliderSection.length) {
                            $('body').trigger('ajax:load.ajaxEvents', [sliderSection]);
                        }
                        $('body').trigger('ajax:load.ajaxEvents', [productSection]);
                    }
                })
            });
    }
}

/**
 * updates the product view when a product attribute is selected or deselected or when
 *         changing quantity
 * @param {string} selectedValueUrl - the Url for the selected variation value
 * @param {jQuery} $productContainer - DOM element for current product
 */
function attributeSelect(selectedValueUrl, $productContainer, currentTarget) {
    var methods = this;

    if (selectedValueUrl) {
        $('body').trigger('product:beforeAttributeSelect',
            { url: selectedValueUrl, container: $productContainer });

        $.ajax({
            url: selectedValueUrl,
            method: 'GET',
        })
            .then((data) => {
                methods.handleVariantResponse(data, $productContainer, currentTarget);
                methods.updateOptions(data.product.optionsHtml, $productContainer);
                methods.updateQuantities(data.product.quantities, $productContainer);
                methods.updateAttributeContent(data, $productContainer);

                $('body').trigger('product:afterAttributeSelect',
                    { data: data, container: $productContainer });
            })
            .always(() => $.spinner().stop());
    }
}

/**
 * Retrieves url to use when adding a product to the cart
 *
 * @return {string} - The provided URL to use when adding a product to the cart
 */
function getAddToCartUrl($productContainer) {
    return $productContainer.find('.add-to-cart-url').val();
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));
    var body = $html.find('.choice-of-bonus-product');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * Retrieves url to use when adding a product to the cart
 *
 * @param {Object} data - data object used to fill in dynamic portions of the html
 */
function chooseBonusProducts(data) {
    var methods = this;

    $('.modal-body').spinner().start();

    if ($('#chooseBonusProductModal').length !== 0) {
        $('#chooseBonusProductModal').remove();
    }
    var bonusUrl;
    if (data.bonusChoiceRuleBased) {
        bonusUrl = data.showProductsUrlRuleBased;
    } else {
        bonusUrl = data.showProductsUrlListBased;
    }

    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="chooseBonusProductModal" tabindex="-1" role="dialog">'
        + '<span class="enter-message sr-only" ></span>'
        + '<div class="modal-dialog choose-bonus-product-dialog" '
        + 'data-total-qty="' + data.maxBonusItems + '"'
        + 'data-UUID="' + data.uuid + '"'
        + 'data-pliUUID="' + data.pliUUID + '"'
        + 'data-addToCartUrl="' + data.addToCartUrl + '"'
        + 'data-pageStart="0"'
        + 'data-pageSize="' + data.pageSize + '"'
        + 'data-moreURL="' + data.showProductsUrlRuleBased + '"'
        + 'data-bonusChoiceRuleBased="' + data.bonusChoiceRuleBased + '">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '    <div class="modal-title">' + data.labels.selectprods + '</div>'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">'
        + '        <span aria-hidden="true">&times;</span>'
        + '        <span class="sr-only"> </span>'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
    $('.modal-body').spinner().start();

    $.ajax({
        url: bonusUrl,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            var parsedHtml = methods.parseHtml(response.renderedTemplate);
            $('#chooseBonusProductModal .modal-body').empty();
            $('#chooseBonusProductModal .enter-message').text(response.enterDialogMessage);
            $('#chooseBonusProductModal .modal-header .close .sr-only').text(response.closeButtonText);
            $('#chooseBonusProductModal .modal-body').html(parsedHtml.body);
            $('#chooseBonusProductModal .modal-footer').html(parsedHtml.footer);
            $('#chooseBonusProductModal').modal('show');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    // conditional added for response, sometimes it was failing when called on page load
    if (response) {
        $('.minicart').trigger('count:update', response);
        var messageType = response.error ? 'alert-danger' : 'alert-success';
        // show add to cart toast
        if (response.newBonusDiscountLineItem
            && Object.keys(response.newBonusDiscountLineItem).length !== 0) {
            this.chooseBonusProducts(response.newBonusDiscountLineItem);
        } else {
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
    }
}

/**
 * Retrieves the bundle product item ID's for the Controller to replace bundle master product
 * items with their selected variants
 *
 * @return {string[]} - List of selected bundle product item ID's
 */
function getChildProducts() {
    var childProducts = [];
    $('.bundle-item').each(function () {
        childProducts.push({
            pid: $(this).find('.product-id').text(),
            quantity: parseInt($(this).find('label.quantity').data('quantity'), 10)
        });
    });

    return childProducts.length ? JSON.stringify(childProducts) : [];
}

/**
 * Retrieve product options
 *
 * @param {jQuery} $productContainer - DOM element for current product
 * @return {string} - Product options and their selected values
 */
function getOptions($productContainer) {
    var options = $productContainer
        .find('.product-option')
        .map(function () {
            var $elOption = $(this).find('.options-select');
            var urlValue = $elOption.val();
            var selectedValueId = $elOption.find('option[value="' + urlValue + '"]')
                .data('value-id');
            return {
                optionId: $(this).data('option-id'),
                selectedValueId: selectedValueId
            };
        }).toArray();

    return JSON.stringify(options);
}

/**
 * Makes a call to the server to report the event of adding an item to the cart
 *
 * @param {string | boolean} url - a string representing the end point to hit so that the event can be recorded, or false
 */
function miniCartReportingUrl(url) {
    if (url) {
        $.ajax({
            url: url,
            method: 'GET',
            success: function () {
                // reporting urls hit on the server
            },
            error: function () {
                // no reporting urls hit on the server
            }
        });
    }
}

function enableQuantitySteppers($context = $('body')) {
    var scope = this;
    var $steppers = $context.find('.quantity-stepper');
    if ($steppers.length) {
        $steppers.each((index, stepper) => {
            var $stepper = $(stepper);
            scope.methods.updateQuantityStepperDisabledStates($stepper);
            scope.methods.bindQuantityStepperButtons($stepper);
            scope.methods.bindQuantityStepperInput($stepper);
        });
    }
}

function updateQuantityStepperDisabledStates($stepper) {
    var min = parseInt($stepper.attr('data-min'));
    var max = parseInt($stepper.attr('data-max'));
    var $input = $stepper.find('input');
    var $minusButton = $stepper.find('[data-action="decrease"]');
    var $plusButton = $stepper.find('[data-action="increase"]');
    var value = !isNaN(parseInt($input.prop('data-qty'))) ? parseInt($input.prop('data-qty')) : parseInt($input.attr('data-qty'));

    if (value <= min) {
        $minusButton.addClass('disabled');
    } else {
        $minusButton.removeClass('disabled');
    }

    if (value >= max) {
        $plusButton.addClass('disabled');
    } else {
        $plusButton.removeClass('disabled');
    }
}

function bindQuantityStepperButtons($stepper) {
    var methods = this;
    var $select = $stepper.prev('select');
    var min = parseInt($stepper.data('min'));
    var max = parseInt($stepper.data('max'));

    $stepper.find('button').off('click').click(event => {
        event.preventDefault();
        var $button = $(event.target);
        var action = $button.data('action');
        var previousValue = parseInt($stepper.find('input').val());
        var newValue = previousValue;

        if (action === 'increase' && (previousValue + 1 <= max)) {
            newValue++;
        }
        if (action === 'decrease' && (previousValue - 1 >= min)) {
            newValue--;
        }
        if (newValue !== previousValue) {
            $select.find('option[value="' + newValue + '"]').prop('selected', true).change();
            $stepper.find('input').prop('value', newValue).prop('data-qty', newValue);
            methods.updateQuantityStepperDisabledStates($stepper);
            $('body').trigger('quantityStepper:change', $stepper);
        }
    });
}

function bindQuantityStepperInput($stepper) {
    var methods = this;
    var ns = '.stepper ';

    var $select = $stepper.prev('select');
    var min = parseInt($stepper.data('min'));
    var max = parseInt($stepper.data('max'));

    $stepper
        .find('[name=qty-stepper]')
        .off(ns)
        .val($select.val())
        .on('change' + ns, event => {
            var $input = $(event.target);
            var previousValue = !isNaN(parseInt($input.prop('data-qty'))) ? parseInt($input.prop('data-qty')) : parseInt($input.attr('data-qty'));
            var newValue = parseInt($input.val());

            if (!isNaN(newValue) && newValue <= max && newValue >= min) {
                $select.find('option[value="' + newValue + '"]').prop('selected', true).change();
                $input.prop('value', newValue).prop('data-qty', newValue);
                methods.updateQuantityStepperDisabledStates($stepper);
                $('body').trigger('quantityStepper:change', $stepper);
            } else {
                $input.prop('value', previousValue);
            }
        });
}

/**
 * Preselect Single Swatches if only one variant available and it is a swatch
   *
   * @param {object} $productContainer - DOM element holding attributes
   * @return {array} - The swatch elements that need to be selected - in this case it's just one
*/
function preselectSingleSwatchesInContainer(containerSelector = 'body') {
    var swatches = [];
    if ($(containerSelector) && $(containerSelector).length > 0) {
        var attributes = $(containerSelector).find('.attribute');
        $.each(attributes, function () {
            var disSwatch = $(this).find('.swatch');
            if (disSwatch.length == 1) {
                var firstswatch = $(disSwatch[0]);
                // If the single swatch is already preselected do not add it to the list to be selected (i.e. going straight to a variation's pdp)
                if (!firstswatch.find('span.selectable').hasClass('selected')) {
                    swatches.push(firstswatch);
                }
                //If we want to hide the attribute selection completely when there is only one choice
                //disSwatch.parents('.attribute').addClass('visually-hidden');
            }
        });
        this.methods.selectSwatch(swatches);
    }
}

/**
 * Select Swatches takes an array of swatch dom elements that need to be preselected
   *
   * @param {array} The swatch elements that need to be selected
*/
function selectSwatch(swatches) {
    var methods = this;

    if (swatches.length > 0) {
        // This splice removes the first swatch element from the array, and stores it in the "swatch" variable
        var swatch = swatches.splice(0,1)[0];

        if ($('.product-bundle').length) {
            var $productContainer = $('.bundle-main-product').length ? $(swatch).closest('.bundle-main-product') : $(swatch).closest('.product-bundle');
        } else {
            var $productContainer = $(swatch).closest('.set-item');
        }

        if (!$productContainer.length) {
            $productContainer = $(swatch).closest('.product-detail');
        }

        $productContainer.find('.color-display-value').text($(swatch).data('displayvalue'));

        // This call triggers the selection of the current swatch element, and sends the new array to be passed back to this function afterward.
        methods.attributeSelect($(swatch).attr('data-url'), $productContainer, function() {
            methods.selectSwatch(swatches);
        });
    }
}

function updateWishlistButtons() {
    var $oldWishlistIcon;

    $('body')
        .on('product:beforeAttributeSelect', function(e, attrData) {
            $oldWishlistIcon = attrData.container.find('div.slide .wishlist-toggle-product').first().clone(true);
        })
        .on('product:afterAttributeSelect', function(e, attrData) {
            if ($oldWishlistIcon && $oldWishlistIcon.length) {
                var $newWishlistIcon = $oldWishlistIcon;
                var $newSliderMainImages = attrData.container.find('div.primary-images-main div.slide img');

                $newWishlistIcon.attr('data-wishlistpid', attrData.wishlistpid);
                wishlistHelpers.updateLinkData($newWishlistIcon);

                $newSliderMainImages.each((_i, newImage) => {
                    var $newImage = $(newImage);

                    $newImage.after($newWishlistIcon.clone(true));
                });
            }
        });
}

module.exports = {
    methods: {
        attributeSelect: attributeSelect,
        bindQuantityStepperButtons: bindQuantityStepperButtons,
        bindQuantityStepperInput: bindQuantityStepperInput,
        checkForClickableAttribute: checkForClickableAttribute,
        chooseBonusProducts: chooseBonusProducts,
        createSlider: createSlider,
        getAddToCartUrl: getAddToCartUrl,
        getAttributesHtml: getAttributesHtml,
        getChildProducts: getChildProducts,
        getOptions: getOptions,
        getPidValue: getPidValue,
        getQuantitySelected: getQuantitySelected,
        getQuantitySelector: getQuantitySelector,
        handlePostCartAdd: handlePostCartAdd,
        handleVariantResponse: handleVariantResponse,
        miniCartReportingUrl: miniCartReportingUrl,
        parseHtml: parseHtml,
        processNonSwatchValues: processNonSwatchValues,
        processSwatchValues: processSwatchValues,
        selectSwatch: selectSwatch,
        updateAttrs: updateAttrs,
        updateAttributeContent: updateAttributeContent,
        updateAvailabilityProcess: updateAvailabilityProcess,
        updateOptions: updateOptions,
        updateQuantities: updateQuantities,
        updateWishlistButtons: updateWishlistButtons,
        updateQuantityStepperDisabledStates: updateQuantityStepperDisabledStates
    },

    /**********
     * shared across QV and PDP
     */
    addToCart: function () {
        var scope = this;

        // if qty stepper input has focus, we need to blur it so product data can update before button click
        $(document).on('mouseenter', 'button.add-to-cart, button.add-to-cart-global', function (event) {
            var $button = $(event.target);
            var $container = $button.closest('.product-detail');
            if (!$container.length) {
                $container = $button.closest('.quick-view-dialog');
            }
            var $qtyStepperInput = $container.find('.quantity-stepper input');

            if ($qtyStepperInput.length && $qtyStepperInput.is(':focus')) {
                $qtyStepperInput.blur();
            }
        });

        $(document).on('click', 'button.add-to-cart, button.add-to-cart-global', function (event) {
            var addToCartUrl;
            var pid;
            var pidsObj;
            var setPids;
            var quantity;

            $('body').trigger('product:beforeAddToCart', this);

            if ($('.set-items').length && $(this).hasClass('add-to-cart-global')) {
                setPids = [];

                var $products = $(this).closest('.product-detail').find('.product-set-item-detail');
                if (!$products.length) {
                    if ($(this).closest('.quick-view-dialog').length) {
                        $products = $(this).closest('.quick-view-dialog').find('.product-set-item-detail');
                    } else {
                        $products = $('.product-detail');  // pagedesigner component 'Add all to cart btn' won't have .product-set-item-detail classes
                    }
                }

                $products.each(function () {
                    if (!$(this).hasClass('product-set-detail')) {
                        setPids.push({
                            pid: $(this).find('.product-id').text(),
                            qty: $(this).find('.quantity-select').val(),
                            options: scope.methods.getOptions($(this))
                        });
                    }
                });
                pidsObj = JSON.stringify(setPids);
            }

            pid = scope.methods.getPidValue($(this));

            quantity = $(this).hasClass('single-variant-quick-add-to-cart') ? 1 : scope.methods.getQuantitySelected($(this));

            var $productContainer = $(this).closest('.product-detail, .product-tile');
            if (!$productContainer.length) {
                if ($(this).hasClass('single-variant-quick-add-to-cart')) {
                    addToCartUrl = $(this).data('url');
                } else {
                    $productContainer = $(this).closest('.quick-view-dialog').find('.product-detail');
                    var $productModalbody = $(this).closest('.modal-content');
                    addToCartUrl = scope.methods.getAddToCartUrl($productModalbody);
                }
            } else {
                addToCartUrl = scope.methods.getAddToCartUrl($productContainer);
            }

            var form = {
                pid: pid,
                pidsObj: pidsObj,
                childProducts: scope.methods.getChildProducts(),
                quantity: quantity,
                options: scope.methods.getOptions($productContainer)
            };

            $(this).trigger('updateAddToCartFormData', form);
            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        if (!data.error) {
                            scope.methods.handlePostCartAdd(data);
                            $('body').trigger('product:afterAddToCart', data);
                            $('body').trigger('product:afterAddToCartQuickview', data); //cart page quickview only
                            $.spinner().stop();
                            scope.methods.miniCartReportingUrl(data.reportingURL);
                        } else {
                            toastHelpers.methods.show('warning', data.message, false);
                        }
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    },
    quickAddToCart: function () {
        $('body').on('product:singleSelectQuickAddToCart', function (e, response) {
            var addToCartUrl = getAddToCartUrl(response.container);

            var form = {
                pid: response.data.product.id,
                quantity: 1
            };

            $(response.container).trigger('updateAddToCartFormData', form);
            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        handlePostCartAdd(data);
                        $('body').trigger('product:afterAddToCart', data);
                        $.spinner().stop();
                        miniCartReportingUrl(data.reportingURL);
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    },
    updateAvailability: function () {
        $('body').on('product:updateAvailability', function (e, response) {
            var $productContainer = response.$productContainer;
            // bundle individual products
            $productContainer.find('.product-availability')
                .data('ready-to-order', response.product.readyToOrder)
                .data('available', response.product.available)
                .find('.availability-msg')
                .empty()
                .html(response.message);
            //Quickview
            var $dialog = $productContainer.closest('.quick-view-dialog');
            if ($dialog.length){
                if ($dialog.find('.product-availability').length) {
                    // bundle all products
                    var allAvailable = $dialog.find('.product-availability').toArray()
                        .every(function (item) { return $(item).data('available'); });

                    var allReady = $dialog.find('.product-availability').toArray()
                        .every(function (item) { return $(item).data('ready-to-order'); });

                    $dialog.find('.global-availability')
                        .data('ready-to-order', allReady)
                        .data('available', allAvailable);

                    $dialog.find('.global-availability .availability-msg').empty()
                        .html(allReady ? response.message : response.resources.info_selectforstock);
                } else {
                    // single product
                    $dialog.find('.global-availability')
                        .data('ready-to-order', response.product.readyToOrder)
                        .data('available', response.product.available)
                        .find('.availability-msg')
                        .empty()
                        .html(response.message);
                }
            //main PDP
            } else {
                if ($productContainer.find('.global-availability').length) {
                    var allAvailable = $productContainer.find('.product-availability').toArray()
                        .every(function (item) { return $(item).data('available'); });

                    var allReady = $productContainer.find('.product-availability').toArray()
                        .every(function (item) { return $(item).data('ready-to-order'); });

                    $productContainer.find('.global-availability')
                        .data('ready-to-order', allReady)
                        .data('available', allAvailable);

                    $productContainer.find('.global-availability .availability-msg').empty()
                        .html(allReady ? response.message : response.resources.info_selectforstock);
                }
            }
        });
    },
    availability: function () {
        var scope = this;

        $(document).on('change', '.quantity-select', function (e) {
            e.preventDefault();

            var $productContainer = $(this).closest('.product-detail');
            if (!$productContainer.length) {
                $productContainer = $(this).closest('.modal-content').find('.product-quickview');
            }

            if ($('.bundle-items', $productContainer).length === 0) {
                scope.methods.attributeSelect($(e.currentTarget).find('option:selected').data('url'),
                    $productContainer);
            }
        });
    },
    updateSetItemsAvailability: function () {
        var scope = this;

        $(document).on('change', '.product-set-quantity-select', function (e) {
            e.preventDefault();

            var $productContainer = $(this).closest('.product-set-detail').find('.set-items');
            if (!$productContainer.length) {
                $productContainer = $(this).closest('.modal-content').find('.set-items');
            }
            var $quantitySelected = $(e.currentTarget).find('option:selected').val();

            $productContainer.find('.product-set-item-detail').each(function () {
                var $setItemQuantity = $(this).find('.quantity-select');
                var qtyStepper = $(this).find('.quantity-stepper');
                $setItemQuantity.val($quantitySelected).find('option').each(function () {
                    if (this.value == $quantitySelected) {
                        $(this).prop('selected','selected');
                        $setItemQuantity.change();
                        if (qtyStepper.length) {
                            qtyStepper.find('input').val($quantitySelected).attr('data-qty',$quantitySelected);
                            scope.methods.updateQuantityStepperDisabledStates(qtyStepper);
                        }
                        return false;
                    }
                })
            });
        });
    },
    updateAddToCart: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            var $productContainer = response.$productContainer;
            // update local add to cart (for sets)
            $productContainer.find('button.add-to-cart').attr('disabled',
                (!response.product.readyToOrder || !response.product.available));
            // update global add to cart (single products, bundles)
            var $dialog = $(response.$productContainer).closest('.quick-view-dialog');
            if ($dialog.length){
                $dialog.find('.add-to-cart-global, .update-cart-product-global').attr('disabled',
                    !$dialog.find('.global-availability').data('ready-to-order')
                    || !$dialog.find('.global-availability').data('available')
                );
            } else {
                var enable = $productContainer.find('.product-availability').toArray().every(function (item) {
                    return $(item).data('available') && $(item).data('ready-to-order');
                });
                $productContainer.find('button.add-to-cart-global').attr('disabled', !enable);
            }
        });
    },
    updateAttribute: function() {
        $('body').on('product:afterAttributeSelect', function (e, response) {
            response.container.find('#sizeChartModal').attr('data-product', response.data.product.id);

            //Quickview
            if ($('.modal.show .product-quickview>.bundle-items').length) {
                $('.modal.show').find(response.container).data('pid', response.data.product.id);
                $('.modal.show').find(response.container).find('.product-id').text(response.data.product.id);
            } else if ($('.set-items').length) {
                response.container.find('.product-id').text(response.data.product.id);
            } else if ($('.modal.show .product-quickview').length) {
                $('.modal.show .product-quickview').data('pid', response.data.product.id);
                $('.modal.show .full-pdp-link').attr('href', response.data.product.selectedProductUrl);
                $('.modal.show').find(response.container).find('.product-id').text(response.data.product.id);
            //Main PDP
            } else if ($('.product-detail>.bundle-items').length) {
                response.container.data('pid', response.data.product.id);
                response.container.find('.product-id').text(response.data.product.id);
            } else if ($('.product-set-detail').eq(0)) {
                response.container.data('pid', response.data.product.id);
                response.container.find('.product-id').text(response.data.product.id);
                response.container.find('.add-to-cart').data('pid', response.data.product.id);
            } else {
                $('.product-detail .add-to-cart').data('pid', response.data.product.id);
                $('.product-id').text(response.data.product.id);
                $('.product-detail:not(".bundle-item")').data('pid', response.data.product.id);
            }
        });
    },
    quickViewLoaded: function() {
        var scope = this;
        $(document).on('quickview:ready', 'body', (event, modal) => {
            scope.enableQuantitySteppers($(modal));
            wishlistHelpers.updateLinkData();
        });
    },
    miniCartLoaded: function() {
        var scope = this;
        $('body').on('minicart:loaded', (event, minicart) => {
            scope.enableQuantitySteppers($(minicart));
        });
    },
    preselectSingleSwatchesInContainer: preselectSingleSwatchesInContainer,
    //Attributes that display as non-color swatches
    nonColorAttribute: function () {
        var scope = this;

        $(document).on('click', 'button.swatch:not(.color-attribute)', function (e) {
            e.preventDefault();

            $('body').trigger('product:swatchClicked', [$(this), toggleObject]); // add trigger for any attribute click use (incl. nonClickable Attrs)
            if (scope.methods.checkForClickableAttribute($(this)) && !toggleObject.viewOutOfStockItems) {
                return;
            }

            if ($('.product-bundle').length) {
                var $productContainer = $('.bundle-main-product').length ? $(this).closest('.bundle-main-product') : $(this).closest('.product-bundle');
            } else {
                var $productContainer = $(this).closest('.set-item');
            }

            if (!$productContainer.length) {
                $productContainer = $(this).closest('.product-detail');
            }

            scope.methods.attributeSelect($(this).attr('data-url'), $productContainer);

            $(this).closest('.non-color-attribute-swatches').find('.non-color-display-value').text($(this).find('.swatch-value').data('display-value'));
        });
    },
    //Attributes that display in a select dropdown (default)
    selectAttribute: function () {
        var scope = this;
        $(document).on('change', 'select[class*="select-"], .options-select', function (e) {
            e.preventDefault();

            if ($('.product-bundle').length) {
                var $productContainer = $('.bundle-main-product').length ? $(this).closest('.bundle-main-product') : $(this).closest('.product-bundle');
            } else {
                var $productContainer = $(this).closest('.set-item');
            }

            if (!$productContainer.length) {
                $productContainer = $(this).closest('.product-detail');
            }
            scope.methods.attributeSelect(e.currentTarget.value, $productContainer, e.currentTarget);
        });
    },
    //Attributes that display as color swatches
    colorAttribute: function () {
        var scope = this;

        $(document).on('click', '[data-attr="color"] button', function (e) {
            e.preventDefault();

            $('body').trigger('product:swatchClicked', [$(this), toggleObject]); // add trigger for any attribute click use (incl. nonClickable Attrs)
            if (scope.methods.checkForClickableAttribute($(this)) && !toggleObject.viewOutOfStockItems) {
                return;
            }

            if ($('.product-bundle').length) {
                var $productContainer = $('.bundle-main-product').length ? $(this).closest('.bundle-main-product') : $(this).closest('.product-bundle');
            } else {
                var $productContainer = $(this).closest('.set-item');
            }

            if (!$productContainer.length) {
                $productContainer = $(this).closest('.product-detail');
            }
            scope.methods.attributeSelect($(this).attr('data-url'), $productContainer);

            $productContainer.find('.color-display-value').text($(this).find('.swatch').data('displayvalue'));
        });
    },
    enableQuantitySteppers: enableQuantitySteppers,

    sizeChart: function() {
        $('body').on('click', '.size-chart .size-chart-launcher', event => {
            event.preventDefault();
            var url = $(event.target).attr('href');
            var productId = $(event.target).closest('.product-detail').find('.product-id').html();
            var $sizeChartModal = $('.modal[data-product=' + productId + ']').eq(0);
            var $modalBody = $sizeChartModal.find('.modal-body');

            $.ajax({
                url: url,
                type: 'get',
                dataType: 'html',
                success: function (data) {
                    $modalBody.html(data);
                }
            });

            //if the sizechart is from a quickview append after all the modal-backdrops
            if ($(event.target).parents('.product-quickview').length) {
                var $sizeChartContainer = $(event.target).closest('.size-chart');

                $sizeChartModal.appendTo('body');
                $sizeChartModal.on('hide.bs.modal', event => {
                    $sizeChartModal.appendTo($sizeChartContainer);
                });
            }
            $sizeChartModal.modal('show');
        });

        $('body').on('click', '#sizeChartModal .close', event =>  {
            $(event.target).closest('#sizeChartModal').modal('hide');
        });
    },

    /**********
     * from cart
     */
    bonusProductEdit: function() {
        var scope = this;

        $('body').on('bonusproduct:edit', (event, data) => {
            scope.methods.chooseBonusProducts(data);
        });
    },
    removeBonusProduct: function () {
        $(document).on('click', '.selected-pid .remove-bonus-product', event => {
            $(event.target).closest('.selected-pid').remove();
            var $selected = $('#chooseBonusProductModal .selected-bonus-products .selected-pid');
            var count = 0;
            if ($selected.length) {
                $selected.each(function () {
                    count += parseInt($(this).data('qty'), 10);
                });
            } else {
                $('.add-bonus-products').addClass('disabled'); // make sure atc button is disabled if no bonus products are selected
            }

            $('.pre-cart-products').html(count);
            $('.selected-bonus-products .bonus-summary').removeClass('alert-danger');
            $('body').trigger('modal:loaded', $('#chooseBonusProductModal')); // update quickview modal scroll height
        });
    },
    selectBonusProduct: function () {
        $(document).on('click', '.select-bonus-product', function () {
            var $choiceOfBonusProduct = $(this).parents('.choice-of-bonus-product');
            var pid = $(this).data('pid');
            var maxPids = $('.choose-bonus-product-dialog').data('total-qty');
            var submittedQty = parseInt($choiceOfBonusProduct.find('.bonus-quantity-select').val(), 10);
            var totalQty = 0;
            $.each($('#chooseBonusProductModal .selected-bonus-products .selected-pid'), function () {
                totalQty += $(this).data('qty');
            });
            totalQty += submittedQty;
            var optionID = $choiceOfBonusProduct.find('.product-option').data('option-id');
            var valueId = $choiceOfBonusProduct.find('.options-select option:selected').data('valueId');
            if (totalQty > 0) {
                $('.add-bonus-products').removeClass('disabled'); //if a bonus product is selected make sure to enable the atc button
            }
            if (totalQty <= maxPids) {
                var selectedBonusProductHtml = ''
                + '<div class="selected-pid" '
                + 'data-pid="' + pid + '"'
                + 'data-qty="' + submittedQty + '"'
                + 'data-optionID="' + (optionID || '') + '"'
                + 'data-option-selected-value="' + (valueId || '') + '"'
                + '>'
                + '<div class="bonus-product-name">'
                + $choiceOfBonusProduct.find('.product-name').html()
                + '</div>'
                + '<div class="remove-bonus-product"></div>'
                + '</div>'
                ;
                $('#chooseBonusProductModal .selected-bonus-products .bonus-summary-products-container').append(selectedBonusProductHtml);
                $('.pre-cart-products').html(totalQty);
                $('.selected-bonus-products .bonus-summary').removeClass('alert-danger');
                $('body').trigger('modal:loaded', $('#chooseBonusProductModal')); // update quickview modal scroll height
            } else {
                $('.selected-bonus-products .bonus-summary').addClass('alert-danger');
            }
        });
    },
    enableBonusProductSelection: function () {
        $('body').on('bonusproduct:updateSelectButton', function (e, response) {
            $('button.select-bonus-product', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available));
            var pid = response.product.id;
            $('button.select-bonus-product', response.$productContainer).data('pid', pid);
        });
    },
    focusChooseBonusProductModal: function () {
        var scope = this;

        $('body').on('shown.bs.modal', '#chooseBonusProductModal', function() {
            scope.enableQuantitySteppers($(this));
            $('body').trigger('quickview:ready', $('#chooseBonusProductModal'));
            $('#chooseBonusProductModal').siblings().attr('aria-hidden', 'true');
            $('#chooseBonusProductModal .close').focus();
        });
    },
    showMoreBonusProducts: function () {
        var scope = this;

        $(document).on('click', '.show-more-bonus-products', function () {
            var url = $(this).data('url');
            var $modalContent = $(this).closest('.modal').find('.modal-content');
            $modalContent.spinner().start();

            $.ajax({
                url: url,
                method: 'GET',
                success: function (response) {
                    var parsedHtml = scope.methods.parseHtml(response.renderedTemplate);
                    $modalContent.find('.modal-body').append(parsedHtml.body);
                    $modalContent.find('.show-more-bonus-products:first').remove();
                    abSlider.initializeSliders($(parsedHtml.body));
                    scope.enableQuantitySteppers($(parsedHtml.body));
                    $modalContent.spinner().stop();
                },
                error: function () {
                    $modalContent.spinner().stop();
                }
            });
        });
    },
    addBonusProductsToCart: function () {
        $(document).on('click', '.add-bonus-products', function () {
            var $readyToOrderBonusProducts = $('.choose-bonus-product-dialog .selected-pid');
            var queryString = '?pids=';
            var url = $('.choose-bonus-product-dialog').data('addtocarturl');
            var pidsObject = {
                bonusProducts: []
            };

            $.each($readyToOrderBonusProducts, function () {
                var qtyOption =
                    parseInt($(this)
                        .data('qty'), 10);

                var option = null;
                if (qtyOption > 0) {
                    if ($(this).data('optionid') && $(this).data('option-selected-value')) {
                        option = {};
                        option.optionId = $(this).data('optionid');
                        option.productId = $(this).data('pid');
                        option.selectedValueId = $(this).data('option-selected-value');
                    }
                    pidsObject.bonusProducts.push({
                        pid: $(this).data('pid'),
                        qty: qtyOption,
                        options: [option]
                    });
                    pidsObject.totalQty = parseInt($('.pre-cart-products').html(), 10);
                }
            });
            queryString += JSON.stringify(pidsObject);
            queryString = queryString + '&uuid=' + $('.choose-bonus-product-dialog').data('uuid');
            queryString = queryString + '&pliuuid=' + $('.choose-bonus-product-dialog').data('pliuuid');
            $.spinner().start();
            $.ajax({
                url: url + queryString,
                method: 'POST',
                success: function (data) {
                    $.spinner().stop();
                    if (data.error) {
                        $('#chooseBonusProductModal').modal('hide');
                        if ($('.add-to-cart-messages').length === 0) {
                            $('body').append('<div class="add-to-cart-messages"></div>');
                        }
                        $('.add-to-cart-messages').append(
                            '<div class="alert alert-danger add-to-basket-alert text-center"'
                            + ' role="alert">'
                            + data.errorMessage + '</div>'
                        );
                        setTimeout(function () {
                            $('.add-to-basket-alert').remove();
                        }, 3000);
                    } else {
                        $('.configure-bonus-product-attributes').html(data);
                        $('.bonus-products-step2').removeClass('hidden-xl-down');
                        $('#chooseBonusProductModal').modal('hide');

                        if ($('.add-to-cart-messages').length === 0) {
                            $('body').append('<div class="add-to-cart-messages"></div>');
                        }
                        $('.minicart-quantity').html(data.totalQty);
                        $('.add-to-cart-messages').append(
                            '<div class="alert alert-success add-to-basket-alert text-center"'
                            + ' role="alert">'
                            + data.msgSuccess + '</div>'
                        );

                        sessionStorage?.setItem?.('cartcount', data.totalQty);

                        setTimeout(function () {
                            $('.add-to-basket-alert').remove();
                            if ($('.cart-page').length) {
                                location.reload();
                            }
                        }, 1500);
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },
    trapChooseBonusProductModalFocus: function () {
        $('body').on('keydown', '#chooseBonusProductModal', function (e) {
            var focusParams = {
                event: e,
                containerSelector: '#chooseBonusProductModal',
                firstElementSelector: '.close',
                lastElementSelector: '.add-bonus-products'
            };
            focusHelper.setTabNextFocus(focusParams);
        });
    },
    onClosingChooseBonusProductModal: function () {
        $('body').on('hidden.bs.modal', '#chooseBonusProductModal', function () {
            $('#chooseBonusProductModal').siblings().attr('aria-hidden', 'false');
            // check to see if there are bonus products selected and if not inform the user
            var $noProductsMessage = $(".bonus-summary-products-container").attr('data-no-products-msg');
            var $selected = $('#chooseBonusProductModal .selected-bonus-products .selected-pid').length > 0;
            if (!$selected) {
                toastHelpers.methods.show('danger', $noProductsMessage, true);
            }
        });
    },
    updateHideShowOutOfStockInStockNotificationForm: function () {
        if (toggleObject.viewOutOfStockItems && toggleObject.viewBackInStockNotificationForm) {
            $('body').on('product:afterAttributeSelect', function(e, attrData) {
                var $qtyCartContainer = attrData.container && attrData.container.find('.qty-cart-container');

                if ($qtyCartContainer) {
                    $qtyCartContainer.each(function () {
                        var $container = $(this);
                        var $addToCartBtn = $container.find('.addtocartbutton');
                        var $qty = $container.find('.quantity');
                        var $bisnForm = $container.find('.bisnform');
                        var product = (attrData.data || {}).product || {};

                        $bisnForm.find('.submit-success').removeClass('submit-success');
                        $bisnForm.find(':input[name="pid"]').val(product.id || '');

                        if (!!product.showBISN) {
                            $addToCartBtn.addClass('d-none');
                            $qty.addClass('d-none');
                            $bisnForm.removeClass('d-none');
                        } else {
                            $addToCartBtn.removeClass('d-none');
                            if (!attrData.data.product.hideQty) {
                                $qty.removeClass('d-none');
                            }
                            $bisnForm.addClass('d-none');
                        }
                    });
                }
            });
        }
    },
    notifyWhenBackInStock: function () {
        $('body').on('submit', '.pdp-bisn-form', function (e) {
            e.preventDefault();
            e.stopPropagation();
            //
            // Submit the Subscribe Form
            //
            var form = this,
                $form = $(form);

            $form.data('$xhr', $.ajax({
                beforeSend: function () {
                    var $xhr = this.data('$xhr');

                    $xhr && $xhr.abort();

                    $form.removeClass('submit-error');

                    return form.checkValidity();
                },
                context: $form,
                data: $form.serialize(),
                method: $form.attr('method'),
                error: function() {
                    // Validate each input
                    this.find(':input').each(function (input) { input.checkValidity(); });

                    console.error(this, arguments);
                },
                success: function (data) {
                    if (data.success) {
                        $form.addClass('submit-success');

                        $('body').trigger('subscribe:success', data);

                        form.reset();
                    } else if (data.error) {
                        $form.addClass('submit-error');
                        // Hide error after delay
                        setTimeout(function () { $form.removeClass('submit-error'); }, 5000);
                    }
                },
                url: $form.attr('action')
            }));
        });
    }
};
