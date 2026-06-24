# Tax Integration Documentation

## Overview

Tax calculation in this Salesforce Commerce Cloud (SFRA) project is handled by three optional third-party providers: **TaxJar**, **Avalara (AvaTax)**, and **Vertex**. All three hook into the same SFCC extension point (`dw.order.calculateTax`) and are toggled independently per site via site preferences.

**Currently active provider:** TaxJar (WGACA site). Avalara and Vertex are disabled by default.

When all three providers are disabled, SFCC's built-in `TaxMgr` rate-table calculation (from `app_storefront_base`) is the fallback.

---

## 1. TaxJar

### Cartridges

| Cartridge | Role |
|---|---|
| `link_taxjar/int_taxjar` | Core calculation logic, API service, nexus management, order sync |
| `link_taxjar/int_taxjar_sfra` | SFRA hook registration, entry point |
| `rvw_integrations_core/rvw_taxjar_integration` | Custom override for PayPal order number reuse |

### Key Files

| File | Purpose |
|---|---|
| `int_taxjar_sfra/cartridge/scripts/hooks/taxjar/taxJarCalculate.js` | Hook entry point (`dw.order.calculateTax`) |
| `int_taxjar/cartridge/scripts/taxJar.js` | Core calculation orchestration |
| `int_taxjar/cartridge/scripts/taxJarService.js` | REST API client |
| `int_taxjar/cartridge/scripts/taxJarNexus.js` | Nexus region lookup and caching |
| `int_taxjar/cartridge/scripts/taxJarCustomerUtils.js` | Customer exemption handling |
| `int_taxjar/cartridge/scripts/steps/syncOrders.js` | Batch job for AutoFile order sync |
| `rvw_taxjar_integration/cartridge/scripts/taxJar.js` | Custom override |

### How It Works

1. Hook fires on `dw.order.calculateTax`
2. Checks `TaxJarEnable` site preference — if false, falls back to SFRA default
3. For each shipment, checks if the destination has **nexus** (tax obligation in that state) via `/v2/nexus/regions` API
   - If no nexus regions are configured, tax is calculated everywhere
   - Nexus regions are cached in `TaxJarTaxNexusCache`
4. Builds a request body with:
   - Ship-from: site preferences (`TaxJarShipFromCountryCode`, `TaxJarShipFromState`, `TaxJarShipFromZip`, etc.)
   - Ship-to: basket shipping address
   - Line items: UUID, unit price, quantity, discount, product tax code
   - Customer ID and exemption type (for B2B exemptions)
5. Calls TaxJar SmartCalcs REST API (`POST /v2/taxes`)
   - Responses are SHA-256 cached in `TaxJarTaxRateCache`
6. Applies `combined_tax_rate` from `tax.breakdown.line_items` back to each `ProductLineItem` via `lineItem.updateTax(effectiveTaxRate, proratedPrice)`
7. Applies shipping tax from `breakdown.shipping` when `freight_taxable = true`
8. Price adjustments and gift certificates always receive **0% tax**
9. Falls back to SFRA's default `calculate.calculateTax` on API failure or when disabled

### Customer Exemptions

- Reads `TaxJarCustomerExemptionType` and `TaxJarCustomerExemptionRegions` from customer profile
- Only applies to US orders

### Order Sync (AutoFile)

- Batch job (`syncOrders.js`) syncs placed orders to TaxJar for automated sales tax filing
- Supports date-range or incremental sync (tracks last sync time in `TaxJarLastSyncTime`)
- Creates/updates/deletes TaxJar transaction records per shipment
- Also supports refund transactions

### Custom Override (rvw)

`rvw_taxjar_integration/taxJar.js` overrides the core `taxJar.js` to add a `createOrderNo` export that handles PayPal order number reuse scenarios, gated by the `paypalCartridgeEnabled` site preference.

### Configuration

