# Global-e Checkout Confirmation Redirect Fix

## Ticket Request

The ticket reported that some shoppers complete payment successfully through Global-e checkout but are not redirected to the order confirmation page. Instead, they may remain on checkout or see a blank page.

The issue is expected to affect a small number of shoppers and is commonly tied to redirect-sensitive environments such as:

- Safari Private Browsing
- Instagram or Facebook in-app browsers
- 3DS or other payment provider redirect flows

Global-e provided implementation instructions to improve redirect reliability by retaining the Global-e cart token across payment redirects.

## Root Cause

The Global-e payment redirect normally returns a cart token in the request query string as `token`.

Before this change, `PaymentRedirectOperation.js` only read the cart token from that query-string parameter. If the redirect came back without the token, or if browser/session behavior caused the expected state to be unavailable, the confirmation flow could not reliably resolve the Global-e checkout state.

Because the cartridge version is `23.4.0`, the Global-e instructions for cartridge version `>= 21.0.0` apply.

## What Changed

Two Global-e cartridge files were updated.

### 1. Store the Cart Token During Send Cart

File:

`autobahn/link_globale/cartridges/int_globale/cartridge/models/globale/checkout/actions/SendCartOperation.js`

Added token persistence after a cart token is available.

The cart token is now saved in:

- `session.privacy.geCartToken`
- secure cookie `GlobalE_Cart_Token`

The cookie uses:

- current request host as the domain
- `/` as the path
- the existing Global-e `geCookieLifetime` preference
- `Secure = true`

This gives the payment redirect flow a fallback source for the cart token if the redirect URL does not include `token`.

### 2. Read Fallback Token During Payment Redirect

File:

`autobahn/link_globale/cartridges/int_globale/cartridge/models/globale/checkout/actions/PaymentRedirectOperation.js`

The redirect flow still reads the query-string `token` first.

If that token is missing, it now falls back in this order:

1. `session.privacy.geCartToken`
2. `GlobalE_Cart_Token` cookie

This matches the Global-e recommended fix for SFRA/SiteGenesis cartridge versions `>= 21.0.0`.

## Expected Behavior After Fix

After successful payment, the shopper should be redirected to the order confirmation page even if the redirect URL does not include the cart token, as long as the token is recoverable from session privacy or the fallback cookie.

## QA Steps

1. Use a country configured as `isOperatedByGlobalE = true` in the `GLOBALE_COUNTRIES` custom object.
2. Add a product to cart.
3. Proceed to Global-e checkout.
4. Complete payment using a redirect-style flow if available, such as 3DS.
5. Test in Safari Private Browsing or an in-app browser if possible.
6. Confirm that successful payment lands on the order confirmation page.
7. Confirm the shopper does not remain on checkout and does not see a blank page.

## Notes

- India will trigger Global-e checkout only if the `IN` custom object exists in `GLOBALE_COUNTRIES` and has `isOperatedByGlobalE = true`.
- This fix is separate from any issue where a shopper redirects to a PLP after checkout. This ticket is specifically about Global-e confirmation page reliability after payment redirects.
- Local syntax checks passed for both changed files. Full lint/unit test execution requires the Global-e cartridge's supported Node version, `>=18.19.0`.
