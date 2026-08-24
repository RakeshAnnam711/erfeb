# Live Selling Special Pricing — What We Built

Plain-English breakdown of each piece we built or fixed, and the files behind each one.

---

## 1. Looking up the special price

**What it does:** given a product, checks our separate "live selling" price list and
returns the special price — but only if we actually bothered to set one for that
product. If we didn't, it just says "nothing here, use the normal price" instead of
guessing or grabbing some other price by mistake.

**Files:**
- `autobahn_client_core/cartridge/scripts/helpers/liveSellingPriceHelper.js`

---

## 2. Applying the discount to the customer's basket

**What it does:** this is the core piece. For a given product in someone's basket, it
decides: should this get the special price right now? It only ever says yes if the
agent explicitly checked the "Is Live Selling Line Item" box — never a guess. If yes,
it applies a discount so the final price the customer pays matches our special price
exactly, no matter what the item's price happens to be at that moment. If the agent
unchecks the box, or we never set a special price for that product, it removes the
discount automatically.

**Files:**
- `autobahn_client_core/cartridge/scripts/helpers/liveSellingPriceAdjustmentHelper.js`

---

## 3. Making the discount actually stick

**What it does:** our website's international pricing system resets every product's
price back to normal, constantly, in the background — cart loads, checkout steps,
coupons, all of it. Setting the price once wasn't enough; something else kept quietly
undoing it. This plugs our discount logic directly into that same background process,
so it re-applies the discount every single time that process runs, anywhere on the
site — not just on the couple of pages we remembered to check.

**Files:**
- `autobahn_client_core/cartridge/scripts/hooks/cart/calculate.js`
- `autobahn_client_core/hooks.json` (registers the above)

---

## 4. Fixing the price shown on screen

**What it does:** turned out the number actually printed on the page and the number
the customer gets charged came from two completely separate, disconnected pieces of
code. Fixing the charge amount (above) did nothing to the price shown on screen — this
piece specifically fixes what's displayed, so the two finally match.

**Files:**
- `autobahn_client_core/cartridge/models/product/decorators/price.js`
- `autobahn_client_core/cartridge/models/productLineItem/productLineItem.js`

---

## 5. Fixing the checkout "Subtotal" line

**What it does:** the Subtotal line at checkout was still showing the full,
non-discounted price even after everything else was fixed. It turned out that one
specific number comes from a completely custom calculation someone wrote separately
from the rest of the checkout math. Fixed that calculation specifically.

**Files:**
- `autobahn_client_core/cartridge/scripts/cart/cartSummaryBuilder.js`

---

## 6. Fixing a payment-breaking crash

**What it does:** this was the scary one. Our discount confused a piece of payment
processing code that only knew how to handle "official" store-wide discounts, and it
crashed instead of processing the payment — customers just saw a generic "your
payment is invalid" error with no real explanation. This same landmine was already
sitting there for other custom discounts on the site (like the subscription discount),
we just happened to be the ones who triggered it. Fixed by making that code handle a
manual discount gracefully instead of crashing.

**Files:**
- `autobahn_client_core/cartridge/adyen/utils/lineItemHelper.js`

---

## 7. A last-check safety net before the order is placed

**What it does:** just in case the discount somehow never got applied earlier in the
flow, this does one final check right before the order is placed. Important detail:
it only *looks*, it never *changes* anything at this point — an earlier version tried
to fix the price here too, but by that point the customer's card had already been
charged, and changing the total after the money already moved is exactly the kind of
thing that gets a payment flagged as fraud. Now it just logs a warning for us to
investigate if something looks wrong, without touching the order.

**Files:**
- `rvw_som_integration/cartridge/scripts/checkout/doPrePlaceOrder.js`

---

## 8. Automated tests

**What it does:** a full set of automated checks covering all of the above — including
one that specifically checks buying 2 or 3 of the same item, since that's exactly the
scenario that hid a real bug from us during manual testing (every test we ran by hand
happened to involve buying just 1). If anyone changes this logic later, these tests
will catch it immediately instead of us finding out from a customer complaint.

**Files:**
- `autobahn_client_core/test/unit/**` (this cartridge had no automated tests at all before this work)

---

## 9. Cleanup — things we built then removed

- A temporary diagnostic page we used to figure out what was going wrong — removed
  once everything was confirmed working.
- An early attempted fix for the Subtotal line that turned out to be the wrong file
  entirely (dead code, never actually did anything) — removed once we found the real
  cause (item 5 above).

---

## 10. What's still left, outside of the code

- Setting up the actual rule in Business Manager that ties a specific shipping method
  to "this basket has a live selling item in it." The code needed to support that has
  been ready for a while — this last piece is BM configuration, not code.
- Business Manager's own basket screen will always show the *normal* price in its
  "Price" column — that's expected, not a bug, since that screen isn't something we
  control. Its "Total" column does correctly show the discounted amount once the
  basket has refreshed.
