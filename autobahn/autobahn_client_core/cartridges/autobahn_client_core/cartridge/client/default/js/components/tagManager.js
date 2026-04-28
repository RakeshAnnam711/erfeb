'use strict';
window.dataLayer = window.dataLayer || [];

/*
*/
function promotionClick(obj){
    var promoObj = {
        event: 'promotionClick',
        ecommerce: {
            promoClick: {
                promotions: []
            }
        }
    }
    promoObj.ecommerce.promoClick.promotions.push(obj);
    dataLayer.push(promoObj);
}

$(document).on('click', 'a[href*="/logout"]', function () {
    window.dataLayer = window.dataLayer || [];
    const logoutEvent = {
        event: 'logout'
    };
    // Push to dataLayer
    window.dataLayer.push(logoutEvent);
    console.log('Logout event pushed to dataLayer:', logoutEvent);
});
/**
 * push homepage click analytics events
 * @param {string} eventlabel - Event Label for the event
 * @param {string} eventaction - Event Action for the event
 */
function homePageEvent(eventlabel, eventaction) {
    if (eventlabel && eventaction) {
        dataLayer.push({
            event: 'GAevent',
            eventCategory: 'Homepage Click',
            eventAction: eventaction,
            eventLabel: eventlabel
        });
    }
}

/**
 * push header navigation click analytics events
 * @param {string} eventlabel - Event Label for the event
 * @param {string} eventaction - Event Action for the event
 */
function headerNavigationEvent(eventlabel, eventaction) {
    if (eventlabel && eventaction) {
        dataLayer.push({
            event: 'GAevent',
            eventCategory: 'Header Navigation Click',
            eventAction: eventaction,
            eventLabel: eventlabel
        });
    }
}
/**
 * push footer navigation click analytics events
 * @param {string} eventlabel - Event Label for the event
 * @param {string} eventaction - Event Action for the event
 */
function footerNavigationEvent(eventlabel, eventaction) {
    if (eventlabel && eventaction) {
        dataLayer.push({
            event: 'GAevent',
            eventCategory: 'Footer Navigation Click',
            eventAction: eventaction,
            eventLabel: eventlabel
        });
    }
}

function select_item(gtmData) {
    if (
        gtmData &&
        typeof gtmData === 'object' &&
        !Array.isArray(gtmData) &&
        Object.keys(gtmData).length > 0
    ) {
        // Cleanup unwanted properties
        delete gtmData.currency;
        delete gtmData.currencyCode;
        delete gtmData.search_results_count;
        delete gtmData.search_term;
        delete gtmData.discount_percent;

        // Handle fallback item_list_name/item_list_id
        let itemListName = gtmData.item_list_name;
        if (!itemListName || itemListName.trim() === '') {
            const currentPageType = sessionStorage.getItem('currentPageType') || '';
            itemListName = currentPageType;
            const itemListId = currentPageType.toLowerCase().replace(/\s+/g, '_');
            gtmData.item_list_name = itemListName;
            gtmData.item_list_id = itemListId;
        }

        // Default affiliation
        gtmData.affiliation = gtmData.affiliation || "WGACA";

        // CONDITIONAL BREADCRUMB LOGIC 
        const currentPageType = sessionStorage.getItem('currentPageType') || '';
        const previousPageType = sessionStorage.getItem('previousPageType') || '';

        const skipBreadcrumbs =
            (previousPageType === 'Home Page Featured' && currentPageType === 'PLP Page') ||
            ['Cart Page', 'Wish List Page', 'wishlistshowdetail','PDP Page'].includes(currentPageType);

        if (!skipBreadcrumbs) {
            const productName = (gtmData.item_name || '').trim().toLowerCase();
            const rawCrumbs = Array.from(document.querySelectorAll('.breadcrumb li')).map(el => el.innerText.trim());
            const filteredCrumbs = [...new Set(
                rawCrumbs
                    .map(crumb => crumb.trim())
                    .filter(crumb => {
                        const lowerCrumb = crumb.toLowerCase();
                        return lowerCrumb !== 'home' && lowerCrumb !== productName;
                    })
            )];

            const totalBreadcrumbs = filteredCrumbs.length;
            if (totalBreadcrumbs >= 2) {
                gtmData.item_category = filteredCrumbs[totalBreadcrumbs - 2];
                gtmData.item_category2 = filteredCrumbs[totalBreadcrumbs - 1];
            } else if (totalBreadcrumbs === 1) {
                gtmData.item_category = filteredCrumbs[0];
                gtmData.item_category2 = filteredCrumbs[0];
            } else {
                gtmData.item_category = '';
                gtmData.item_category2 = '';
            }
        } else {
            // Ensure empty category values when skipping breadcrumbs
            gtmData.item_category = '';
            gtmData.item_category2 = '';
        }
        dataLayer.push({ ecommerce: null });
        dataLayer.push({
            event: 'select_item',
            ecommerce: {
                items: [gtmData]
            }
        });
    }
}

