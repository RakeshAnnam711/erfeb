'use strict';
var focusHelper = require('base/components/focus');
var formValidation = require('base/components/formValidation');
var base = require('core/product/base');

/**
 * Retrieves the relevant pid value (copied from base so we dont load the entire file 2x for this)
 * @param {jquery} $el - DOM container for a given add to cart button
 * @return {string} - value to be used when adding product to cart
 */
function getPidValue($el) {
    var pid;

    if ($('#quickViewModal').hasClass('show') && !$('.product-set').length) {
        pid = $($el).closest('.modal-content').find('.product-quickview').data('pid');
    } else if ($('.product-set-detail').length || $('.product-set').length) {
        pid = $($el).closest('.product-detail').find('.product-id').text();
    } else {
        pid = $('.product-detail:not(".bundle-item")').data('pid');
    }

    return pid;
}

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, params) {
    var newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return newUrl;
}

/**
 * Checks whether the basket is valid. if invalid displays error message and disables
 * checkout button
 * @param {Object} data - AJAX response from the server
 */
function validateBasket(data) {
    if (data.valid.error) {
        if (data.valid.message) {
            var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
                'fade show" role="alert">' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                '<span aria-hidden="true">&times;</span>' +
                '</button>' + data.valid.message + '</div>';

            $('.cart-error').append(errorHtml);
        } else {
            $('.cart').empty().append('<div class="row"> ' +
                '<div class="col-12 text-center"> ' +
                '<h1>' + data.resources.emptyCartMsg + '</h1> ' +
                '</div> ' +
                '</div>'
            );
            $('.number-of-items').empty().append(data.numItems == 1 ? data.resources.numberOfItem : data.resources.numberOfItems);
            $('.minicart-quantity').empty().append(data.numItems);
            $('.minicart-link').attr({
                'aria-label': data.resources.minicartCountOfItems,
                title: data.resources.minicartCountOfItems
            });
            $('.minicart .popover').empty();
            $('.minicart .popover').removeClass('show');

            sessionStorage?.setItem?.('cartcount', data.numItems);
        }

        $('.checkout-btn').addClass('disabled');
    } else {
        $('.checkout-btn').removeClass('disabled');
    }
}

/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} data - AJAX response from the server
 */

function updateCartTotals(data) {
    var $cart = $('.cart');
    $('.number-of-items').empty().append(data.numItems == 1 ? data.resources.numberOfItem : data.resources.numberOfItems);
    $cart.find('.shipping-cost span').empty().append(data.totals.totalShippingCost);
    $cart.find('.tax-total span').empty().append(data.totals.totalTax);
    // $cart.find('.sub-total span').empty().append(data.totals.subTotal);
    $('.minicart-quantity').empty().append(data.numItems);
    $('.minicart-link').attr({
        'aria-label': data.numItems == 1 ? data.resources.numberOfItem : data.resources.numberOfItems,
        title: data.numItems == 1 ? data.resources.numberOfItem : data.resources.numberOfItems
    });

    sessionStorage?.setItem?.('cartcount', data.numItems);

    if (data.totals.orderLevelDiscountTotal.value > 0) {
        $cart.find('.order-discount').removeClass('hide-order-discount');
        $cart.find('.order-discount-total').empty()
            .append('- ' + data.totals.orderLevelDiscountTotal.formatted);
    } else {
        $cart.find('.order-discount').addClass('hide-order-discount');
    }

    if (data.totals.shippingLevelDiscountTotal.value > 0) {
        $cart.find('.shipping-discount').removeClass('hide-shipping-discount');
        $cart.find('.shipping-discount-total span').empty().append('- ' +
            data.totals.shippingLevelDiscountTotal.formatted);
    } else {
        $cart.find('.shipping-discount').addClass('hide-shipping-discount');
    }

    if (data.payment.giftCertificatePaymentInstruments.length) {
        $cart.find('.giftcertificate-discount').removeClass('d-none');
        $cart.find('.giftcertificate-discount-label').text(data.totals.giftCertificatePaymentInstrumentsLabel);
        $cart.find('.giftcertificate-discount-total').text('- ' + data.totals.giftCertificatePaymentInstrumentsTotalFormatted);
    } else {
        $cart.find('.giftcertificate-discount').addClass('d-none');
    }

    if (data.totals.grandTotalLessGiftCertificatePaymentInstrumentsValue) {
        $cart.find('.cartAdditionalPaymentButtons').removeClass('d-none');
    } else {
        $cart.find('.cartAdditionalPaymentButtons').addClass('d-none');
    }
}

