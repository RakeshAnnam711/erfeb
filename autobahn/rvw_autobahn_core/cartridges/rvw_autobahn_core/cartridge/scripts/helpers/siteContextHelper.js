'use strict';

var Logger = require('dw/system/Logger').getLogger('AB SiteContext');
var Site = require('dw/system/Site');
var System = require('dw/system/System');
var URLUtils = require('dw/web/URLUtils');

var currentSite = Site.getCurrent();
var sandboxSitePathRegExp = new RegExp('^\/s\/' + currentSite.ID,'g');
var multiBrandHelper = require('*/cartridge/scripts/helpers/brands/multiBrandHelper');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');

/*
 * This is a custom Site Context configuration
 * Example JSON that should be defined in a site preference "siteContextJSON"
[
    {
        "host": "www.autobahn038.com", // required. this should match the alias in BM.
        "brandID": "site1", // required. alphanumeric only. no spaces or symbols.
        "brandName": "Red Van Workshop" // optional. The brand display name. Will display as brandID if empty.
        "sitePath": "beauty-box", // optional. Used for sites where host is the same between sites but brand is in the sitepath.
        "isDefault": true, // required - Only 1 must be set to true.
        "logo": { // @NOTE: updates to the css class 'header-logo-image' must be made to display the current site logo.
            "url": "//domain/site-assets/images/logos/logo.svg", // required if displaying logo externally. This will be used first if fileName is also provided.
            "fileName": "" // required if image is in repo. Save image under 'static/default/images/'.
        },
        "rootCatalogID": "electronics-m-catalog", // optional. Uses site root by default. Loads to menu navigation first if value is present, otherwise it'll fallback on rootCategoryID or the current site root catalog.
        "rootCategoryID": "womens" // optional. Uses site root by default. Loads as the menu navigation and redirect path to the PLP (if sitePath has a value). If 'rootCatalogID' value is present, the menu navigation will load the root catalog instead
    }
]
*/

function getHostKey(siteObj) {
    var hostKey = 'host';

    if (!(hostKey in siteObj)) {
        hostKey = 'hostStaging'; // AUTOBAHN TODO Add hostDevelopment Support

        if (System.getInstanceType() === System.PRODUCTION_SYSTEM) {
            hostKey = 'hostProduction';
        }
    }

    return hostKey;
}

/**
 * Retrieves the current brand ID context based on the httpHost
 * @param {Array} sites - List of sites
 * @param {dw.system.Request} request - The current request
 * @returns {String} - The current site ID
*/
function getCurrentBrandID(sites, req) {
    var originalBrand = Site.getCurrent().getID();
    var originalBrandIsInSites;
    var currentSiteBrandID;
    var defaultBrandID;
    var currentSession = req.session.raw;
    var lastActiveSite = currentSession.custom.siteContextID || null;
    var pdEditMode = PageRenderHelper.isInEditMode();

    // create a reduced list og current groups for PD Edit mode
    var activeBrands = (pdEditMode && currentSession.customer && currentSession.customer.customerGroups ? currentSession.customer.customerGroups.toArray() : []).filter(group => group.custom.isSiteContextGroup);

    if (sites && sites.length) {
        for (var siteObj of sites) {
            var reqHttpHost = req.host;
            var hostKey = getHostKey(siteObj);
            var siteHost = siteObj.sitePath ? siteObj[hostKey] + '/' + siteObj.sitePath : siteObj[hostKey];

            // Host includes a site path
            if (siteObj.sitePath) {
                var requestPath = (req.httpHeaders.get('x-is-path_translated') || '').replace(sandboxSitePathRegExp, '');
                reqHttpHost += requestPath;
            }

            // BM View, returns last match since customer groups can be multiselect
            if (pdEditMode) {
                activeBrands.forEach(function (group) {
                    if (group.ID === siteObj.brandID) {
                        currentSiteBrandID = group.ID;
                    }
                });
            // Storefront View
            } else if (!pdEditMode && reqHttpHost.includes(siteHost)) {
                currentSiteBrandID = siteObj.brandID;
            }
            // Setup Default
            if (siteObj.isDefault) {
                defaultBrandID = siteObj.brandID; // use as backup brand ID
            }
            // Track Standard ID
            if (siteObj.brandID === originalBrand) {
                originalBrandIsInSites = true;
            }
        }
    }
    if (!currentSiteBrandID && req.httpParameterMap.bid.value) {
        //if no matching sites based on sitePath then look for an brand id (bid)
        //check is that bid value matches a custom object first
        currentSiteBrandID = multiBrandHelper.checkForBrandID(req.httpParameterMap.bid.value) ? req.httpParameterMap.bid.value : false;
    }

    if (!currentSiteBrandID) {
        if (!defaultBrandID) {
            if (sites & sites.length) {
                defaultBrandID = originalBrandIsInSites ? originalBrand : sites[0].brandID;
            } else {
                defaultBrandID = originalBrand;
            }
        }

        try {
            //check to see if the lastActiveSite is a deleted site, if it is: set to null to use the defaultBrandID
            //Check if there are custom Object brands before wiping lastActiveSite
            if (multiBrandHelper.getBrandCount() > 0) {
                lastActiveSite = multiBrandHelper.checkIfBrandIsNotDeleted(lastActiveSite) ? lastActiveSite : null;
            }
        } catch (e) {
            //Failed to check custom objects, use lastActiveSite
        }

        currentSiteBrandID =  !empty(lastActiveSite) ? lastActiveSite : defaultBrandID;
    }

    return currentSiteBrandID;
}

