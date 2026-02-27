
(function () {
    const previousPageType = sessionStorage.getItem('previousPageType') || '';
    const currentPageType = sessionStorage.getItem('currentPageType') || '';

    if (previousPageType === 'SKU Search') {
        if (currentPageType === 'PLP Page' || currentPageType === 'frenzysearch') {
            sessionStorage.setItem('previousPageType', 'frenzysearch');
        }
    }
})();
// capture clicks on legal links
$(document).on('click', '.register-privacy-policy-link', function () {
    sessionStorage.setItem('checkoutLegalNav', 'true');
});

$(document).ready(function () {
    var isCheckout = window.location.pathname.includes('/checkout');
    var comingFromLegal = sessionStorage.getItem('checkoutLegalNav') === 'true';

    if (isCheckout) {
        var registerIntent = sessionStorage.getItem('checkoutRegisterIntent');
        if (registerIntent === 'true') {
            $('a[href="#register"]').tab('show');
        } else {
            $('a[href="#login"]').tab('show');
        }
        $('a[href="#register"]').on('click', function () {
            sessionStorage.setItem('checkoutRegisterIntent', 'true');
        });
        $('a[href="#login"]').on('click', function () {
            sessionStorage.removeItem('checkoutRegisterIntent');
        });
        sessionStorage.removeItem('checkoutLegalNav');
    } else if (!comingFromLegal) {
        sessionStorage.removeItem('checkoutRegisterIntent');
    }
});


function setCurrentPageType(pageType) {
    const previous = sessionStorage.getItem('currentPageType') || '';
    sessionStorage.setItem('previousPageType', previous);
    sessionStorage.setItem('currentPageType', pageType);
}

function fireSearchEvent(term, label = 'search') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: label,
        search_term: term
    });
}

function navigateWithDelay(href, delay = 50) {
    setTimeout(() => {
        window.location.href = href;
    }, delay);
}

function handleGlobalClick(event) {
    const target = event.target;
    // Product tile click
    const productLink = target.closest('.product-click-track');
    if (productLink && productLink.dataset.pageType) {
        setCurrentPageType(productLink.dataset.pageType);
    }

    // Suggestions click
    const productSuggestion = target.closest('.suggestions-products-a');
    if (productSuggestion) {
        event.preventDefault();
        try {
            const clickedText = productSuggestion.textContent.trim();
            const item = productSuggestion.closest('.suggestions-item');
            const list = item?.closest('.suggestions-items');
            const header = list?.previousElementSibling;
            const sectionLabel = header?.textContent.trim() || '';

            const sectionToPageType = {
                'Products': 'search_products_carousel',
                'Popular Products': 'search_popularProducts_carousel'
            };

            const pageType = sectionToPageType[sectionLabel] || 'frenzysearch';
            sessionStorage.setItem('currentPageType', pageType);

            fireSearchEvent(clickedText, 'search');
            navigateWithDelay(productSuggestion.href);
        } catch (err) {
            console.error('Error handling product suggestion click:', err);
        }
        return;
    }

    // Suggestions phrase or popular terms
    const suggestionLink = target.closest('.suggestions a');
    if (suggestionLink && !suggestionLink.classList.contains('suggestions-products-a')) {
        event.preventDefault();
        try {
            const clickedText = suggestionLink.textContent.trim();
            setCurrentPageType('frenzysearch');
            fireSearchEvent(clickedText, 'search');
            navigateWithDelay(suggestionLink.href);
        } catch (err) {
            console.error('Error processing text suggestion click:', err);
        }
        return;
    }

    // Recently viewed / you may also like
    const frenzyAnchor = target.closest('.frenzy_product_item a');
    if (frenzyAnchor) {
        event.preventDefault();
        try {
            const parent = frenzyAnchor.closest('.frenzy_product_item');
            const gtmDataAttr = parent?.querySelector('[data-gtmdata]');
            const gtmDataRaw = gtmDataAttr?.getAttribute('data-gtmdata');
            const gtmData = gtmDataRaw ? JSON.parse(gtmDataRaw.replace(/&quot;/g, '"')) : null;
            if (gtmData?.item_list_name) {
                setCurrentPageType(gtmData.item_list_name);
            }
        } catch (err) {
            console.error('Error parsing GTM Data for Frenzy product:', err);
        }
        navigateWithDelay(frenzyAnchor.href);
        return;
    }

    // Popular search
    const popularSearchLink = target.closest('.popular-search a.category-name');
    if (popularSearchLink) {
        event.preventDefault();
        try {
            const clickedCategory = popularSearchLink.textContent.trim();
            setCurrentPageType('frenzysearch');
            fireSearchEvent(clickedCategory, 'search');
            navigateWithDelay(popularSearchLink.href);
        } catch (err) {
            console.error('Error processing popular search click:', err);
        }
        return;
    }

    // Mini cart product clicks
const miniCartProduct = target.closest('.item-image.mini-cart, .line-item-name.mini-cart');
if (miniCartProduct) {
    setCurrentPageType('Mini Cart');
    return;
}


    // Homepage photo-tile logic
    const currentPageType = sessionStorage.getItem('currentPageType');
    const isHomepage =
        currentPageType === 'Home Page' ||
        (currentPageType && currentPageType.startsWith('Homepage-'));

    const clickedInsidePhotoTile = target.closest('.photo-tile');
    if (!isHomepage && !clickedInsidePhotoTile) return;

    const mainContent = document.getElementById('maincontent');
    if (mainContent && mainContent.contains(target)) {
        sessionStorage.setItem('homepageClickTarget', 'Home Page Featured');
    }
}

function handleSearchSubmit(e) {
    const form = e.target.closest('form[name="simpleSearch"]');
    if (form) {
        const input = form.querySelector('input[name="q"]');
        if (input && input.value.trim()) {
            const searchTerm = input.value.trim();
            setCurrentPageType('SKU Search');
            fireSearchEvent(searchTerm, 'search');
        }
    }
}


document.removeEventListener('click', handleGlobalClick);
document.addEventListener('click', handleGlobalClick);

document.removeEventListener('submit', handleSearchSubmit);
document.addEventListener('submit', handleSearchSubmit);
