# Live Selling & CSC Handoff — Feature Flow

## 1. Overview

Live selling is a special product experience: a dedicated category page where
products are visible with a badge and item number, but price and Add to Cart
are hidden — customers can't buy them directly from the storefront. Instead, a
Customer Service (CSC) agent builds the customer's basket for them in Business
Manager and hands it off. Once handed off, those items are **locked** in the
customer's basket (can't be removed, quantity-changed, or wishlisted, and the
promo/coupon box is hidden) while anything the customer adds themselves stays
fully editable, even in the same basket.

This document walks the whole flow in order — category, product, storefront
display, CSC handoff, cart locking, order placement — naming the exact
attribute created for each piece of behavior and which SFCC object it lives
on.

---

## 2. Category

Two independent, either-is-enough ways a category counts as "live selling":

| Attribute | Object | Type | Purpose |
|---|---|---|---|
| `liveSellingCategoryID` | Site Preference | string | The ID of the primary live-selling category. If a category's ID matches this value, it's automatically treated as live-selling — no other flag needed. **No fallback**: if this is left blank, ID-based matching is skipped entirely (by explicit decision — an earlier hardcoded default was removed). |
| `isLiveSellingCategory` | Category | boolean | Lets a **second or additional** category also count as live-selling, independent of whatever ID is in `liveSellingCategoryID`. Useful if the business ever needs more than one live-selling category at once. |

Both checks live in one shared helper, `scripts/helpers/liveSellingCategoryHelper.js`, and every other part of the feature that needs to know "is this a live-selling category" calls into this same helper — so the two categories above are the *only* two ways a category can qualify, consistently, everywhere.

---

## 3. Product

| Attribute | Object | Type | Purpose |
|---|---|---|---|
| `liveSellingItemID` | Product | string | The item number shown on the PLP/PDP badge instead of price (e.g. "Item: 04"). Falls back to the product's own ID if left blank. |

**`isLiveSellingProduct` (Product) was removed.** It used to be a separate per-product checkbox, but it's redundant — a product only needs to be **assigned to the live-selling category** (section 2) to get every piece of live-selling behavior: hidden price/Add to Cart, badge, exclusion from other categories/search, and CSC cart-locking eligibility. No product-level flag is required at all.

---

## 4. Storefront Display (PLP / PDP)

**What makes a product show as "live selling" on the page** — computed by `models/product/decorators/liveSelling.js`, using `liveSellingCategoryHelper.isProductAssignedToLiveSellingCategory(product)`: true if the product is assigned to any category that qualifies per section 2. This single check drives all of:

- Hidden price and Add to Cart (PLP tile and PDP)
- Badge + item ID shown instead
- (Storefront-side only — see section 2 for the category-level mechanism)

**Where the badge/PLP content actually comes from** — all Site Preferences, shared across every live-selling product for the whole event:

| Attribute | Object | Type | Purpose |
|---|---|---|---|
| `liveSellingEventID` | Site Preference | string | Static identifier for the current event. |
| `liveSellingHostName` | Site Preference | string | The authoritative host name for the event — single source of truth, used everywhere host name is shown or recorded. |
| `liveSellingEventDate` | Site Preference | string | The authoritative event date — same role as host name. |
| `liveSellingBadgeText` | Site Preference | string | Text shown on the badge. Defaults to `"LIVE"` in code if left blank. |
| `liveSellingPlatform` | Site Preference | string | Placeholder, not wired into any code yet — the platform the event is/will be hosted on. Created for future use. |

**Keeping live-selling products out of everywhere else** — `models/search/productSearch.js` (category pages, keyword search, pagination, sorting) and `models/search/suggestions/product.js` (search-as-you-type dropdown) both filter out any product assigned to a qualifying live-selling category, unless the page being viewed *is* that category. Same shared helper as section 2 — no separate attribute involved, purely category assignment.

**Content slot**: the `live-selling` slot only renders when the current page is a qualifying live-selling category (`Search.js` computes `isLiveSellingCategoryPage` using the same helper, passes it to the template as `pdict.isLiveSellingCategoryPage`).

---

## 5. CSC Handoff (Business Manager)

An agent builds a basket for a customer using the Customer Service Center screens below.

### Product Detail form

```json
{
  "live-selling-fields": {
    "layout": [{ "attribute": "c_isLiveSellingLineItem", "width": 12 }]
  }
}
```

| Attribute | Object | Type | Purpose |
|---|---|---|---|
| `isLiveSellingLineItem` | ProductLineItem | boolean | The agent's checkbox — the only live-selling-related field shown on this form. Set per product as the agent adds it to the basket. This is the agent's **explicit choice**, and it always wins over any fallback later in the flow when present. |

Two attributes that used to live here — `liveSellingHostName` and `liveSellingEventDate` on ProductLineItem — were **removed**. They were per-line-item copies of the Site Preference values (section 4), always identical across every item in an order, so they were redundant with the Order-level copies (section 7) and have been dropped from both code and metadata.

### Basket view — "Order Notes" tab

```json
{
  "order_notes": {
    "layout": [{ "attribute": "c_cscOrderNotes", "width": 12, "end": true }]
  }
},
"config": {
  "area_id": "order_notes",
  "default_data_provider": "DefaultShipment"
}
```

| Attribute | Object | Type | Purpose |
|---|---|---|---|
| `cscOrderNotes` | Shipment | string | Free-text note the agent types while building the basket. **Must** be saved at the Shipment level — confirmed by testing that this Business Manager screen cannot save a custom attribute directly to Basket or Order, only to Shipment/Customer-level data providers. This is a *temporary staging spot*; it gets copied onward at checkout (section 7). |