/**
 * @function removeFromCart
 * @description Click event for remove product from cart
 */
function removeFromCart (productObject, quantity) {
    var quantObj = {'quantity': quantity},
        obj = {
            'event': 'removeFromCart',
            'ecommerce': {
                'remove': {
                    'products': []
                }
            }
        };
    obj.ecommerce.remove.products.push($.extend(productObject,quantObj));
    dataLayer.push(obj);
}

/**
 * @function addToWishlist
 * @description Click event for adding product to wishlist
 */
function getWishlistEventId(productObject) {
    const itemId = productObject.item_id || productObject.id || productObject.pid || 'unknown';
    return `add_to_wishlist-${itemId}-${Date.now()}`;
}

let lastWishlistEvent = {
    key: '',
    time: 0
};

function getWishlistProductKey(productObject) {
    return productObject.item_id || productObject.id || productObject.pid || '';
}

function shouldSuppressWishlistEvent(productObject) {
    const key = getWishlistProductKey(productObject);
    const now = Date.now();
    const globalLastWishlistEvent = window.wgacaLastWishlistEvent || {};

    if (
        key &&
        (
            (lastWishlistEvent.key === key && now - lastWishlistEvent.time < 1500) ||
            (globalLastWishlistEvent.key === key && now - globalLastWishlistEvent.time < 1500)
        )
    ) {
        return true;
    }

    lastWishlistEvent = {
        key: key,
        time: now
    };
    window.wgacaLastWishlistEvent = lastWishlistEvent;

    return false;
}

function addToWishlist(productObject) {
    if (shouldSuppressWishlistEvent(productObject)) {
        return;
    }

    const item = { ...productObject };
    const eventId = getWishlistEventId(productObject);

    if (item.item_list_name) {
        const currency = productObject.currency || productObject.currencyCode || 'USD';
        delete item.currencyCode;
        delete item.currency;
        delete item.search_results_count;
        delete item.search_term;
        const obj = {
            event: 'add_to_wishlist',
            event_id: eventId,
            ecommerce: {
                currency: currency,
                currencyCode: currency,
                event_id: eventId,
                value: Number(productObject.price) || 0,
                items: [item]
            }
        };
        dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
        dataLayer.push(obj);
        return;
    }

    item.item_brand = productObject.item_brand || productObject.brand;
    item.discount = Number(productObject.discount_price || productObject.discount) || 0;
    item.price = Number(productObject.price) || 0;
    item.affiliation = 'WGACA';

    delete item.brand;
    delete item.discount_price;
    delete item.discount_percent;
    delete item.currencyCode;
    delete item.search_results_count;
    delete item.search_term;
    const productName = (productObject.item_name || '').trim().toLowerCase();
    const rawCrumbs = Array.from(document.querySelectorAll('.breadcrumb li')).map(el => el.innerText.trim());
    const filteredCrumbs = [...new Set(
        rawCrumbs
            .map(crumb => crumb.trim())
            .filter(crumb => {
                const lowerCrumb = crumb.toLowerCase();
                return lowerCrumb !== 'home' && lowerCrumb !== productName;
            })
    )];
    var totalBreadcrumbs = filteredCrumbs.length;
    if (totalBreadcrumbs >= 2) {
        item.item_category = filteredCrumbs[totalBreadcrumbs - 2];
        item.item_category2 = filteredCrumbs[totalBreadcrumbs - 1];
        item.item_category3 = filteredCrumbs[totalBreadcrumbs - 2];
        item.item_category4 = filteredCrumbs[totalBreadcrumbs - 1];
    } else if (totalBreadcrumbs === 1) {
        item.item_category = filteredCrumbs[0];
        item.item_category2 = filteredCrumbs[0];
        item.item_category3 = filteredCrumbs[0];
        item.item_category4 = filteredCrumbs[0];
    } else {
        item.item_category = '';
        item.item_category2 = '';
        item.item_category3 = '';
        item.item_category4 = '';
    }
    var currentPageType = sessionStorage.getItem('currentPageType') || '';
    var listId = currentPageType.toLowerCase().replace(/\s+/g, '_');  
    var listName = currentPageType;
    item.item_list_id = listId;
    item.item_list_name = listName;
    const qty = Number(document.querySelector('select[name="quantity"]')?.value) || 1;
    item.quantity = qty;
    delete item.currency;
    const obj = {
        event: 'add_to_wishlist',
        event_id: eventId,
        ecommerce: {
            currency:
                productObject.currency || productObject.currencyCode || 'USD',
            currencyCode:
                productObject.currency || productObject.currencyCode || 'USD',
            event_id: eventId,
            value: item.price,
            items: [item]
        }
    };

    dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
    dataLayer.push(obj);
}

