# add_to_wishlist GTM Tracking Fixes — Rationale

This document explains *why* each change was made to the `add_to_wishlist` GTM
event pipeline. It is intended for QA and code review reference, since several
of the changes (removing existing code, adding category-walking logic) are not
self-explanatory from the diff alone.

## Issues being fixed

1. Duplicate `add_to_wishlist` events firing for logged-in users
2. `item_list_id` / `item_list_name` empty or wrong on PDP wishlist adds
3. `item_category` / `item_category2` always blank
4. `product_gender` hardcoded to `"Women"` for every product
5. Product names containing apostrophes silently breaking GTM data (JSON parse failure)
6. `currencyCode` (and a duplicate `currency`) leaking into the `items[]` object

## Architecture: how the event actually fires

For logged-in users, clicking the wishlist heart opens a modal
(`#wishlistModalShowLists`). Selecting a list triggers an AJAX call to
`Wishlist-ToggleProduct`. Two independent listeners react to that AJAX call:

- The **local `success` callback** inside `modalShowLists.js` / `toggleProduct.js`,
  which calls `openToast(data)`.
- A **global `$(document).ajaxSuccess` handler** registered in `gtmScript.isml`,
  which calls `window.wgacaPushAddToWishlist`.

jQuery always fires the local `success` callback *before* the global
`ajaxSuccess` event. That means `openToast` always wins the race and pushes
the event first; `wgacaPushAddToWishlist` then gets blocked by a shared
deduplication key (`window.wgacaLastWishlistEvent`, 10s window). This is why
fixes had to be applied to `openToast` itself, not just the AJAX-tracker path
— the AJAX-tracker path rarely if ever wins.

## Why the MutationObserver block was removed (tagManager.js)

Before this fix, there was a **third** independent event source:

```js
// Replace jQuery DOM ready logic for wishlist toggle
const observer = new MutationObserver(mutationsList => {
  if (... icon.classList.contains('selected')) {
    addToWishlist(gtmData);
  }
});
```

This watched the wishlist heart icon's `class` attribute and fired
`addToWishlist()` directly whenever `selected` appeared — completely
independent of the AJAX success handlers above. With three sources racing to
fire the same event, whichever one's data happened to be on the DOM at the
moment the class changed would "win," and timing was not guaranteed. This was
a direct contributor to the duplicate-event bug, so it was removed in favor
of the single AJAX-success-driven flow (`openToast` + `wgacaPushAddToWishlist`
with shared dedup).

It is in scope for this fix, not an unrelated cleanup — it's one of the root
causes of issue #1 above.

## Why item_list_id / item_list_name needed a PDP-specific rule

`sessionStorage.currentPageType` and `previousPageType` are updated on every
page load by `savePageType()` in `gtmScript.isml`. The original logic was:

```js
var listPage = (currentPage === 'PDP Page' && prevPage) ? prevPage : currentPage;
```

On a direct PDP visit (no prior PLP page in this session), `prevPage` is
empty, so this fell back to `currentPage` ("PDP Page") — giving
`item_list_id = "pdp_page"`, which is misleading: it doesn't represent any
real product list. The fix removes the `&& prevPage` guard:

```js
var listPage = (currentPage === 'PDP Page') ? prevPage : currentPage;
```

Now:
- PDP reached from PLP → `item_list_id = "plp_page"` (correct list context)
- PDP reached directly → `item_list_id = ""` (consistent with how `view_item` already behaves for direct PDP loads)
- PLP itself → unaffected, still `"plp_page"`

## Why item_category / item_category2 needed category-tree walking (gtmHelpers.js)

Root cause: a product in this catalog typically belongs to *multiple*
category trees at once — a merchandise tree (e.g. `Men's > Bags`) and a brand
tree (e.g. `Brands > Louis Vuitton`). Reading the product's first/primary
category often returned the **brand** tree, so `item_category` ended up as
`"Brands"` and `item_category2` as the brand name — wrong, and redundant with
`item_brand`, which already carries that information.

The fix iterates every category the product belongs to, builds the full path
for each, discards any path whose top-level node name contains "brand," and
keeps the **longest remaining path** (the deepest, most specific merchandise
category). That deepest path's last two segments become `item_category` /
`item_category2`.

This runs once per product, server-side, when the GTM data object is built
for a page render or wishlist tile (not on every click). A product typically
belongs to a handful of categories (3–10) with shallow depth (2–4 levels), so
the extra iteration is not a performance concern — it is bounded, server-side,
and infrequent.

## Why product_gender stopped being hardcoded

`obj.product_gender = 'Women';` was unconditional — every product, regardless
of actual gender, reported as Women in GTM. The fix reads the `fdxGender`
custom attribute (checking the variant first, then falling back to the
master product), and only falls back to inferring gender from the top-level
merchandise category name (Men/Women) when `fdxGender` is not set on either.
`Tile.js` got a parallel fix using the PLP's `cgid` query parameter to infer
gender from the page's category context for tile-level wishlist clicks.

## Why wishlistIcon.isml's data-gtmdata attribute encoding changed

```diff
- data-gtmdata='${pdict.gtmdata ? pdict.gtmdata : JSON.stringify(product.gtmData)}'
+ data-gtmdata="<isprint value="${...}" encoding="htmlcontent" />"
```

Product names containing an apostrophe (e.g. a possessive name) broke the
single-quoted attribute, corrupting the embedded JSON and causing a silent
`JSON.parse` failure downstream (caught by a `try/catch`, so the wishlist
event would fire with incomplete data and no visible error). Switching to a
double-quoted attribute with `encoding="htmlcontent"` HTML-encodes the JSON
value safely, so the browser decodes it back to valid JSON on read via
`getAttribute`.

## Why currencyCode was removed from items[]

`currencyCode` and `currency` both originate from the product's server-side
GTM data object and were being copied wholesale into the event's `items[]`
entry via object spread/`Object.assign`. GA4's recommended schema only wants
`currency` at the top level of the `ecommerce` object, not duplicated inside
each item. The fix captures the currency value into a local variable first,
then explicitly deletes both `currencyCode` and `currency` from the item
object before it is pushed, in every code path that fires the event
(`openToast` in both `helpers.js`/`toggleProduct.js`/`modalShowLists.js`, and
`addToWishlist` in `tagManager.js`/`main.js`).

## Scope note

None of these changes touch price filter logic. The only `filter` matches in
the modified files are JavaScript array `.filter()` calls used to clean up
breadcrumb/category name arrays — unrelated to the PLP price filter feature.
