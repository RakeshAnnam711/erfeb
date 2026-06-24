# Sprint Planning Story Point Rationale

This document explains the recommended story point estimates for the tickets assigned for the sprint. The estimates use a Fibonacci-style scale and account for investigation effort, implementation complexity, QA coverage, and integration risk.

## Summary

| Ticket | Title | Recommended Story Points |
| --- | --- | ---: |
| WIP-525 | Confirm SFCC connection requirements for The Editorialist (OCAPI + SCAPI) | 3 |
| TBD | Checkout Confirmation Page Not Loading for Some Users (Global-e) | 3 |
| TBD | Incorrect Redirect to PLP After Successful Checkout | 5 |
| WIP-465 | Unexpected International URLs (CY / Non-US URLs) | 5 |

Total recommended sprint estimate: **16 story points**

## WIP-525: Confirm SFCC Connection Requirements for The Editorialist

Recommended estimate: **3 story points**

This ticket is mainly a discovery, validation, and documentation task. The work involves confirming the SFCC integration requirements for OCAPI and SCAPI access, including endpoints, authentication method, required scopes, and any differences between sandbox and production.

The estimate is **3 points** because the work is not expected to require a full feature build, but it still needs careful validation with the current Salesforce Commerce Cloud setup. The main effort will be checking access requirements, confirming API permissions, documenting findings clearly, and identifying any blockers before implementation begins.

Reasons for 3 SP:

- Requires SFCC OCAPI and SCAPI requirement validation.
- Needs confirmation of auth method, scopes, endpoints, and environment differences.
- May require coordination if credentials or access details are missing.
- Output should be documented clearly for the integration team.
- Low coding effort, but moderate investigation and dependency risk.

## Checkout Confirmation Page Not Loading for Some Users (Global-e)

Recommended estimate: **3 story points**

Estimated time: **1 to 1.5 working days**

This ticket appears to be a targeted configuration update for a known issue affecting some checkout confirmation redirects. The description mentions that Global-e has provided a one-pager with step-by-step instructions and that the expected change is limited to two configuration files.

The estimate is **3 points** because the implementation scope is small and Global-e has provided exact steps, but checkout flows need careful testing. Based on the attached PDF, this fix is about retaining the Global-e cart token across payment redirects by storing it in session/cookie and reading it back if the redirect URL loses the token. Even if the code change is limited, we need to validate the confirmation page behavior after successful payment and check the affected redirect scenarios, including browser privacy settings, social app webviews, or 3DS/payment redirects where possible.

Reasons for 3 SP:

- Partner has provided implementation instructions.
- Change appears limited to the Global-e cart token handling files in SFCC.
- Current Global-e cartridge version is 23.4.0, so the PDF's version >= 21.0.0 instructions apply.
- Expected files are `SendCartOperation.js` and `PaymentRedirectOperation.js`.
- Requires checkout regression testing after payment success.
- Needs validation that confirmation page redirect reliability improves.
- Checkout area has customer-facing risk, so QA effort is important even for a small change.

## Incorrect Redirect to PLP After Successful Checkout

Recommended estimate: **5 story points**

This is a higher priority checkout bug where the customer is redirected to the Bags PLP instead of the order confirmation page after placing an order. The payment appears to process successfully, but the user does not see the order confirmation message, order number, or purchase summary.

The estimate is **5 points** because this requires more than a configuration-only change. The work likely includes reproducing the issue, tracing the redirect after payment submission, checking checkout controller logic or integration hooks, validating order placement state, and confirming the correct post-payment destination. Since the issue is in the checkout path, it also needs careful regression testing.

Reasons for 5 SP:

- Impacts a critical checkout completion flow.
- Requires reproduction using the provided steps.
- Needs investigation across payment processing, order placement, and redirect handling.
- Fix may involve controller logic, route handling, session state, or integration behavior.
- Requires QA to confirm order confirmation page, order number display, and no regression to normal checkout.

Note: If the root cause is deep inside the payment or Global-e integration, this could increase to **8 story points**.

## WIP-465: Unexpected International URLs (CY / Non-US URLs)

Recommended estimate: **5 story points**

This ticket involves unexpected international URLs appearing in GA4 and Ahrefs reporting. A support ticket should be raised with the appropriate support team because the root cause may involve platform behavior, indexing, redirects, storefront URL mappings, canonical tags, hreflang configuration, or tracking setup. However, because this sprint expects us to help drive the fix, the work should include internal investigation, support coordination, applying the required changes if they are in our code or configuration, and validating the result.

The estimate is **5 points** because the work is not just raising the support ticket. We need to collect evidence, compare US blog URLs against CY or other non-US versions, check canonical and hreflang behavior, review redirects or URL mappings where possible, coordinate with support, implement or request the required correction, and validate that reporting and indexing behavior is moving toward the expected US URLs.

Reasons for 5 SP:

- Requires preparing a support ticket with clear evidence from GA4 and Ahrefs.
- Needs comparison of US blog URLs vs CY or other international URL versions.
- Requires checking canonical tags, hreflang tags, redirects, URL mappings, and possible tracking configuration.
- May need changes in storefront configuration, metadata, redirects, or SEO-related setup depending on support findings.
- Requires follow-up with support, implementation or coordination of the fix, and post-fix validation.
- Risk is moderate because the root cause is uncertain and may sit across multiple systems.

## Talking Points for Sprint Planning

- The two **3-point tickets** are smaller in implementation scope but still need validation, documentation, or coordination.
- The two **5-point tickets** have broader investigation, higher business risk, or cross-system dependencies.
- Checkout-related work should not be estimated only by code size because payment and confirmation flows require careful QA.
- The international URL issue should still include a support ticket, but because we are expected to drive the fix, it should remain **5 story points**.
- Recommended sprint commitment for these tickets is **16 total story points**.
