'use strict';

var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var ContentMgr = require('dw/content/ContentMgr');
var ContentSearchModel = require('dw/content/ContentSearchModel');
var URLUtils = require('dw/web/URLUtils');
var URLAction = require('dw/web/URLAction');
var URLParameter = require('dw/web/URLParameter');
var SitemapMgr = require('dw/sitemap/SitemapMgr');

var STOREFRONT_BASE_URL = Site.getCurrent().getCustomPreferenceValue('storefrontBaseUrl');

var MAX_URLS_PER_FILE = 50000;
var MAX_FILE_SIZE_IN_BYTES = 9 * 1024 * 1024;
var DEFAULT_CHANGE_FREQ = 'daily';
var DEFAULT_PRIORITY = '0.5';
var EXCLUDE_PRODUCT_IMAGES = false;

var TEMP_FOLDER_PATH = File.TEMP + '/regional-sitemaps-temp';
var FINAL_FOLDER_PATH = File.IMPEX + '/regional-sitemaps';

function execute(args) {
    try {
        MAX_URLS_PER_FILE = args && args.MAX_URLS_PER_FILE ? parseInt(args.MAX_URLS_PER_FILE, 10) : MAX_URLS_PER_FILE;
        MAX_FILE_SIZE_IN_BYTES = args && args.MAX_FILE_SIZE_IN_MB ? parseInt(args.MAX_FILE_SIZE_IN_MB, 10) * 1024 * 1024 : MAX_FILE_SIZE_IN_BYTES;
        DEFAULT_CHANGE_FREQ = args && args.DEFAULT_CHANGE_FREQ ? args.DEFAULT_CHANGE_FREQ : DEFAULT_CHANGE_FREQ;
        DEFAULT_PRIORITY = args && args.DEFAULT_PRIORITY ? args.DEFAULT_PRIORITY : DEFAULT_PRIORITY;
        var fileExclusionKeywords = args && args.fileExclusionKeywords ? args.fileExclusionKeywords.split(',') : [];
        EXCLUDE_PRODUCT_IMAGES = args && args.excludeProductImages ? (args.excludeProductImages == true) : EXCLUDE_PRODUCT_IMAGES;
        var hostname = args && args.hostname ? args.hostname : 'www.whatgoesaroundnyc.com';

        var tempDir = new File(TEMP_FOLDER_PATH);
        if (!tempDir.exists()) {
            tempDir.mkdirs();
        }
        var siteLocales = Site.getCurrent().getAllowedLocales();
        var defaultLocale = Site.getCurrent().getDefaultLocale();
        var allSitemapFiles = [];

        siteLocales.toArray().forEach(function (locale) {
            Logger.info('Generating sitemap for locale: {0}', locale);
            var localeSitemaps = generateLocaleSitemap(locale);
            localeSitemaps.forEach(function (fileName) {
                allSitemapFiles.push({
                    fileName: fileName,
                    locale: locale
                });
            });
        });

        if(!EXCLUDE_PRODUCT_IMAGES){
            var imageSitemap = generateImageSitemaps();
            imageSitemap.forEach(function (fileName) {
                allSitemapFiles.push({
                        fileName: fileName,
                        locale: defaultLocale
                    });
            });
        }

        cleanUpFinalDir();
        moveTempFilesToFinal();
        deleteAllCustomFilesFromSitemapMgr();
        addFilesToSitemapMgr(fileExclusionKeywords, hostname);
        cleanUpTempDir();
        Logger.info('Sitemap generation completed successfully.');
    } catch (e) {
        Logger.error('Error during sitemap generation: {0}', e);
    }
}

function deleteAllCustomFilesFromSitemapMgr() {
    SitemapMgr.deleteCustomSitemapFiles();
}

function moveTempFilesToFinal() {
    var finalDir = new File(FINAL_FOLDER_PATH);
    if (!finalDir.exists()) {
        finalDir.mkdirs();
    }
    var tempDir = new File(TEMP_FOLDER_PATH);
    var files = tempDir.listFiles();

    files.toArray().forEach(function (tempFile) {
        var finalFile = new File(FINAL_FOLDER_PATH + '/' + tempFile.getName());
        tempFile.renameTo(finalFile);
    });
}

