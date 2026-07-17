# Live Checkout Flow - Sprint Planning Document

Date prepared: July 10, 2026

## Purpose

This document is for sprint planning and stakeholder discussion for the Live Checkout / Live Shopping ticket set. It summarizes the requirements from the Live Checkout Flow PDF and Jira screenshots, maps the stories into implementation phases, and calls out dependencies, risks, and open decisions.

The main goal is to deliver a controlled live-shopping purchase flow where live items can be discovered, added to cart through the live process, locked in cart, clearly identified as live/final sale, carried through checkout, and tagged on the order for fulfillment, operations, and commission reporting.

## Current Context

We previously explored the SFCC CSC/handoff cart behavior where Customer Service / Live Selling team can control the customer basket. The relevant learning for this ticket is:

- Live/CSC-added items need a durable line-item marker.
- Live/CSC-added items should be locked from customer removal.
- Standard storefront-added items should remain editable unless explicitly live-tagged.
- Promo/coupon behavior, cart actions, and checkout display must be controlled by live item presence.
- Order and product line item metadata are important for downstream fulfillment/reporting.

The earlier technical risk was around relying on SFCC basket system fields such as agent/channel metadata. For this sprint, we should prefer explicit custom metadata on product, basket line item, and order where possible.

## Source Artifacts Reviewed

- `TD-Live Checkout Flow-090726-033810.pdf`
- Ticket screenshots from `WhatsApp Unknown 2026-07-10 at 12.08.24 PM.zip`

## Jira / Requirement Inventory

### Item Setup & Display

| Req | Jira | Title | Priority Seen | Notes |
| --- | --- | --- | --- | --- |
| 1.0 | TBD | Live Shopping category/page in navigation | Must Have | From PDF; no screenshot seen. |
| 1.1 | WIP-792 | Display product images on live item tiles | High | Existing PDP/catalog images should feed live tiles and PDP. |
| 1.2 | TBD | Display live-exclusive label | Must Have | From PDF; live badge on tile, PDP, cart. |
| 1.3 | WIP-793 | Hide price until live item is dropped on air | High | Depends on live price book setup and online-from timing. |
| 1.4 | WIP-794 | Display original price with live price hidden pre-drop | Medium | Depends on Req 1.3. |
| 1.5 | WIP-795 | Auto-number live products per show with badges | High | Depends on show management and live customer/session identification. |
| 2.9 | WIP-796 | Showcase live discount percentage/amount on PDP | Low | Depends on price reveal and price calculation. |

### Cart & Checkout Behavior

| Req | Jira | Title | Priority Seen | Notes |
| --- | --- | --- | --- | --- |
| 1.7 | WIP-797 | Generate and send SMS add-to-cart links for live items | High | Depends on SMS platform and item numbering. |
| 1.8 | WIP-798 | Display "LIVE" tag identifier on cart line items | High | Must persist through cart and checkout, desktop and mobile. |
| 1.9 | WIP-799 | Implement cart expiration timer for live items | High | High technical risk; depends on inventory reservation and scheduler behavior. |
| 2.4 | TBD | Remove standard Add to Cart for live-sale products | Must Have | From PDF; only live-specific mechanism should add live item to cart. |
| 2.5 | WIP-800 | Disable remove button for locked-in live bundle/items | High | Closely related to prior CSC/handoff locking work. |

### Policy

| Req | Jira | Title | Priority Seen | Notes |
| --- | --- | --- | --- | --- |
| 2.0 | WIP-801 | Display final sale messaging for all live items | High | PDP, cart, checkout, and order confirmation/email/text. |
| 2.1 | WIP-791 | Exclude live items from self-service returns portal | High | Depends on returns portal integration and SKU/live tagging. |
| 2.2 | WIP-802 | Add Live Selling Terms & Conditions with checkout acknowledgement | Medium | Requires order metadata storage and T&C content/page. |

### Fulfillment & Operations

