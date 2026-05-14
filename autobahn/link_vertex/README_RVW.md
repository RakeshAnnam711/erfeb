# Vertex Integration for SFRA in Salesforce Commerce Cloud
Link Cartridge for Vertex for SFRA (StoreFront Reference Architecture).

![Logo](https://red-van-workshop.s3.us-east-1.amazonaws.com/logo.png "Logo")
Part of the Red Van Workshop Autobahn Third Party Integrations.
This integration was initially done in February 2021 into Autobahn v2.3.3 which had just been updated for SFRA v5.1.



#### Installation

1. Follow directions in the 'documentation' folder in these documents:
'Vertex Cartridge Overview.docx' provides a quick overview of using the cartridge and BM extension. 

'Vertex Salesforce B2C Commerce Configuration Guide.docx' provides detailed information on Business Manager configuration, logging, request & response, custom code changes that may be needed in overlay cartridges


'Vertex Salesforce B2C Commerce SFRA Configuration Guide.docx' provides
additional detail on examples that are contained in the int_vertex_sfra cartridge for forms and scripts that can and/or may need to be implemented in overlaying cartridges.

'Vertex Salesforce B2C Commerce Implementation Guide.docx' provides information on base Business Manager configuration, logging, request and response mapping and installation for Eclipse.

'Revision Notes Vertex Inc v1.5.2.docx' lists out changes/fixes by version and date of the Vertex cartridge.

2. See the additional setup and configuration documentation/notes in Red Van's Confluence at https://redvanworkshop.atlassian.net/wiki/spaces/RVW/pages/1228505089/Vertex

3. In the 'metadata' folder, there is import XML that, if not run as part of the npm data:update process, can be executed manually. There are  additional attributes to System objects in 'meta/system-objecttype-extensions.xml', along with jobs and services to be imported.

4. The cartridge path for both Sites and Business Manager will need to be updated (see the documentation in file a/o in Confluence)

5. Confirm that the vertex cartridge has been added to the "dataFor" attribute of the example.dw.json (might also be called something like 'config.dw.json') that is used by the build to initialize data.
Also update your local dw.json's "dataFor" attribute as well.

Example:
{
  "hostname": "bgms-001.sandbox.us01.dx.commercecloud.salesforce.com",
  "username": "damian.dobosz@otterproducts.com",
  "password": "myP@ssw0rd",
  "code-version": "rvw_1",
  "sitecode": "ob-us",
  "dataFor": ["app_storefront_base","int_cybersource_sfra","link_vertex","plugin_gtm","rvw_autobahn_core","autobahn_client_core","autobahn_ob_us","autobahn_ob_emea","autobahn_ob_apac","autobahn_lp_us","autobahn_lp_emea","autobahn_lp_apac"]
}
