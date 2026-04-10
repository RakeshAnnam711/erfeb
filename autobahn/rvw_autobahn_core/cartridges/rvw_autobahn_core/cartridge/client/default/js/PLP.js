'use strict';

/**
 * PLP.js - Optimized JavaScript bundle for Product Listing Pages (PLP)
 * This file contains only the essential components needed for PLP pages
 * to reduce initial JavaScript execution time and improve performance scores
 */

const SiteConstants = require('constants/SiteConstants');

window.jQuery = window.$ = require('jquery');
window.isMobile = () => $(window).outerWidth() < SiteConstants.BreakpointSizes.lg;

const processInclude = require('base/util');

// Lazy load jQuery UI only when needed (saves ~200KB from initial bundle)
let jqueryUILoaded = false;
let jqueryUITouchPunchLoaded = false;
const loadJQueryUI = function() {
    if (!jqueryUILoaded) {
        require('jquery-ui/dist/jquery-ui');
        jqueryUILoaded = true;
    }
    if (!jqueryUITouchPunchLoaded) {
        require('jquery-ui-touch-punch');
        jqueryUITouchPunchLoaded = true;
    }
};

// Helper to check if element exists (lightweight - uses native DOM)
const elementExists = function(selector) {
    return document.querySelector(selector) !== null;
};

/**
 * PLP Critical Components - Only what's needed for initial product grid render
 * These are the absolute minimum for PLP functionality
 */
const plpCriticalFiles = {
    menu: require('./components/menu'),
    cookie: require('base/components/cookie'),
    consentTracking: require('./components/consentTracking'),
    header: require('./components/header'),
    search: require('./components/search').init,
    tile: require('./product/tile'),
    productTile: require('./components/productTile'),
    miniCart: require('./components/miniCart'),
    toast: require('./components/toast')
};

/**
 * PLP Secondary Components - Load after initial render (50-100ms delay)
 * These are important but not blocking first paint
 */
const plpSecondaryFiles = {
    cart: require('./cart'),
    scroll: require('./utilities/scroll')
};

/**
 * PLP Lazy Components - Load conditionally or on interaction
 * Only load if their DOM elements exist on the page
 */
const plpLazyFiles = {
    tabs: () => require('./components/tabs'),
    toolTip: () => require('./components/toolTip'),
    quickView: () => {
        loadJQueryUI(); // QuickView may need jQuery UI
        return require('./product/quickView');
    },
    wishlist: () => require('./wishlist/wishlist'),
    footer: () => require('./components/footer'),
    headerUtils: () => require('./utilities/headerUtils'),
    base: () => require('./product/base')
};

// Component selectors for conditional loading
const componentSelectors = {
    tabs: '.tabs, [role="tablist"], .nav-tabs',
    toolTip: '[data-toggle="tooltip"], .tooltip',
    quickView: '.quickview, [data-quickview], .product-tile[data-pid]',
    wishlist: '.wishlist, [data-wishlist], .add-to-wishlist',
    footer: 'footer',
    base: '.product-detail, .pdp'
};

// Load lazy components conditionally
const loadLazyComponents = () => {
    Object.keys(plpLazyFiles).forEach((key) => {
        const selector = componentSelectors[key];
        if (!selector || elementExists(selector)) {
            try {
                processInclude(plpLazyFiles[key]());
            } catch (e) {
                console.warn('PLP: Failed to load lazy component:', key, e);
            }
        }
    });
};

// Initialize PLP components with optimized loading strategy
const initializePLP = function() {
    // Load critical components immediately (synchronous for first paint)
    Object.keys(plpCriticalFiles).forEach(function(key) {
        try {
            processInclude(plpCriticalFiles[key]);
        } catch (e) {
            console.warn('PLP: Failed to load critical component:', key, e);
        }
    });
    
    // Load secondary components after a micro-delay (non-blocking)
    const loadSecondary = function() {
        Object.keys(plpSecondaryFiles).forEach(function(key) {
            try {
                processInclude(plpSecondaryFiles[key]);
            } catch (e) {
                console.warn('PLP: Failed to load secondary component:', key, e);
            }
        });
    };
    
    // Use requestIdleCallback with short timeout for secondary
    if (window.requestIdleCallback) {
        requestIdleCallback(loadSecondary, { timeout: 100 });
    } else {
        setTimeout(loadSecondary, 50);
    }
    
    // Load lazy components when browser is idle
    const loadLazy = function() {
        loadLazyComponents();
    };
    
    if (window.requestIdleCallback) {
        requestIdleCallback(loadLazy, { timeout: 3000 });
    } else {
        setTimeout(loadLazy, 500);
    }
};

// Defer heavy libraries completely - load only when needed
const loadHeavyLibraries = function() {
    // Bootstrap - only load if Bootstrap components exist
    if (elementExists('.modal, .dropdown, .collapse, .carousel, [data-toggle]')) {
        require('./thirdParty/bootstrap');
    }
    
    // Focus-visible - defer to idle time (low priority polyfill)
    if (window.requestIdleCallback) {
        requestIdleCallback(function() {
            require('focus-visible/dist/focus-visible.min.js');
        }, { timeout: 5000 });
    } else {
        setTimeout(function() {
            require('focus-visible/dist/focus-visible.min.js');
        }, 2000);
    }
    
    // Spinner - load only when needed (usually on form submissions)
    if (window.requestIdleCallback) {
        requestIdleCallback(function() {
            require('base/components/spinner');
        }, { timeout: 5000 });
    } else {
        setTimeout(function() {
            require('base/components/spinner');
        }, 2000);
    }
};

// Start initialization
if (document.readyState === 'loading') {
    $(document).ready(function() {
        initializePLP();
        
        // Defer heavy libraries after page is interactive
        if (window.requestIdleCallback) {
            requestIdleCallback(loadHeavyLibraries, { timeout: 2000 });
        } else {
            setTimeout(loadHeavyLibraries, 1000);
        }
    });
} else {
    // Document already loaded
    initializePLP();
    if (window.requestIdleCallback) {
        requestIdleCallback(loadHeavyLibraries, { timeout: 2000 });
    } else {
        setTimeout(loadHeavyLibraries, 1000);
    }
}

// Export for backward compatibility (if needed)
const baseFiles = {};
Object.keys(plpCriticalFiles).forEach(function(key) {
    baseFiles[key] = plpCriticalFiles[key];
});
Object.keys(plpSecondaryFiles).forEach(function(key) {
    baseFiles[key] = plpSecondaryFiles[key];
});
Object.keys(plpLazyFiles).forEach(function(key) {
    baseFiles[key] = function() {
        return plpLazyFiles[key]();
    };
});

module.exports = {
    baseFiles: baseFiles
};