| Req | Jira | Title | Priority Seen | Notes |
| --- | --- | --- | --- | --- |
| 2.3 | WIP-803 | Auto-capture show metadata on live orders | Medium | Order should store show name/date/host; visible/searchable in OMS. |
| 2.6 | WIP-804 | Track host commission per live show | High | Depends on show/host metadata and reporting infrastructure. |
| 2.7 | WIP-805 | Auto-apply free 2-day shipping for live orders | High | Depends on shipping rules and live-item cart detection. |

## Recommended Delivery Strategy

I recommend planning this as multiple slices rather than one large sprint. The work has different risk profiles:

- Low/medium risk UI display work.
- Medium risk metadata and checkout/order persistence.
- High risk cart lock, add-to-cart link, expiration, shipping, and reporting work.

The safest path is to first create a stable live-item data model and detection layer, then build UI/cart/checkout behavior on top of it, then add operational/reporting capabilities.

## Sprint 0 - Discovery / Technical Design

Recommended length: 2-3 days, before implementation sprint starts.

### Goals

- Confirm source of truth for "live item".
- Confirm source of truth for "live show", "host", and "item number".
- Confirm how SMS links will be generated and sent.
- Confirm whether live items are controlled through CSC, Bambuser, SMS, custom route, or another live-selling platform.
- Confirm inventory hold/expiration approach.
- Confirm whether live order means one live item, mixed cart with live + standard items, or full order classification.

### Deliverables

- Technical design notes.
- Custom attribute list.
- Data flow diagram for live item -> cart -> checkout -> order.
- Decision log for open questions.
- Final MVP/non-MVP agreement.

### Key Questions To Ask In Call

- What system creates a live show and host record?
- How does a product become live-eligible?
- Is item numbering manual or generated per show?
- What creates the SMS link?
- Does clicking SMS link require login before add-to-cart?
- Can a customer have both live and standard items in the same cart?
- Should promo code entry be disabled for any cart containing live items?
- What is the cart expiration duration?
- Who can override/remove live items: CSC only, LS team only, or both?
- Which shipping method ID represents free 2-day shipping in SFCC?
- Which returns portal/integration must consume the live-item flag?

## Sprint 1 - Live Item Foundation & PDP/PLP Display

### Scope

Build the base live item identification and display layer.

### Candidate Stories

- Req 1.0 - Live shopping category/page/navigation.
- WIP-792 / Req 1.1 - Product images on live item tiles.
- Req 1.2 - Live exclusive label/badge.
- WIP-793 / Req 1.3 - Hide live price until drop.
- WIP-794 / Req 1.4 - Show original price while live price is hidden.
- WIP-795 / Req 1.5 - Live item numbering/badge.
- Req 2.4 - Suppress standard Add to Cart for live-sale products.

### Technical Work

- Add/confirm product custom attributes:
  - live eligible flag.
  - live show ID.
  - live host ID if available at product/show level.
  - live item number.
  - live active/drop state, or derive from price book timing.
- Create live category/page filtering.
- Update tile/PDP templates:
  - live badge.
  - item number.
  - image fallback.
  - price hidden/revealed behavior.
  - original price display.
  - suppress standard add-to-cart for live-only items.
- Add mobile + desktop QA coverage.

### Acceptance Summary

- Live items appear only in intended live surfaces.
- Images render from existing catalog records.
- Live badge and item number show on tile/PDP.
- Live price is hidden before the drop and visible after activation.
- Standard add-to-cart is suppressed for live-only items.

### Risks

- Price-book timing may not align exactly with live show timing.
- Item numbering needs a reliable show-management source.
- Product visibility rules need clear definition for non-live customers.

## Sprint 2 - Live Cart & Checkout MVP

### Scope

Deliver the customer-facing live cart/checkout behavior.

### Candidate Stories