/**
 * Retrieves the site context
 * @param {Object} req - request object
 * @returns {Object}
*/
function getSiteContext(req) {
    var siteContextJSON = currentSite.getCustomPreferenceValue('siteContextJSON');
    var siteContext = {
        logos: [],
        urlParametersArray: []
    };

    try {
        var sites = JSON.parse(siteContextJSON);
        var defaultBrand = [];

        if (!sites) {
            sites = (multiBrandHelper.getAllBrandsOrderedBy('navOrder', 'asc') || [])
                .filter(function(customObj) {
                    var brand = customObj.custom;
                    var hostKey = getHostKey(brand);

                    if (brand.isDefault && !brand.siteDeleted) {
                        defaultBrand.push(brand.brandID);

                        if (defaultBrand.length > 1) Logger.warn('Multi active brands are set as default: {0}', defaultBrand.join(', '));
                    }

                    return !empty(brand.brandID) && !empty(brand[hostKey]) && !brand.siteDeleted;
                })
                .map(function (customObj) {
                    // Convert to std Object class
                    return Object.assign({}, customObj.custom);
                });
        }

        var brandID = getCurrentBrandID(sites, req);

        siteContext.ID = brandID;
        siteContext.url = URLUtils.sessionRedirect(req.host, null).toString();
        siteContext.name = currentSite.getName() || brandID;

        (sites || []).forEach(function (siteObj) {
            // Convert to std Object class
            var hostKey = getHostKey(siteObj);
            if (!siteObj.brandID || !siteObj[hostKey]) return;

            try {
                siteObj.logo = siteObj.logo || JSON.parse(siteObj.logoJSON || '{}');
            } catch (e) {
                Logger.error('Error parsing logo for brand: {3}, {0} [{1}:{2}]', e.toString(), e.fileName, e.lineNumber, siteObj.brandID);
            }

            var isCurrentSite = siteObj.brandID === siteContext.ID;
            var siteHost = siteObj[hostKey];
            var isSameHost = (req.host || '').toLowerCase().indexOf(siteHost.toLowerCase()) !== -1;
            var hasHostPath = 'sitePath' in siteObj && siteObj.sitePath.length > 0;
            var categoryID = 'rootCategoryID' in siteObj && siteObj.rootCategoryID ? siteObj.rootCategoryID : null;
            var useRootCategory = 'useRootCategory' in siteObj ? siteObj.useRootCategory : !empty(categoryID);
            var sessionRedirectURL = useRootCategory && categoryID && hasHostPath ? URLUtils.url('Search-Show', 'cgid', categoryID).host(siteHost) : URLUtils.https('Home-Show').host(siteHost); // go to category or homepage only

            if (isSameHost) sessionRedirectURL.append('bid', siteObj.brandID);

            var logoURL = URLUtils.sessionRedirect(siteHost, sessionRedirectURL).toString();
            var logoImage;

            if (!empty(siteObj.logo) && !empty(siteObj.logo.url || siteObj.logo.fileName)) {
                logoImage = !empty(siteObj.logo.url) ? siteObj.logo.url : URLUtils.staticURL('/images/' + siteObj.logo.fileName).toString();
            }

            // only push if siteActive for brand/site selector
            if (siteObj.siteActive) {
                var logoObject = {};

                if (!empty(siteObj.brandID)) logoObject.siteID = siteObj.brandID;

                if (!empty(siteObj.brandName)) logoObject.siteName = siteObj.brandName;

                if (!empty(logoImage)) logoObject.imageURL = logoImage;

                if (!empty(logoURL)) logoObject.link = logoURL;

                if (!empty(siteObj.src)) logoObject.src = siteObj.src;

                siteContext.logos.push(logoObject);
            }

            // Get current site home url
            if (isCurrentSite) {
                if (!empty(logoURL)) {
                    Object.defineProperty(siteContext, 'url', {
                        value: logoURL
                    });
                }

                if (!empty(siteObj.brandName)) siteContext.name = siteObj.brandName;

                if (!empty(siteObj.rootCatalogID)) siteContext.catalog = siteObj.rootCatalogID;

                if (!empty(categoryID)) siteContext.category = categoryID;

                if (!empty(logoImage)) siteContext.logo = logoImage; // if empty, it'll fallback on 'logo-home' class logo

                if (!empty(siteObj.liveChatID)) siteContext.liveChatID = siteObj.liveChatID;
            }
        });
    } catch (e) {
        Logger.error('There was an issue while retrieving siteContext data. {0} [{1}:{2}]', e.toString(), e.fileName, e.lineNumber);
    }

    try {
        var ProductMgr = require('dw/catalog/ProductMgr');
        var CatalogMgr = require('dw/catalog/CatalogMgr');

        var reqProduct = !empty(req.querystring.pid) ? ProductMgr.getProduct(req.querystring.pid) : null;
        var reqCategory = !empty(req.querystring.cgid) ? CatalogMgr.getCategory(req.querystring.cgid) : null;

        if (empty(reqCategory) && reqProduct) {
            reqCategory = reqProduct.primaryCategory;
        }

        if (reqCategory) {
            siteContext.activecategory = reqCategory.ID;
        }
    } catch (e) {
        Logger.error('There was an issue while retrieving active siteContext data. {0}', e.toString());
    }

    // Setup URL Parameter Array
    //['cgid', siteContext.category || '', 'catalog', siteContext.catalog || '', 'activecategory', siteContext.activecategory || '']
    let parameterMap = {
        ID: 'brandID',
        catalog: 'catalog',
        category: 'cgid',
        activecategory: 'activecategory'
    };

    for (let key in parameterMap) {
        if (!empty(siteContext[key])) siteContext.urlParametersArray.push(parameterMap[key], siteContext[key] || '');
    }

    return siteContext;
}

module.exports = {
    getSiteContext: getSiteContext
}
