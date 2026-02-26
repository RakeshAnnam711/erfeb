'use strict';

/**
 * Events are divided up by name space so only the
 * events that are needed are initialized.
 */
var events = {
    homeshow: function () {},
    productshow: function () {},
    productshowincategory: function () {},
    searchshow: function () {
        $('body').on('click', '.product .image-container a:not(.quickview), .product .pdp-link a', function () {
            var $ele = $(this).closest('.product');
            var gtmdata = $ele.data('gtmdata') || $.parseJSON($ele.attr('data-gtmdata'));
            productClick(gtmdata);
        });
    },
    cartshow: function () {},
    checkoutbegin: function () {},
    orderconfirm: function () {},
    // events that should happen on every page
    all: function () {
               /**  Track single product add-to-cart */
               $('body').on('click', '.add-to-cart, .add-to-cart-global, .wishlist-card-product-add', function () {
                if (!$(this).hasClass('isDisabled') && !$(this).hasClass('disabled')) {
                    pushAddToCartForElements($(this));
                }
            });

                    /** Track "Add All to Cart" from wishlist */
        $('body').on('click', '.wishlist-details-add-cart', function () {
            const $items = $('.wishlist-card-product-add');
            pushAddToCartForElements($items);
    });

        /** Track "Add Selected to Cart" from wishlist checkboxes */
        $('body').on('click', '.wishlist-overlay-detail-selected-add', function () {
            const $selected = $('.wishlist-card-product[data-selected="true"]').find('.wishlist-card-product-add');
            pushAddToCartForElements($selected);
    });

        // Remove from Cart - WGACA MODIFICATION
        // $('body').on('click', '.remove-product', function () {
        //     var $ele = $(this);
        //     var gtmData = $ele.data('gtmdata') || $.parseJSON($ele.attr('data-gtmdata'));
        //     var qty = $ele.closest('.card').find('select.quantity').val();
        //     qty = qty ? qty : 1;

        //     $('body').on('click', '#removeProductModal .cart-delete-confirmation-btn', function () {
        //         removeFromCart(gtmData, qty);
        //     });
        // });
        // END MODIFICATION

        // Update GTM data attribute
        $('body').on('product:updateAddToCart', function (e, response) {
            $('button.add-to-cart, button.add-to-cart-global', response.$productContainer)
                .attr('data-gtmdata', JSON.stringify(response.product.gtmData))
        });
    }
};

/**
 * @param {String} productId The product ID
 * @description gets the data for a product click
 */
function productClick (productObject) {
    var obj = {
            'event': 'productClick',
            'ecommerce': {
                'click': {
                    'actionField': {'list': 'Search Results'},
                    'products': []
                }
            }
        };
    obj.ecommerce.click.products.push(productObject);
    dataLayer.push(obj);
}

function pushAddToCartForElements($elements) {
    $elements.each(function () {
        const $el = $(this);
        const initialText = $el.text().trim().toLowerCase();
        const alreadyAdded = initialText.includes('added to cart') || initialText.includes('in bag');

        // If already added, do not track again
        if (alreadyAdded) {
            return;
        }

        const observer = new MutationObserver(function () {
            const updatedText = $el.text().trim().toLowerCase();
            const isNowAdded = updatedText.includes('added to cart') || updatedText.includes('in bag');

            if (isNowAdded && updatedText !== initialText) {
                observer.disconnect();
                fireAddToCartEvent($el);
            }
        });

        observer.observe($el[0], {
            childList: true,
            characterData: true,
            subtree: true
        });
    });
}

