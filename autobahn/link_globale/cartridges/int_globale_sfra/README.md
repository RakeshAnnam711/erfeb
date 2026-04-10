[<img src="../int_globale/cartridge/static/default/images/globale/logo_2018.png?raw=true" alt="Global-e Smart Cross Border" width="180">](https://www.salesforce.com/products/commerce-cloud/partner-marketplace/partners/global-e/)

# Global-e SFRA Cartridge
This is Global-e cartridge for the Storefront based on SFRA.

Global-e has a core cartridge (`int_globale`) provided by Global-e that is never directly customized or edited. Instead, customization cartridges are layered on top of the core cartridge, e.g. `int_globale_sfra`. This change is intended to allow for easier adoption of new features and bug fixes.

# What's New
The latest version of Global-e SFRA Cartridge is based on [latest version of SFRA](https://github.com/SalesforceCommerceCloud/storefront-reference-architecture).
Please note that Global-e repository contains also Global-e SiteGenesis Pipelines / Javascript Controllers Cartridge - `int_globale_sitegenesis`. In case if you still using Pipelines or Javascript Controllers (not SFRA) you have to use `int_globale_sitegenesis` instead of `int_globale_sfra`.

# Getting Started
Please use the latest version of node js LTS (up to v11.15.0).
1. Clone this repository.
2. Run `npm install` in root folder of repository to install all of the local dependencies (node version 8.x or current LTS release recommended)
3. Create `dw.json` file in the root of the project:
```json
{
    "hostname": "your-sandbox-hostname.demandware.net",
    "username": "yourlogin",
    "password": "yourpwd",
    "code-version": "version_to_upload_to"
}
```
4. Run `npm run compile:js:sfra` command that will compile your JS, `npm run compile:scss:sfra` to compile your CSS and `npm run uploadCartridge:sfra` command that would upload `int_globale` and `int_globale_sfra` cartridges to the sandbox you specified in dw.json file.
5. Create manually `GLOBALE` Payment Processor - Merchant Tools -> Ordering -> Payment Processors -> New
6. Import metadata located in `metadata` folder:
	* `globale.system.xml` - Administration -> Site Development -> Import & Export -> Meta Data
	* `globale.custom.xml` - Administration -> Site Development -> Import & Export -> Meta Data
	* `globale.jobs.xml` - Administration -> Operations -> Import & Export -> Job Schedules
	* `globale.services.xml` - Administration -> Operations -> Import & Export -> Services
	* `globale.shippingmethods.xml` - Merchant Tools -> Ordering -> Import & Export -> Shipping Methods
	* `globale.paymentmethods.xml` - Merchant Tools -> Ordering -> Import & Export -> Payment Methods
7. Add the `int_gloable` and `int_globale_sfra` cartridges to your cartridge path (following the instructions from SFCC, e.g. `int_globale_sfra:[your_brand_cartridge]:int_globale:app_storefront_base`).
8. Configure `GLOBALE` and `GLOBALE-PRODUCT` Site Preferences according to the details provided by Global-e (such as `Global-e Client JS SDK Base URL`, `Client JS SDK Source (/SOURCE)`, `Global-e API URL`, `Cookie domain`, `Client JS Merchant ID`, `Merchant GUID`, `Merchant Country Code`... etc.)
9. Run Global-e `GlobaleSettings` Job
10. Make your customization (instructions you can find in [Global-e_SFCC_Cartridge_Integration_Guide.pdf](https://github.com/SalesforceCommerceCloud/link_globale/blob/master/documentation/Global-e_SFCC_Cartridge_Integration_Guide.pdf))
11. You should now be ready to navigate and use your site.

# NPM scripts
Use the provided NPM scripts to check the scripts for any syntax errors and upload changes to your Sandbox.

## Linting your code
`npm run lint:js` - Execute linting for all JavaScript files in the project. You should run this command before committing your code.
`npm run lint:css` - Execute linting for all CSS files (if needed) in the project.

## Uploading
`npm run uploadCartridge:sfra` - Will upload `int_globale` and `int_globale_sfra` to the Salesforce B2C Commerce Cloud Digital. Requires a valid dw.json file at the root that is configured for the sandbox to upload.
`npm run upload <filepath>` - Will upload a given file to the server. Requires a valid dw.json file.

# Testing
## Running unit tests
You can run `npm test` to execute all unit tests in the project.

# Contributing to Global-e Cartridges
If you've found any bug - please [create a new Issue](https://github.com/SalesforceCommerceCloud/link_globale/issues).