function addFilesToSitemapMgr(fileExclusionKeywords, hostname) {
    var finalDir = new File(FINAL_FOLDER_PATH);
    var files = finalDir.listFiles();

    files.toArray().forEach(function (sFile) {
        var name = sFile.getName();

        // skip files that contain any of the exclude tokens
        var shouldExclude = fileExclusionKeywords.some(function (token) {
            return name.indexOf(token) !== -1;
        });

        if (shouldExclude) {
            return;
        }

        try {
            SitemapMgr.addCustomSitemapFile(hostname, sFile);
        } catch (e) {
            Logger.error('Failed to add sitemap file to SitemapMgr: {0} - {1}', name, e.message || e);
        }
    });
}

function cleanUpFinalDir() {
    var finalDir = new File(FINAL_FOLDER_PATH);
    if (finalDir.exists()) {
        var files = finalDir.listFiles();
        files.toArray().forEach(function (file) {
            file.remove();
        });
        finalDir.remove();
    }
}

function cleanUpTempDir() {
    var tempDir = new File(TEMP_FOLDER_PATH);
    if (tempDir.exists()) {
        var files = tempDir.listFiles();
        files.toArray().forEach(function (file) {
            file.remove();
        });
        tempDir.remove();
    }
}

function createSitemapFile(index) {
    var path = TEMP_FOLDER_PATH;
    var fileName = 'images-' + index + '.xml';
    var file = new File(path + '/' + fileName);
    var writer = new FileWriter(file, 'UTF-8');
    var xsw = new XMLStreamWriter(writer);

    xsw.writeStartDocument('UTF-8', '1.0');
    xsw.writeStartElement('urlset');
    xsw.writeAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
    xsw.writeAttribute('xmlns:image', 'http://www.google.com/schemas/sitemap-image/1.1');

    return {
        file: file,
        writer: writer,
        xsw: xsw,
        fileName: fileName,
        urlCount: 0
    };
}

function generateImageSitemaps() {
    var allProducts = ProductMgr.queryAllSiteProducts();
    var sitemaps = [];
    var sitemapIndex = 1;
    var sitemap = createSitemapFile(sitemapIndex);

    while (allProducts.hasNext()) {
        var product = allProducts.next();
        if (!product.online || !product.siteMapIncluded) continue;

        var images = product.getImages('large').toArray();
        if (images.length === 0) continue;

        sitemap.xsw.writeStartElement('url');
        var productUrl = STOREFRONT_BASE_URL + URLUtils.url('Product-Show', 'pid', product.ID).toString();
        sitemap.xsw.writeStartElement('loc');
        sitemap.xsw.writeCharacters(productUrl);
        sitemap.xsw.writeEndElement(); // </image:loc>

        images.forEach(function (img) {
            sitemap.xsw.writeStartElement('image:image');

                sitemap.xsw.writeStartElement('image:loc');
                    sitemap.xsw.writeCharacters(STOREFRONT_BASE_URL + img.getURL().toString());
                sitemap.xsw.writeEndElement(); // </image:loc>

                sitemap.xsw.writeStartElement('image:caption');
                    sitemap.xsw.writeCharacters(img.alt);
                sitemap.xsw.writeEndElement(); // </image:caption>

                sitemap.xsw.writeStartElement('image:title');
                    sitemap.xsw.writeCharacters(img.title);
                sitemap.xsw.writeEndElement(); // </image:title>

            sitemap.xsw.writeEndElement(); // </image:image>
        });

        sitemap.xsw.writeEndElement(); // </url>
        sitemap.urlCount++;

        // Check limits
        if (sitemap.urlCount >= MAX_URLS_PER_FILE || sitemap.file.length() >= MAX_FILE_SIZE_IN_BYTES) {
            sitemap.xsw.writeEndElement(); // </urlset>
            sitemap.xsw.writeEndDocument();
            sitemap.xsw.close();
            sitemap.writer.close();

            sitemaps.push(sitemap.fileName);
            sitemapIndex++;
            sitemap = createSitemapFile(sitemapIndex);
        }
    }

    // Final file close
    sitemap.xsw.writeEndElement(); // </urlset>
    sitemap.xsw.writeEndDocument();
    sitemap.xsw.close();
    sitemap.writer.close();
    sitemaps.push(sitemap.fileName);

    allProducts.close();

    return sitemaps;
}