- WIP-797 / Req 1.7 - SMS add-to-cart links.
- WIP-798 / Req 1.8 - LIVE tag on cart line items.
- WIP-800 / Req 2.5 - Disable/hide remove for locked live items.
- WIP-801 / Req 2.0 - Final sale messaging on PDP/cart/checkout.
- WIP-802 / Req 2.2 - T&C acknowledgement in checkout.

### Technical Work

- Create or finalize add-to-cart endpoint/link format:
  - supports single item.
  - supports bundle.
  - carries show ID/host ID/item number metadata.
- Add line-item custom attributes:
  - isLiveShoppingLineItem.
  - liveShowID.
  - liveHostID.
  - liveItemNumber.
  - liveAddedAt timestamp.
  - liveLocked flag if separate from live flag.
- Update cart and mini-cart:
  - display LIVE tag.
  - display final sale message.
  - hide/remove disable remove action for live locked items.
  - prevent remove/update server-side, not only template-side.
- Update checkout:
  - persist LIVE tag/message.
  - show T&C checkbox only when live items are present.
  - block place order until T&C is checked.
  - write T&C acceptance timestamp to order.
- Add order metadata:
  - isLiveShoppingOrder.
  - liveTermsAccepted.
  - liveTermsAcceptedAt.

### Acceptance Summary

- SMS/cart link adds correct live item or bundle.
- Cart line item shows LIVE tag on desktop/mobile.
- Customer cannot remove live locked items.
- LS/CSC team can still manage the cart through SFCC.
- Final sale messaging appears on PDP/cart/checkout.
- Checkout requires T&C acknowledgement for live carts.
- Order records T&C acceptance.

### Risks

- Add-to-cart link security and replay behavior must be defined.
- Live item removal must be blocked server-side or customers can bypass UI.
- Prior CSC/handoff behavior showed that relying on SFCC internal basket flags can be fragile; use explicit line-item attributes.

## Sprint 3 - Expiration, Shipping, and Order Operations

### Scope

Deliver operational controls after the basic cart/checkout flow is stable.

### Candidate Stories

- WIP-799 / Req 1.9 - Cart expiration timer.
- WIP-803 / Req 2.3 - Auto-capture show metadata on live orders.
- WIP-805 / Req 2.7 - Auto-apply free 2-day shipping.
- WIP-791 / Req 2.1 - Exclude live items from returns portal.

### Technical Work

- Expiration:
  - store liveAddedAt / liveReservedUntil on line item or custom object.
  - create configurable hold duration.
  - add warning display if feasible.
  - create scheduled job or request-time validation to release expired items.
  - recalculate basket after release.
- Shipping:
  - detect cart/order with live items.
  - default free 2-day shipping method.
  - prevent manual promo dependency.
  - define behavior for mixed carts.
- Order operations:
  - write show name/date/host to order and order line items.
  - ensure metadata visible/searchable in BM/OMS.
- Returns:
  - expose live order/line item flag to returns integration.
  - block self-service return flow for live-tagged SKUs/items.
  - show explanatory message.

### Acceptance Summary

- Live holds expire after configured duration.
- Released items become available for other customers.
- Live carts default to free 2-day shipping at $0.
- Live order metadata appears in Order Management.
- Live items are excluded from self-service returns.

### Risks

- Expiration is likely the highest-risk feature because inventory reservation behavior must be verified in SFCC and any external systems.
- Shipping method override can conflict with existing promotions/shipping rules.
- Returns portal may need integration work outside SFCC templates.

## Sprint 4 - Reporting & Commission

### Scope

Deliver reporting/export needs once live show metadata is reliably captured.

### Candidate Stories

- WIP-804 / Req 2.6 - Track host commission per live show.
- WIP-796 / Req 2.9 - Discount percentage/amount display can also be completed here if not pulled into Sprint 1.

### Technical Work

- Confirm commission rules:
  - gross vs net.
  - discounts.
  - cancellations.
  - returns.
  - multiple hosts per show.
- Add/report fields:
  - show ID/name.
  - host ID/name.
  - live item number.
  - product ID/SKU.
  - quantity.
  - net sales.
  - discount.
  - return/cancel status.