| Site Preference | Type | Description |
|---|---|---|
| `TaxJarEnable` | Boolean | Master on/off switch |
| `TaxJarAPIToken` | String | Bearer token for API auth |
| `TaxJarShipFromCountryCode` | String | Ship-from country |
| `TaxJarShipFromState` | String | Ship-from state |
| `TaxJarShipFromZip` | String | Ship-from ZIP code |
| `TaxJarLastSyncTime` | String | Tracks last AutoFile sync |
| `TaxJarCustomerExemptionType` | String | Customer-level exemption type |
| `TaxJarCustomerExemptionRegions` | String | Regions where exemption applies |

### API

- **Base URL:** TaxJar SmartCalcs REST API v2
- **Auth:** Bearer token
- **Key endpoints:**
  - `POST /v2/taxes` — calculate tax for a transaction
  - `GET /v2/nexus/regions` — fetch nexus regions
  - `POST/PUT/DELETE /v2/transactions/orders/{id}` — order sync
  - `POST/PUT/DELETE /v2/transactions/refunds/{id}` — refund sync

---

## 2. Avalara (AvaTax)

### Cartridges

| Cartridge | Role |
|---|---|
| `link_avalara/int_avatax_sfra` | SFRA hook registration, orchestration |
| `link_avalara/int_avatax_svcclient` | REST API client and transaction models |
| `link_avalara/bm_avatax` | Business Manager UI for settings and reconciliation |

### Key Files

| File | Purpose |
|---|---|
| `int_avatax_sfra/cartridge/scripts/hooks/avatax/avataxhooks.js` | Hook entry point (`dw.order.calculateTax`, `dw.order.createOrderNo`) |
| `int_avatax_sfra/cartridge/scripts/avaTax.js` | Core calculation orchestration |
| `int_avatax_svcclient/cartridge/scripts/avaTaxClient.js` | REST API client |
| `int_avatax_svcclient/cartridge/models/createTransactionModel.js` | Request model |
| `int_avatax_svcclient/cartridge/models/commitTransactionModel.js` | Commit model |
| `int_avatax_svcclient/cartridge/models/voidTransactionModel.js` | Void model |
| `bm_avatax/cartridge/controllers/AvataxBM.js` | BM order reconciliation controller |
| `bm_avatax/cartridge/controllers/AVSettings.js` | BM settings controller |

### How It Works

1. Hook fires on `dw.order.calculateTax`
2. Checks `ATSettings.taxCalculation` JSON preference — if false or no shipping address, zeroes all taxes
3. Builds a `CreateTransactionModel` with all line items:
   - Products, product options, shipping line items, gift certificates
   - Each line gets `taxCode` from `product.taxClassID` (default: `P0000000`)
   - `amount` from `proratedPrice`
   - `taxIncluded` flag based on `taxationpolicy` preference (gross vs. net pricing)
   - Ship-from from site preferences
   - Customer code strategy configurable: `customer_number`, `customer_email`, or `custom_attribute`
4. Calls Avalara REST API v2 (`POST /api/v2/transactions/create`)
   - Session-cached via murmur-hash to avoid repeated identical calls
5. Maps response lines back to basket line items by UUID via `uuidLineNumbersMap` (SortedMap)
6. Sets `lineItem.setTax(Money)` and `lineItem.updateTax(rate, price)` for each line
7. Bonus product line items and price adjustments always receive **0% tax**
8. Stores rich tax detail in basket/order custom attributes

### Additional Hook: `dw.order.createOrderNo`

- Fires when an order number is generated
- Calls `AvaTax.calculateTax(basket, orderNo)` immediately to **record a committed invoice in AvaTax before the order is placed**
- Gated by `avataxCartridgeEnabled` site preference (handled in `rvw_integrations_core/checkoutHooks.js`)

### Transaction Modes

| Mode | Behavior |
|---|---|
| SalesOrder | Quote mode — transaction is not committed in AvaTax |
| SalesInvoice | Committed mode — transaction is recorded immediately |

