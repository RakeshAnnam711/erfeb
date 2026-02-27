'use strict';

var coreCart = require('core/cart/cart');
var coreCartInit = coreCart.init;
var coreCartUpdateCartTotals = coreCart.updateCartTotals;
var coreProductBase = require('core/product/base');

// Returns cart summary data via AJAX
function getCartSummaryData() {
    const getSummaryDataURL = document.querySelector('input[name="get-cart-summary-data"]')?.value;    
    return $.ajax({
        url: getSummaryDataURL,
        method: 'GET'
    });
}

/**
 * Updates details of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
coreCart.updateProductDetails = function(data, uuid) {
    $('.card .product-info.uuid-' + uuid).parent().replaceWith(data.renderedTemplate);
    coreProductBase.enableQuantitySteppers();
}

/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} data - AJAX response from the server
 */
coreCart.updateCartTotals = function (data) {
    // trigger AB Core updateCartTotals first
    var $cart = $('.cart');
    var $checkout = $('#checkout-main')
    var $minicart = $('.header-nav .minicart');

    $cart.find('.grand-total span').empty().append(data.totals.grandTotalLessGiftCertificatePaymentInstrumentsFormatted
        ? data.totals.grandTotalLessGiftCertificatePaymentInstrumentsFormatted :data.totals.grandTotal);
        $cart.find('.checkout-continue .checkout-btn').attr('data-price', data.totals.grandTotalLessGiftCertificatePaymentInstrumentsFormatted
            ? data.totals.grandTotalLessGiftCertificatePaymentInstrumentsFormatted :data.totals.grandTotal);
    coreCartUpdateCartTotals.call(this, data);

    var totalCalculated = data.totals.grandTotal.substr(1).replace(/,/g, '');
    $('.affirm-as-low-as').attr('data-amount', (totalCalculated * 100).toFixed());
    try {
        affirm.ui.refresh();
    } catch (e) {
        console.error('Error while calling affirm.ui.refresh:', e);
    }

    // Fetch latest cart summary and update cart UI accordingly
    getCartSummaryData()
    .then(function (cartSummaryData) {
        var combinedData = {
            cartSummaryData: cartSummaryData,
            data: data
        };
        updatePromoTotal($cart, cartSummaryData);
        const $targetElement = $checkout.length > 0 ? $checkout : $cart;
        updateProductCards($targetElement, $minicart, combinedData);
        updateCouponList($('.added-promo-list'), data.totals?.discounts || []);
        updateCampaignValues($cart, data.totals?.discounts || []);
        $cart.find('.estimated-total-value span').empty().append(cartSummaryData.cart.estimatedTotal.formatted || data.totals.subTotal);
    })
    .catch(function (err) {
        console.error('Failed to fetch cart summary:', err);
    });
}

// Updates the promo code total section based on applied coupon data
function updatePromoTotal($cart, cartSummaryData) {
    const $promoSection = $cart.find('.promo-code-section');
    const hasCoupons = cartSummaryData?.cart?.hasAppliedCoupons;
    const discount = cartSummaryData?.cart?.productCouponDiscount || '';

    if (hasCoupons && discount && discount.value) {
        $promoSection.find('.promo-code-total span').text(discount.formatted);
        $promoSection.removeClass('d-none');
    } else {
        $promoSection.addClass('d-none');
    }
}