var events = {
    all: function () {
        document.addEventListener('DOMContentLoaded', () => {
            // Replace jQuery event delegation with vanilla JavaScript
            document.body.addEventListener('click', (event) => {
                if (event.target.matches('a.header-link')) {
                    const eventaction = event.target.getAttribute('aria-label');
                    headerNavigationEvent('My Account', eventaction);
                } else if (event.target.matches('.wishlist-link')) {
                    const eventaction = 'Wishlist menu';
                    headerNavigationEvent(event.target.title.trim(), eventaction);
                } else if (event.target.matches('.menu-level-1 .nav-item a.nav-link, .menu-level-1 .nav-item a.dropdown-link')) {
                    const eventaction = 'Main Menu';
                    headerNavigationEvent(event.target.textContent.trim(), eventaction);
                } else if (event.target.matches('.logo-home')) {
                    headerNavigationEvent(window.location.pathname, 'Main Logo');
                } else if (event.target.matches('.menu-footer a')) {
                    footerNavigationEvent(event.target.textContent.trim(), 'Footer menu');
                } else if (event.target.matches('.social-links a')) {
                    footerNavigationEvent(event.target.getAttribute('aria-label').trim(), 'Social Link');
                } else if (event.target.matches('.postscript a')) {
                    footerNavigationEvent(event.target.textContent.trim(), 'Footer Link');
                } else if (event.target.matches('.back-to-top')) {
                    footerNavigationEvent(window.location.pathname, 'Back to top');
                }
            });

            // Replace jQuery DOM ready logic for wishlist toggle
            const wishlistIcons = document.querySelectorAll('.wishlist-icon');
            wishlistIcons.forEach(icon => {
                const observer = new MutationObserver(mutationsList => {
                    mutationsList.forEach(mutation => {
                        if (
                            mutation.type === 'attributes' &&
                            mutation.attributeName === 'class' &&
                            icon.classList.contains('selected')
                        ) {
                            const btn = icon.closest('.wishlist-toggle-product');
                            if (btn) {
                                const gtmData = JSON.parse(btn.getAttribute('data-gtmdata') || '{}');
                                if (gtmData && gtmData.item_id) {
                                    addToWishlist(gtmData);
                                }
                            }
                        }
                    });
                });
                observer.observe(icon, { attributes: true, attributeFilter: ['class'] });
            });

            // Replace jQuery dynamic DOM observer
            const domObserver = new MutationObserver(mutationList => {
                mutationList.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.matches('.wishlist-icon')) {
                            const observer = new MutationObserver(mutationsList => {
                                mutationsList.forEach(mutation => {
                                    if (
                                        mutation.type === 'attributes' &&
                                        mutation.attributeName === 'class' &&
                                        node.classList.contains('selected')
                                    ) {
                                        const btn = node.closest('.wishlist-toggle-product');
                                        if (btn) {
                                            const gtmData = JSON.parse(btn.getAttribute('data-gtmdata') || '{}');
                                            if (gtmData && gtmData.item_id) {
                                                addToWishlist(gtmData);
                                            }
                                        }
                                    }
                                });
                            });
                            observer.observe(node, { attributes: true, attributeFilter: ['class'] });
                        }
                    });
                });
            });
            domObserver.observe(document.body, { childList: true, subtree: true });

            // Replace jQuery click events for product tracking
            document.body.addEventListener('click', (event) => {
                if (event.target.matches('a.product-click-track')) {
                    const tile = event.target.closest('.product-tile');
                    const gtmDataAttr = tile.querySelector('button[data-gtmdata]')?.getAttribute('data-gtmdata');
                    let gtmData = {};
                    try {
                        gtmData = JSON.parse(gtmDataAttr);
                    } catch (e) {
                        console.warn('[Product Click] Invalid data-gtmdata:', e);
                    }
                    select_item(gtmData);
                }
            });

            // Replace other jQuery-dependent logic similarly...

            document.body.addEventListener('click', (event) => {
                if (event.target.matches('.experience-component a')) {
                    var id = '';
                    var name = '';
                    var creative = '';
                    if (event.target.closest('.experience-component').classList.contains('experience-commerce_assets-assetInclude')) {
                        id = event.target.closest('.experience-component').querySelector('.content-asset').getAttribute('data-asset-id');
                        name = 'content-asset';
                    } else if (event.target.closest('.experience-component').classList.contains('experience-commerce_assets-heroBanner')) {
                        id = 'experience-commerce_assets-heroBanner';
                        name = event.target.textContent.trim();
                    } else if (event.target.closest('.experience-component').classList.contains('experience-commerce_assets-popularCategory')) {
                        id = 'experience-commerce_assets-popularCategory';
                        name = 'Popular Category';
                        creative = event.target.querySelector('.h2-alt').textContent.trim();
                    } else if (event.target.closest('.experience-component').classList.contains('experience-commerce_assets-imageAndText')) {
                        id = 'experience-commerce_assets-imageAndText';
                        name = event.target.textContent.trim();
                        creative = 'Image text block';
                    }
                    var obj = {};
                    obj.name = name;
                    obj.id = id;
                    obj.creative = creative;
                    promotionClick(obj);
                }
            });

            document.body.addEventListener('click', (event) => {
                if (event.target.matches('.remove-product')) {
                    var gmtData = JSON.parse(event.target.getAttribute('data-gtmdata') || '{}');
                    var qty = JSON.parse(event.target.getAttribute('data-quantity') || '{}');
                    document.body.addEventListener('click', (event) => {
                        if (event.target.matches('#removeProductModal .cart-delete-confirmation-btn')) {
                            removeFromCart(gmtData, qty);
                        }
                    });
                }
            });

            document.body.addEventListener('click', (event) => {
                if (event.target.matches('.frenzy_product_item a')) {
                    if (
                        event.target.closest('.wishlist-toggle-product') ||
                        event.target.classList.contains('wishlist-toggle-product')
                    ) {
                        return;
                    }
                    var tile = event.target.closest('.frenzy_product_item');
                    var gtmDataAttr = tile.querySelector('button[data-gtmdata]')?.getAttribute('data-gtmdata');
                    var gtmData = {};
                    try {
                        gtmData = JSON.parse(gtmDataAttr);
                    } catch (e) {
                        console.warn('[Product Click] Invalid data-gtmdata:', e);
                    }
                    select_item(gtmData);
                }
            });

            document.body.addEventListener('click', (event) => {
                if (event.target.matches('.frenzySearchgtm > .frenzy_item')) {
                    if (
                        event.target.closest('.wishlist-toggle-product') ||
                        event.target.classList.contains('wishlist-toggle-product')
                    ) {
                        return;
                    }
                    var tile = event.target.closest('.frenzySearchgtm');
                    var gtmDataAttr = tile.getAttribute('data-gtm-data');
                    var gtmData = {};
                    try {
                        gtmData = JSON.parse(gtmDataAttr);
                        select_item(gtmData);
                    } catch (err) {
                        console.warn('[Product Click] Invalid gtmData:', err);
                    }
                }
            });

            document.body.addEventListener('click', (event) => {
                if (event.target.matches('.card[cypress-target="cartProductCard"] a')) {
                    if (
                        event.target.closest('.wishlist-toggle-product') ||
                        event.target.classList.contains('wishlist-toggle-product') ||
                        event.target.closest('.remove-product') ||
                        event.target.classList.contains('remove-product')
                    ) {
                        return;
                    }
                    var card = event.target.closest('.card[cypress-target="cartProductCard"]');
                    var gtmDataAttr = card.querySelector('button[data-gtmdata]')?.getAttribute('data-gtmdata');
                    var gtmData = {};
                    try {
                        gtmData = JSON.parse(gtmDataAttr);
                        delete gtmData.item_category;
                        delete gtmData.item_category2;
                        select_item(gtmData);
                    } catch (e) {
                        console.warn('[Cart Product Click] Invalid data-gtmdata:', e);
                    }
                }
            });

            document.body.addEventListener('click', (event) => {
                if (event.target.matches('.wishlist-card-product-name a')) {
                    var card = event.target.closest('.wishlist-card-product');
                    var gtmDataAttr = card.querySelector('button[data-gtmdata]')?.getAttribute('data-gtmdata');
                    var gtmData = {};
                    try {
                        gtmData = JSON.parse(gtmDataAttr);
                    } catch (err) {
                        console.warn('[Wishlist Product Click] Invalid data-gtmdata:', err);
                    }
                    select_item(gtmData);
                }
            });

            document.body.addEventListener('click', (event) => {
                if (event.target.matches('.plp-product-tile a')) {
                    if (
                        event.target.closest('.wishlist-toggle-product') ||
                        event.target.closest('button')
                    ) {
                        return;
                    }
                    var tile = event.target.closest('.product');
                    var gtmDataAttr = tile.getAttribute('data-gtmdata');
                    var gtmData = {};
                    try {
                        gtmData = JSON.parse(gtmDataAttr);
                    } catch (err) {
                        console.warn('[PLP Click] Invalid GTM data:', err);
                    }
                    select_item(gtmData);
                }
            });

            document.body.addEventListener('frenzysearch:productitem', (event) => {
                let gtmData = JSON.parse(event.detail.response);
                if (gtmData && gtmData.length > 0) {
                    const { search_term = '', search_results_count = 0 } = gtmData[0];
                    let previousPageType = sessionStorage.getItem('previousPageType') || '';
                    let currentPageType = sessionStorage.getItem('currentPageType') || '';

                    if (previousPageType === 'SKU Search') {
                        if (currentPageType === 'PLP Page' || currentPageType === 'frenzysearch') {
                            previousPageType = 'frenzysearch';
                        }
                    }

                    const listId = previousPageType.toLowerCase().replace(/\s+/g, '_') || '';
                    const listName = previousPageType || '';

                    const productItems = gtmData.map(({ search_term, search_results_count, ...item }) => {
                        return {
                            ...item,
                            item_list_id: listId,
                            item_list_name: listName
                        };
                    });
                    dataLayer.push({
                        event: 'view_search_result',
                        ecommerce: {
                            search_term,
                            search_results_count,
                            items: productItems
                        }
                    });
                }
            });

            document.body.addEventListener('frenzyRecommadtion:productitem', (event) => {
                let gtmData = JSON.parse(event.detail.response);
                if (gtmData && gtmData.length > 0) {
                    const { item_list_id, item_list_name } = gtmData[0];
                    dataLayer.push({
                        event: 'view_item_list',
                        ecommerce: {
                            item_list_id,
                            item_list_name,
                            items: gtmData
                        }
                    });
                }
            });
        });
    }
}

module.exports = events;
