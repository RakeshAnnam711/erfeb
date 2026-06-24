**Q: Is there a reason to remove the "Replace jQuery DOM ready logic for
wishlist toggle" block? It seems outside the topic of the code push.**

A: It is in scope — it's one of the root causes of the duplicate-event bug
this push fixes. That removed block was a `MutationObserver` watching the
wishlist heart icon's `class` attribute, which fired `addToWishlist()`
directly whenever the `selected` class appeared:

```js
// Replace jQuery DOM ready logic for wishlist toggle
const observer = new MutationObserver(mutationsList => {
  if (... icon.classList.contains('selected')) {
    addToWishlist(gtmData);
  }
});
```

This was a **third, independent** trigger for the same event, on top of the
two that already exist: the AJAX `success` callback (`openToast`) and the
global `ajaxSuccess` handler (`wgacaPushAddToWishlist`). With three sources
racing to fire the same event, timing wasn't guaranteed and duplicates could
slip through. It was removed in favor of relying on the single
AJAX-success-driven flow, which has shared deduplication
(`window.wgacaLastWishlistEvent`, 10s window).

---

**Q: Does this include the fix for the filters?**

A: No. None of the files touched in this change relate to the price filter
feature.

**Q: Why "Walk all categories to find the deepest merchandise navigation path
(skip 'brand' trees)"? Seems like a lot of processing.**

A: Root cause this works around: products in this catalog belong to
*multiple* category trees simultaneously — a merchandise tree (e.g.
`Men's > Bags`) and a brand tree (e.g. `Brands > Louis Vuitton`). Reading the
product's first/primary category often returned the **brand** tree instead of
the merchandise tree, so `item_category` was coming through as `"Brands"` and
`item_category2` as the brand name — wrong, and redundant with `item_brand`,
which already captures that.

The fix iterates every category the product belongs to, builds the full path
for each, discards any path whose top-level node name contains "brand," and
keeps the longest remaining path (the deepest, most specific merchandise
category). The last two segments of that path become `item_category` /
`item_category2`.

On the processing concern: this runs **server-side, once per product**, when
the GTM data object is built for a page render or wishlist tile — not on
every click or in a hot loop. A product typically belongs to a handful of
categories (3–10) with shallow depth (2–4 levels), so the extra iteration is
negligible. It is bounded, infrequent, and server-side, not a performance
risk.
