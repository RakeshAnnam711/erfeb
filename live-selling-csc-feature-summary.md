# Live Selling / CSC Feature — Final Summary

Verified file by file by reading the actual code (not commit history) right before this PR.

## Files touched or created

### New files (created for this feature)

- `autobahn_client_core/cartridge/scripts/helpers/liveSellingCategoryHelper.js`
- `autobahn_client_core/cartridge/scripts/helpers/liveSellingPriceHelper.js`
- `autobahn_client_core/cartridge/scripts/helpers/liveSellingPriceAdjustmentHelper.js`
- `autobahn_client_core/cartridge/scripts/helpers/agentBasketLineItemLocks.js`
- `autobahn_client_core/cartridge/scripts/hooks/cart/calculate.js`
- `autobahn_client_core/cartridge/adyen/utils/lineItemHelper.js`
- `autobahn_client_core/cartridge/models/product/decorators/liveSelling.js`
- `autobahn_client_core/cartridge/models/product/decorators/price.js`
- `.cartridgeignore`

### Existing files (modified for this feature)

- `autobahn_client_core/cartridge/scripts/cart/cartSummaryBuilder.js`
- `autobahn_client_core/cartridge/scripts/checkout/checkoutHelpers.js`
- `autobahn_client_core/cartridge/controllers/Cart.js`
- `autobahn_client_core/cartridge/models/product/decorators/badges.js`
- `autobahn_client_core/cartridge/models/product/fullProduct.js`
- `autobahn_client_core/cartridge/models/product/productTile.js`
- `autobahn_client_core/cartridge/models/productLineItem/productLineItem.js`
- `autobahn_client_core/cartridge/models/search/productSearch.js`
- `autobahn_client_core/cartridge/models/search/suggestions/product.js`
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
- `autobahn_client_core/cartridge/templates/resources/product.properties`
- `autobahn_client_core/cartridge/client/default/js/cart/cart.js`
- `autobahn_client_core/cartridge/client/default/scss/checkout/_checkout.scss`
- `autobahn_client_core/cartridge/client/default/scss/components/_productTiles.scss`
- `autobahn_client_core/cartridge/client/default/scss/product/_pdp-consolidated.scss`
- `autobahn_client_core/hooks.json`
- `rvw_som_integration/cartridge/scripts/checkout/doPrePlaceOrder.js`
- `rvw_autobahn_core/cartridge/client/default/scss/_variables.scss`
- `rvw_autobahn_core/cartridge/templates/default/product/components/productTileImage.isml`

## Features, explained simply

**1. Marking a category/product as "Live Selling"**
A Site Preference (and an optional category checkbox) decide which category counts as
"live selling." Products in that category automatically get the special treatment
below — no per-product setup needed.
*Files: `liveSellingCategoryHelper.js`, `decorators/liveSelling.js`*

**2. Hiding price/Add to Cart on the storefront**
Live-selling products show a badge and item number instead of a price, and can't be
added to cart directly by a customer.
*Files: `fullProduct.js`, `productTile.js`, `productTileImage.isml`, `productDetailsContent.isml`, `product.properties`*

**3. Keeping live-selling products out of search/browsing**
These products only show up on their own dedicated category page — hidden from every
other category, keyword search, and search-as-you-type suggestions.
*Files: `productSearch.js`, `suggestions/product.js`, `searchResults.isml`*

**4. Agent builds the basket in Business Manager (CSC handoff)**
An agent checks "Is Live Selling" on a product and can leave a note for the customer.
The system automatically knows which items the agent added vs. which the customer
added themselves.
*Files: `agentBasketLineItemLocks.js`, `checkoutHelpers.js`*

**5. Locking the item in the customer's cart**
Once handed off, the customer can't remove, edit, or wishlist that item — but anything
they add themselves stays fully editable, even in the same basket. Locked items also
auto-expire and release after a set number of hours if never purchased.
*Files: `agentBasketLineItemLocks.js`, `Cart.js`, `cart.js`, `cart.isml`, `cartProductCard.isml`, `cartProductCardEdit.isml`, `checkout/productCard.isml`, `productCardProductNameAndRemove.isml`*

**6. "Final sale, no returns" messaging**
Locked live-selling items show the same final-sale message regular final-sale products
already use, on cart, checkout, and the order confirmation page — no new message or
styling was needed, the templates just also show it for a locked item.
*Files: `cartProductCard.isml`, `checkout/productCard.isml`, `confirmationProductCard.isml`*

**7. Recording it on the order**
When the order is placed, it gets flagged as a live-selling order (only if the agent
actually checked the box — never guessed), marked non-returnable, and the agent's note
gets copied onto the order as a real Business Manager note.
*Files: `doPrePlaceOrder.js` (rvw_som_integration), `checkoutHelpers.js`*

