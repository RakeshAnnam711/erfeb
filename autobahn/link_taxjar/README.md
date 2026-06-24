# TaxJar for SalesForce Commerce Cloud

# The latest version

The latest version of TaxJar for SFCC is 20.1.0

# Getting Started

1. Clone this repository.

2. Run `npm install` to install all of the local dependencies (node version 8.x or current LTS release recommended)

3. Create `dw.json` file in the root of the project:
```json
{
    "hostname": "your-sandbox-hostname.demandware.net",
    "username": "yourlogin",
    "password": "yourpwd",
    "code-version": "version_to_upload_to"
}
```

4. Run `npm run uploadCartridge:all`. It will upload `int_taxjar`, `taxjar_sfra` and `int_taxjar_sg` cartridges to the sandbox you specified in `dw.json` file. Alternatively if you only want to upload the cartridges required for SFRA run the command `npm run uploadCartridge:sfra` or run `npm run uploadCartridge:sgjc` to upload cartridges required for Site Genesis.

5. Add the `int_taxjar` cartridge to your cartridge path in _Administration >  Sites >  Manage Sites > RefArch - Settings_ . For SFRA add `int_taxjar_sfra` to the cartridge path as well. For Site Genesis add `int_taxjar_sg` cartridge to the cartridge path.

6. Configure TaxJar settings according to documentation in the `taxjar-sfcc/documentation` directory.


# NPM scripts
Use the provided NPM scripts to test and upload changes to your sandbox.

## Linting your code

`npm run lint:js` - Execute linting for all JavaScript files in the project. You should run this command before committing your code.

## Watching for changes and uploading

`npm run watch` - Watches everything and recompiles (if necessary) and uploads to the sandbox. Requires a valid `dw.json` file at the root that is configured for the sandbox to upload.

## Uploading

`npm run uploadCartridge:all` - Will upload `int_taxjar`, `int_taxjar_sg` and `int_taxjar_sfra` to the server. Requires a valid `dw.json` file at the root that is configured for the sandbox to upload.

`npm run uploadCartridge:sfra` - Will upload `int_taxjar`, and `int_taxjar_sfra` to the server. Requires a valid `dw.json` file at the root that is configured for the sandbox to upload.

`npm run uploadCartridge:sgjc` - Will upload `int_taxjar`, and `int_taxjar_sg` to the server. Requires a valid `dw.json` file at the root that is configured for the sandbox to upload.

`npm run upload <filepath>` - Will upload a given file to the server. Requires a valid `dw.json` file.

# Testing
## Running unit tests

You can run `npm test` to execute all unit tests in the project.

## Running SFRA integration tests
Integration tests are located in the `taxjar-sfcc/test/integration` directory.

To run integration tests you can use the following command:

```
npm run test:integration
```

**Note:** Please note that short form of this command will try to locate URL of your sandbox by reading `dw.json` file in the root directory of your project. If you don't have `dw.json` file, integration tests will fail.
sample `dw.json` file (this file needs to be in the root of your project)
{
    "hostname": "devxx-sitegenesis-dw.demandware.net"
}

You can also supply URL of the sandbox on the command line:

```
npm run test:integration -- --baseUrl devxx-sitegenesis-dw.demandware.net
```
## Running Site Genesis integration tests

### Setup

1. Install necessary dependencies

```
npm install
```

2. Install standalone selenium driver

```
npm install --production -g selenium-standalone@latest
selenium-standalone install
```

3. Add dw.json file if it doesn't already exist

4. Import the promotions in /test/sgjc/metadata/TaxJarSpplicationTestPromotions.xml file into the Site Genesis site



### Running the Tests

1. Start selenium standalone service

```
selenium-standalone start
```

2. Run tests (in separate terminal)

```
npm run test:sgjc
```

