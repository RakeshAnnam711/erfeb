# Live Selling / CSC - Final File List by Layer

## Quick overview

- **Frontend:** The browser-side changes are limited to existing JavaScript and SCSS files. No new frontend files were created.
- **Backend:** Most of the work is server-side, including controllers, helpers, models, hooks, and ISML templates. All new feature files are in this layer.
- **Business Manager:** The CSC agent uses native Business Manager screens. The feature adds metadata and screen configuration rather than a separate application.
- **OCAPI:** This feature does not use OCAPI or SCAPI. The `dw.order.calculate` hook is an SFCC server-side basket calculation hook and is not related to either API.

---

## Frontend - client-side JavaScript and SCSS

No new frontend files were added. The feature updates the following existing files.

### Modified

- `autobahn_client_core/cartridge/client/default/js/cart/cart.js`
- `autobahn_client_core/cartridge/client/default/scss/checkout/_checkout.scss`
- `autobahn_client_core/cartridge/client/default/scss/components/_productTiles.scss`
- `autobahn_client_core/cartridge/client/default/scss/product/_pdp-consolidated.scss`
- `rvw_autobahn_core/cartridge/client/default/scss/_variables.scss`

---

## Backend - controllers, scripts, models, and hooks

### New files

- `autobahn_client_core/cartridge/scripts/helpers/liveSellingCategoryHelper.js`
- `autobahn_client_core/cartridge/scripts/helpers/liveSellingPriceHelper.js`
- `autobahn_client_core/cartridge/scripts/helpers/liveSellingPriceAdjustmentHelper.js`
- `autobahn_client_core/cartridge/scripts/helpers/agentBasketLineItemLocks.js`
- `autobahn_client_core/cartridge/scripts/hooks/cart/calculate.js` - registered in `hooks.json` as a `dw.order.calculate` hook and called during basket/order calculation
- `autobahn_client_core/cartridge/adyen/utils/lineItemHelper.js`
- `autobahn_client_core/cartridge/models/product/decorators/liveSelling.js`
- `autobahn_client_core/cartridge/models/product/decorators/price.js`
- `.cartridgeignore` - build configuration added with this work; it does not contain feature logic

### Modified files

- `autobahn_client_core/cartridge/controllers/Cart.js`
- `autobahn_client_core/cartridge/controllers/Checkout.js`
- `autobahn_client_core/cartridge/scripts/cart/cartSummaryBuilder.js`
- `autobahn_client_core/cartridge/scripts/checkout/checkoutHelpers.js`
- `autobahn_client_core/cartridge/models/product/decorators/badges.js`
- `autobahn_client_core/cartridge/models/product/fullProduct.js`
- `autobahn_client_core/cartridge/models/product/productTile.js`
- `autobahn_client_core/cartridge/models/productLineItem/productLineItem.js`
- `autobahn_client_core/cartridge/models/search/productSearch.js`
- `autobahn_client_core/cartridge/models/search/suggestions/product.js`
- `autobahn_client_core/hooks.json`
- `rvw_som_integration/cartridge/scripts/checkout/doPrePlaceOrder.js`

### Modified server-rendered templates

These ISML files generate HTML on the server. They are listed under the backend because they are rendered before the response reaches the browser. All of them were existing files.

- `autobahn_client_core/cartridge/templates/default/cart/cart.isml`
- `autobahn_client_core/cartridge/templates/default/cart/cartPromoCode.isml`
- `autobahn_client_core/cartridge/templates/default/cart/productCard/cartProductCard.isml`
- `autobahn_client_core/cartridge/templates/default/cart/productCard/cartProductCardEdit.isml`
- `autobahn_client_core/cartridge/templates/default/cart/productCard/confirmationProductCard.isml`
- `autobahn_client_core/cartridge/templates/default/checkout/cart/miniCart.isml`
- `autobahn_client_core/cartridge/templates/default/checkout/productCard/productCard.isml`
- `autobahn_client_core/cartridge/templates/default/checkout/productCard/productCardProductNameAndRemove.isml`
- `autobahn_client_core/cartridge/templates/default/product/components/productDetailsContent.isml`
- `autobahn_client_core/cartridge/templates/default/product/productTile.isml`
- `autobahn_client_core/cartridge/templates/default/search/searchResults.isml`
- `autobahn_client_core/cartridge/templates/resources/product.properties` - contains labels used by the templates
- `rvw_autobahn_core/cartridge/templates/default/product/components/productTileImage.isml`

---

## Business Manager - CSC agent configuration

The agent builds the handoff basket using SFCC's Customer Service Center screens in Business Manager. This project does not provide a separate agent-facing application or API.

The following configuration supports the CSC flow:

- `data/clientmeta/autobahn_client_core/meta/system-objecttype-extensions.xml` - defines custom fields such as "Is Live Selling" for Order, ProductLineItem, and Category records
- **Customer Service Center Settings > Basket View JSON** under Administration > Site Development - controls the fields and tabs displayed on the CSC basket screen; this configuration is maintained in Business Manager and is not stored in the repository

---

## OCAPI - not used

The following OCAPI configuration files were checked:

- `autobahn/data/initialize/autobahn_client_core/ocapi-settings/wapi_data_config.json`
- `autobahn/data/initialize/autobahn_client_core/ocapi-settings/wapi_shop_config.json`
- The WGACA site-specific `ocapi-settings/wapi_data_config.json`

None of these files contain live-selling or CSC configuration. The feature uses storefront controllers and Business Manager, with no OCAPI or SCAPI endpoint.

---

## Removed during the PR review changes

The following parts were removed intentionally:

- The `Cart-CheckExpired` route in `Cart.js`; expiration is now checked when the cart or checkout page loads
- The client-side `setInterval` polling in `cart.js`
- The hidden `#check-expired-csc-url` input in `cart.isml`
- The `cscOrderNotes` Order and Shipment attributes
- The `cscOrderNotes` attribute group and Basket View JSON area
- The order-note read/write logic in `checkoutHelpers.js` and `doPrePlaceOrder.js`
- The separate item-ID badge in `productTileImage.isml`; the item ID is now part of the main badge in `productTile.isml` and `productDetailsContent.isml`