/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.cart-error').append(errorHtml);
}

/**
 * re-renders the approaching discount messages
 * @param {Object} approachingDiscounts - updated approaching discounts for the cart
 */
function updateApproachingDiscounts(approachingDiscounts) {
    var html = '';
    $('.approaching-discounts').empty();
    if (approachingDiscounts.length > 0) {
        approachingDiscounts.forEach(function (item) {
            html += '<div class="single-approaching-discount text-center">'
                + item.discountMsg + '</div>';
        });
    }
    $('.approaching-discounts').append(html);
}

/**
 * Updates the availability of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateAvailability(data, uuid) {
    var lineItem;
    var messages = '';

    for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].UUID === uuid) {
            lineItem = data.items[i];
            break;
        }
    }

    if (lineItem != null) {
        $('.availability-' + lineItem.UUID).empty();

        if (lineItem.availability) {
            if (lineItem.availability.messages) {
                lineItem.availability.messages.forEach(function (message) {
                    messages += '<p class="line-item-attributes">' + message + '</p>';
                });
            }

            if (lineItem.availability.inStockDate) {
                messages += '<p class="line-item-attributes line-item-instock-date">'
                    + lineItem.availability.inStockDate
                    + '</p>';
            }
        }

        $('.availability-' + lineItem.UUID).html(messages);
    }
}

/**
 * Finds an element in the array that matches search parameter
 * @param {array} array - array of items to search
 * @param {function} match - function that takes an element and returns a boolean indicating if the match is made
 * @returns {Object|null} - returns an element of the array that matched the query.
 */
function findItem(array, match) {
    for (var i = 0, l = array.length; i < l; i++) {
        if (match.call(this, array[i])) {
            return array[i];
        }
    }
    return null;
}

/**
 * Updates details of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateProductDetails(data, uuid) {
    $('.card .product-info.uuid-' + uuid).parent().replaceWith(data.renderedTemplate);
    base.enableQuantitySteppers();
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.product-quickview');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * replace content of modal
 * @param {string} actionUrl - url to be used to remove product
 * @param {string} productID - pid
 * @param {string} productName - product name
 * @param {string} uuid - uuid
 */
function confirmDelete(actionUrl, productID, productName, uuid) {
    var $deleteConfirmBtn = $('.cart-delete-confirmation-btn');
    var $productToRemoveSpan = $('.product-to-remove');

    $deleteConfirmBtn.data('pid', productID);
    $deleteConfirmBtn.data('action', actionUrl);
    $deleteConfirmBtn.data('uuid', uuid);

    $productToRemoveSpan.empty().append(productName);
}

function displayMessage(dataStatus, dataMsg) {
    $.spinner().stop();

    if ($('.toggle-cart-product-messages').length === 0) {
        $('body').append('<div class="toggle-cart-product-messages"></div>');
    }

    $('.toggle-cart-product-messages').append('<div class="alert text-center add-to-wishlist-alert text-center ' + dataStatus + '">' + dataMsg + '</div>');

    setTimeout(function () {
        $('.toggle-cart-product-messages').remove();
    }, 5000);
}

// Refreshes the checkout order total summary section dynamically
function refreshOrderSummary() {
    const orderSummaryTemplate = $('.order-total-summary');
    if (orderSummaryTemplate.length > 0){
        const getOrderSummaryDataURL= $('input[name="get-checkout-order-summary-data"]').val();
        $.ajax({
            url: getOrderSummaryDataURL,
            method: 'GET',
            success: function (html) {
                orderSummaryTemplate.html(html);
            },
            error: function (e) {
                console.error('Failed to refresh order summary.', e);
            }
        });
    }
}