function fireAddToCartEvent($el) {
    const gtmData = $el.data('gtmdata') || $.parseJSON($el.attr('data-gtmdata'));
    if (!gtmData) return;

    const currentPageType = sessionStorage.getItem('currentPageType') || '';
    const listId = currentPageType.toLowerCase().replace(/\s+/g, '_');
    const listName = currentPageType;

    const item = { ...gtmData };
    item.item_brand = gtmData.brand || gtmData.item_brand || '';
    item.discount = Number(gtmData.discount_price || gtmData.discount) || 0;
    item.price = Number(gtmData.price) || 0;
    item.quantity = 1;
    item.affiliation = 'WGACA';
    const previousPageType = sessionStorage.getItem('previousPageType') || '';
    const skipBreadcrumbs =
        (previousPageType === 'Home Page Featured' && currentPageType === 'PLP Page') || (previousPageType.startsWith('Homepage-') && currentPageType === 'PDP Page') || (previousPageType==='frenzysearch' && currentPageType==='PDP Page') || 
        ['Wish List Page', 'wishlistshowdetail'].includes(currentPageType);

    if (!skipBreadcrumbs) {
        const productName = (gtmData.item_name || '').trim().toLowerCase();
        const rawCrumbs = Array.from(document.querySelectorAll('.breadcrumb li')).map(el => el.innerText.trim());
        const filteredCrumbs = [...new Set(
            rawCrumbs.filter(crumb => {
                const lowerCrumb = crumb.toLowerCase();
                return lowerCrumb !== 'home' && lowerCrumb !== productName;
            })
        )];
        const totalBreadcrumbs = filteredCrumbs.length;
        if (totalBreadcrumbs >= 2) {
            item.item_category = filteredCrumbs[totalBreadcrumbs - 2];
            item.item_category2 = filteredCrumbs[totalBreadcrumbs - 1];
        } else if (totalBreadcrumbs === 1) {
            item.item_category = filteredCrumbs[0];
            item.item_category2 = filteredCrumbs[0];
        } else {
            item.item_category = '';
            item.item_category2 = '';
        }
    } else {
        item.item_category = '';
        item.item_category2 = '';
    }
    const productName = (gtmData.item_name || '').trim().toLowerCase();
    const rawCrumbs = Array.from(document.querySelectorAll('.breadcrumb li')).map(el => el.innerText.trim());
    const filteredCrumbs = [...new Set(
        rawCrumbs.filter(crumb => {
            const lowerCrumb = crumb.toLowerCase();
            return lowerCrumb !== 'home' && lowerCrumb !== productName;
        })
    )];
    const total = filteredCrumbs.length;
    if (total >= 2) {
        item.item_category3 = filteredCrumbs[total - 2];
        item.item_category4 = filteredCrumbs[total - 1];
    } else if (total === 1) {
        item.item_category3 = filteredCrumbs[0];
        item.item_category4 = filteredCrumbs[0];
    } else {
        item.item_category3 = '';
        item.item_category4 = '';
    }
    if (item.item_list_id == 'recently_viewed' || item.item_list_id  == 'you_may_also_like') {
        item.item_category = '';
        item.item_category2 = '';
        item.item_category3 = '';
        item.item_category4 = '';
    }
    if (!item.item_list_id || item.item_list_id == '' || !item.item_list_name || item.item_list_name == '') {
        item.item_list_id = listId;
        item.item_list_name = listName;
    }
    delete item.brand;
    delete item.discount_price;
    delete item.discount_percent;
    delete item.currencyCode;
    delete item.search_results_count;
    delete item.search_term;

    const currency = item.currency || item.currencyCode || 'USD';
    delete item.currency;
    dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object
    dataLayer.push({
        event: 'add_to_cart',
        ecommerce: {
            currency: currency,
            value: item.price * item.quantity,
            items: [item]
        }
    });
}



/**
 * @function removeFromCart
 * @description Click event for remove product from cart
 */
function removeFromCart (productObject, quantity) {
    var quantObj = { quantity: quantity };
    var obj = {
        'event': 'remove_from_cart',
        'ecommerce': {
            'currency': productObject.currency,
            'items': [$.extend(productObject, quantObj)],
            'value': (Number(productObject.price) * Number(quantity)).toFixed(2),
        }
    };

    dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
    dataLayer.push(obj);
}

/**
 * @function init
 * @description Initialize the tag manager functionality
 * @param {String} nameSpace The current name space
 */
$(document).ready(function () {
    if (window.gtmEnabled) {
        if (pageAction && events[pageAction]) {
            events[pageAction]();
        }
        events.all();
    }
});

/**
 * listener for ajax events
 */
function gtmEventLoader() {
    try {
        $(document).ajaxSuccess(function(event, request, settings, data) {
            if (settings.dataTypes.indexOf('json') > -1) {
                if (data && '__gtmEvents' in data && Array.isArray(data.__gtmEvents)) {
                    data.__gtmEvents.forEach(function gtmEvent(gtmEvent) {
                        if (gtmEvent) {
                            dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object to prevent events affecting one another
                            dataLayer.push(gtmEvent);
                        }
                    });
                }
            }
        });
        document.removeEventListener('DOMContentLoaded', gtmEventLoader);
    } catch (e) {
        console.error(e);
    }
}

/**
 * setup ajax event listener
 */
if (document.readyState === 'complete') {
    gtmEventLoader();
} else {
    document.addEventListener('DOMContentLoaded', gtmEventLoader);
}
