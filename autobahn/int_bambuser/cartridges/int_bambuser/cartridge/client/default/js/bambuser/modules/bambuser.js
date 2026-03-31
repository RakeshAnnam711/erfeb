/**
 * Bambuser helper functions for the Bambuser integration
 * @module bambuser
 */

/**
* Reloads the iframe page for live commerce
* @returns {void}
*/
function reloadIframePage() {
    /* eslint-disable */
    $('iframe').each((i, item) => {
        const $pageFrame = $(item);
        const parentId = $($pageFrame.parent()).attr('id');
        /* eslint-enable */
        const currentPage = window.location.href;
        if (currentPage.indexOf('Order-Confirm') > -1) {
            return;
        }

        if (parentId && parentId.indexOf('livecommerce-surf') > -1) {
            $pageFrame.attr('src', currentPage);
        }
    });
}

/**
* Updates the shop's mini cart
* @param {Object} options - options for updating the mini cart
* @param {number} options.quantityTotal - total quantity of items in the mini cart
* @param {number} options.minicartCountOfItems - count of items in the mini cart
* @returns {void}
*/
function updateShopMiniCart({ quantityTotal, minicartCountOfItems }) {
    window.$('.minicart').trigger('count:update', { quantityTotal, minicartCountOfItems });
    document.dispatchEvent(new Event('cart:update', { bubbles: true }));
    reloadIframePage();
}

/**
* Updates the Bambuser product with the given product response, player, and configuration
* @param {Object} productResponse - the response from the Bambuser API for the product
* @param {Object} player - the Bambuser player object
* @param {Object} config - the configuration for the Bambuser product
*/
function updateBambuserProduct(productResponse, player, config) {
    if (productResponse) {
        player.updateProduct(productResponse.bambuserPID, (factory) => factory
            .currency(config.currency)
            .locale(config.locale)
            .product((p) => p
                .brandName(productResponse.brand)
                .defaultVariationIndex(0)
                .description(productResponse.description)
                .name(productResponse.name)
                .sku(productResponse.id)
                .variations((v) => productResponse.variations.map((variation) => v()
                    .attributes((a) => a
                        .colorName(variation.colorName))
                    .imageUrls(variation.imageURLs)
                    .name(variation.name)
                    .sku(variation.sku)
                    .sizes((s) => variation.sizes.map((size) => s()
                        .name(size.name)
                        .inStock(size.inStock)
                        .price((pr) => pr
                            .currency(size.price.currency)
                            .current(size.price.current))
                        .sku(size.sku)))))));
    }
}

/**
* Pauses the video playback if the bambuserPlayer object is available in the parent window
*/
function pauseVideo() {
    if (window.parent.bambuserPlayer) {
        window.parent.bambuserPlayer.pause();
    }
}

/**
* Continues the video playback if the bambuser player is available
* @returns {void}
*/
function continueVideo() {
    if (window.parent.bambuserPlayer) {
        window.parent.bambuserPlayer.play();
    }
}

/**
* Checks if the cart is empty and updates the player's cart accordingly
* @param {Object} player - the player object
* @returns {void}
*/
function isCartEmpty(player) {
    let basketUrl;
    const basketItems = document.querySelector('.basket-items');

    if (basketItems !== null) {
        basketUrl = basketItems.getAttribute('data-basket-action');
    }
    // eslint-disable-next-line no-undef
    $.ajax({
        url: basketUrl,
        method: 'GET',
        success(data) {
            if (data.quantityTotal === 0) {
                player.updateCart({
                    items: [],
                });
            }
        },
        error(e) {
            window.console.error('Could not load basket', e);
        },
    });
}