function init () {
    $('body').on('click', '.remove-product', function (e) {
        e.preventDefault();

        var actionUrl = $(this).data('action');
        var productID = $(this).data('pid');
        var productName = $(this).data('name');
        var uuid = $(this).data('uuid');
        module.exports.confirmDelete(actionUrl, productID, productName, uuid);
    });

    $('body').on('afterRemoveFromCart', function (e, data) {
        e.preventDefault();
        module.exports.confirmDelete(data.actionUrl, data.productID, data.productName, data.uuid);
    });

    $('body').on('click', '.cart-delete-confirmation-btn', function (e) {
        e.preventDefault();
        var pageAction = $('.page').data('action');

        var productID = $(this).data('pid');
        var url = $(this).data('action');
        var uuid = $(this).data('uuid');
        var urlParams = {
            pid: productID,
            uuid: uuid
        };

        url = module.exports.appendToUrl(url, urlParams);

        $('body > .modal-backdrop').remove();

        $('body').trigger('cart:beforeUpdate');

        $.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                displayMessage('alert-success', 'Product removed from cart.');
                if (data.basket.items.length === 0) {
                    // Redirect to cart page from checkout if cart becomes empty
                    if (pageAction === 'Checkout-Begin') {
                        $.spinner().start();
                        try {
                            const getCartPageLink= $('input[name="get-cart-page-link"]').val();
                            window.location.href = getCartPageLink;
                            return;
                        } catch (error) {
                            console.error('Error while redirecting to cart page.', error);
                        }
                        $.spinner().stop();
                    }
                    const homeShowLink = $('input[name="home-show-link"]').val();
                    const wishlistShowLink = $('input[name="wishlist-show-link"]').val();
                    $('.cart-header .number-of-items, .cart-header .continue-shopping-link').hide();
                    $('.cart').empty().append(`
                        <div class="cart-empty m-auto">
                            <div class="row">
                                <div class="col-12">
                                    <p class="cart-emtpy-text m-0">${data.basket.resources.emptyCartMsg}</p>
                                </div>
                                <div class="col-12 cart-empty-ctas">
                                    <a href="${homeShowLink}"
                                        class="btn btn-primary"
                                        aria-label="Continue Shopping"
                                        role="button">
                                        Continue Shopping
                                    </a>
                                    <a href="${wishlistShowLink}"
                                        class="btn btn-secondary"
                                        aria-label="view your wishlist"
                                        role="button">
                                        view your wishlist
                                    </a>
                                </div>
                            </div>
                        </div>`
                    );
                    $('.number-of-items').empty().append(data.basket.resources.numberOfItems);
                    $('.number-of-items-container').removeClass('text-md-right');
                    $('.minicart-quantity').empty().append(data.basket.numItems);
                    $('.minicart-link').attr({
                        'aria-label': data.basket.resources.minicartCountOfItems,
                        title: data.basket.resources.minicartCountOfItems
                    });
                    $('.minicart .popover').empty();
                    $('.minicart .popover').removeClass('show');
                    $('body').removeClass('modal-open');
                    $('html').removeClass('veiled');

                    sessionStorage?.setItem?.('cartcount', data.basket.numItems);
                } else {
                    if (data.toBeDeletedUUIDs && data.toBeDeletedUUIDs.length > 0) {
                        for (var i = 0; i < data.toBeDeletedUUIDs.length; i++) {
                            $('.uuid-' + data.toBeDeletedUUIDs[i]).closest('.card').remove();
                        }
                    }
                    $('.uuid-' + uuid).closest('.card').remove();
                    if (!data.basket.hasBonusProduct) {
                        $('.bonus-product').remove();
                    }
                    // NOTE: there's an open issue for problems with removing products with bonus items: https://github.com/SalesforceCommerceCloud/storefront-reference-architecture/issues/748
                    $('.coupons-and-promos').empty().append(data.basket.totals.discountsHtml);
                    module.exports.updateCartTotals(data.basket);
                    module.exports.updateApproachingDiscounts(data.basket.approachingDiscounts);
                    $('body').trigger('setShippingMethodSelection', data.basket);
                    module.exports.validateBasket(data.basket);
                    refreshOrderSummary();
                }

                $('body').trigger('cart:update', [data, uuid, productID]);

                var productLength = data.basket.items.length || 0;
                if (productLength == 0) {
                    document.dispatchEvent(new CustomEvent('cart:refetchFrenzyRecommendationForEmptyCart'));
                } else {
                    var skus = data.basket.items.map(item => item.id);
                    document.dispatchEvent(new CustomEvent('cart:refetchFrenzyRecommendation', {detail: {skuList: skus}}));
                }

                // WGACA MODIFICATION - Show add to cart status for current PDP product
                if (module.exports.getPidValue() === productID) {
                    window.showAddToCartStatus?.();
                }

                $(`div.card.wishlist-card-product.product-tile[data-pid="${productID}"]`)
                .find('button.wishlist-card-product-add')
                .text('Add To Cart')
                .prop('disabled', false)
                .removeClass('disabled');

                // END MODIFICATION
                $.spinner().stop();
            },
            error: function (err) {
                displayMessage('alert-danger', 'Something went wrong while removing the product from cart.');
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    module.exports.createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });

    $('body').on('quantityStepper:change', (event, stepper) => {
        var $stepper = $(stepper);
        var isMiniCart = $stepper.closest('.minicart').length > 0;
        var selectId = $stepper.closest('.quantity-form').find('select').attr('id');
        var $select = $('.cart-page select#' + selectId);
        var value = parseInt($stepper.find('input').val());

        // if the qty change was triggered from the minicart, manually update cart qty input values
        if (isMiniCart) {
            var $cartStepper = $select.next('.quantity-stepper');
            $cartStepper.find('input').prop('value', value).prop('data-qty', value);
        }
    });

    $('body').on('change', '.quantity-form > .quantity', function() {
        var url = $(this).data('action');
        if (!url) {
            return;
        }

        var preSelectQty = $(this).data('pre-select-qty');
        var quantity = $(this).val();
        var productID = $(this).data('pid');
        var uuid = $(this).data('uuid');
        var urlParams = {
            pid: productID,
            quantity: quantity,
            uuid: uuid
        };
        url = module.exports.appendToUrl(url, urlParams);

        $(this).parents('.card').spinner().start();

        $('body').trigger('cart:beforeUpdate');

        $.ajax({
            url: url,
            type: 'get',
            context: this,
            dataType: 'json',
            success: function (data) {
                $('.quantity[data-uuid="' + uuid + '"]').val(quantity);
                $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                module.exports.updateCartTotals(data);
                module.exports.updateApproachingDiscounts(data.approachingDiscounts);
                module.exports.updateAvailability(data, uuid);
                module.exports.validateBasket(data);
                $(this).data('pre-select-qty', quantity);

                $('body').trigger('cart:update', [data, uuid]);

                $.spinner().stop();
                if ($(this).parents('.product-info').hasClass('bonus-product-line-item') && $('.cart-page').length) {
                    location.reload();
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    module.exports.createErrorNotification(err.responseJSON.errorMessage);
                    $(this).val(parseInt(preSelectQty, 10));
                    $.spinner().stop();
                }
            }
        });
    });

    $('.shippingMethods').change(function () {
        var url = $(this).attr('data-actionUrl');
        var urlParams = {
            methodID: $(this).find(':selected').attr('data-shipping-id')
        };
        // url = module.exports.appendToUrl(url, urlParams);

        $('.totals').spinner().start();
        $('body').trigger('cart:beforeShippingMethodSelected');
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: urlParams,
            success: function (data) {
                if (data.error) {
                    window.location.href = data.redirectUrl;
                } else {
                    $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                    module.exports.updateCartTotals(data);
                    module.exports.updateApproachingDiscounts(data.approachingDiscounts);
                    module.exports.validateBasket(data);
                }
                $('body').trigger('cart:shippingMethodSelected', data);
                $.spinner().stop();
            },
            error: function (err) {
                if (err.redirectUrl) {
                    window.location.href = err.redirectUrl;
                } else {
                    module.exports.createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });

    let checkoutInstance = null;
    let applePayComponent = null;
    
    function destroyApplePay() {
        if (applePayComponent) {
            applePayComponent.unmount();
            applePayComponent = null;
        }
    }
    
    async function initApplePay(paymentMethodsResponse, orderAmount) {
        destroyApplePay();
    
        try {
            checkoutInstance = await AdyenCheckout({
                environment: window.Configuration.environment,
                clientKey: window.adyenClientKey,
                paymentMethodsResponse: paymentMethodsResponse.AdyenPaymentMethods,
    
                onSubmit: (state, component) => {
                    console.log('[ApplePay] onSubmit triggered');
                
                    const data = state.data;
                    const csrfToken = $('#adyen-token').val();
                
                    if (!csrfToken) {
                        console.error('[ApplePay] CSRF token missing');
                        component.setStatus('error');
                        return;
                    }
                
                    console.log('[ApplePay] Sending PaymentFromComponent request', data);
                
                    $.ajax({
                        url: window.paymentFromComponentURL,
                        type: 'post',
                        data: {
                            data: JSON.stringify(data),
                            paymentMethod: 'Apple Pay',
                            csrf_token: csrfToken
                        },
                        success: function (response) {
                            // console.log('[ApplePay] PaymentFromComponent response:', response);
                            if (!document.querySelector('#showConfirmationForm')) {
                                const template = document.createElement('template');
                                template.innerHTML = `
                                    <form method="post"
                                          id="showConfirmationForm"
                                          action="${window.showConfirmationAction}">
                                        <input type="hidden" id="additionalDetailsHidden" name="additionalDetailsHidden"/>
                                        <input type="hidden" id="merchantReference" name="merchantReference"/>
                                        <input type="hidden" id="orderToken" name="orderToken"/>
                                        <input type="hidden" id="result" name="result"/>
                                    </form>
                                `;
                                document.body.appendChild(template.content);
                                console.log('[ApplePay] Confirmation form created');
                            }
                
                
                            if (response.orderNo) {
                                document.querySelector('#merchantReference').value = response.orderNo;
                                console.log('[ApplePay] merchantReference set:', response.orderNo);
                            }
                
                            if (response.orderToken) {
                                document.querySelector('#orderToken').value = response.orderToken;
                                console.log('[ApplePay] orderToken set');
                            }
                
                            document.querySelector('#additionalDetailsHidden').value =
                                JSON.stringify(data);
                
                            if (response.resultCode === 'Authorised') {
                                console.log('[ApplePay] Payment AUTHORISED');
                
                                document.querySelector('#result').value = JSON.stringify({
                                    pspReference: response.fullResponse?.pspReference,
                                    resultCode: response.fullResponse?.resultCode,
                                    paymentMethod:
                                        response.fullResponse?.paymentMethod ||
                                        response.fullResponse?.additionalData?.paymentMethod,
                                    donationToken: response.fullResponse?.donationToken,
                                    amount: response.fullResponse?.amount
                                });
                
                                component.setStatus('success');
                
                            } else {
                                console.error('[ApplePay] Payment FAILED:', response.resultCode);
                
                                document.querySelector('#result').value = JSON.stringify({
                                    error: true,
                                    resultCode: response.resultCode
                                });
                
                                component.setStatus('error');
                            }

                            console.log('[ApplePay] Submitting confirmation form');
                            document.querySelector('#showConfirmationForm').submit();
                        }
                    }).fail(function () {
                        console.error('[ApplePay] PaymentFromComponent AJAX failed');
                        component.setStatus('error');
                    });
                }                
            });
    
            applePayComponent = checkoutInstance.create('applepay', {
                amount: {
                    value: orderAmount.value,
                    currency: orderAmount.currency
                },
                countryCode: paymentMethodsResponse.countryCode,
                buttonType: 'plain',
                onError: err => console.error('Apple Pay error', err)
            });
            applePayComponent.mount('#component_applepay');
    
        } catch (err) {
            console.error('Failed to init Apple Pay', err);
        }
    }
    
    function fetchPaymentMethodsAndInitApplePay(orderAmount) {
        $.ajax({
            url: window.getPaymentMethodsURL,
            type: 'POST',
            dataType: 'json',
            data: {
                csrf_token: $('#adyen-token').val()
            }
        })
        .done(response => {
            $('body').trigger('payment:methodsUpdated', response);
            initApplePay(response, orderAmount);
        })
        .fail(err => console.error('Payment methods failed', err));
    }
    
    $('.promo-code-form').submit(function (e) {
        e.preventDefault();

        var currentItemCount = parseInt($('.minicart-quantity').text(), 10) || 0;

        $.spinner().start();
        $('.coupon-missing-error, .promo-code-form .coupon-success-message, .coupon-error-message').hide();
        if (!$('.coupon-code-field').val()) {
            $('.promo-code-form .form-control').addClass('is-invalid');
            $('.promo-code-form .coupon-form-body').addClass('is-invalid');
            $('.promo-code-form .form-control').attr('aria-describedby', 'missingCouponCode');
            $('.coupon-missing-error').show();
            $.spinner().stop();
            return false;
        }
        var $form = $('.promo-code-form');
        $('.promo-code-form .form-control').removeClass('is-invalid is-valid');
        $('.promo-code-form .coupon-form-body').removeClass('is-invalid is-valid');
        $('.coupon-error-message').hide();
        $('body').trigger('promotion:beforeUpdate');

        $.ajax({
            url: $form.attr('action'),
            type: 'GET',
            dataType: 'json',
            data: $form.serialize(),
            success: function (data) {
                if (data.error) {
                    $('.promo-code-form .form-control').addClass('is-invalid');
                    $('.promo-code-form .form-control').attr('aria-describedby', 'invalidCouponCode');
                    $('.promo-code-form .coupon-form-body').addClass('is-invalid');
                    $('.coupon-error-message').show();
                    if (data.errorMessage) {
                        $('.coupon-error-message').text(data.errorMessage);
                    }
                    $('body').trigger('promotion:error', data);
                    $('.coupon-code-field').trigger('focus');
                    $.spinner().stop();
                } else {
                    // If cart item was added/removed via promo code submit
                    if (['', null, undefined].indexOf(data.numItems) === -1 && currentItemCount !== data.numItems) {

                        // Clean Url Structure of any erroneous parameters
                        if (window.history && ['', null, undefined].indexOf(data.actionUrls.showUrl) === -1) {
                            history.replaceState({}, null, data.actionUrls.showUrl);
                        }
                        // Force uncached reload
                        window.location.reload(true);
                    } else {
                        $('.coupons-and-promos').empty().append(data.totals.discountsHtml).css('display', 'flex');
                        $('.promo-code-form .form-control').addClass('is-valid').val('');
                        $('.promo-code-form .coupon-form-body').addClass('is-valid');
                        $('.promo-code-form .coupon-success-message').show();
                        $('button.clear-coupon-input-icon').css('display', 'none');
                        module.exports.updateCartTotals(data);
                        module.exports.updateApproachingDiscounts(data.approachingDiscounts);
                        module.exports.validateBasket(data);
                        $('body').trigger('promotion:success', data);
                        refreshOrderSummary();
                        $.ajax({
                            url: window.getPaymentMethodsURL,
                            type: 'POST',
                            data: {
                                csrf_token: $('#adyen-token').val()
                            }
                        })
                        .done(function (response) {
                            $('body').trigger('payment:methodsUpdated', response);
                            
                            fetchPaymentMethodsAndInitApplePay({
                                value: data.totals.grandTotalValueOrNull*100,
                                currency: data.payment.currencyCode
                            });
                            
                        })
                        .fail(function (err) {
                            console.error('Payment methods api failed', err);
                        })
                        .always(function () {
                            $.spinner().stop();
                        });
                        $.spinner().stop();
                    }
                }
            },
            error: function (err) {
                $('body').trigger('promotion:error', err);
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    module.exports.createErrorNotification(err.errorMessage);
                    $.spinner().stop();
                }
            }
        });
        return false;
    });

    $('body').on('click', '.remove-coupon', function (e) {
        e.preventDefault();

        var couponCode = $(this).data('code');
        var uuid = $(this).data('uuid');
        var $deleteConfirmBtn = $('.delete-coupon-confirmation-btn');
        var $productToRemoveSpan = $('.coupon-to-remove');

        $deleteConfirmBtn.data('uuid', uuid);
        $deleteConfirmBtn.data('code', couponCode);

        $productToRemoveSpan.empty().append(couponCode);
    });

    $('body').on('click', '.delete-coupon-confirmation-btn', function (e) {
        e.preventDefault();

        var currentItemCount = parseInt($('.minicart-quantity').text(), 10) || 0;
        var url = $(this).data('action');
        var uuid = $(this).data('uuid');
        var couponCode = $(this).data('code');
        var urlParams = {
            code: couponCode,
            uuid: uuid
        };

        url = module.exports.appendToUrl(url, urlParams);

        $('body > .modal-backdrop').remove();

        $.spinner().start();
        $('body').trigger('promotion:beforeUpdate');
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $('.coupon-uuid-' + uuid).remove();

                // If cart item was added/removed via promo code removal
                if (['', null, undefined].indexOf(data.numItems) === -1 && currentItemCount !== data.numItems) {
                    // Clean Url Structure of any erroneous parameters
                    if (window.history && ['', null, undefined].indexOf(data.actionUrls.showUrl) === -1) {
                        history.replaceState({}, null, data.actionUrls.showUrl);
                    }
                    // Force uncached reload
                    window.location.reload(true);
                } else {
                    module.exports.updateCartTotals(data);
                    module.exports.updateApproachingDiscounts(data.approachingDiscounts);
                    module.exports.validateBasket(data);
                    refreshOrderSummary();
                    $.spinner().stop();
                    $('body').trigger('promotion:success', data);
                    $.ajax({
                        url: window.getPaymentMethodsURL,
                        type: 'POST',
                        data: {
                            csrf_token: $('#adyen-token').val()
                        }
                    })
                    .done(function (response) {
                        console.log('[CouponRemove] Payment methods refreshed:', response);
            
                        $('body').trigger('payment:methodsUpdated', response);
            
                        fetchPaymentMethodsAndInitApplePay({
                            value: data.totals.grandTotalValueOrNull * 100,
                            currency: data.payment.currencyCode
                        });
                    })
                    .fail(function (err) {
                        console.error('[CouponRemove] Payment methods API failed', err);
                    });
                }
                if ($('.coupons-and-promos').find('.coupon-price-adjustment').length === 0) {
                    $('.coupons-and-promos').css('display', 'none');
                }
                // reset promo code input section when user removes any coupon
                $('.promo-code-form .form-control').removeClass('is-valid is-invalid');
                $('.promo-code-form .coupon-form-body').removeClass('is-valid is-invalid');
                $('.coupon-missing-error, .promo-code-form .coupon-success-message, .coupon-error-message').hide();
            },
            error: function (err) {
                $('body').trigger('promotion:error', err);
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    module.exports.createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });
    $('body').on('click', '.cart-page .bonus-product-button', function () {
        $.spinner().start();
        $(this).addClass('launched-modal');
        $.ajax({
            url: $(this).data('url'),
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                $('body').trigger('bonusproduct:edit', data);
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });

    $('body').on('hidden.bs.modal', '#chooseBonusProductModal', function () {
        $('#chooseBonusProductModal').remove();
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open');

        if ($('.cart-page').length) {
            $('.launched-modal .btn-outline-primary').trigger('focus');
            $('.launched-modal').removeClass('launched-modal');
        } else {
            $('.product-detail .add-to-cart').focus();
        }
    });

    $('body').on('change', '.quantity-select', function () {
        var selectedQuantity = $(this).val();
        $('.modal.show .update-cart-url').data('quantity', selectedQuantity);
    });

    $('body').on('click', '.update-cart-product-global', function (e) {
        e.preventDefault();
        var updateProductUrl = $(this).closest('.cart-and-ipay').find('.update-cart-url').val();
        var form = $(this).closest('.cart-and-ipay').find('.update-cart-url').data();

        if (form) {
            form.selectedOptionValueIds = base.methods.getOptions($('#quickViewModal'));
            form.pid = module.exports.getPidValue($(this))
            $(this).parents('.card').spinner().start();
            $('body').trigger('cart:beforeUpdate');

            if (updateProductUrl) {
                $.ajax({
                    url: updateProductUrl,
                    type: 'post',
                    context: this,
                    data: form,
                    dataType: 'json',
                    success: function (data) {
                        $('#quickViewModal').modal('hide');

                        $('.coupons-and-promos').empty().append(data.cartModel.totals.discountsHtml);
                        module.exports.updateCartTotals(data.cartModel);
                        module.exports.updateApproachingDiscounts(data.cartModel.approachingDiscounts);
                        module.exports.updateAvailability(data.cartModel, form.uuid);
                        module.exports.updateProductDetails(data, form.uuid);

                        if (data.uuidToBeDeleted) {
                            $('.uuid-' + data.uuidToBeDeleted).remove();
                        }

                        module.exports.validateBasket(data.cartModel);

                        $('body').trigger('cart:update', [data, form.uuid]);

                        $.spinner().stop();
                    },
                    error: function (err) {
                        if (err.responseJSON.redirectUrl) {
                            window.location.href = err.responseJSON.redirectUrl;
                        } else {
                            module.exports.createErrorNotification(err.responseJSON.errorMessage);
                            $.spinner().stop();
                        }
                    }
                });
            }
        }
    });

    $('body').on('product:afterAddToCartQuickview', () => {
        var verifyCartPage = $('body').find('.page').data('action');
        if (verifyCartPage == 'Cart-Show') {
            $.spinner().start();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            location.reload();
        }else{
            $.spinner().stop();
        }
    });

    //responsible for filling edit gift cert modal with information from line item on cart page
    $('body').on('click', 'a.edit.editGiftCertificateLineItem', function (e) {
        e.preventDefault();

        var anchor = $(this);
        var uuid = anchor.data('uuid');
        var parentContainer = anchor.parents('.product-info.uuid-' + uuid);
        var from = parentContainer.find('.dwfrm_giftCertificate_purchase_from-' + uuid).data('value');
        var recipient = parentContainer.find('.dwfrm_giftCertificate_purchase_recipient-' + uuid).data('value');
        var recipientEmail = parentContainer.find('.dwfrm_giftCertificate_purchase_recipientEmail-' + uuid).data('value');
        var message = parentContainer.find('.dwfrm_giftCertificate_purchase_message-' + uuid).attr('title');
        var amount = parentContainer.find('.pricing.item-total-' + uuid).data('value');

        var modal = $('#editGiftCertificateLineItemModal');
        modal.find('#from').attr('value', from);
        modal.find('#recipient').attr('value', recipient);
        modal.find('#recipientEmail').attr('value', recipientEmail);
        modal.find('#confirmRecipientEmail').attr('value', recipientEmail);
        modal.find('#message').html(message || '');
        modal.find('#amount').attr('value', (('' + amount) || '0.0').split('.')[0]);
        modal.find('.btn-update-giftcertificate-incart').attr('data-uuid', uuid);
        modal.find('.btn-update-giftcertificate-incart').data('uuid', uuid);
    });
}

module.exports = {
    getPidValue: getPidValue,
    appendToUrl: appendToUrl,
    validateBasket: validateBasket,
    updateCartTotals: updateCartTotals,
    createErrorNotification: createErrorNotification,
    updateApproachingDiscounts: updateApproachingDiscounts,
    updateAvailability: updateAvailability,
    updateProductDetails: updateProductDetails,
    confirmDelete: confirmDelete,
    init: init
};
