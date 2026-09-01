CHANGELOG
=========

## 25.3.0
* Fastlane 3D Secure (3DS) support
* Improved BNPL Messaging location configurations

## 25.2.0
* PayPal App Switch Integration
* PayPal Shipping Module Integration (PayPal and Pay with Venmo flows) 
* PayPal Contact Module Implementation
* Streamlined (2-Step) Checkout Process Option
* Buy Now, Pay Later (BNPL) Configurator for PayPal, other improvements
* 3D Secure (3DS) SCA Indicators for Google Pay
* Add Venmo Button Style Configuration Options (Separate configuration from the PayPal Button)
* Introducing Site-Specific token cache
* BM Module Updated for Salesforce Modern UI Compatibility

## 25.1.0
* Fastlane Implementation: Added support for PayPal Fastlane, streamlining checkout processes.
* Google Pay Payment Method: Introduced support for Google Pay for Billing and Express Checkout, enabling faster and secure payment options.
* Payment Model Configuration by Payment Method: Added flexibility to use Authorize payment model along with the Local Payment Method.
* Business Manager Modules Alignment: Config Check feature enhancements, Transaction\Dispute modules enhancements, Button Style Configuration minor improvements. Updated Business Manager modules to align with the latest Salesforce Commerce Cloud (SFCC) Business Manager standards.
* Stability Enhancements: Made various stability improvements to enhance overall performance.
* Various functional improvements regarding the already implemented features to make the buyer experience on the checkout better. 

## 24.2.0
* SFRA base cartridge updated to 7.0.0 version.
* Migration from Billing Agreement Flow to Vault Flow
* Update Credit Card Payment Method from Hosted Fields to Card Fields
* PayPal Returning Customer Experience
* PayPal Express checkout Store Shipping methods integration (Shipping Options)
* PayPal Button Messaging
* Digital Goods flow improvements (Pay Now flow is renamed to Digital Goods flow)
* "Create new Transaction from Vault" functionality improvements
* CAPTURE.DECLINED and ORDER.CANCELLED webhooks implementation
* BM Transaction filtering
* Error messages overhaul for LPM flows
* Various minor feature improvements
* Stability improvements
* Billing Agreement is deprecated
* Giropay LPM is deprecated (implementation is removed)
* Save Order Flow is deprecated (implementation is removed)
* OCAPI cartridges are not maintained (implementation is removed)
* PayPal Static image is deprecated

## 24.1.0
* Apple Pay integration
* Add Apple Pay button style configurations in the Business Manager
* Alerts for failed transaction statuses
* PayPal Disputes module in Business Manager
* Merged cartridges for Business Manager into one
* Merged OCAPI cartridges into one
* Add make default logic for Credit Card
* Add expire/expired notification for Credit Card
* Add saving limitation logic for Credit Card
* Add VAULT.PAYMENT-TOKEN.CREATED, VAULT.PAYMENT-TOKEN.DELETED webhooks
* Add Level 2/Level 3 data for Credit Card, Apple Pay, Venmo, LPM (Local Payment Methods) and L2 data for PayPal transactions
* Add payment descriptor for Credit Card, PayPal, Venmo
* Implemented API Tracking
* Styles for Hosted fields on My Account
* Remove support of Sofort\Klarna LPM (Local Payment Methods)
* Improve PayPal shipping address validation
* Updated documentation
* Minor technical improvements

## 23.3.0
* Hosted fields on the My Account page
* Hosted fields integration on Checkout page
* Redesign of the existing PayPal Plugin Configuration in Business Manager
* LiPP account linking additional security layer
* Unlink Login with PayPal from my user account
* Verification and Vaulting on Checkout page
* Email notification regarding unlinking with the pre-existing user account
* Address retrieval for Hosted Fields on Checkout page
* Highlight CC which are going to expire or is expired
* Show notification for expired CC on the My Account page
* Hosted fields validation errors for My Account page
* Investigate the possibility of using 3DS on the My Account page
* Add Config Check pop-up
* Test connection with PayPal
* Code quality improvement: Ajax & CSRF Tokenization
* Implement idempotency requests: adding header
* EC with Paypal: unsupported shipping handling
* Improvement regarding Automatic PM adding flow
* LiPP notifications improvements
* Implement Cross-Border Pay Later Messaging
* Transactions order: Replace buttons Capture and Void with button Authorize Payment
* Hide PayPal Debit Credit button if Hosted Fields are enabled

## 23.2.0
* Add Transaction history to PayPal Transactions
* Add PayPal button to the PVP (enable/disable, apply button styles from Business Manager)
* Add LiPP button style configurations (storefront, Business Manager)
* LPM: Integration of BLIK payment method

## 23.1.0
* SFRA base cartridge updated to 6.3.0 version.
* Usage of "actions.order.create" method was removed from client JS side.
* Usage of "actions.order.capture" method was removed from client JS side.
* Digital Goods (Pay Now) flow added.
* Improvements for the PayPal Transactions in the Business Manager added.
* General small code improvements and bug fixing added.

## 22.1.0
* SFRA support up to 6.1.0

## 21.3.0
* SFRA support up to 6.0
