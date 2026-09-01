# Live Selling / CSC - PR Review, Question by Question

This covers the 13 points raised in the PR review: how the code worked before, what the reviewer suggested, what we changed, and why.

---

## 1. The item number badge

**Before:** The item number and live-selling text appeared in two separate badges. They were added at different times and were never combined.

```html
<span class="badge-product live-selling-badge">Item: QFB18D7W0B028</span>
<span class="live-selling-badge-text">LIVE SELLING EXCLUSIVE</span>
```

**Reviewer said:** Show both values in one badge.

**What we did:** Combined the live-selling text and item number.

```html
<span class="badge-product live-selling-badge">LIVE SELLING EXCLUSIVE QFB18D7W0B028</span>
```

**Why:** Two badges were not needed and the combined version is cleaner.

**Issue found during the change:** The new badge overlapped the product title on the PLP. It was still using positioning intended for a badge displayed over the product image. We updated the styling so it stays in the normal product-information area.

---

## 2. Host name

**Before:** The host name was stored as a Site Preference and applied to the whole live-selling event.

**Reviewer said:** The host appeared to be something the agent should select while building the order.

**What we did:** No change yet. We need confirmation on how the host should work.

**Why:** If every event has one host, the Site Preference is enough. If the host can change by order or line item, we need to add a field to the CSC order flow. We should confirm the requirement before changing the data model.

---

## 3. Showing that an order came from live selling

**Before:** The live-selling flag was saved on the order, but it was not visible on the main Business Manager order screens.

**Reviewer said:** Display it on the order list and other order screens.

**What we did:** Added it through Business Manager configuration.

**Why:** The value was already stored correctly. This was a display configuration change, so no code update was needed.

---

## 4. Checking whether a handed-off item expired

**Before:** The cart page called the server every 30 seconds to check for expired CSC items.

```js
setInterval(function () {
    $.ajax({ url: checkExpiredUrl, ... });
}, 30000);
```

**Reviewer said:** Remove the polling and check expiration when the customer loads the cart or checkout page.

**What we did:** Removed the timer and added the expiration check to the normal cart and checkout page-load flow.

**Why:** The cart already checked expiration when it loaded, so the polling duplicated existing behavior and created unnecessary server requests. An item that expires while the customer stays on the page will now be removed after their next action or navigation.

---

## 5. The expired-item cleanup was too long

**Before:** The function used around 35 lines to find and remove expired items. Each item also had separate error handling.

**Reviewer said:** The function should be much shorter.

**What we did:** Reduced it to one filter, one map, and one removal transaction.

```js
function removeExpiredCSCLineItems(basket) {
    if (!basket || !basket.allProductLineItems) {
        return [];
    }

    try {
        var now = new Date().getTime();
        var expirationMs = getExpirationMs();
        var expiredItems = basket.allProductLineItems.toArray().filter(function (lineItem) {
            return isCSCHandoffLineItem(lineItem) && lineItem.creationDate && (now - lineItem.creationDate.getTime()) >= expirationMs;
        });
        var removedUUIDs = expiredItems.map(function (lineItem) { return lineItem.UUID; });

        Transaction.wrap(function () {
            expiredItems.forEach(function (lineItem) { basket.removeProductLineItem(lineItem); });
        });

        return removedUUIDs;
    } catch (e) {
        return [];
    }
}
```

**Why it is not exactly five lines:** We kept one error handler around the operation. If an unexpected SFCC object or metadata issue occurs, the cart page should continue loading instead of failing completely.

---

## 6. "I don't think this code ever runs"

**Before/Now:** After a CSC handoff, a customer can still add another product through the storefront. The correction code makes sure that new product is treated as a storefront item instead of being locked as an agent-added item.

**Reviewer said:** He did not think this path was being used.

**What we did:** Checked the mixed-cart flow and kept the code.

**Why:** Mixed carts are supported. There was also an earlier bug where a customer-added item was incorrectly locked after an agent handoff. If mixed carts are removed from the requirements, this correction can be removed with them.

---

## 7. Remove All button

**Before:** The endpoint removed products, coupons, and price adjustments one at a time, then recalculated the basket.

```js
Transaction.wrap(function () {
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
```

**Reviewer said:** Use the SFCC method that deletes the basket.

**What we tried:** Replaced the manual cleanup with:

```js
BasketMgr.deleteBasket(currentBasket);
```

**What happened:** CSC handoff baskets returned a permission error when the customer clicked Remove All.

