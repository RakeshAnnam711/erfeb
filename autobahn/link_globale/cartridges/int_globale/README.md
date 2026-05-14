[<img src="cartridge/static/default/images/globale/logo_2018.png?raw=true" alt="Global-e Smart Cross Border" width="180">](https://www.salesforce.com/products/commerce-cloud/partner-marketplace/partners/global-e/)

# Global-e SFCC Core Cartridge
This cartridge (`int_globale`) is a base cartridge and contains Global-e Core functionality, regardless of which SFCC architecture is used on storefront (SiteGenesis or SFRA).

Please always add this cartridge to the cartridge path of any Site in BM which will be using Global-e power. This cartridge should be added after all other cartridges which might be using any controller, model or factory from `int_globale`.

This cartridge should be never directly customized or edited. Instead, the cartridges with any storefront architecture customization (`int_globale_sitegenesis` or `int_globale_sfra`) are layered on top of the merchant brand (and `int_gloable`) cartridges. This change is intended to allow for easier adoption of new features and bug fixes.

# Contributing to Global-e
If you've found any bug - please [create a new issue ticket](https://github.com/SalesforceCommerceCloud/link_globale/issues).