### Classifying who added what

Not agent-facing, but set automatically the moment a line item lands in the basket (`scripts/helpers/agentBasketLineItemLocks.js`, based on `channelType` — the reliable signal for a Business Manager-created basket in this org):

| Attribute | Object | Type | Purpose |
|---|---|---|---|
| `isCSCHandoffLineItem` | ProductLineItem | boolean | True for a product the CSC agent added. |
| `isStorefrontLineItem` | ProductLineItem | boolean | True for a product the customer added themselves. The other half of the same distinction — together these two are what let a single mixed basket keep CSC items locked and customer items editable. |

---

## 6. Cart Locking (Customer-Facing)

On every cart page load, a sweep (`ensureLockedLineItems` in `agentBasketLineItemLocks.js`) checks each line item:

- **Locked** (no Remove/Wishlist/quantity change, promo box hidden) when it's a CSC item (`isCSCHandoffLineItem`) **and** counts as live-selling — either the agent explicitly checked `isLiveSellingLineItem`, or (if the agent never touched that checkbox) it falls back to whether the product is assigned to a live-selling category (section 2/3's logic).
- **Editable**, exactly like a normal cart item, if it's `isStorefrontLineItem`, or if it's a CSC item the agent never marked live-selling.

| Attribute | Object | Type | Purpose |
|---|---|---|---|
| `cscHandoffExpirationHours` | Site Preference | double | How many hours a locked item can sit unpurchased before it's automatically removed from the basket. Defaults to 5 minutes (as a fraction of an hour) if left blank. Checked on page load plus a 30-second client-side poll while the cart page stays open. |

---

## 7. Order Placement

Two files run, in order, once payment succeeds:

### `checkoutHelpers.js` (order creation)

Copies the note from where the agent saved it to where it needs to end up, and creates a real Business Manager note:

- `Shipment.custom.cscOrderNotes` → `Order.custom.cscOrderNotes`
- Calls `order.addNote('CSC Order Note', cscOrderNotes)` — creates a genuine entry on the order's **Notes** tab in Business Manager (not just a custom attribute).

### `doPrePlaceOrder.js` (rvw_som_integration)

For each product line item, decides if it's *genuinely* live-selling for order-reporting purposes — **stricter** than cart-locking (section 6): only counts if the agent explicitly checked the box (`isCSCHandoffLineItem` **and** `isLiveSellingLineItem === true`), never falling back to the product's category assignment the way display/cart-locking does. This means a normal customer order can never accidentally get marked live-selling at the order level.

| Attribute | Object | Type | Purpose |
|---|---|---|---|
| `isLiveSellingOrder` | Order | boolean | True only if at least one line item passed the strict check above. |
| `isCSCHandoffOrder` | Order | boolean | True whenever *any* line item was added by a CSC agent, regardless of live-selling status — independent of `isLiveSellingOrder`. A plain CSC handoff (no live-selling item) still sets this alone. |
| `liveSellingHostName` | Order | string | Copied from the `liveSellingHostName` Site Preference (section 4) at the moment of placement. |
| `liveSellingEventDate` | Order | string | Copied from the `liveSellingEventDate` Site Preference at the moment of placement. |
| `liveSellingItemID` | ProductLineItem | string | Snapshot of the product's `liveSellingItemID` (section 3) at the moment of purchase — preserves what item ID applied to this specific sale even if the catalog value changes later. |
| `somCC_returnable` | ProductLineItem | boolean | Set to `false` for live-selling line items, reusing the exact same export flag final-sale products already use, rather than a separate live-selling return flag. |

---

## 8. Complete Attribute Index

| Attribute | Object | Set at | Purpose |
|---|---|---|---|
| `liveSellingCategoryID` | Site Preference | Configured once per environment | Primary live-selling category ID |
| `isLiveSellingCategory` | Category | Catalog setup | Flags an additional category as live-selling |
| `liveSellingItemID` | Product | Catalog setup | Per-product badge/item number |
| `liveSellingEventID` | Site Preference | Configured per event | Static event identifier |
| `liveSellingHostName` | Site Preference | Configured per event | Authoritative event host name |
| `liveSellingEventDate` | Site Preference | Configured per event | Authoritative event date |
| `liveSellingBadgeText` | Site Preference | Configured per event | Badge text on PLP/PDP |
| `liveSellingPlatform` | Site Preference | Configured (unused) | Placeholder for future use |
| `isLiveSellingLineItem` | ProductLineItem | CSC handoff (agent) | Agent's explicit live-selling choice |
| `isCSCHandoffLineItem` | ProductLineItem | Basket build (automatic) | Marks a CSC-added line item |
| `isStorefrontLineItem` | ProductLineItem | Basket build (automatic) | Marks a customer-added line item |
| `cscOrderNotes` | Shipment | CSC handoff (agent) | Note staging spot before checkout |
| `cscHandoffExpirationHours` | Site Preference | Configured once per environment | Auto-removal timing for locked items |
| `isLiveSellingOrder` | Order | Order placement | Strict order-level live-selling flag |
| `isCSCHandoffOrder` | Order | Order placement | Any-CSC-item order flag |
| `liveSellingHostName` | Order | Order placement | Snapshot of the Site Preference |
| `liveSellingEventDate` | Order | Order placement | Snapshot of the Site Preference |
| `liveSellingItemID` | ProductLineItem | Order placement | Snapshot of the product's item ID |
| `somCC_returnable` | ProductLineItem | Order placement | No-returns export flag |
| `cscOrderNotes` | Order | Order placement | Final copy of the agent's note |