function getActionWithLocale(pipeline, locale) {
    var currentSite = Site.getCurrent();
    return new URLAction(pipeline, currentSite.ID, locale);
}

function generateLocaleSitemap(locale) {
    var sitemapCount = 1;
    var urlCount = 0;
    var fileSize = 0;
    var sitemapFiles = [];

    var sitemapFilename = getSitemapFilename(locale, sitemapCount);

    var file = new File(TEMP_FOLDER_PATH + '/' + sitemapFilename);
    var writer = new FileWriter(file, 'UTF-8');
    var xmlWriter = new XMLStreamWriter(writer);

    startSitemap(xmlWriter);

    function writeUrlEntry(loc, changefreq, priority, lastmod, imageUrls) {
        // Check limits
        if (urlCount >= MAX_URLS_PER_FILE || fileSize >= MAX_FILE_SIZE_IN_BYTES) {
            endSitemap(xmlWriter);
            writer.close();
            sitemapFiles.push(sitemapFilename);

            sitemapCount++;
            sitemapFilename = getSitemapFilename(locale, sitemapCount);
            file = new File(TEMP_FOLDER_PATH + '/' + sitemapFilename);
            writer = new FileWriter(file, 'UTF-8');
            xmlWriter = new XMLStreamWriter(writer);
            startSitemap(xmlWriter);

            urlCount = 0;
            fileSize = 0;
        }

        xmlWriter.writeStartElement('url');

        xmlWriter.writeStartElement('loc');
        xmlWriter.writeCharacters(loc);
        xmlWriter.writeEndElement();

        if (lastmod) {
            xmlWriter.writeStartElement('lastmod');
            xmlWriter.writeCharacters(lastmod);
            xmlWriter.writeEndElement();
        }

        xmlWriter.writeStartElement('changefreq');
        xmlWriter.writeCharacters(changefreq);
        xmlWriter.writeEndElement();

        xmlWriter.writeStartElement('priority');
        xmlWriter.writeCharacters(priority);
        xmlWriter.writeEndElement();

        if (imageUrls && imageUrls.length > 0) {
            imageUrls.forEach(function (imgUrl) {
                xmlWriter.writeStartElement('image:image');
                xmlWriter.writeStartElement('image:loc');
                xmlWriter.writeCharacters(imgUrl);
                xmlWriter.writeEndElement(); // image:loc
                xmlWriter.writeEndElement(); // image:image
            });
        }

        xmlWriter.writeEndElement(); // url

        urlCount++;
        var approxSize = loc.length * 2;
        if (imageUrls) {
            imageUrls.forEach(function (img) {
                approxSize += img.length * 2;
            });
        }
        fileSize += approxSize;
    }

    // Add all URLs
    addCategories(writeUrlEntry, locale);
    addProducts(writeUrlEntry, locale);
    addContentPages(writeUrlEntry, locale);
    addSharedLibraryFolders(writeUrlEntry, locale);

    endSitemap(xmlWriter);
    writer.close();
    sitemapFiles.push(sitemapFilename);

    return sitemapFiles;
}

function addCategories(writeFn, locale) {
    var catalog = CatalogMgr.getSiteCatalog();
    var rootCategories = catalog.getRoot().getOnlineSubCategories().toArray();
    rootCategories.forEach(function (category) {
        processCategory(writeFn, category, locale);
    });
}

function getChangeFreqOrDefault(changeFreq) {
    return changeFreq ? changeFreq : DEFAULT_CHANGE_FREQ;
}

function getPriorityOrDefault(priority) {
    return priority ? priority : DEFAULT_PRIORITY;
}

function processCategory(writeFn, category, locale) {
    if (category.online && category.siteMapIncluded) {
        var url = STOREFRONT_BASE_URL + URLUtils.url(getActionWithLocale('Search-Show', locale), new URLParameter('cgid', category.ID)).toString();
        writeFn(url,
            getChangeFreqOrDefault(category.siteMapChangeFrequency),
            getPriorityOrDefault(category.siteMapPriority),
            getCurrentISODate(),
            []);
    }
    var subCategories = category.getOnlineSubCategories().toArray();
    subCategories.forEach(function (subCat) {
        processCategory(writeFn, subCat, locale);
    });
}