**8. Special "live selling" pricing**
A separate price list (`wgaca-liveselling` by default, configurable) can hold a
special price for a product. If the agent checks the live-selling box and that price
exists, the customer is charged that price instead of the normal one — correctly,
even with multiple quantities, and surviving the site's background price
recalculation. If no special price was set, the item just uses the normal price.
*Files: `liveSellingPriceHelper.js`, `liveSellingPriceAdjustmentHelper.js`, `calculate.js`, `hooks.json`, `models/product/decorators/price.js`, `productLineItem.js`, `cartSummaryBuilder.js`*

**9. Live-selling badge, driven by Business Manager**
The "LIVE" badge shown on live-selling products pulls its text and styling from the
same reusable "badges" system the site already uses for other merchandising badges
(New, Sale, etc.), instead of being fixed in code. The business can turn it on/off and
reschedule it entirely from Business Manager, no code deploy needed. If it hasn't been
set up in Business Manager yet, no badge shows at all — no placeholder text.
*Files: `decorators/badges.js`, `decorators/liveSelling.js`, `productTile.isml`, `productDetailsContent.isml`*

**10. Discount applies immediately, not after a delay**
When an agent hands off a live-selling item, the discounted price now shows correctly
the very first time the customer opens their cart — previously it could briefly show
the full, undiscounted price until something else refreshed the basket.
*Files: `liveSellingPriceAdjustmentHelper.js`, `agentBasketLineItemLocks.js`, `productLineItem.js`*

**11. Bugs found and fixed along the way**
- A payment processor (Adyen) crashed on this kind of special discount, breaking
  checkout entirely for some payment methods — fixed (`adyen/lineItemHelper.js`).
- An unrelated, pre-existing missing style variable was breaking the entire site's
  build — fixed (`rvw_autobahn_core/_variables.scss`).
- Added safety nets so a problem in this feature's pricing code can never break
  checkout for a normal, non-live-selling order (`calculate.js`, `cartSummaryBuilder.js`,
  `liveSellingPriceAdjustmentHelper.js`, `productLineItem.js`).

---

## Attributes used

### Site Preferences
*Business Manager → Merchant Tools → Site Preferences → Custom Preferences → "Autobahn Configurations"*

| Attribute | Type | Purpose |
|---|---|---|
| `liveSellingHostName` | Dropdown (enum-of-string) | Host name for the current event |
| `liveSellingEventSummary` | String | Free-text event summary |
| `cscHandoffExpirationHours` | Double | Hours before an unpurchased handed-off item auto-releases |
| `liveSellingCategoryID` | String | Category ID that marks products as live-selling |
| `liveSellingPriceBookID` | String | Price book holding special live-selling prices |

### Category
| Attribute | Type | Purpose |
|---|---|---|
| `isLiveSellingCategory` | Boolean | Marks a category as the live-selling category |

### Product (catalog)
| Attribute | Type | Purpose |
|---|---|---|
| `liveSellingItemID` | String | Item number shown on PLP/PDP; falls back to the Product ID if blank |

### ProductLineItem (basket/order line item)
| Attribute | Type | Purpose |
|---|---|---|
| `isLiveSellingLineItem` | Boolean | Agent's explicit checkbox at handoff |
| `isCSCHandoffLineItem` | Boolean | Marks an item as added by an agent, not the customer |
| `isStorefrontLineItem` | Boolean | Marks an item the customer added themselves |
| `liveSellingItemID` | String | Copied from the product onto the line item at order placement |
| `liveSellingHostName` | String | Copied from the Site Preference onto the line item at order placement |

### Order
| Attribute | Type | Purpose |
|---|---|---|
| `isLiveSellingOrder` | Boolean | True only if the agent explicitly marked a line item live-selling |
| `isCSCHandoffOrder` | Boolean | True if any line item was agent-added, live-selling or not |
| `liveSellingHostName` | String | Aggregated from all live-selling line items on the order |
| `liveSellingEventSummary` | String | Aggregated from all live-selling line items on the order |
| `cscOrderNotes` | String | Agent's note, copied to a real Business Manager order note |

### Custom Object type: `badges`
*One instance, id `live-selling`, drives the storefront badge — see Feature 9.*

| Attribute | Type | Purpose |
|---|---|---|
| `badgeDisplayName` | String | The badge's text |
| `badgeClass` | String | Optional CSS class |
| `badgeFontSize`, `badgeFontStyle`, `badgeFontWeight` | String | Optional font styling |
| `badgeBorderColor`, `badgeBackgroundColor`, `badgeFontColor` | String | Optional color styling |
| `badgeStartDateTime`, `badgeEndDateTime` | Date | Optional on/off scheduling window |