/**
* Initializes the Bambuser integration
* @returns {void}
*/
function initIntegration() {
    // get config
    let config;
    const basketPLIs = {};

    try {
        const configEl = document.querySelector('.js_bambuser-config');
        config = JSON.parse(configEl.dataset.config);
    } catch (e) {
        window.console.error('Could not load bambuser player config', e);
        return;
    }

    if (!config.enabled) {
        window.console.debug('Bambuser integration disabled');
        return;
    }
    // configure player and define handlers
    window.onBambuserLiveShoppingReady = function (player) {
        window.bambuserPlayer = player;
        // basic config
        let dismissMiniplayer;
        let productMiniplayer;
        let checkoutMiniplayer;
        const buttonsDisplay = {};
        const NO_DISPLAY = 'no_display';

        switch (config.dismissMiniplayer) {
            case 'player.BUTTON.CLOSE':
                dismissMiniplayer = player.BUTTON.CLOSE;
                break;
            case 'player.BUTTON.MINIMIZE':
                dismissMiniplayer = player.BUTTON.MINIMIZE;
                break;
            case 'player.BUTTON.NONE':
                dismissMiniplayer = player.BUTTON.NONE;
                break;
            default: break;
        }

        if (config.dismissMiniplayer !== NO_DISPLAY) {
            buttonsDisplay.dismiss = dismissMiniplayer;
        }

        switch (config.productMiniplayer) {
            case 'player.BUTTON.LINK':
                productMiniplayer = player.BUTTON.LINK;
                break;
            case 'player.BUTTON.MINIMIZE':
                productMiniplayer = player.BUTTON.MINIMIZE;
                break;
            case 'player.BUTTON.NONE':
                productMiniplayer = player.BUTTON.NONE;
                break;
            case 'player.BUTTON.AUTO':
                productMiniplayer = player.BUTTON.AUTO;
                break;
            default: break;
        }

        if (config.productMiniplayer !== NO_DISPLAY) {
            buttonsDisplay.product = productMiniplayer;
        }

        switch (config.checkoutMiniplayer) {
            case 'player.BUTTON.LINK':
                checkoutMiniplayer = player.BUTTON.LINK;
                break;
            case 'player.BUTTON.MINIMIZE':
                checkoutMiniplayer = player.BUTTON.MINIMIZE;
                break;
            default: break;
        }

        if (config.checkoutMiniplayer !== NO_DISPLAY) {
            buttonsDisplay.checkout = checkoutMiniplayer;
        }

        player.configure({
            locale: config.locale,
            currency: config.currency,
            buttons: buttonsDisplay,
            ui: {
                hideCartButton: !config.cartIntegration,
            },

        });

        // handle add to cart
        player.on(player.EVENT.ADD_TO_CART, (addedItem, callback) => {
            const payLoad = new FormData();
            payLoad.append('pid', addedItem.sku);
            payLoad.append('quantity', addedItem.quantity || 1);
            window.fetch(
                config.urls.addToCart,
                {
                    method: 'POST',
                    body: payLoad,
                },
            )
                .then((response) => response.json())
                .then((productJson) => {
                    basketPLIs[addedItem.sku] = productJson.pliUUID;
                    updateShopMiniCart(productJson);
                    callback(true);
                });
        });

        // handle checkout (redirect)
        player.on(player.EVENT.CHECKOUT, () => {
            player.showCheckout(window.location.origin + config.urls.checkout);
        });

        // handle PROVIDE_PRODUCT_DATA
        player.on(player.EVENT.PROVIDE_PRODUCT_DATA, (event) => {
            if (config.cartIntegration) {
                Array.prototype.forEach.call(event.products, (prod) => {
                    // construct query url
                    const url = new URL(window.location.href);
                    url.pathname = config.urls.productData;
                    url.searchParams.append('id', prod.id || '');
                    url.searchParams.append('ref', prod.ref || '');

                    // fetch and process product data
                    window.fetch(url, { method: 'GET' })
                        .then((response) => response.json())
                        .then((responseObj) => updateBambuserProduct(responseObj.product, player, config));
                });
            }
        });

        // Optional: handle CLOSE
        player.on(player.EVENT.CLOSE, (event) => { // eslint-disable-line no-unused-vars
            // do something
        });

        // handle UPDATE_ITEM_IN_CART
        // Note: due to the possibility of the player cart being out of sync with the shop, some unexpected behavior
        // is possible (see SYNC_CART_STATE handler)
        player.on(player.EVENT.UPDATE_ITEM_IN_CART, (updatedItem, callback) => {
            if (updatedItem.quantity < 0) { // WGACA MODIFICATION
                const pliUUID = basketPLIs[updatedItem.sku];

                if (pliUUID) {
                    const url = new URL(
                        updatedItem.quantity > 0 ? config.urls.updateQuantity : config.urls.removeProduct,
                        window.location.origin,
                    );
                    url.searchParams.append('pid', updatedItem.sku);
                    url.searchParams.append('uuid', pliUUID);
                    url.searchParams.append('quantity', updatedItem.quantity);

                    window
                        .fetch(url, { method: 'GET' })
                        .then((response) => response.json())
                        .then((responseJson) => {
                            const quantityTotal = responseJson.numItems || 0;
                            const { minicartCountOfItems } = updatedItem.quantity > 0
                                ? responseJson.resources
                                : responseJson.basket.resources;
                            updateShopMiniCart({ quantityTotal, minicartCountOfItems });
                            callback(true);
                        });
                } else {
                    callback({
                        success: false,
                        reason: "custom-error",
                        message: "For additional quantities, please email LiveShopping@wgacany.com",
                    });
                }
            }
        });

        player.on(player.EVENT.SYNC_CART_STATE, () => {
            // check if the basket is empty
            isCartEmpty(player);
        });
    };

    // load bambuser script
    window.initBambuserLiveShopping = function (item) { window.initBambuserLiveShopping.queue.push(item); };
    window.initBambuserLiveShopping.queue = [];
    const scriptNode = document.createElement('script');
    scriptNode.src = config.urls.embedScript;
    document.body.appendChild(scriptNode);
}