// Updates individual cart product cards
function updateProductCards($cart, $minicart, combinedData){
    combinedData.data.items.forEach(function (item, index) {
        var itemPrice;
        var itemTotalPrice;

        // Find matching product by pid
        const matchedProduct = combinedData.cartSummaryData.products.find(
            p => p.pid === item.id
        );

        if (item.productType === 'giftCertificate') {
            itemPrice = item.priceTotal?.price;
            itemTotalPrice = item.priceTotal?.price;
        } else {
            itemPrice = item.renderedPrice;
            itemTotalPrice = item.priceTotal?.renderedPrice;
        }

        if (combinedData.data.totals.orderLevelDiscountTotal.value > 0) {
            $cart.find('.coupons-and-promos').empty().append(combinedData.data.totals.discountsHtml);
        }
        // commenting this part of code as item.renderedPromotions returns blank div
        // if (item.renderedPromotions) {
        //     $cart.find('.item-' + item.UUID).empty().append(item.renderedPromotions);
        // } else {
        //     $cart.find('.item-' + item.UUID).empty();
        // }

        // update product price
        $cart.find('.line-item-price-' + item.UUID + ' .line-item-total-price-amount').empty().append(item.priceTotal.price); // discounted price - cart product card
        $minicart.find('.uuid-' + item.UUID + ' .line-item-total-price-amount').empty().append(item.priceTotal.price); // discounted price - minicart product card

        if (combinedData.data.items[index].price.list && matchedProduct.couponsApplied.length) {
            $cart.find('.line-item-price-' + item.UUID + ' .noncoupon-strike-through .value').addClass('d-none');
            $cart.find('.line-item-price-' + item.UUID + ' .coupon-strike-through .value').removeClass('d-none').empty().append(combinedData.data.items[index].price.list.formatted); // base price - cart product card

            $minicart.find('.uuid-' + item.UUID + ' .noncoupon-strike-through .value').addClass('d-none');
            $minicart.find('.uuid-' + item.UUID + ' .coupon-strike-through .value').removeClass('d-none').empty().append(combinedData.data.items[index].price.list.formatted); // base price - minicart product card
        }else if(combinedData.data.items[index].price.sales && matchedProduct.couponsApplied.length){
            $cart.find('.line-item-price-' + item.UUID + ' .noncoupon-strike-through .value').addClass('d-none');
            $cart.find('.line-item-price-' + item.UUID + ' .coupon-strike-through .value').removeClass('d-none').empty().append(combinedData.data.items[index].price.sales.formatted); // base price - cart product card

            $minicart.find('.uuid-' + item.UUID + ' .noncoupon-strike-through .value').addClass('d-none');
            $minicart.find('.uuid-' + item.UUID + ' .coupon-strike-through .value').removeClass('d-none').empty().append(combinedData.data.items[index].price.sales.formatted); // base price - minicart product card
        }else{
            $cart.find('.line-item-price-' + item.UUID + ' .noncoupon-strike-through .value').removeClass('d-none');
            $cart.find('.line-item-price-' + item.UUID + ' .coupon-strike-through .value').addClass('d-none');

            $minicart.find('.uuid-' + item.UUID + ' .noncoupon-strike-through .value').removeClass('d-none');
            $minicart.find('.uuid-' + item.UUID + ' .coupon-strike-through .value').addClass('d-none');
        }

        // update promo code list
        if (matchedProduct && matchedProduct.couponsApplied.length > 0) {
            const appliedCoupons = matchedProduct.couponsApplied
            .filter(coupon => coupon.isApplied) // only show applied ones
            .map(coupon => coupon.couponCode)
            .join(', ');
            $cart.find('.item-' + item.UUID + ' .line-item-promo-list .line-item-promo-ids').text(appliedCoupons);
            $cart.find('.item-' + item.UUID + ' .line-item-promo-list').removeClass('d-none');
            $cart.find('.item-total-' + item.UUID).addClass('price-discounted');
        } else {
            $cart.find('.item-' + item.UUID + ' .line-item-promo-list').addClass('d-none');
            $cart.find('.item-total-' + item.UUID).removeClass('price-discounted');
        }

        // product triple strike through price
        var $strikeThroughPriceParent = $cart.find('.line-item-price-' + item.UUID + ' .coupon-strike-through');
        var $strikeThroughPrice = $strikeThroughPriceParent.find('.value');

        if ($strikeThroughPrice.length) {
            if (item.priceTotal && item.priceTotal.nonAdjustedPrice) {
                $strikeThroughPrice
                    .removeClass('d-none')
                    .addClass('d-flex')
                    .text(item.priceTotal.nonAdjustedPrice);
            } else {
                $strikeThroughPrice
                    .removeClass('d-flex')
                    .addClass('d-none');
            }

            if (item.price && item.price.list) {
                $strikeThroughPriceParent.addClass('strike-through-black');
            } else {
                $strikeThroughPriceParent.removeClass('strike-through-black');
            }
        } else {
            console.warn('Could not update discount prices. Strike through price element not found for item UUID:', item.UUID, '\nReload page to see updated prices.');
        }
    });
}