**Why it failed:** The basket was originally created or modified through the CSC flow. Deleting the entire basket has stricter ownership rules than removing its contents from the customer session.

**What we did:** Restored the item-by-item cleanup because it works for both regular and CSC baskets.

---

## 8. Why change the shared badge decorator?

**Before/Now:** The project already had a shared badge system for labels such as Sale and New. We extended it so the live-selling badge can be resolved automatically for products in the live-selling category.

**Reviewer said:** Asked why a shared file used by other features needed to change.

**What we did:** No further change yet.

**Why:** If the catalog team can assign the badge manually, the automatic category handling can be removed from the shared decorator. We need confirmation from the people managing the catalog before deciding.

---

## 9. Showing the discounted unit price

**Before/Now:** The live-selling adjustment made the line total correct, but the unit price displayed beside the item still came from the product's regular price model.

**Reviewer said:** Use an `isif` condition if the price only needs to be hidden.

**What we did:** Kept the unit-price override.

**Why:** An `isif` can show or hide a value, but it cannot replace the regular unit price with the adjusted one. Without the override, the displayed unit price and line total do not match. We should still confirm whether showing the adjusted unit price is required by the business.

---

## 10. Search can show the wrong result count

**Before/Now:** SFCC runs the search first, and our code removes live-selling products from the returned list afterward. If the only matching product is removed, the result count and visible products can disagree.

**Reviewer said:** Exclude live-selling products from the search index instead of filtering them afterward.

**What we did:** Agreed with the approach, but did not implement it yet.

**Why:** Search exclusion needs to be handled through catalog data or an indexing process. We first need to confirm how this project imports products and rebuilds its search indexes.

---

## 11. Where the CSC order note was saved

**Before:** The agent entered the note in a shipment custom attribute. During order creation, the value was copied to the order and added as an order note.

**Reviewer said:** Asked why the note was stored temporarily and then copied instead of being written directly to its final location.

**What we did:** Removed the CSC order-note feature based on the decision from the review call.

**Why:** The feature was no longer required, so the metadata and copy logic were removed instead of being refactored.

---

## 12. The basket-lock helper was too complicated

**Before:** The helper checked the object and custom container before reading a boolean attribute, while also wrapping the access in `try/catch`.

```js
function getCustomBoolean(lineItem, attributeID) {
    try {
        return !!(lineItem && lineItem.custom && lineItem.custom[attributeID]);
    } catch (e) {
        return false;
    }
}
```

**Reviewer said:** Asked why a boolean custom attribute needed this much handling.

**What we did:** Removed the repeated null checks and kept the error handling.

```js
function getCustomBoolean(lineItem, attributeID) {
    try {
        return !!lineItem.custom[attributeID];
    } catch (e) {
        return false;
    }
}
```

**Why:** Reading an attribute can throw when its metadata has not been imported into an environment. The `try/catch` protects the cart from that configuration problem. The additional null checks were unnecessary because the same failure is already handled by the catch block.

---

## 13. Can the pricing calculation hook be removed?

**Before/Now:** The live-selling adjustment is checked after every basket calculation, including quantity, coupon, shipping, cart, and checkout updates.

**Reviewer said:** Asked what the hook does and whether it can be removed.

**What we did:** Kept it.

**Why:** The existing Global-e calculation resets line-item base prices. We first tried setting the special price once, but it was lost during the next basket calculation. Running the adjustment after the base calculation keeps the live-selling price in place.

We can still review whether the hook needs to run for every calculation path, but removing it completely would bring back the price-reset issue.

---

## Summary table

| # | Topic | Outcome |
|---|---|---|
| 1 | Badge and item number | Combined and layout issue fixed |
| 2 | Host name per order | Waiting for clarification |
| 3 | Live-selling flag in BM | Completed through Business Manager configuration |
| 4 | Expiration polling | Removed and replaced with page-load checks |
| 5 | Expiration function | Simplified with one error handler |
| 6 | Storefront item correction | Kept for mixed carts |
| 7 | Remove All button | Native basket deletion failed, so manual cleanup was restored |
| 8 | Shared badge decorator | Waiting for catalog-team confirmation |
| 9 | Discounted unit price | Kept; business requirement still needs confirmation |
| 10 | Search filtering | Index-based solution not implemented yet |
| 11 | CSC order notes | Removed |
| 12 | Basket-lock helper | Simplified while keeping metadata protection |
| 13 | Pricing calculation hook | Kept because Global-e resets the base price |