/* eslint-disable */
// the code is from bambuser dashboard and we disabled the linting as it doesn't comply with it
/**
* Initializes the Bambuser Live Shopping Widget
* @returns {void}
*/
function initLiveShoppingWidget() {
    const configEl = document.querySelector('.js_bambuser-fab-config');
    if (configEl) {
        const configFab = JSON.parse(configEl.getAttribute('data-config'));
        const skipPage = configEl.getAttribute('fabSkipPage');
        if (configFab.enableFAB && skipPage !== "true") {
            if (!window.initBambuserLiveShopping) {
                initIntegration();
            }
            const widgetElementId = 'bambuser-liveshopping-widget';
            window.__bfwId = configFab.fabWidgetId;
    
            if (document.getElementById(widgetElementId) && window.__bfwInit) {
                return window.__bfwInit();
            }
    
            if (document.getElementById(widgetElementId)) {
                return;
            }
    
            const s = document.createElement('script');
            const ss = document.getElementsByTagName('body')[0]; // WGACA MODIFICATION
            const aa = ss.lastElementChild;
            s.id = widgetElementId;
            s.src = configFab.fabWidgetURL;
            aa.parentNode.insertBefore(s, aa);
        }
    }
}

/**
* Initializes a Bambuser stream for a specific element
* @param {string} showId - the ID of the show to stream
* @param {HTMLElement} node - the element to stream the show on
* @param {string} [type='overlay'] - the type of stream to initialize (default: overlay)
*/
function initStream(showId, node, type = 'overlay') {
    // check if integration has been initialized
    if (!window.initBambuserLiveShopping) {
        initIntegration();
    }
    // intitialize stream for element
    if (window.initBambuserLiveShopping) {
        window.initBambuserLiveShopping({
            showId,
            node,
            type,
        });
    }
}

/**
* Function that handles miniplayer page skipping
* @returns {void}
*/
function miniplayerSkipPages() {
    const configMiniplayer = document.querySelector('.js_bambuser-fab-config');

    if (configMiniplayer) {
        const skipPageMiniplayer = configMiniplayer.getAttribute('miniplayerSkipPage');
        const miniplayer = window.parent.document.querySelector('[data-bambuser-liveshopping-player-id]');
        if (miniplayer) {
            if (skipPageMiniplayer === 'true') {
                miniplayer.classList.remove('show-miniplayer');
                if (!miniplayer.classList.contains('hide-miniplayer')){
                    miniplayer.classList.add('hide-miniplayer');
                    pauseVideo();
                }
            } else if (skipPageMiniplayer !== 'true') {
                miniplayer.classList.remove('hide-miniplayer');
                if (!miniplayer.classList.contains('show-miniplayer')){
                    miniplayer.classList.add('show-miniplayer');
                    continueVideo();
                }
            }
        }
    }
}

module.exports.initStream = initStream;
module.exports.initLiveShoppingWidget = initLiveShoppingWidget;
module.exports.miniplayerSkipPages = miniplayerSkipPages;
