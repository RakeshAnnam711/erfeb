## 1. Badges — reuse the existing badge loop

**What he asked:** Don't build a separate item-ID element next to the badge. Reuse the site's existing generic badge rendering — concatenate the item ID onto the same badge text (`badge.name + itemID`). Keep the current red-text styling as-is.

**Current code** — `templates/default/product/components/productDetailsContent.isml`:
```html
<div class="live-selling-product-meta live-selling-product-meta-pdp">
    <isif condition="${!empty(product.liveSellingItemID)}">
        <span class="badge-product live-selling-badge">${Resource.msgf('label.liveselling.itemid', 'product', null, product.liveSellingItemID)}</span>
    </isif>
    <span class="live-selling-badge-text ${product.liveSellingBadgeClass}"<isif condition="${!empty(product.liveSellingBadgeStyle)}"> style="${product.liveSellingBadgeStyle}"</isif>>${product.liveSellingBadgeText}</span>
</div>
```
Two separate spans: one hand-built for the item ID, one for the badge text (itself sourced from the generic `badges` Custom Object, see #8).

**What he's proposing** (his own screenshot, existing generic `badges.isml`):
```html
<isset name="liveSallingID" value="${product.liveSallingID ? ' ' + product.liveSallingID : ''}" scope="page" />
...
<isloop items="${product.badges}" var="badge">
    <span class="badge-product ${badge.class}"<isif condition="${!empty(badge.style)}"> style="${badge.style}"</isif>>${badge.name + liveSallingID}</span>
</isloop>
```
One span, one loop — the item ID just gets appended to whatever badge text is already rendering.

**Why we built it separately:** The item-ID display was built first, in an earlier pass, before the badge system existed at all — at that point there was no generic badge loop to fold into, so a standalone span was the only option. The badge Custom Object migration (see #8) came later, as its own separate piece of work, added the badge *text* on top without anyone going back to unify the two. So it's less "we chose two elements deliberately" and more "these were built at different times, for different asks, and never got merged afterward."

**Action:** Agreed, straightforward simplification. Only works cleanly if a live-selling product never has *other* badges assigned at the same time (otherwise the item ID would append to every badge, not just the live-selling one) — worth a quick sanity check but not expected to be an issue in practice.

**Simple answer:** Possible — yes, easy. Necessary — yes, it removes duplicate code for no real cost. **Conclusion: do it.**

---

## 2. Host name — dropdown vs. per-item field

**What he asked:** Confirmed there should be a dropdown/input for host name — but his screenshot points at an empty box *inside the CSC "Configure Item" modal itself* (right below "Is Live Selling Line Item"), suggesting the agent picks the host name per line item, in that modal.

**Current code** — `data/clientmeta/.../system-objecttype-extensions.xml` (SitePreferences):
```xml
<attribute-definition attribute-id="liveSellingHostName">
    <type>enum-of-string</type>
    <value-definitions>
        <value-definition><display>Eswar</display><value>eswar</value></value-definition>
        <value-definition><display>Eswartest</display><value>eswartest</value></value-definition>
        <value-definition><display>Eswartest123</display><value>eswartest123</value></value-definition>
    </value-definitions>
</attribute-definition>
```
One dropdown, set once, site-wide (Merchant Tools → Site Preferences → Custom Preferences → "Autobahn Configurations").

**Why:** The attribute's own description states the assumption directly: "static identifier for the current live selling event, **shared across all live selling products**." A live-selling event is one livestream hosted by one person — everything sold during that stream naturally shares a single host, so a site-wide value matches the real-world shape of the data. A per-item field only matters if a single order could ever mix items from *different* events/hosts, which was never a stated requirement. Building it as one dropdown also meant zero BM form customization — it's a stock Site Preference, editable through BM's existing generic preferences screen, versus adding a genuinely new custom field into a native "Configure Item" modal we don't own the layout of.

**Open question — this is genuinely unresolved:** Does one site-wide value cover the real use case (one host runs the whole event), or do different line items in the same order sometimes need different hosts? If it's the latter, a real custom field needs to be added to that BM "Configure Item" modal — a bigger, separate piece of BM customization we haven't scoped. Need his answer on this directly.

**Simple answer:** Possible — yes, either way is buildable. Necessary — the site-wide version is already done and works for the common case; a per-item field is only necessary if multiple hosts can appear in one order, which isn't confirmed. **Conclusion: keep what we have unless he confirms the multi-host case is real.**

---

## 3. `isLiveSellingOrder` visibility on more BM pages

**What he asked:** Show the live-selling flag as a column/indicator on Order Search results, order history, order summary, etc. — "just configurations."

**Current code** — `rvw_som_integration/.../doPrePlaceOrder.js`:
```js
if (isLiveSellingOrder) {
    order.custom.isLiveSellingOrder = true;
    order.custom.liveSellingHostName = liveSellingHostNames.join(', ');
    order.custom.liveSellingEventSummary = liveSellingEventSummaries.join(', ');
}
```
The data is set correctly on the order. It's just not configured as a visible column anywhere in BM.

**Action:** Agreed — pure BM display/metadata configuration (Order Search results grid, order detail forms), no new cartridge code needed.

**Simple answer:** Possible — yes, trivial. Necessary — yes, useful for support/ops to see at a glance. **Conclusion: do it, it's just configuration.**

---

## 4. `checkExpiredUrl` client-side polling — rejected

**His exact words:** "wtf? DO NOT DO that. don't use interval + apicall. we can check expired items on Basket-Show and Checkout-Begin. as a middleware."

**Current code** — `client/default/js/cart/cart.js:301-317`:
```js
// Polls for CSC line items expiring while the customer sits on the cart page - the server re-validates elapsed time on every poll, the client just triggers the check.
const checkExpiredUrl = document.getElementById('check-expired-csc-url');
if (checkExpiredUrl && checkExpiredUrl.value) {
    setInterval(function () {
        $.ajax({
            url: checkExpiredUrl.value,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                if (data && data.expired) {
                    window.location.reload();
                }
            }
        });
    }, 30000);
}
```
And the endpoint it hits — `controllers/Cart.js:179-194`:
```js
server.get('CheckExpired', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var expiredUUIDs = [];

    if (currentBasket) {
        expiredUUIDs = agentLocks.removeExpiredCSCLineItems(currentBasket);

        if (expiredUUIDs.length) {
            Transaction.wrap(function () {
                require('*/cartridge/scripts/helpers/basketCalculationHelpers').calculateTotals(currentBasket);
            });
        }
    }

    res.json({
        expired: expiredUUIDs.length > 0,
        ...
    });
});
```

**Why we built it this way:** The concern was real, even if the fix was wrong. A customer can sit on the cart page for a long time — reading details, comparing, on a call — with no reason to reload. Without any check running mid-session, the totals and line items shown could silently drift out of sync with what's actually still valid in the basket (an item that expired and got removed server-side on the *next* action would just vanish unexpectedly at checkout, or the displayed total wouldn't match what they'd actually be charged). The goal was to surface that change while they're still looking at the page, not leave them to discover it later. Polling was the first mechanism reached for to solve that — not the only one, just the one implemented.

**Action:** Agreed, remove both the `setInterval` block and the `CheckExpired` endpoint entirely. Call `agentLocks.removeExpiredCSCLineItems(basket)` directly inside `Basket-Show` and `Checkout-Begin`, before rendering — so it's checked on every real page load instead of via a background timer. Tradeoff: an item won't visibly vanish while the customer is idle on the page staring at it; it'll clear on their next navigation instead. Reasonable to give up for removing a whole polling subsystem.

**Simple answer:** Possible — yes, straightforward to rebuild as middleware. Necessary — yes, the current polling approach is a real anti-pattern he's right to flag. **Conclusion: replace it, accept the small UX tradeoff (no live disappearance while idle).**

---

## 5. `removeExpiredCSCLineItems` — too long

**What he asked:** Should fit in 3-5 lines.

**Current code** — `agentBasketLineItemLocks.js:332-366` (~35 lines):
```js
function removeExpiredCSCLineItems(basket) {
    var expiredItems = [];
    var now = new Date().getTime();
    var expirationMs = getExpirationMs();

    if (!basket || !basket.allProductLineItems) {
        return [];
    }

    collections.forEach(basket.allProductLineItems, function (lineItem) {
        try {
            if (isCSCHandoffLineItem(lineItem) && lineItem.creationDate && (now - lineItem.creationDate.getTime()) >= expirationMs) {
                expiredItems.push(lineItem);
            }
        } catch (e) {
            // Skip this line item on any unexpected read failure rather than blocking the whole check.
        }
    });

    if (!expiredItems.length) {
        return [];
    }

    var removedUUIDs = expiredItems.map(function (lineItem) {
        return lineItem.UUID;
    });

    Transaction.wrap(function () {
        expiredItems.forEach(function (lineItem) {
            basket.removeProductLineItem(lineItem);
        });
    });

    return removedUUIDs;
}
```

**Action:** Agreed, this can be tightened substantially — combine the filter/collect/remove steps, drop the per-item try/catch (or keep a single outer one) to cut it down toward the 3-5 line target he wants.

**Simple answer:** Possible — yes. Necessary — cosmetic, not urgent, but a cheap win. **Conclusion: simplify while touching this file for point 4 anyway.**

---

## 6. `AddProduct` "false positive" correction — not dead code

**What he asked:** "I don't think we ever hitting this."

**Current code** — `controllers/Cart.js:91-101`:
```js
if (currentBasket && req.form.pid && !req.form.isbambuser) {
    Transaction.wrap(function () {
        var productListItems = currentBasket.productLineItems;
        for (var i = 0; i < currentBasket.productLineItems.length; i++) {
            if (productListItems[i].productID === pid) {
                // Unconditional: Add to Cart is hidden for CSC/live-selling products, so any CSC flag found here is a false positive from the earlier lock sweep.
                agentLocks.forceMarkStorefrontLineItem(productListItems[i]);
            }
        }
    });
}
```
What it calls — `agentBasketLineItemLocks.js:164-175`:
```js
function forceMarkStorefrontLineItem(lineItem) {
    setCustomBoolean(lineItem, CSC_LINE_ITEM_ATTR, false);
    setCustomBoolean(lineItem, STOREFRONT_LINE_ITEM_ATTR, true);

    var basket = getLineItemContainer(lineItem);
    var storefrontUUIDs = getStoredStorefrontUUIDs(basket);
    addUnique(storefrontUUIDs, lineItem.UUID);
    setStoredStorefrontUUIDs(basket, storefrontUUIDs);
}
```

**Why it's not dead — the trigger condition:** The classification sweep only marks *unclassified* items as CSC when the whole basket is agent/CSC-sourced:
```js
shouldMarkUnclassifiedAsCSC = forceCurrentItemsLocked || isAgentBasket(basket) || isCustomerServiceCenterBasket(basket);
```
This is a **basket-level** check, not per item. So for a normal customer basket, it's always false — this correction code genuinely never fires there, agreeing with half of what Mike's saying.

But this feature explicitly supports **mixed baskets**: a customer who already has an agent-handed-off item can keep shopping normally in the *same* basket. In that case the basket-level check is true (the whole basket is CSC-sourced), so the sweep would wrongly mark the customer's own freshly-added item as CSC too — it has no way to tell "customer just added this themselves" apart from "nobody's classified this yet." This block undoes that specific mistake, right after the storefront's own `AddProduct` runs.

**Evidence this really happened:** there's a dedicated commit in this branch's history — *"Fix CSC handoff mixed-basket regression locking storefront items too"* — fixing exactly this bug in production testing, not a hypothetical.

**Action:** Keep, as long as mixed baskets (agent item + customer's own items, same basket) stay in scope. If mixed baskets get cut from the feature, this goes with it.

**Simple answer:** Possible to remove — only if mixed baskets are cut entirely. Necessary — yes, as long as mixed baskets exist; there's a real bug fix in the commit history proving it. **Conclusion: keep it — it's not removable on its own without removing mixed-basket support too.**

---

## 7. `ClearCart` — simplify to `BasketMgr.deleteBasket()`

**What he asked:** Replace the manual clearing with the platform's own delete call.

**Current code** — `controllers/Cart.js:242-276`:
```js
server.get('ClearCart', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var CartModel = require('*/cartridge/models/cart');

    if (!currentBasket) {
        res.json({ error: false, basket: null });
        return next();
    }

    Transaction.wrap(function () {
        var productLineItems = currentBasket.allProductLineItems.toArray();
        var couponLineItems = currentBasket.couponLineItems.toArray();
        var priceAdjustments = currentBasket.priceAdjustments.toArray();

        productLineItems.forEach(function (lineItem) {
            currentBasket.removeProductLineItem(lineItem);
        });
        couponLineItems.forEach(function (couponLineItem) {
            currentBasket.removeCouponLineItem(couponLineItem);
        });
        priceAdjustments.forEach(function (priceAdjustment) {
            currentBasket.removePriceAdjustment(priceAdjustment);
        });

        basketCalculationHelpers.calculateTotals(currentBasket);
    });
    agentLocks.clearLockedUUIDs();

    res.json({
        error: false,
        basket: new CartModel(currentBasket)
    });
    return next();
});
```

**Why we built it this way:** Likely built by explicitly enumerating "everything that needs to disappear when the cart is cleared" — line items, coupons, price adjustments — one category at a time, rather than reaching for the platform's blunter "just delete the whole thing" option. That instinct makes sense if you think you might need to keep the basket object alive after clearing it (e.g. preserve a shipping address or some other basket-level state the customer already entered) — but for a genuine "start over" action, there's nothing on the basket worth keeping, so the finer-grained approach doesn't actually buy anything here. It's the same instinct as #12's redundant null-checks: being explicit about every step feels safer, even when a single platform call already covers all of it.

**Action:** Agreed. Replace the whole `Transaction.wrap` body with `BasketMgr.deleteBasket(currentBasket)`. One implementation detail: after deleting, `currentBasket` is a dead reference — need to call `BasketMgr.getCurrentOrNewBasket()` to get a fresh empty basket before building the `CartModel` for the response. `agentLocks.clearLockedUUIDs()` stays as-is (separate session state, unrelated to the basket object).

**Simple answer:** Possible — yes, one line replaces the whole block. Necessary — not urgent (current code works), but a clean, low-risk simplification. **Conclusion: do it.**

---

## 8. Why does `decorators/badges.js` need any changes?

**What he asked:** Why does this shared, pre-existing badge engine (used for New, Sale, etc. — not built for this feature) need any of our changes?

**Current code** — the part we added to `decorators/badges.js`:
```js
// Resolves one 'badges' Custom Object by name into {name, class, style}; wrapped in try/catch since liveSelling.js calls this for every product tile and a missing Custom Object type must not break the whole PLP.
function resolveBadge(badgeName) {
    try {
        ...
        var badgeObj = CustomObjectMgr.getCustomObject("badges", badgeName);
        ...
    } catch (e) {
        return null;
    }
}
```
Called from `decorators/liveSelling.js`:
```js
var liveSellingBadge = badgesDecorator.resolveBadge(LIVE_SELLING_BADGE_NAME);
var badgeText = liveSellingBadge ? liveSellingBadge.name : '';
```

**Why:** We wanted the live-selling badge assigned automatically based on category, rather than requiring someone to manually set the `badgeNames` attribute on every individual live-selling product. Live-selling products move through the catalog in bursts — a batch gets added for one event, then rotated out — so tagging each one's `badgeNames` by hand would be an ongoing manual step every time inventory changes, and it's a second signal that has to be kept in sync with the *first* signal (category assignment) that already drives everything else about the feature (hidden price, search exclusion, cart locking). Deriving the badge from the same category check we already rely on everywhere else meant one source of truth instead of two things that could quietly drift apart.

**Action:** Fair point. If instead the badge is assigned the normal way — setting `badgeNames` on the product to include `live-selling`, exactly like any other badge — `badges.js` needs zero changes. If automatic category-based assignment is still wanted, that logic can live entirely inside our own `decorators/liveSelling.js` (already a file we own for this feature) instead of extending the shared file.

**Simple answer:** Possible to avoid touching `badges.js` — yes, if manual `badgeNames` tagging per product is acceptable. Necessary — only if automatic, no-manual-work assignment is a real requirement. **Conclusion: depends on whether manual tagging is operationally acceptable — worth asking directly rather than assuming.**

---

## 9. `decorators/price.js` / `productLineItem.js` — "use isif to hide price"

**What he asked:** If we need to hide the price, just use a template `<isif>`.

**Important clarification — this conflates two different things.** Hiding the price on PLP/PDP for a live-selling product is *already* just a template check — nothing to do with these two files:
```html
<!-- productTile.isml -->
<isif condition="${product.isLiveSellingProduct}">
    <div class="live-selling-product-meta">...</div>
<iselse/>
    <!-- normal price markup -->
</isif>
```

What `price.js`/`productLineItem.js` actually solve is different — **once a live-selling item is already in the customer's cart, its displayed unit price needs to show the discounted number, not the catalog price.** That's substituting a computed value, not a show/hide toggle.

**Current code** — `models/productLineItem/productLineItem.js`:
```js
try {
    if (options.lineItem && liveSellingPriceAdjustmentHelper.isEligibleForOverride(options.lineItem)) {
        var liveSellingPrice = liveSellingPriceHelper.getLiveSellingPrice(apiProduct);
        if (liveSellingPrice) {
            var overriddenPrice = new DefaultPrice(liveSellingPrice, null);
            Object.defineProperty(product, 'price', { configurable: true, enumerable: true, value: overriddenPrice });
            Object.defineProperty(product, 'renderedPrice', { configurable: true, enumerable: true, value: getRenderedPrice(overriddenPrice) });
        }
    }
} catch (e) {
    dwLogger.error('Failed to apply live selling price override for line item {0}: {1}', options.lineItem && options.lineItem.UUID, e);
}
```
`decorators/price.js` exists only because the base SFRA price decorator locks `price`/`renderedPrice` as non-configurable — a deliberate SFRA design choice meant to stop exactly this kind of downstream mutation. There's no built-in hook in SFRA's price factory for "build this line item's price object, but substitute this specific number" — price is computed purely from the product's own default price model at decoration time, with no parameter for a per-line-item override. Given that constraint, the only way to correct it without rewriting SFRA's entire base pricing factory was: replicate the base decorator's logic in our own file with `configurable: true` added, then redefine the properties afterward once the line item context is known. It's more code than we'd like, but it's the minimal change SFRA's existing architecture allows for this specific problem.

**Confirmed necessary, not hypothetical:** debugged directly earlier this session — the cart's line *total* already showed the correct discounted amount (that comes from the price adjustment alone, unrelated to these two files), but the separate unit-price display stayed stuck at full catalog price until this override existed.

**Action:** Can't be replaced with an `<isif>` as-is — different problem entirely. Worth asking directly: does the business actually need the discounted *unit* price shown (beyond the line total, which already works correctly without any of this)? If the total alone is sufficient, this whole override could be dropped.

**Simple answer:** Possible to remove entirely — only if a correct unit-price display isn't actually required (line total alone would still be correct without it). Necessary — yes, if the unit price must be shown correctly, confirmed by direct testing earlier this session. **Conclusion: not an isif swap — needs a business decision on whether unit price display matters.**

---

## 10. Search filtering could break search

**What he asked:** If a customer searches something specific (his example: "LV 2005 bag") and the only match is a live-selling product, filtering it out *after* the search already found it shows an empty results page for a search that legitimately matched something. Fix: exclude live-selling products from the Search Model / index entirely, so they never show up as hits to begin with.

**Current code** — `models/search/productSearch.js:68-80`:
```js
// Live selling products are only browsable on their own category page; filtered by category assignment (not the boolean attribute) to avoid search-index refinement quirks.
var isViewingLiveSellingCategory = liveSellingCategoryHelper.isLiveSellingCategory(productSearch && productSearch.category);

if (!isViewingLiveSellingCategory && this.productIds) {
    this.productIds = this.productIds.filter(function (item) {
        try {
            var product = item.productSearchHit && item.productSearchHit.product;
            return !liveSellingCategoryHelper.isProductAssignedToLiveSellingCategory(product);
        } catch (e) {
            return true;
        }
    });
}
```
Same pattern in `models/search/suggestions/product.js` for the autocomplete dropdown.

**Why we built it this way:** The category-exclusion check (`isProductAssignedToLiveSellingCategory`) already existed and was already proven working — it's the exact same check used to hide price/Add to Cart on PLP/PDP and to drive cart locking. Reusing it here was the path of least new code: filter the list the search already returned, using a helper that was already trusted. Making a product genuinely unsearchable would mean reaching for a different, less-familiar part of the platform (search index configuration / indexability settings) that hadn't been touched anywhere else in this feature — not because it's harder, just because it was unexplored territory compared to a pattern already in use everywhere else.

**Action:** Agreed — this is a real risk his example demonstrates concretely, not hypothetical. The cleaner fix is making live-selling products genuinely unsearchable (excluded from the index or marked not-searchable) so they never appear as a hit at all, rather than post-filtering a result set that already reflects a "found" count.

**Simple answer:** Possible — yes, SFCC supports excluding products from the search index natively. Necessary — yes, the current approach has a real, demonstrated bug risk (empty results page). **Conclusion: should be changed to index-level exclusion.**

---

## 11. `cscOrderNotes` / `checkoutHelpers.js` — needs a call

**What he asked:** Why write to a custom shipping attribute and then copy it to an order note — can it just write directly? Explicitly flagged as needing a live discussion, not a written answer.

**Current code** — `checkoutHelpers.js:23-50` (inside `createOrder`):
```js
try {
    if (
        currentBasket.defaultShipment &&
        !empty(currentBasket.defaultShipment.custom.cscOrderNotes)
    ) {
        cscOrderNotes = currentBasket.defaultShipment.custom.cscOrderNotes;
    }
} catch (e) {
    Logger.warn("...Unable to read cscOrderNotes from basket default shipment: " + e.message);
}

// ... order gets created ...

try {
    if (!empty(cscOrderNotes)) {
        newOrder.custom.cscOrderNotes = cscOrderNotes;
        newOrder.addNote('CSC Order Note', cscOrderNotes);
    }
} catch (e) {
    Logger.warn("...Unable to set cscOrderNotes/addNote on order: " + e.message);
}
```
Confirms exactly what he's describing: the agent's note is written to `currentBasket.defaultShipment.custom.cscOrderNotes` (a Shipment-level custom attribute) at handoff time, then at order-creation time it's copied onto both `order.custom.cscOrderNotes` and a real BM order note.

**Likely reason it landed on the Shipment, worth raising on the call rather than assuming:** Business Manager's native basket/order edit screens expose Shipment-level custom attributes directly, editable through BM's stock UI (the "Shipping" tab in the basket edit flow) — so writing there gave the agent an input field to type a note into without building any new custom BM form. A basket-level custom attribute doesn't have that same ready-made input surface in BM's generic screens by default; using it would likely need actual custom BM form work to expose an editable field for it. That's a plausible explanation for why Shipment was chosen, not a confirmed one — the "why not the basket directly" question is exactly what needs answering on the call.

**Status:** Not resolved via chat — his question ("can we write it to basket [directly] instead of shipment?") needs to be answered on the call, not guessed at here.

**Simple answer:** Possible — likely yes, writing to the basket directly is probably technically fine. Necessary to keep the current shipment-based approach — unclear, depends on whether BM needs a ready-made input field for the agent. **Conclusion: genuinely open, this is the one to actually discuss live, not decide in advance.**

---

## 12. `agentBasketLineItemLocks.js` — refactor, `getCustomBoolean()`

**What he asked:** File is "AI generated, complicated, large." Specifically: `product.custom.attributeID` already returns true/false directly, so why wrap it in `getCustomBoolean()`?

**Current code:**
```js
function getCustomBoolean(lineItem, attributeID) {
    try {
        return !!(lineItem && lineItem.custom && lineItem.custom[attributeID]);
    } catch (e) {
        return false;
    }
}
```

**Why the try/catch is earned, not paranoia:** accessing a custom attribute whose metadata hasn't been imported yet in a given environment genuinely throws in SFCC — this exact class of bug was hit multiple times this session (it's why `doPrePlaceOrder.js` has its own nearly identical catch, logged as *"Missing ProductLineItem live selling custom attribute definition"*). Removing this wrapper and reading `.custom.attributeID` directly everywhere would reintroduce that risk across every basket calculation, site-wide — not a one-off page, every recalculation.

**Why the same wrapper shows up so many times across the file, not just once:** once that failure mode was hit for real, the fix got applied consistently to every custom-attribute read across the feature as a blanket rule, rather than patching it one call site at a time as each one happened to break in testing. That's why it looks repetitive — it's the same known fix, applied everywhere the same risk exists, instead of waiting to rediscover the identical bug in a dozen different places one at a time.

**What actually is redundant:** the explicit null-checks stacked on top of the try/catch — `lineItem && lineItem.custom &&`. The try/catch alone already handles a null `lineItem` (it'd just throw a TypeError and get caught) equally safely, so those checks add nothing but noise:
```js
// simplified, same safety:
function getCustomBoolean(lineItem, attributeID) {
    try {
        return !!lineItem.custom[attributeID];
    } catch (e) {
        return false;
    }
}
```

**Action:** Simplify by dropping the redundant null-checks across the file (there are several similar helpers with the same pattern). Keep the try/catch itself — that protection is real, evidenced by actual bugs this session, not defensive-coding-for-its-own-sake.

**Simple answer:** Possible to fully remove the wrapper — yes, technically possible, but would bring back a real crash risk. Necessary to keep some form of it — yes, proven by actual bugs hit this session. **Conclusion: trim the redundant parts, don't remove the protection itself.**

---

## 13. `calculate.js` / `applyLiveSellingAdjustments()` — can this be removed?

**What he asked:** What is this doing, and can it be removed?

**Current code** — `scripts/hooks/cart/calculate.js`:
```js
function applyLiveSellingAdjustments(basket) {
    var adjustmentsChanged = false;
    if (basket && basket.allProductLineItems) {
        collections.forEach(basket.allProductLineItems, function (lineItem) {
            try {
                if (liveSellingPriceAdjustmentHelper.syncLiveSellingPriceAdjustment(lineItem)) {
                    adjustmentsChanged = true;
                }
            } catch (e) {
                dwLogger.error('...', lineItem && lineItem.UUID, e);
            }
        });
    }
    if (adjustmentsChanged) {
        HookMgr.callHook('dw.order.calculateTax', 'calculateTax', basket);
        basket.updateTotals();
    }
    return adjustmentsChanged;
}

exports.calculate = function (basket, original, payByLinkScenario) {
    var result = base.calculate(basket, original, payByLinkScenario);
    try {
        applyLiveSellingAdjustments(basket);
    } catch (e) {
        dwLogger.error('...', basket && basket.UUID, e);
    }
    return result;
};
```
Registered in `hooks.json` against `dw.order.calculate` — a native extension point that fires on *every* basket recalculation site-wide: cart loads, checkout step navigation, quantity changes, coupon application, shipping method changes.

**Why it exists — root cause, found and confirmed earlier this session:** Global-e's own integration (`int_globale_sfra`) has its own `dw.order.calculate` hook that unconditionally resets every line item's base price back to the catalog default on every single recalculation. That's existing platform/integration behavior, not something this feature added. The first version of this feature tried the obvious simpler approach — set the discounted price once, when the agent hands off the item, via `ProductLineItem.setPriceValue()` — and it provably failed in testing, because Global-e's reset wins that race almost immediately after.

**Why a `PriceAdjustment` survives that reset when `setPriceValue()` doesn't:** Global-e's hook only touches the *base* price — the raw catalog price a line item starts from. It never touches adjustments layered on top of that base price. A `PriceAdjustment` is conceptually the same mechanism a coupon discount uses: it sits on top of whatever the base price currently is, rather than being the base price itself, so it's untouched by a reset that only rewrites the base. That's why this moved to a `dw.order.PriceAdjustment`, re-synced on every pass via this same hook — the adjustment recomputes itself relative to whatever the base price currently is, so it self-corrects on every single recalculation regardless of what Global-e just reset it to.

**Alternatives considered:**
- **A native SFCC Promotion instead of a custom hook.** Would be genuinely more "native" — promotions re-apply automatically as part of `dw.order.calculate`'s own base behavior, no custom hook needed at all. Doesn't work here: native promotion qualifiers don't support "if this custom attribute is true" conditions out of the box. Would need a custom promotion-qualifier extension — arguably more custom code, not less.
- **Call the sync function from specific controllers instead of the global hook** (e.g. only `Cart-Show`/`Checkout-Begin`, similar to what's being proposed for expiration in #4). Worth discussing seriously. The risk: quantity updates, coupon application, and shipping method selection each hit *different* routes than a plain page load — missing any one of them silently brings back "price resets to full catalog price," which is the original bug this was built to fix. A single global hook guarantees correctness regardless of which action triggers the recalculation; narrowing it trades that guarantee for a smaller footprint.

**Action:** Not removable as-is — doing so reintroduces the original, already-debugged bug. Narrowing scope to specific controllers instead of the global hook is a legitimate discussion point, not obviously wrong, but it's a real tradeoff (footprint vs. guaranteed correctness) that should be a deliberate decision, not an assumption.

**Simple answer:** Possible to remove entirely — no, not without bringing back the original "price resets to full catalog price" bug. Possible to narrow its scope — yes, but with a real tradeoff. Necessary — yes, some form of this must exist as long as Global-e's reset behavior exists. **Conclusion: keep it; only the scope (global vs. specific controllers) is worth debating.**

---

## Overall scope — the one big open question

Mike's closing message describes the minimal feature set as he sees it: Customer Service Center, badges (PLP/PDP), a template to hide prices, search exclusion, a clear-cart button with expiration, and basket/line-level attributes.

**The entire special live-selling pricing mechanism is not on that list** — `liveSellingPriceHelper.js`, `liveSellingPriceAdjustmentHelper.js`, the `calculate.js` hook (#13), `decorators/price.js`, and the `productLineItem.js` override (#9). This is the single most complex part of the feature and where the majority of this session's actual debugging effort went (payment-breaking Adyen bug, checkout-breaking order-mutation bug, quantity-2+ math bug, the Global-e reset race described in #13 — all specifically about making this pricing mechanism work correctly).

Two genuinely different possibilities, worth putting to him directly:
1. He considers it implicitly covered under "basket-level and line-level attributes" + "minimal custom logic," and still wants some leaner version of price override to exist.
2. He's suggesting the special live-selling price isn't a custom storefront feature at all — that agents apply the special price some other way entirely (e.g., manually adjusting the order total in BM) — and this whole mechanism (5 files, the hardest bugs of the whole project) should be cut.

Get a definitive answer on this before doing anything else from the review — it's the one decision that changes the scope of everything else by an order of magnitude.
