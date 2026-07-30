# plugin_seo: Plugin SEO

This is the repository for the plugin_seo plugin. This plugin enhances the app_storefront_base cartridge by adding more SEO capabilities to the existing SFRA layer.

# Getting Started

1. Clone this repository. (The name of the top-level folder is plugin_seo.)
2. Change the values regarding the page meta tags in the `plugin_seo/cartridge/templates/resources/seo.properties` file so that those values meet your needs. Don't forget to transltate those in case you address multiple languages
3. Upload the cartridge on your instance
4. Include the plugin_seo cartridge in the cartridge path of your site, after the `app_storefront_base` cartridge (on the left of it), so that the plugin extends SFRA

# Features list

The plugin covers the following features and use cases:

## Page Meta Tags

The plugin adds the title, description and keywords meta tags to the following controller endpoints:
- Account-Show
- Account-EditProfile
- Account-EditPassword
- Account-PasswordReset
- Account-SetNewPassword
- Address-AddAddress
- Address-EditAddress
- Cart-Show
- Checkout-Login
- Checkout-Shipping details
- Checkout-Payment details
- Checkout-Review Order
- Checkout-Confirmation
- ContactUs-Landing
- Default-Start
- Error-Start
- Error-ErrorCode
- Login-Show
- Login-OAuthLogin
- Login-OAuthReentry
- Order-Confirmation
- Order-Track
- Order-History
- Order-Details
- Order-Filtered
- PaymentInstruments-List
- PaymentInstruments-AddPayment
- Stores-Find

### Ways to manage the Page Meta Tags

#### By using content assets

When loading any page previously listed, the plugin tries to get the page title, description, keywords and page meta tags from a content asset by following this naming convention: `{controllerName in lowercase where the dash is replaced by a dot}.seo`.
For example, when hitting the Account-Show controller, the content asset name has to be `account.show.seo`.
These content assets don't have to be online, as those are mainly used for SEO purpose, they won't appear on the storefront.

If no content asset is found, then the resources are used.

#### By using resources

When no content asset is found for the given controller endpoint, the plugin loads the page title, description and keywords from the resources. The plugin is shipped with default values from the `seo.properties` file. Feel free to override these values and translate them in the languages of your site.

## Href langs

The plugin generates the href-langs meta tags for the available locales of the current site, on each and every page (including Page Designer pages).

## Open Graph tags

The plugin generates the Open Graph tags on each and every page (including Page Designer pages) of the site, by following the official [Open Graph Protocol](https://ogp.me/).

## Schema Markup

This plugin extends the SFRA schema markup from the PDP/PLP, and add the breadcrumb coverage.

## PDP Offline redirection

When enabled (disabled by default), the plugin redirects any offline product to its primary category page, instead of letting the default behavior happening (rendering the 404 error page).

## CLP/PLP Offline redirection

When enabled (disabled by default), the plugin redirects any offline category to the home page, instead of letting the default behavior happening (rendering the 404 error page).

## PLP/Search Pagination

When enabled, the plugin replaces the "Load more" button at the bottom of the PLP/Search pages by a pagination. This pagination allow the customer to navigate between search result pages by using a pagination which reloads the page when navigating between pages, instead of using the infinite scroll SFRA behavior which loads products when the customer clicks on the "Load more" button.
This pagination is displaying, by default, page links by couple of three buttons. This value is manageable in the plugin's preferences.

# How to enable/disable features?

Each use case can be enabled/disabled without modifying the plugin. The plugin includes the SFRA way to enable/disable features from the code, by leveraging the use of the [cartridge/config/seoPreferences.js](https://github.com/SalesforceCommerceCloud/storefront-reference-architecture/blob/master/cartridges/app_storefront_base/cartridge/config/seoPreferences.js) file. This file is extended with the following preferences, that you can change from your brand cartridge to enable/disable the plugin's features:
- enableHrefLangs enables/disables the Href Langs tags generation
- enableOpenGraph enables/disables the Open Graph tags generation
- enablePageMetaData enables/disables the Page Meta tags generation

All three features are **enabled by default**, if you want to disable on of those, or all of them, please do the following steps:
1. Create the `your_brand_cartridge/config/seoPreferences.js` file
2. Put the following code in the file:
```javascript
'use strict';

var base = module.superModule || {};

// HERE YOUR CODE TO DISABLE FEATURES

module.exports = base;
```
3. Replace the comment in the code below by the following line, for example to disable the Href Langs generation:
```javascript
// Disable Href Langs tags generation into the templates
base.enableHrefLangs = false;
```
4. The `preferences.js` file should be like this:
```javascript
'use strict';

var base = module.superModule || {};

// Disable Href Langs tags generation into the templates
base.enableHrefLangs = false;

module.exports = base;
```

# Extention points

The Page Meta Data and Schema markup features are triggering a hook, which allows other cartridges to override the default behavior applied when setting the data into the request.
In order to override those data, please do the following:
1. Create the `hooks.json` file in your cartridge (where you want, common practice is to create it at the root level of your cartridge)
2. Reference the path of the `hooks.json` file in a `package.json` file (that you might need to create) at the root level of your cartridge. For example:
```json
{
    "hooks": "./hooks.json" // In case the hooks.json file is at the root level of the cartridge
}

```

3. In the `hooks.json` file, listen on the `app.seo.setpagemetadata` event or `app.seo.schema` event, and reference a listener script that will implement the event listener. For example:
```json
{
    "hooks": [
        {
            "name": "app.seo.setpagemetadata",
            "script": "./cartridge/scripts/path/to/script.js"
        },
        {
            "name": "app.seo.schema",
            "script": "./cartridge/scripts/path/to/script.js"
        }
    ]
}
```

4. Create the file that will implement the event listener, and define the methods related to the metadata keys. The function pattern should be `{metadata_key}` (with the `.` replaced by a `_`) for the metadata event. For example, for the `Account-Show` controller, the function name will be `account_show`. The file should look like:
```javascript
'use strict';

// Schema method that extends the provided schema and allow to override it
module.exports.schema = function (schema, viewData) {
    schema.test = 'value';
    if (viewData.something) {
        schema.something = viewData.something;
    }

    return schema;
};

// Meta data extension
module.exports.account_show = function (metadataObj) {
    // Do something to override the data
    return {...};
};

// Then implement each method you want to override
...
```

# SFRA compatibility

This plugin declares a hook, `app.template.htmlHead.seo`.

You will need to add this line to **`htmlhad.isml`**.
```html
<isprint value="${dw.system.HookMgr.callHook('app.template.htmlHead.seo', 'htmlHead', pdict) || ''}" encoding="off" />
```
We could have used the hook `app.template.htmlHead`, but the data need to be printed, as it's in HTML.