- Build reporting export or BM job/report view.
- Validate against sample show payout.

### Acceptance Summary

- Report aggregates sales by host and show.
- Report accounts for returns/cancellations.
- Data is auditable for commission payouts.

### Risks

- Commission rules may not be finalized.
- Returns/cancellation timing can change historical payout numbers.
- Reporting may require BI/export work beyond storefront code.

## Suggested MVP Definition

For first production release, recommend MVP includes:

- Live item identification and badge.
- Live category/page or live item surfacing.
- Live price hide/reveal.
- SMS/add-to-cart link or agreed live add mechanism.
- Cart LIVE tag.
- Remove disabled/hidden for live locked items.
- Final sale messaging.
- Checkout T&C acknowledgement.
- Order and line-item metadata for live order/show/host.

Recommend deferring or isolating behind a feature flag:

- Cart expiration timer.
- Commission report.
- Returns portal automation.
- Complex mixed-cart shipping behavior.
- Discount percentage display if price logic is not ready.

## Dependencies

### Business / Product

- Live show management process.
- Host ID/source.
- Live item numbering rules.
- T&C copy/page.
- Final sale copy.
- Cart expiration duration.
- Commission rules.
- Mixed cart policy.

### Technical

- Product custom attributes.
- ProductLineItem custom attributes.
- Order custom attributes.
- Price book setup and online-from/online-to timing.
- SMS integration/link generation.
- Shipping method/rule configuration.
- Returns portal integration.
- Reporting/export infrastructure.

## Proposed Custom Metadata

### Product

- isLiveShoppingProduct
- liveEligible
- liveShowID
- liveHostID
- liveItemNumber
- liveOnlyAddToCart

### ProductLineItem

- isLiveShoppingLineItem
- liveShowID
- liveHostID
- liveItemNumber
- liveAddedAt
- liveReservedUntil
- liveLocked
- liveFinalSale

### Order

- isLiveShoppingOrder
- liveShowID
- liveHostID, if single-host order
- liveTermsAccepted
- liveTermsAcceptedAt
- liveOrderNote / liveShowMetadata

If the business allows mixed live items from multiple shows/hosts in one order, show/host should primarily live on product line items, with order-level fields used only for summary flags.

## Call Talking Points

- We should not treat this as one ticket; it is a grouped program with product setup, cart/checkout behavior, policy, fulfillment, and reporting.
- The first implementation dependency is a reliable live item/show data model.
- The cart lock behavior should use explicit line-item metadata, not SFCC internal basket flags.
- Cart expiration needs special attention because it touches inventory reservation and scheduled cleanup.
- Free 2-day shipping and returns exclusion depend on reliable live-item detection at cart/order/line-item level.
- Commission reporting should come after show/host metadata is stable.
- Business needs to confirm mixed-cart behavior early.

## Open Questions

1. Is the live show data managed in SFCC, Bambuser, another platform, or manually?
2. What exact field identifies a live product?
3. Can one order contain products from multiple live shows?
4. Can one show have multiple hosts?
5. What is the required cart hold/expiration duration?
6. Should customers be warned before expiration, and how?
7. Should promo codes be disabled for live carts?
8. Should standard items in a mixed cart get free 2-day shipping too?
9. What is the exact free 2-day shipping method ID?
10. Should live item quantity be editable?
11. Can CSC/LS remove live items after they are locked for the customer?
12. What returns portal/integration needs the exclusion flag?
13. What system consumes commission reports?
14. What is the legal-approved T&C/final sale copy?

## Recommended Next Step

Use the approval call to agree on MVP scope and dependencies:

1. Confirm live item/show metadata source.
2. Confirm which tickets belong in Sprint 1 vs later.
3. Confirm mixed-cart behavior.
4. Confirm cart expiration and free shipping rules.
5. Confirm order/line-item attributes.
6. Finalize sprint backlog with story owners and estimates.

