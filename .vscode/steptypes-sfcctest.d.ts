
declare global {

		interface JobExecutionParameters {
			/** Emails gift certificates in GiftCertificateEmailQueue custom objects. 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/autobahn_client_core/cartridges/autobahn_client_core/steptypes.json#5) */
			'custom.sendQueuedGiftCertificateEmails': Readonly<{}>;
			/** Updates the attributes of Products for GloablE restricted product 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/autobahn_client_core/cartridges/autobahn_client_core/steptypes.json#29) */
			'custom.globale.updateGlobalERestrictedProducts': Readonly<{}>;
			/** Exports product to Amazon API productsup 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/autobahn_client_core/cartridges/autobahn_client_core/steptypes.json#53) */
			'custom.amazon.exportproductsup': Readonly<{}>;
			/** Link orders to given customer account 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/autobahn_client_core/cartridges/autobahn_client_core/steptypes.json#75) */
			'custom.linkOrderToCustomerAccount': Readonly<{}>;
			/** Exports sitemap categories by locale 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/autobahn_client_core/cartridges/autobahn_client_core/steptypes.json#120) */
			'custom.exportRegionSpecificSitemaps': Readonly<{
				/** Maximum URLs per sitemap file */
				'MAX_URLS_PER_FILE': string,
				/** Maximum file size in MB per sitemap file */
				'MAX_FILE_SIZE_IN_MB': string,
				/** Default change frequency for sitemap URLs */
				'DEFAULT_CHANGE_FREQ': string,
				/** Default priority for sitemap URLs */
				'DEFAULT_PRIORITY': string,
				/** Comma separated keywords to exclude files containing any of these keywords */
				'fileExclusionKeywords'?: string,
				/** Hostname to use for sitemap URLs */
				'hostname': string,
				/** Flag to exclude product images from sitemap */
				'excludeProductImages': boolean}>;
			/** Exports product to eBay API 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/autobahn_client_core/cartridges/autobahn_client_core/steptypes.json#198) */
			'custom.eBay.exportDeltaEbayProducts': Readonly<{}>;
			/** Exports product to eBay API productsup 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/autobahn_client_core/cartridges/autobahn_client_core/steptypes.json#220) */
			'custom.amazon.exportEbayProductsMasterFeed': Readonly<{}>;
			/** Upload files to an (S)FTP server 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_feedonomics/cartridges/int_feedonomics/steptypes.json#4) */
			'custom.Feedonomics.FtpUpload': Readonly<{}>;
			/** Export Feedonomics Product Feed 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_feedonomics/cartridges/int_feedonomics/steptypes.json#71) */
			'custom.Feedonomics.ProductExport': Readonly<{}>;
			/** Export Feedonomics Inventory Feed 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_feedonomics/cartridges/int_feedonomics/steptypes.json#155) */
			'custom.Feedonomics.ProductInventoryExport': Readonly<{}>;
			/** Upload files to the Flow SFTP server 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_flowcommerce/cartridges/int_flow/steptypes.json#4) */
			'custom.Flow.uploadFilesToFlow': Readonly<{
				/** Remote folder on Flow SFTP, relative to home directory */
				'remoteFolder'?: string,
				/** Mark the step as disabled. This will skip the step and returns a OK status */
				'disabled'?: boolean}>;
			/** Download pricebooks from the Flow SFTP server 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_flowcommerce/cartridges/int_flow/steptypes.json#42) */
			'custom.Flow.downloadPricebooksFromFlow': Readonly<{
				/** Remote folder on Flow SFTP, relative to home directory */
				'remoteFolder'?: string}>;
			/** Removes old files from the flow archive folders 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_flowcommerce/cartridges/int_flow/steptypes.json#72) */
			'custom.Flow.cleanArchives': Readonly<{
				/** How many days to keep the file */
				'fileAgeInDays'?: number}>;
			/** Exports product images as a CSV file 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_flowcommerce/cartridges/int_flow/steptypes.json#101) */
			'custom.Flow.exportProductImages': Readonly<{
				/** Product image size to export to Flow */
				'productImageSize'?: string}>;
			/** Generates shipping methods import file from flow API 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_flowcommerce/cartridges/int_flow/steptypes.json#130) */
			'custom.Flow.generateShippingMethodsImportFile': Readonly<{}>;
			/** Updates order fraud status and places order 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_flowcommerce/cartridges/int_flow/steptypes.json#147) */
			'custom.Flow.updateOrderFraudStatus': Readonly<{
				/** Datetime string, filters results to orders created after this date */
				'startDate'?: datetime-string}>;
			/** Generates flowExperiences.json & countries.json files 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_flowcommerce/cartridges/int_flow/steptypes.json#175) */
			'custom.Flow.generateConfigurationJsonFiles': Readonly<{}>;
			/** Processes the Flow Notification custom objects 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_flowcommerce/cartridges/int_flow/steptypes.json#192) */
			'custom.Flow.processFlowNotifications': Readonly<{
				/** Comma seperated list of addresses to send notifications */
				'toAddresses'?: string}>;
			/** Loads Global-e AppSettings 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#6) */
			'custom.GlobaleAppSettings': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Loads Global-e Countries 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#36) */
			'custom.GlobaleCountries': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Loads Global-e Country Coefficients 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#66) */
			'custom.GlobaleCountryCoefficients': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Loads Global-e Cultures 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#96) */
			'custom.GlobaleCultures': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Loads Global-e Currencies 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#126) */
			'custom.GlobaleCurrencies': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Loads Global-e Currency Rates 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#156) */
			'custom.GlobaleCurrencyRates': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Loads Global-e Rounding Rules 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#186) */
			'custom.GlobaleRoundingRules': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Loads Global-e Active Hub Details 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#216) */
			'custom.GlobaleActiveHubDetails': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Loads Recent Product Country S data 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#246) */
			'custom.GlobaleLoadRecentProductCountryS': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Imports Recent Product Country S data 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#276) */
			'custom.GlobaleImportRecentProductCountryS': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Archives Recent Product Country S data 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#306) */
			'custom.GlobaleArchiveRecentProductCountryS': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Sends the Order status update to Global-e 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#336) */
			'custom.GlobaleUpdateOrderStatus': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Sends the CreateOrderRefund request to Global-e 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#366) */
			'custom.GlobaleCreateOrderRefund': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Sends the UpdateOrderDispatchV2 request to Global-e 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#396) */
			'custom.GlobaleUpdateOrderDispatch': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Generates Catalog file and stores it in IMPEX/* folder 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#426) */
			'custom.GlobaleGenerateCatalogFeed': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Uploads generated Catalog file from IMPEX/* to Global-e SFTP folder 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#456) */
			'custom.GlobaleUploadCatalogFeed': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Generates Restricted Items file and stores it in IMPEX/* folder 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#486) */
			'custom.GlobaleGenerateRestrictedItemsFeed': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Uploads generated Restricted Items file from IMPEX/* to Global-e SFTP folder 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#516) */
			'custom.GlobaleUploadRestrictedItemsFeed': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Sends the UpdateRMA request to Global-e 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#546) */
			'custom.GlobaleUpdateRMA': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Processes GLOBALE_INVENTORY_NOTIFICATION custom objects (async processing) 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#576) */
			'custom.GlobaleInventoryVoidReservation': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Generates Cache Price Books XML file and stores it in IMPEX/* folder 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#606) */
			'custom.GlobaleGenerateCachePriceBooksXML': Readonly<{
				/** Disables running the job step. */
				'geDisableJobStep'?: boolean}>;
			/** Cancels Expired Pay By Link Orders 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_globale/cartridges/int_globale/steptypes.json#636) */
			'custom.GlobaleCancelExpiredPayByLinkOrders': Readonly<{}>;
			/** Remove PaypalNew Transaction custom object when creation date is more than a year 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_paypal/cartridges/bm_paypal/steptypes.json#5) */
			'custom.removePaypalCustomObject': Readonly<{}>;
			/** Checks previously ran chunk order export job for errors and surfaces them in the Business Manager 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_yotpocbu/cartridges/int_yotpo_sfra/steptypes.json#5) */
			'custom.Yotpo.JobErrorChecking': Readonly<{}>;
			/** Yotpo Cartridge - export and send orders to Yotpo's webservice. 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_yotpocbu/cartridges/int_yotpo_sfra/steptypes.json#33) */
			'custom.Yotpo.ExportOrdersJson': Readonly<{}>;
			/** Yotpo Cartridge - send customer loyalty data to Yotpo's webservice. 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_yotpocbu/cartridges/int_yotpo_sfra/steptypes.json#67) */
			'custom.Yotpo.LoyaltyCustomerExport': Readonly<{}>;
			/** Yotpo Cartridge - send order loyalty data to Yotpo's webservice. 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/link_yotpocbu/cartridges/int_yotpo_sfra/steptypes.json#101) */
			'custom.Yotpo.LoyaltyOrderExport': Readonly<{}>;
			/** Export Google Merchant Product Feed 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/rvw_autobahn_core/cartridges/bm_autobahn_core/steptypes.json#4) */
			'custom.GoogleMerchant.ProductExport': Readonly<{}>;
			/** Order Export for SOM Order History 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/rvw_integrations_core/cartridges/rvw_som_integration/steptypes.json#4) */
			'custom.SOM.OrderExport': Readonly<{}>;
			/** Export Product Feed for Salesforce Marketing Cloud 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/rvw_salesforce_services/cartridges/int_salesforce_services/steptypes.json#4) */
			'custom.Salesforce.Marketing.Feed': Readonly<{}>;
			/** Copy or move files from one directory to another. 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#5) */
			'custom.CSComponents.MoveFiles': Readonly<{
				/** File pattern (Regular Expression) */
				'FilePattern'?: string,
				/** Source folder path */
				'SourceFolder': string,
				/** Target folder path */
				'TargetFolder': string,
				/** If NOT checked, source files will be DELETED. Use with care! */
				'CopyOnly'?: boolean,
				/** When checked, the operation will include subfolders. */
				'Recursive'?: boolean,
				/** If checked, existing files in target folder will be overwritten. */
				'Overwrite'?: boolean,
				/** No files found exit code */
				'NoFileFoundStatus'?: 'OK' | 'ERROR',
				/** Mark the step as disabled. This will skip the step and returns a OK status */
				'IsDisabled'?: boolean}>;
			/** Upload files to an (S)FTP server 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#93) */
			'custom.Feedonomics.FtpUpload': Readonly<{}>;
			/** Exports product to Amazon API 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#159) */
			'custom.amazon.exportproduct': Readonly<{}>;
			/** Exports Delta product to Amazon API 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#181) */
			'custom.amazon.exportDeltaProduct': Readonly<{}>;
			/** Update AmazonProductExport Flag based on Quantity provided by Llama. if product has zero quantity from last 60 days, will set the flag false 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#203) */
			'custom.amazon.updateAmazonProductExportFlag': Readonly<{
				/** Inventory Data Type */
				'InventoryDataType'?: string}>;
			/** Product attributes bulk updates 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#233) */
			'custom.bulk.updateProduct': Readonly<{
				/** Product folder path (in IMPEX) */
				'folder': string,
				/** Product filename path (in IMPEX) */
				'fileName': string}>;
			/** Product attributes tiktok updates 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#267) */
			'custom.tiktok.updateproduct': Readonly<{
				/** Product folder path (in IMPEX) */
				'folder': string,
				/** Product filename path (in IMPEX) */
				'fileName': string,
				/** LOA path */
				'loaPath': string}>;
			/** Delete files older than a certan age. 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#308) */
			'custom.CSComponents.CleanUpFiles': Readonly<{
				/** File pattern (Regular Expression) */
				'FilePattern'?: string,
				/** Source folder path */
				'WorkingFolder': string,
				/** No files found exit code */
				'NoFileFoundStatus'?: 'OK' | 'ERROR',
				/** Mark the step as disabled. This will skip the step and returns a OK status */
				'IsDisabled'?: boolean,
				/** Number of days to keep old files */
				'DaysToKeep'?: number}>;
			/** Zip files or directories locally 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#374) */
			'custom.CSComponents.ZipFiles': Readonly<{}>;
			/** Zip files or directories locally 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#465) */
			'custom.CSComponents.UnzipFiles': Readonly<{}>;
			/** Download files from an (S)FTP server 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#549) */
			'custom.CSComponents.FtpDownload': Readonly<{}>;
			/** Upload files to an (S)FTP server 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#644) */
			'custom.CSComponents.FtpUpload': Readonly<{}>;
			/**  
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#739) */
			'custom.CSComponents.TimeSlotCondition': Readonly<{}>;
			/** Triggers an Error Status if no Orders are being created, placed or exported for a certain amount of time. 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#785) */
			'custom.CSComponents.OrderGuard': Readonly<{}>;
			/** Export Frenzy Product Feed 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#857) */
			'custom.frenzy.ProductExport': Readonly<{}>;
			/** Export Product Catalog Feed 
			 * @source [definition](file:///home/inno-rakesh/Desktop/err/work/sfcctest/autobahn/sfcc-job-components/cartridges/bc_job_components/steptypes.json#941) */
			'custom.catalog.ProductExport': Readonly<{}>;
		}



}
	export {};