Controlled by the `saveTransactions` preference within `ATSettings`.

### Address Validation

- `avaTaxClient.resolveAddressPost()` → `POST /api/v2/addresses/resolve`
- US and Canada only
- Controlled by `addressValidation` flag in `ATSettings`

### Custom Attributes Populated

| Attribute | Content |
|---|---|
| `ATTaxDetail` | Full JSON breakdown per line item |
| `ATInvoiceMessage` | Invoice-level message from AvaTax |
| `ATLandedCost` | Landed cost detail |
| `ATCustomsDuty` | Customs duty detail |
| `ATGenericMessage` | General message from AvaTax |
| `ATTax` | VAT/GST total |

### Configuration

| Site Preference | Type | Description |
|---|---|---|
| `ATSettings` | JSON | Master config object (taxCalculation, addressValidation, saveTransactions, customerCodeStrategy, etc.) |
| `avataxCartridgeEnabled` | Boolean | Gates the `createOrderNo` hook in rvw override |

### API

- **Base URL:** Avalara AvaTax REST API v2
- **Auth:** Basic auth (username:password, base64-encoded), from `avatax.rest.all` service credential
- **Key endpoints:**
  - `POST /api/v2/transactions/create` — create/calculate a transaction
  - `POST /api/v2/addresses/resolve` — validate a shipping address

---

## 3. Vertex

### Cartridges

| Cartridge | Role |
|---|---|
| `link_vertex/int_vertex` | Core SOAP logic, API, constants |
| `link_vertex/int_vertex_sfra` | SFRA hook registration, entry point, address suggestions |
| `link_vertex/bm_vertex` | Business Manager UI for settings and health checks |

### Key Files

| File | Purpose |
|---|---|
| `int_vertex_sfra/cartridge/scripts/hooks/cart/calculate.js` | Hook entry point (`dw.order.calculateTax`) |
| `int_vertex_sfra/cartridge/scripts/hooks/taxes.js` | SFCC-native TaxMgr fallback (not hooked directly) |
| `int_vertex/cartridge/scripts/vertex.js` | Orchestration layer |
| `int_vertex/cartridge/scripts/lib/libVertexApi.js` | SOAP API implementation |
| `int_vertex/cartridge/scripts/init/initVertexApi.js` | SOAP service registration |
| `int_vertex/cartridge/scripts/constants.js` | All site preference mappings |
| `bm_vertex/cartridge/controllers/VertexInc.js` | BM settings and health test controller |

### How It Works

1. Hook fires on `dw.order.calculateTax`
2. Checks `Vertex_isEnabled` site preference
3. Requires `basket.billingAddress` to exist — if missing, calls `Helper.prepareCart` (zeroes gift certificate taxes)
4. Calls `Vertex.CalculateTax('Quotation', basket)` which:
   - Checks `API.isEnabled` and session state (`VertexAddressSuggestionsError`)
   - Builds a SOAP XML envelope via `createCalculateTaxEnvelope`
   - Line items keyed as `PRODUCT??{productID}` or `SHIPPING??{shipmentID}`
5. Calls Vertex O Series via SOAP (`calculateTax70()`) at `Vertex_EndpointTax`
6. Parses response: extracts `effectiveRate` and `calculatedTax` per line item
7. Matches lines by `lineItemId` and `projectNumber` (shipment ID for multi-ship)
8. Updates basket inside `Transaction.wrap` with `updateTax()` + `updateTaxAmount()`
9. All price adjustments receive **0% tax**
10. Stores full breakdown in `cart.custom.vertex_taxation_details`

### Address Cleansing (Optional)

- `Vertex.LookupTaxAreas()` → SOAP `lookupTaxAreas70()`
- US addresses only
- Surfaces address suggestions to the user if address is not found
- Sets `session.privacy.VertexAddressSuggestionsError = 'error'` to block checkout on invalid address
- Controlled by `Vertex_isAddressCleansingEnabled`

### Operating Modes

