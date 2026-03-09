![Logo](https://red-van-workshop.s3.us-east-1.amazonaws.com/logo.png "Logo")

# RVW Autobahn

> Red Van Workshop's Autobahn [sfcc-4.1.2.2](/package.json)

## Table of Contents:

* [Cartridges](#cartridges)
* [Prerequisites](#prerequisites)
* [Getting Started For Internal Development](#getting-started-for-internal-development)
    * [Recommended VS Code Extensions](#recommended-vs-code-extensions)
    * [Recommended VS Code Settings](#recommended-vs-code-settings)
* [Standup a Storefront with Automated Site Imports](#standup-a-storefront-with-automated-site-imports)
    * [Configure Open Commerce API Settings in Business Manager](#configure-open-commerce-api-settings-in-business-manager)
    * [Configure Your WebDAV Permissions in Business Manager](#configure-your-webdav-permissions-in-business-manager)
* [Running Automated Site Imports](#running-automated-site-imports)
* [Inspecting Cartridge Bundle Size](#inspecting-cartridge-bundle-size)
* [Partial Uploading/Building Cartridges](#partial-upload-cartridges)
* [Reference](#reference)
    * [project.dw.json fields](#projectdwjson-fields)
    * [project.dw.json replace field](#projectdwjson-replace-field)
* [Upgrading Node](#upgrading-node-version)

## Cartridges

REQUIRED CARTRIDGE NAME             | DESCRIPTION
:--                                 | :--
`autobahn_client_core`              | Custom cartridge to serve as example of where client modifications would go
`rvw_integrations_core`             | Custom cartridge overlay containing the combined changes needed for all 3rd party cartridges to play nice together
`rvw_autobahn_core`                 | Custom cartridge overlay containing all core autobahn features
`rvw_pagedesigner_core`             | Custom cartridge overlay containing all autobahn specific pagedesigner changes
`rvw_integrations_base`             | Custom cartridge overlay to app_storefront_base containing necessary combined changes needed for all 3rd party cartridges to extend controllers, helper and hook script to work in combination.
`storefront-reference-architecture` | SFRA (v7.0.0) with minimal changes. Changes are tagged by `AUTOBAHN MOD` comments

## Prerequisites

- [X] Install [git](https://git-scm.com/) for npm methods involving git calls.

- [X] Install [n](https://github.com/tj/n) or [nvm](https://github.com/nvm-sh/nvm) to managed node.js version installations.

- [X] We have tested on Node.js version [v20.12.2](https://nodejs.org/download/release/v20.12.2/) and suggest you use that version installed with n or nvm above.  See our [Getting Started Guide](https://www.rvwautobahn.com/en_US/174606-getting-started/getting-started-code-base-and-site-import) for more info.

- [x] We suggest [VS Code](https://code.visualstudio.com/) with [Prophet Debugger](https://marketplace.visualstudio.com/items?itemName=SqrTT.prophet) for uploads and debugging your sandbox.

- [x] Your GitHub user account must be granted access to the [SalesForce Commerce Cloud](https://github.com/SalesforceCommerceCloud) Community Repos. If you do not have access, log into [XChange](https://xchange.demandware.com/), then [Request Access](https://cc-community-authmgr.herokuapp.com/).

- [x] You must have an SSH key created and installed on your computer, and have added that key to your [GitHub Account](https://help.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh).

- [x] Obtain SalesForce CommerceCloud [Account Manager](https://account.demandware.com/) user credentials from your admins. This account MUST also be granted Business Manager Admin level access to a development sandbox.

- [ ] Obtain the SalesForce CommerceCloud API Key & Secret for for PIGs[^1] from the project organization admins. For a sandbox, the values will be `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` and `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`.
## Getting Started For Internal Development

1. Clone this repository to your local system.

2. Open a command-line prompt (VC Code, Terminal, or Command Shell) and navigate to the directory of the `autobahn/package.json` (a sibling to this file) on your local machine.

3. Run `npm i` to install all of the local dependencies and cartridge specific dependencies.

4. Run `npm run dev:compile` to compile the client-side code.

5. Create a copy of [example.dw.json](example.dw.json) in your autobahn root (a sibling to this README), then rename the file to `dw.json`.
    - **NOTE: RELOAD VSCODE WITH `CMD+SHIFT+P` OR `CTRL+SHIFT+P` AND SELECT `Developer: Reload Window` FOR PROPHET TO PICKUP ANY CHANGES TO `dw.json`!!!!!!!!**

        <details><summary><b>SAMPLE dw.json</b></summary>

        ```json
        {
            "hostname": "redvan01-alliance-prtnr-na01-dw.demandware.net",
            "username": "autobahn@redvanworkshop.com",
            "password": "somepassword",
            "version": "version1",
            "clientId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        }
        ```
        </details>

6. Enter your specific Account Manager credentials into `dw.json`. You will need to update `hostname`, `username`, `password`, and `version`. The rest will be inherited from `project.dw.json` via `dw.js`.

    | property | value |
    | --- | --- |
    | `hostname` | Domain for your development sandbox |
    | `username` | Email Address listed under SFCC Account Manager > Account Information |
    | `password` | Password for your SFCC Account Manager Account |
    | `version` | Active code version for the development sandbox. Obtain this via the development sandbox `Business Manager` > `Administration` > `Site Development` > `Code Deployment` |
    | `clientId` | 30 a's (sandbox) |

7. If you are using VS Code, the `.vscode/launch.json` file interacts with the [Prophet Debugger](https://marketplace.visualstudio.com/items?itemName=SqrTT.prophet) plugin. If missing, go to the Prophet Debugger panel and click `create a launch.json file` and then select `Attach to Sandbox`, or you can go to the top menu Run/Add Configuration. It should look like this:

    <details><summary><b>SAMPLE launch.json</b></summary>

    ```json
    {
        "version": "0.2.0",
        "configurations": [
          {
              "type": "prophet",
              "request": "launch",
              "name": "Attach to Sandbox"
          }
        ]
    }
    ```
    </details>

At this point you are ready to start developing.  If you are doing client side development, you should run `npm run watch` to watch all your client side changes. Also make sure to Enable Upload for Prophet Debugger. **Note**: when running `npm run watch`, the cartridges start uploading before the code finishes compiling, so it's helpful to do a "Clean Project/Upload All" after the compile is finished.

If this is a brand new sandbox, see the sections below on Automated Site Imports.

#### Recommended VS Code Extensions

|  | Extension | Details |
| :-: | --- | --- |
| <img src="https://aaron-bond.gallerycdn.vsassets.io/extensions/aaron-bond/better-comments/2.0.5/1557930515925/Microsoft.VisualStudio.Services.Icons.Default" height="16"> | [Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments) | Makes Code Comments more useful |
| <img src="https://streetsidesoftware.gallerycdn.vsassets.io/extensions/streetsidesoftware/code-spell-checker/1.9.0/1589974448396/Microsoft.VisualStudio.Services.Icons.Default" height="16"> | [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker) | Handy if your fingers don't always type what you thought they did |
| <img src="https://editorconfig.gallerycdn.vsassets.io/extensions/editorconfig/editorconfig/0.15.1/1590371230963/Microsoft.VisualStudio.Services.Icons.Default" height="16"> | [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig) | Helps with line ending issues across macOS & Windows |
| <img src="https://eamodio.gallerycdn.vsassets.io/extensions/eamodio/gitlens/10.2.2/1591818157905/Microsoft.VisualStudio.Services.Icons.Default" height="16"> | [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) | Shows who worked on code where your cursor has focus |
| <img src="https://fabiowquixada.gallerycdn.vsassets.io/extensions/fabiowquixada/vscode-isml-linter/1.0.0/1560124783765/Microsoft.VisualStudio.Services.Icons.Default" height="16"> | [ISML Linter](https://marketplace.visualstudio.com/items?itemName=fabiowquixada.vscode-isml-linter) | Adds Linting support for ISML files |
| <img src="https://sqrtt.gallerycdn.vsassets.io/extensions/sqrtt/prophet/1.3.12/1591000736002/Microsoft.VisualStudio.Services.Icons.Default" height="16"> | [Prophet Debugger](https://marketplace.visualstudio.com/items?itemName=SqrTT.prophet) | This is pretty much **required** for SFCC/SFRA Work |

#### Recommended VS Code Settings

To fix a few white spacing issues between macOS and Windows developers, it is recommended to use the following VS Code settings (these are UNIX friendly, which is what git repos like `Github` and `Bitbucket` will be using).

> VS Code ? Preferences ? Settings ? Search for "trim"

Option                          | Value
--------------------------------|------------
Editor: Trim Auto Whitespace    | CHECKED
Files: Trim Final Newlines      | UNCHECKED
Files: Trim Trailing Whitespace | CHECKED
Trailing-spaces: Trim On Save   | CHECKED


## Standup a Storefront with Automated Site Imports

The latest version of SFRA is 7.0.0

* A. Log into the Business Manager.
* B. Navigate to `Administration` > `Site Development` > `Open Commerce API Settings`.
* C. Select 'Data API' and 'Global' from the available select boxes.
* D. Add the permission configuration below for your clientId to the existing configuration settings.

Remember that 'client_id' needs to match the 'clientId' configured in your `dw.json` file for a sandbox or your `project.dw.json` file for a PIG[^1]. If you already have clientId permissions listed, please add the resources outlined in the snippet below to the existing clientId configuration. (Version is subject to change depending on the sandbox you're using. There also may be more configuration already added to the file. If this is the case, please append and not overwrite existing settings).

2. Run `npm install` to install all of the local dependencies (SFRA has been tested with Node v18.19 and is recommended)

3. Run `npm run compile:js` from the command line that would compile all client-side JS files. Run `npm run compile:scss` and `npm run compile:fonts` that would do the same for css and fonts.

4. Create `dw.json` file in the root of the project. Providing a [WebDAV access key from BM](https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2Fcontent%2Fb2c_commerce%2Ftopics%2Fadmin%2Fb2c_access_keys_for_business_manager.html) in the `password` field is optional, as you will be prompted if it is not provided.
```json
{
    "_v":"21.9",
    "clients":
    [
    {
        "client_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "resources": [
            {
                "resource_id":"/**",
                "methods":["get","put","post","patch","delete"],
                "read_attributes":"(**)",
                "write_attributes":"(**)"
            }
            ]
    }
    ]
}
```

#### Configure Your WebDAV Permissions in Business Manager

* A. Log into the Business Manager.
* B. Navigate to Administration > Organization > WebDAV Client Permissions.
* C. Add the following permission sets for your clientId to the existing configuration settings.

Remember to use the `client_id` as the 'CLIENTID' that is configured in your `dw.json` file for a sandbox or `project.dw.json` file for a PIG[^1].  If you already have clientId permissions listed, please add the resources outlined in the snippet below to the existing clientId configuration.

**WebDAV Client Application Permissions JSON Reference**
```json
{
    "clients": [{
    "client_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "permissions": [{
        "path": "/cartridges",
        "operations": [
            "read_write"
        ]
        },
        {
        "path": "/impex",
        "operations": [
            "read_write"
        ]
        }
    ]
    }]
}
```

## Running acceptance tests

**Prerequisite:** The Java Runtime Environment (JRE 8+) is required to run Selenium and the acceptance tests. If you have not done so, install Java on your machine.

Acceptance tests are located in the `storefront-reference-architecture/test/acceptance` directory.

The acceptance tests will run against the site specified in the hostname property of `dw.json`. ie. To run the tests on `abcd-123.dx.commercecloud.salesforce.com`, in your dw.json set the following:
```
"hostname": "abcd-123.dx.commercecloud.salesforce.com"
```

There are several NPM scripts available for running the acceptance tests. They all require a `--profile` parameter for setting the browser the tests will run against. ie. `npm run test:acceptance:smoke --profile chrome`

Tests will generally run on Chrome, Safari, and Firefox.

To run the tests in headless mode, set a HEADLESS environment to true before starting the npm run. ie. `HEADLESS=true && npm run test:acceptance:smoke --profile chrome`

* `test:acceptance:custom` - runs all tests (Note: some tests will fail as the browser size defaults to desktop)
* `test:acceptance:deep` - runs all storefront tests
* `test:acceptance:smoke` - runs happy path tests
* `test:acceptance:pagedesigner` - runs page designer tests
* `test:acceptance:desktop` - runs storefront desktop tests
* `test:acceptance:mobile` - runs storefront mobile tests
* `test:acceptance:tablet` - runs storefront tablet tests

**Note:** Selenium can be finicky to start. If the tests fail to start, simply rerun the command again until the tests start.

# [Contributing to SFRA](./CONTRIBUTING.md)

The following table details the most often used npm commands designed to stand up and support Autobahn development teams.

Command                         | Repo Folder | Result
--------------------------------|-------------|-------
`npm run data:meta`             | `data/meta` | This will import all system and custom object definitions. It will contain only default values and it will only override your data if you have changed System/Custom object definitions.
`npm run data:initialize`       | `data/initalize` | THIS WILL OVERRIDE ALL YOUR INTEGRATION RELATED SETTINGS (JOBS, SERVICES, OCAPI, PAYMENTS, TAX, etc...) AND THE DEFAULT SITE CONTENT LIBRARY.  Developers may choose to run it from time to time on their personal sandbox to get a clean slate (not a bad idea to reset the sandbox first)
`npm run data:clientmeta`       | `data/clientmeta` | This will import all data in clientmeta/ folder. You should place all client specific metadata definitions in this folder.
`npm run data:clientkeys`       | `data/clientkeys` | This will import all data in clientkeys/ folder. You should place all client specific Keys / Service Credentials in this folder.
`npm run data:clienttest`       | `data/clienttest` | This will import all data in clienttest/ folder. You should place all client specific testdata in this folder.
`npm run data:devtest`          | `data/devtest` | THIS CAN OVERRIDE ALL INITIALZE DATA using our Autobahn storefront test data. (Should not be used outside of AB Dev Team and RVWU[^2])
`npm run data:devkeys`          | `data/devkeys` | THIS CAN OVERRIDE ALL INTEGRATION KEYS/SERVICE CREDENTIALS using our Autobahn test accounts (Should not be used outside of AB Dev Team and RVWU[^2])
`npm run data:clientsandbox`    | | Runs the following commands as defined below: `data:meta`, `data:initialize`, `data:clientmeta`, `data:clientkeys`, and then `data:clienttest`
`npm run data:devsandbox`       | | Runs the following commands as defined below: `data:meta`, `data:initialize`, `data:devkeys`, and then `data:devtest` (Should not be used outside of AB Dev Team and RVWU[^2])

If you have not modified system/custom object definitions in business manager it is relatively safe to run data:meta. All the other commands RUN AT YOUR OWN RISK, they can be dangerous unless you are prepared to lose data!

By default these will all deploy to/override the `Autobahn` site.  You may change the name by editing the `replace` list attributes inside `project.dw.json`. Your project admin should configure `project.dw.json` when setting up the Github Repository.

Please note that we are using [Autobahn-cli](https://github.com/redvanworkshop/autobahn-cli), via the above npm commands, to build the data segmented out by cartridge. Please visit the readme for further information. If you wish to customize how/what data you pull in, you can reference the docs here `https://github.com/redvanworkshop/autobahn-cli/blob/master/docs/cmd-import.md`

If you have a blank sandbox and just want to get started asap working on autobahn, you would run:
1. `npm run data:meta`
2. `npm run data:initialize`
3. `npm run data:clientkeys` or `npm run data:devkeys`

If you need more test data than just bare bones:
4. `npm run data:clienttest` or `npm run data:devtest`

Be sure to build your search indexes with all this new data, especially if it's a fresh sandbox setup:

  * A. Log into Business Manager.
  * B. Navigate to Merchant Tools > Search > Search Indexes.
  * C. Click the `Rebuild All` button and wait for everything to finish building

After the initial setup of your sandbox, it is only relatively safe to run `npm run data:meta`.  Developers have lost all their custom work by running other commands without understanding what they will replace!

### NOTE: To add new cartridge and get it building correctly:

1. Add a reference to the specific cartridge data in the correct data folders under a directory using the same name as the cartridge - if you need to add attributes to a shared grouping - please add them in the 'attribute_groups' folder. This is the last import to run and will override any other previous group definition.
2. Because the default build uses `cartridgeAll` it should import automatically when running the `data:*` commands listed above and after reloading VSCode prophet will `upload` it as well.


## Inspecting Cartridge Bundle Size

You can enable Cartridge Bundle Analyzing via:

```bash
ANALYZE_BUNDLES=true npm run dev:compile
```

This will analyze the node packages in each cartridge and generate a specific HTML report in a `.analyze-bundle` directory.

As the code is compiled via webpack, an HTML file is generated that contains statistics on which parts of the code are taking up the most space in the bundled package.

This file is ignored in the git repo, so it does not get committed, but you can view an interactive report at any time by simply opening the HTML file in your browser.

## Partial Uploading/Building Cartridges

If you do not want to use all the cartridges this project has to offer, this is pretty straight forward to do.  All you need to do is define which cartridges you want to use in your `dw.json` file.

Setting which cartridges you want in your `dw.json` file will achieve two things:

1. Prophet Debugger will only upload these cartridges (see [their notes](https://github.com/SqrTT/prophet#using-the-uploader) on this)
2. When you run a compile process, e.g. `npm run dev:compile` it will ignore cartridges not defined in your `dw.json` cartridge list:

    <details><summary><b>SAMPLE dw.json</b></summary>

    ```json
    {
      "hostname": "redvan01-alliance-prtnr-na01-dw.demandware.net",
      "username": "yourusername",
      "password": "yourpassword",
      "code-version": "version1",
      "cartridge": [
        "storefront-reference-architecture",
        "int_cybersource_sfra",
        "rvw_cybersource_integration",
        "rvw_autobahn_core"
      ]
    }
    ```

    </details>
### NOTE: You must use the specific cartridge names, not the project name (int_cybersource_sfra vs link_cybersource for example)

3. This will automatically limit what is imported when you run `npm run data:*` commands. See [autobahn-cli]('https://github.com/redvanworkshop/autobahn-cli/blob/master/docs/cmd-import.md') for more advanced options.

# Reference
## project.dw.json fields
Remember that any of the below fields can technically appear in either file due to the combining of them inside dw.js.  This shows their recommended and most practical locations

project.dw.json             | default   | DESCRIPTION
:--                         | :--       | :--
`allowStagingInitialize`    | false     | let the meta github build deploy to staging with data:initialize as a command (dangerous)
`cartridge`                 | []        | list of specific code and data cartridges to deploy by default (just like dataFor used to do, cartridge becomes dataFor inside dw.js)
`cartridgeAll`              | false     | deploy all cartridges automatically (just like dataAll used to do, cartridgeAll becomes dataAll inside dw.js)
`clientId`                  | 30 a's    | OCAPI client id
`dataFinal`                 | ''        | typically 'attribute_groups', used to set shared metadata groups, last imported data cartridge
`dataIgnore`                | []        | glob patterns to ignore data folders relative to each data sub folder (meta, initialize, etc...)
`defaultDeployEnvironment`  | sandbox   | staging, development or sandbox, where the github actions build to during a regular merge to develop branch
`defaultDataCommand`        | data:meta, data:clientmeta       | default data command used in Github actions
`developmentDomain`         | ''        | used when development is the default deploy environment
`stagingDomain`             | ''        | used when staging is the default deploy environment or you cut a release or hotfix branch
`stagingSecureDomain`       | ''        | used for code upload when staging is the default deploy environment or you cut a release or hotfix branch (cert.staging.<realm>.<customer>.demandware.net)
`sandboxDomainPrefix`       | ''        | used when sandbox is the default deploy environment (zzrt-)
`sandboxNumber`             | ''        | used when sandbox is the default deploy environment (001)
`sandboxDomainPostfix`      | ''        | used when sandbox is the default deploy environment (.sandbox.us01.dx.commerceloud.salesforce.com)
`siteRename`                | false     | opts in to change the Siteidreplaceme and Sitenamereplaceme placeholders ( you almost always want this on )
`siteId (Deprecated)`       | ''        | deprecated - please use `replace` list
`siteName (Deprecated)`     | ''        | deprecated - please use `replace` list
`validateConnection`        | false     | whether or not you want the github action to always test if it has access to upload/import code or data before actually doing so (useful for troubleshooting keys)
`replace`                   | []        | list of `placeholder{delimiter}value` strings to replace placeholder strings in /data subfolder folder XML files
`delimiter`                 | :         | delimiter used to separate placeholder:value strings in `replace` list

## project.dw.json replace field
The following items are 'replace' case sensitive strings as defined in `project.dw.json` which are used to build storefront specific metadata files. These files are built from the `data/*.*` folders. The 'Key' portion of the string should not be modified. Additional values may be added as required.

### Required
Full String (key:value)                                     | Key                                   | DESCRIPTION
:--                                                         | :--                                   | :--
`INSTANCETIMEZONEREPLACEME:US/Central`                      | `INSTANCETIMEZONEREPLACEME`           | Business Manager timezones. Options listed in BM Admin > Global Preferences > Instance Time Zones
`Siteidreplaceme:Autobahn`                                  | `Siteidreplaceme`                     | Site ID - No spaces, camel case, no special characters
`Sitenamereplaceme:Autobahn`                                | `Sitenamereplaceme`                   | Site Name - Camel case
`sitenamereplaceme:autobahn`                                | `sitenamereplaceme`                   | Site Name - Lowercase
`SITENAMEREPLACEME:AUTOBAHN`                                | `SITENAMEREPLACEME`                   | Site Name - Uppercase
`sitecatalogidreplaceme:storefront-catalog-autobahn`        | `sitecatalogidreplaceme`              | Storefront Catalog ID - No spaces, no special characters
`WORKFLOW.PROJECTCLIENTID.REPLACEME:some-api-key-from-sfcc` | `WORKFLOW.PROJECTCLIENTID.REPLACEME`  | This field will fill preconfigured OCAPI JSON structures used by GitHub workflows to push builds and data into SBXs & PIGs

### Optional
Full String (key:value)                                     | Key                                   | DESCRIPTION
:--                                                         | :--                                   | :--
`CRMCLIENTIDREPLACEME:some-api-key-from-sfcc`               | `CRMCLIENTIDREPLACEME`                | API Key setup requirements provided by SF Core CRM Admin
`CRMALLOWEDORIGINREPLACEME:somedomain.hostname.com`         | `CRMALLOWEDORIGINREPLACEME`           | CRM hostname provided by SF Core CRM Admin
`SOMORDERSYNCCLIENTIDREPLACEME:some-api-key-from-sfcc`      | `SOMORDERSYNCCLIENTIDREPLACEME`       | API Key setup requirements provided by SF Core SOM Admin

# Staging - Creating p12
1. : Retrieve the certificate zip file from Salesforce support.
2. : Unzip the contents and in terminal run cd to the cert folder location.
3. : Run the following commands in the terminal:
3a : `openssl req -new -sha256 -newkey rsa:2048 -nodes -out <filename>.req -keyout <filename>.key`
3b : `openssl x509 -CA <certfilename>.crt -CAkey <keyfilename>.key -CAserial <srlfilename>.srl -req -in <filename>.req -out <filename>.pem -days 3650`
3c : `openssl pkcs12 -certpbe PBE-SHA1-3DES -export -in <filename>.pem -inkey <filename>.key -certfile <certfilename>.crt -name "<filename>" -out <filename>.p12` (NOTE: during the "Password Export" step, create a password here. This is the same password to store in GitHub for `CERT_PASS`)
[^4]: Run `openssl base64 -in tcs.p12` to get the base64 p12

# GitHub Build Setup
Add the following GitHub Repository Secrets:
[^1]: `API_CLIENT_SECRET` - The API Client secret
[^2]: `CERT_CONTENTS` - Base64 encrypted p12 cert (instructions above)
[^3]: `CERT_PASS` - Password used during the p12 creation "Export" step

# Upgrading Node Version
As of April 2024 the repository version of node has been updated to [v20.12.2](https://nodejs.org/download/release/v20.12.2/).
To run commands on a local machine the version must be upgraded using n or nvm.
Once node is upgraded open a command-line prompt (VC Code, Terminal, or Command Shell) and navigate to the directory of the `autobahn/package.json` (a sibling to this file) on your local machine. Run `npm i` to install all of the local dependencies and cartridge specific dependencies.

[^1]: Primary Instance Group. This group includes SFCC development, staging and production instances.
[^2]: Red Van Workshop University
