# How item_list_id and item_list_name Get Populated

These two fields tell GA4 where the user was when they added a product to their wishlist — for example, "they wishlisted this from the PLP" or "they wishlisted this from the homepage".

---

## Where the value comes from

There are two sources. The second one only kicks in if the first one is empty.

---

### Source 1 — Server-side (Tile.js)

When a product tile is rendered on the **homepage**, the server builds the GTM data for that tile and sets:

```
item_list_id  = "homepage-{section}"   e.g. "homepage-featured"
item_list_name = "Homepage-{section}"  e.g. "Homepage-Featured"
```

The `section` value comes from the homepage component that renders the tile (e.g. "Featured", "New Arrivals"). This gets baked into the wishlist button's `data-gtmdata` attribute in the HTML.

If the tile is **not** on the homepage (e.g. PLP, PDP), the server sets these to empty strings.

**Known issue:** If the section parameter comes through as the literal string "null", the result is "Homepage-null". This happens when the homepage template passes the section without checking if it's actually set.

---

### Source 2 — Client-side fallback (helpers.js / openToast)

When the user clicks the wishlist button, the `openToast` function runs in the browser. It checks:

1. Is `item_list_id` already set (from Source 1)?
   - **Yes** → keep it as is, do nothing
   - **No / empty** → figure it out from the page the user is currently on

To figure out the current page, it reads two values from `sessionStorage`:
- `currentPageType` — the page the user is on right now (e.g. "Home Page", "PLP Page", "PDP Page")
- `previousPageType` — the page they were on before (e.g. "PLP Page")

These are written to sessionStorage on every page load by `gtmScript.isml`.

**Special case for PDP:**
If the user is on a PDP and wishlists from there, `currentPageType` would be "PDP Page" which is not a useful list name. So instead it uses `previousPageType` — meaning "the page they came from to get to this PDP".

Example: User browses Men's PLP → clicks into a PDP → wishlists it → `item_list_name` = "PLP Page" (where they discovered the product).

The final value is then formatted:
```
item_list_id   = "plp_page"   (lowercase, spaces replaced with underscores)
item_list_name = "PLP Page"   (as-is from sessionStorage)
```

---

## Summary

| Scenario | item_list_name | Where it came from |
|---|---|---|
| Wishlist from homepage tile (section set) | "Homepage-Featured" | Tile.js server-side |
| Wishlist from homepage tile (section missing) | "Home Page" | sessionStorage fallback |
| Wishlist from PLP | "PLP Page" | sessionStorage fallback |
| Wishlist from PDP (came from PLP) | "PLP Page" | sessionStorage previousPageType |
| Wishlist from PDP (direct URL, no previous page) | "" (empty) | No data available |