| Mode | Preference | Behavior |
|---|---|---|
| Quotation | Default | Tax quote only, not committed |
| Invoice | `Vertex_isInvoiceEnabled` | Committed transaction recorded |
| VAT | `Vertex_isVATEnabled` | VAT/GST calculation for international |

### Configuration

| Site Preference | Type | Description |
|---|---|---|
| `Vertex_isEnabled` | Boolean | Master on/off switch |
| `Vertex_EndpointTax` | String | SOAP endpoint for CalculateTax |
| `Vertex_EndpointLookup` | String | SOAP endpoint for LookupTaxAreas |
| `Vertex_TrustedId` | String | Preferred auth method |
| `Vertex_UserName` | String | Fallback auth username |
| `Vertex_Password` | String | Fallback auth password |
| `Vertex_isVATEnabled` | Boolean | Enable VAT mode |
| `Vertex_isInvoiceEnabled` | Boolean | Enable invoice/committed mode |
| `Vertex_isAddressCleansingEnabled` | Boolean | Enable address cleansing |
| `Vertex_Company` | String | Seller company name |
| `Vertex_Address` | String | Seller street address |
| `Vertex_City` | String | Seller city |
| `Vertex_PostalCode` | String | Seller ZIP/postal code |
| `Vertex_Country` | String | Seller country |
| `Vertex_isSFRA` | Boolean | Flags SFRA vs. SiteGenesis mode |

### API

- **Protocol:** SOAP (WSDL via `webreferences2`)
- **Auth:** `TrustedId` (preferred) or Username/Password
- **Key operations:**
  - `calculateTax70(envelope)` — calculate tax for a transaction
  - `lookupTaxAreas70(envelope)` — validate/cleanse a US address

---

## Provider Comparison

| Feature | TaxJar | Avalara (AvaTax) | Vertex |
|---|---|---|---|
| Protocol | HTTPS REST (JSON) | HTTPS REST (JSON) | SOAP (XML) |
| Auth | Bearer token | Basic auth | TrustedId or User/Pass |
| Enable preference | `TaxJarEnable` | `ATSettings.taxCalculation` | `Vertex_isEnabled` |
| **Active for WGACA** | **Yes** | No | No |
| Nexus awareness | Yes — skips if no nexus | No | No |
| Address validation | No | Yes (US/CA) | Yes (US only) |
| VAT support | No | Partial (via tax codes) | Yes (`Vertex_isVATEnabled`) |
| Order filing/sync | Yes (AutoFile batch job) | Yes (invoice mode) | Via invoice mode |
| Response caching | SHA-256 per request body | Session murmur-hash | None |
| BM UI | No | `bm_avatax` | `bm_vertex` |
| Price adjustment tax | Always 0% | Always 0% | Always 0% |
| Gift certificate tax | Always 0% | Always 0% | Zeroed if no billing address |
| Multi-shipment support | Yes (per shipment) | Yes (per shipment) | Yes (via `projectNumber`) |

---

## Hook Registration Summary

| Provider | Hook | Handler |
|---|---|---|
| TaxJar | `dw.order.calculateTax` | `int_taxjar_sfra/.../taxJarCalculate.js` |
| Avalara | `dw.order.calculateTax` | `int_avatax_sfra/.../avataxhooks.js` |
| Avalara | `dw.order.createOrderNo` | `int_avatax_sfra/.../avataxhooks.js` |
| Vertex | `dw.order.calculateTax` | `int_vertex_sfra/.../calculate.js` |
| SFRA default | `dw.order.calculateTax` | `app_storefront_base/.../calculate.js` (TaxMgr) |

---

## Default Fallback (No Provider)

When all providers are disabled, SFCC's built-in `TaxMgr`-based rate-table calculation runs from:

`storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/hooks/cart/calculate.js`

This uses tax rates configured directly in the Business Manager tax table (`TaxMgr.getTaxRate(taxClassId, taxJurisdictionId)`) — no external API calls.