// Updates coupon list
function updateCouponList(promoListParent, couponData){
    const promoListItems = couponData
        .filter(coupon => coupon.type === 'coupon' && coupon.valid)
        .map(coupon => {
            const statusClass = coupon.applied ? 'coupon-status-applied' : 'coupon-status-not-applied';
            const statusText = coupon.applied ? 'Applied' : 'Not Applied';
            return `<li class="added-promo-list-item">
                        Promo Code ${coupon.couponCode} -
                        <span class="${statusClass}">${statusText}</span>
                        <button type="button" class="float-right remove-coupon"
                                data-code="${coupon.couponCode}"
                                aria-label="${statusText}"
                                data-toggle="modal"
                                data-target="#removeCouponModal"
                                data-uuid="${coupon.UUID}">
                            <span aria-hidden="true" class="icon-close"></span>
                        </button>
                    </li>`;
        });

    promoListParent.empty().append(promoListItems);
    promoListItems.length ? promoListParent.removeClass('d-none') : promoListParent.addClass('d-none');
}

// Update applied promotion discount values in the cart DOM for applied promotion
function updateCampaignValues($cart, discountsArray) {
    discountsArray
        .filter(item => item.type === 'promotion' && item.UUID && item.price)
        .forEach(item => {
            const $el = $cart.find(`.promotion-${item.UUID} .applied-promotion-discount`);
            if ($el.length) {
                $el.text(item.price);
            } else {
                console.warn(`Element not found for promotion UUID: ${item.UUID}`);
            }
        });
}

coreCart.init = function () {
    coreCartInit.apply(this, arguments);

    // show coupon section if coupons are applied
    const couponsEl = document.querySelector('.coupons-and-promos');
    if (couponsEl && couponsEl.querySelector('.coupon-price-adjustment')) {
        couponsEl.style.display = 'flex';
    }

    // cartFernzySlider.isml
    $('body').on('cart:update', function (e, data, uuid) {
        if (data.basket.items.length === 0) {
            window.getHomepageProductsApi?.();
        }
    });

    $('#checkout-select-country').on('click', ()=>{
        document.getElementById('ge-country-selector').click();
    });

    // reset promo code input section when user types in
    document.querySelectorAll('.promo-code-form .form-control').forEach(input => {
        input.addEventListener('input', () => {
            document.querySelectorAll('.promo-code-form .form-control').forEach(el => {el.classList.remove('is-valid', 'is-invalid');});
            document.querySelectorAll('.promo-code-form .coupon-form-body').forEach(el => {el.classList.remove('is-valid', 'is-invalid');});
            document.querySelectorAll('.coupon-missing-error, .promo-code-form .coupon-success-message, .coupon-error-message').forEach(el => {el.style.display = 'none';});
        });
    });

    // Clear coupon input icon logic in promo section
    const input = document.querySelector('.form-control.coupon-code-field');
    const clearIcon = document.querySelector('button.clear-coupon-input-icon');

    if (clearIcon) {
        clearIcon.addEventListener('click', () => {
            if (input) {input.value = '';input.focus();}
            clearIcon.style.display = 'none';
        });
    }

    if (input) {
        input.addEventListener('input', () => {
            if (clearIcon) {clearIcon.style.display = input.value ? 'block' : 'none';}
        });
    }
};

$(document).on('hide.bs.modal', '#removeCouponModal', function (e) {
        // Instantly hide the modal, bypassing any animation
        $(this).removeClass('fade');
});

$(document).ready(function() {
    $('body').on('click', '.checkout-btn', function () {
        $.spinner().start();
    });
});

module.exports = coreCart;