function addProducts(writeFn, locale) {
    var productIter = ProductMgr.queryAllSiteProducts();
    while (productIter.hasNext()) {
        var product = productIter.next();
        if (!product.online || !product.siteMapIncluded) continue;

        var url = STOREFRONT_BASE_URL + URLUtils.url(getActionWithLocale('Product-Show', locale), new URLParameter('pid', product.ID)).toString();

        writeFn(url,
            getChangeFreqOrDefault(product.siteMapChangeFrequency),
            getPriorityOrDefault(product.siteMapPriority),
            getCurrentISODate(),
            []);
    }
    productIter.close();
}

function addContentPages(writeFn, locale) {
    var searchModel = new ContentSearchModel();
    searchModel.setSearchPhrase('*');
    searchModel.setRecursiveFolderSearch(true);
    searchModel.search();
    var contentIter = searchModel.getContent().asList().iterator();
    while (contentIter.hasNext()) {
        var content = contentIter.next();
        if (content.isOnline() && content.siteMapIncluded) {
            var url = STOREFRONT_BASE_URL + URLUtils.url(getActionWithLocale('Page-Show', locale), new URLParameter('cid', content.ID)).toString();
            writeFn(url,
                getChangeFreqOrDefault(content.siteMapChangeFrequency),
                getPriorityOrDefault(content.siteMapPriority),
                getCurrentISODate(),
                []);
        }
    }
}

function addSharedLibraryFolders(writeFn, locale) {
    var siteLibrary = ContentMgr.getSiteLibrary();
    if (!siteLibrary) {
        Logger.warn('No Site Library found');
        return;
    }

    Logger.info('SiteLibrary: [{0}]', siteLibrary.ID);

    var folders = siteLibrary.getRoot() ? siteLibrary.getRoot().getSubFolders().toArray() : [];
    folders.forEach(function (folder) {
        processFolder(folder, writeFn, locale);
    });
}

function processFolder(folder, writeFn, locale) {
    if (folder.online && folder.siteMapIncluded) {
        var url = STOREFRONT_BASE_URL + URLUtils.url(getActionWithLocale('Page-Show', locale), new URLParameter('cid', folder.ID)).toString();
        writeFn(url,
            getChangeFreqOrDefault(folder.siteMapChangeFrequency),
            getPriorityOrDefault(folder.siteMapPriority),
            getCurrentISODate(),
            []);
    }
    var contentAssets = folder.getOnlineContent().toArray();
    contentAssets.forEach(function (content) {
        if (content.siteMapIncluded) {
            var url = STOREFRONT_BASE_URL + URLUtils.url(getActionWithLocale('Page-Show', locale), new URLParameter('cid', content.ID)).toString();
            writeFn(url,
                getChangeFreqOrDefault(content.siteMapChangeFrequency),
                getPriorityOrDefault(content.siteMapPriority),
                getCurrentISODate(),
                []);
        }
    });
    // Recurse into subfolders
    var subFolders = folder.getSubFolders().toArray();
    subFolders.forEach(function (subFolder) {
        processFolder(subFolder, writeFn, locale);
    });
}

function startSitemap(xmlWriter) {
    xmlWriter.writeStartDocument('UTF-8', '1.0');
    xmlWriter.writeStartElement('urlset');
    xmlWriter.writeAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
    xmlWriter.writeAttribute('xmlns:image', 'http://www.google.com/schemas/sitemap-image/1.1');
    xmlWriter.writeAttribute('xmlns:xhtml', 'http://www.w3.org/1999/xhtml');
    xmlWriter.writeAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
    xmlWriter.writeAttribute('xsi:schemaLocation',
        'http://www.sitemaps.org/schemas/sitemap/0.9 ' +
        'http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd ' +
        'http://www.google.com/schemas/sitemap-image/1.1 ' +
        'http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd ' +
        'http://www.w3.org/1999/xhtml ' +
        'http://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd');
}

function endSitemap(xmlWriter) {
    xmlWriter.writeEndElement(); // urlset
    xmlWriter.writeEndDocument();
}

function getSitemapFilename(locale, count) {
    return locale + '-' + count + '.xml';
}

function getCurrentISODate() {
    return new Date().toISOString();
}

module.exports = {
    execute: execute
};
