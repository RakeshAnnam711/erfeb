var SiteConstants = require('constants/SiteConstants');

window.jQuery = window.$ = require('jquery');
window.isMobile = () => $(window).outerWidth() < SiteConstants.BreakpointSizes.lg;

// WGACA MODIFICATION - extend JQuery Object with additional libraries
require('jquery-ui/dist/jquery-ui');
require('jquery-ui-touch-punch');

var processInclude = require('base/util');

/**
 * A list of base Files, leave these in order they are listed
 */
var baseFiles = {
    menu: require('./components/menu'),
    cookie: require('base/components/cookie'),
    consentTracking: require('./components/consentTracking'),
    footer: require('./components/footer'),
    miniCart: require('./components/miniCart'),
    collapsibleItem: require('./components/collapsibleItem'),
    search: require('./components/search').init,
    clientSideValidation: require('./components/clientSideValidation'),
    countrySelector: require('./components/countrySelector'),
    header: require('./components/header'),
    tabs: require('./components/tabs'),
    toast: require('./components/toast'),
    toolTip: require('./components/toolTip'),
    video: require('./components/video'),
    tile: require('./product/tile'),
    base: require('./product/base'),
    quickView: require('./product/quickView'),
    productTile: require('./components/productTile'),
    giftCertificate: require('./giftCertificate/giftCertificate').init,
    modal: require('./components/modal').init,
    slider: require('./components/slider').init,
    einsteinRecs: require('./components/einsteinRecs').init,
    wishlist: require('./wishlist/wishlist'),
    cart: require('./cart'),
    scroll: require('./utilities/scroll'),
    headerUtils: require('./utilities/headerUtils'),
    pageDesigner: require('pagedesigner/pageDesigner'),
    pageDesignerBase: require('pagedesigner/base/index'),
    storeLocator: require('./storeLocator/storeLocator')
};

$(document).ready(() => {
    Object.keys(baseFiles).forEach(function (key) {
        processInclude(baseFiles[key]);
    });
});

require('./thirdParty/bootstrap');
require('focus-visible/dist/focus-visible.min.js');
require('base/components/spinner');

module.exports = {
    baseFiles
};