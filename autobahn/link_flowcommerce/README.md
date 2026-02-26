# Flow Commerce SFCC Integration Cartridge
Flow has an officially certified Salesforce Commerce Cloud Cartridge that enables a fast, easy, and simple back-end integration between a merchant's Commerce Cloud site and Flow.

For any questions, please reach out to your technical contact at Flow.

## Configure Flow
  1. Review the [Getting Started](https://docs.flow.io/getting-started) Documentation. 
  
  2. Flow will set up your production and sandbox organizations, and invite an administrator
     from your company to join.

  3. Login to [Console](https://console.flow.io).

  4. Create one or more [experiences](https://docs.flow.io/integration-overview#experiences). This will represent the intended regions to serve. 

  5. Define at least one shipping tier per experience.

  6. Contact Flow to:

     * Define distribution centers
     * Customize and test your organization
     * Make sure your SFTP is set up and provide credentials

## Salesforce Commerce Cloud - Quick Sandbox Setup

  1. Upload the SFRA or Controllers cartridge to your instance and add the cartridge to your cartridge path
  
  2. Use Site Import to import the RefArch.zip (SFRA) or SiteGenesis.zip (Controllers)

  3. Add the Locales and Currencies defined in your Flow Experiences to the Site.

  4. Configure Site Preferences & Flow Jobs & Services (Read the Integration Documentation for more details)

  5. Run the initial jobs to export the catalog and generate the configuration files

  6. Upload the generated configuration files and run the jobs to import the Shipping Methods and Price Books

  7. Add the Price Books to the Site and Reindex the search indexes
