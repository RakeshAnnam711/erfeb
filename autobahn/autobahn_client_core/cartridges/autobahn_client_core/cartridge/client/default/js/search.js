'use strict';

var processInclude = require('base/util');
var searchHelper = require('./search/search');
let filterCount = 0;
let isLoading = false;
var $xhr;

// Performance: Defer heavy operations to reduce main-thread work
$(document).ready(function () {
    var searchModule = require('./search/search');
    processInclude(searchModule);

    // Ensure applyFilter is initialized (needed for reset button and filter functionality)
    if (searchModule.applyFilter && typeof searchModule.applyFilter === 'function') {
        searchModule.applyFilter();
    }

    // Defer non-critical functionality to reduce initial execution time
    if (window.requestIdleCallback) {
        requestIdleCallback(function() {
            //load Sort order functionality
            loadSortbyFunctionality();
            // load price search configurations on page load
            loadPriceRefineSearch();
        }, { timeout: 1000 });
    } else {
        // Fallback: use setTimeout for browsers without requestIdleCallback
        setTimeout(function() {
            loadSortbyFunctionality();
            loadPriceRefineSearch();
        }, 500);
    }
    // Multiple category select implementation
    //selectMultipleCategories();

    // Defer sticky filter initialization
    if (window.requestIdleCallback) {
        requestIdleCallback(function() {
            fiterStickyViewOnscroll();
        }, { timeout: 1500 });
    } else {
        setTimeout(fiterStickyViewOnscroll, 800);
    }

    // Debounce resize events for better performance
    let resizeTimeout;
    $(window).on('resize orientationchange', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            fiterStickyViewOnscroll(); // Re-initialize sticky filter logic
        }, 150);
    });


    // load product on scroll
    handleViewAllResultsBtn();

    // load price search configuration after reset filter with default values
    $('body').on('search:filter--success', () => {
        loadPriceRefineSearch();
        loadSortbyFunctionality();

        // scrolls to top after applying filter
        $(window).scrollTop($('.search-results-header.plp-hero-banner')[0].offsetTop +
                                $('.search-results-header.plp-hero-banner')[0].offsetHeight -
                                $('.header-nav')[0].getBoundingClientRect().height);

    });

    // window.addEventListener('resize', function (e){
    //     loadPriceRefineSearch();
    // });
});


// grab the site pref integration object
var siteIntegrations = require('integrations/integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

if (toggleObject.yotpoCartridgeEnabled) {
    $('body').on('search:showMore--success search:filter--success search:sort--success', () => {
        if (window.yotpo) {
            window.yotpo.refreshWidgets();
        }
    });
}


// Enable Infinaite Scroll on View All Results click
function handleViewAllResultsBtn() {
    $('.container').on('click', '.view-all-results button', function (e) {
        $('.view-all-results').hide();
        $('.show-more').hide();
    // Debounce scroll events for better performance
    let scrollTimeout;
    $(window).on('scroll', function (e) {
        // Hide the "show more" and "view all results" buttons once load Product scroll functionality is initiated.
        $('.view-all-results').hide();
        $('.show-more').hide();

        // Throttle scroll handler
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            if ($(window).scrollTop() + $(window).height() >= $('#footercontent').offset().top) {
                loadMoreProducts(e);
            }
        }, 100);
    })
        // Trigger a scroll event manually so the logic runs immediately
        $(window).trigger('scroll');
    })
}

// load product on scroll ---start
function fiterStickyViewOnscroll() {

    const el = document.querySelector('.plp-top-bar');
    if (!el) return;

    const resultCount = document.querySelector('.result-count');
    const header = document.getElementById('header-nav');

    let headerHeight = header ? header.offsetHeight : 0;
    let lockedHeaderHeight = headerHeight;
    var stickyStart = document.querySelector('.grid-header').offsetTop
    let isSticky = false;
    let scrollRAF = null;

    // Desktop filterView adjustment
    if (!window.isMobile()) {
        const filterView = document.getElementById('filterView');
        if (filterView) {
            filterView.style.top = `${headerHeight + 10}px`;
        }
    }
    function getSafeScrollTop() {
        return window.visualViewport
            ? window.visualViewport.pageTop
            : window.scrollY;
    }
    function recalcPositions() {
        headerHeight = header ? header.offsetHeight : 0;
        if (!isSticky) {
            stickyStart = el.offsetTop;
            lockedHeaderHeight = headerHeight;
        }
    }
    window.addEventListener('resize', recalcPositions);
    window.addEventListener('orientationchange', recalcPositions);
    window.addEventListener('scroll', function () {
        if (scrollRAF) return;

        scrollRAF = requestAnimationFrame(function () {
            if (!window.isMobile()) {
                scrollRAF = null;
                return;
            }
            const scrollTop = getSafeScrollTop();
            if (!isSticky && scrollTop >= (stickyStart - headerHeight)) {
                lockedHeaderHeight = headerHeight;
                el.style.position = 'fixed';
                el.style.top = `${lockedHeaderHeight}px`;
                el.style.background = 'white';
                el.style.zIndex = '60';
                el.style.padding = '20px 0';
                el.style.width = '100vw';

                if (resultCount) resultCount.style.display = 'none';
                isSticky = true;
            }
            if (isSticky && scrollTop < (stickyStart - lockedHeaderHeight)) {
                el.style.position = '';
                el.style.top = '';
                el.style.left = '';
                el.style.right = '';
                el.style.width = '100vw';
                el.style.marginRight = 0;

                if (resultCount) resultCount.style.display = '';
                isSticky = false;
            }
            scrollRAF = null;
        });
    });

    function applySticky() {
        el.style.position = 'fixed';
        el.style.top = `${headerHeight}px`;
        el.style.left = '0';
        el.style.right = '0';
        el.style.zIndex = '60';
        el.style.background = '#fff';
        el.style.padding = '20px 0';

        if (resultCount) resultCount.style.display = 'none';
        isSticky = true;
    }

    function removeSticky() {
        el.style.position = '';
        el.style.top = '';
        el.style.left = '';
        el.style.right = '';
        el.style.zIndex = '';
        el.style.background = '';
        el.style.padding = '';

        if (resultCount) resultCount.style.display = '';
        isSticky = false;
    }
}



// Function to load more products (reuse the existing one)
function loadMoreProducts(e) {
    var apiurl = $('#more-results-button button').data('url');
    const currentUrl = window.location.href;
    var $showMoreButton = $(e.target);
    if(apiurl == undefined){
        return;
    }

    if (isLoading) return;
    isLoading = true;

    // Show spinner or loading indicator
    $('#loading-spinner').removeClass("d-none");
    $(this).trigger('search:showMore', e);
    // $.spinner().start();
    apiurl = searchHelper.copyPriceRange(currentUrl, apiurl);
    $.ajax({
        url: apiurl,
        data: { apiurl },
        method: 'GET',
        success: function (response) {
            var $response = $(response);
            var $productGridElement = $response.find('.product-grid');
        
            var updatedGridHtml = $productGridElement.length > 0
                ? $productGridElement.children()
                : response;
        
            var promoTileCount = $showMoreButton
                .closest('.product-grid')
                .find('[class*="experience-promoTile"]').length;
        
            // Update grid footer / content
            $('.grid-footer').replaceWith(updatedGridHtml);
        
            var permalink = $(response).find(':input.permalink').val();
            if (permalink) {
                let updatedPermaLink = searchHelper.copyPriceRange(currentUrl, permalink);
                history.replaceState(undefined, document.title, updatedPermaLink);
            }
        
            updateSortOptions(response, promoTileCount);
            searchHelper.loadProductTiles(document.querySelector('.product-grid'));
        
            $('body').trigger('search:showMore--success');
        
            isLoading = false;
            $('#loading-spinner').addClass("d-none");
        },        
        error: function () {
            console.error('Failed to load more products.');
            isLoading = false;
            $('#loading-spinner').addClass("d-none");
        },
        complete: function () {
            $('#loading-spinner').addClass("d-none");
            isLoading = false;
        }

    });
}

function updateSortOptions(response, promoTileCount) {
    var $tempDom = $('<div>').append($(response));
    var sortOptions = $tempDom.find('.grid-footer').data('sort-options').options;
    var pageSize = Number($tempDom.find('.grid-footer').data('page-size'));

    sortOptions.forEach(option => {
        var pageUrl = new URL(window.location);
        var urlPageSize = pageUrl.searchParams.get('sz') !== null ? Number(pageUrl.searchParams.get('sz')) : null;
        var optionUrl = new URL(option.url);
        var optionPageSize = Number(optionUrl.searchParams.get('sz'));

        // If 'sz' is already defined in URL, but promo tiles aren't already accounted for, decrement sz param
        if (!isNaN(urlPageSize) && urlPageSize !== optionPageSize - pageSize) {
            var updatedPageSize = optionPageSize - promoTileCount;
            optionUrl.searchParams.set('sz', updatedPageSize);
            option.url = optionUrl.toString();
        }

        $('option.' + option.id).val(option.url);
    });
}



// Funcation to create url of selected filters for mobile
function createSelectedFiltersWithPriceUrl(selectedPriceFilter) {
    $('.helpButton')?.addClass('d-none');    // handling the visibility of overlapping .helpButton
    let updateIntialUrl = searchHelper.methods.getMobileFilterApplyUrl();
    let {pmin, pmax} = selectedPriceFilter
    updateIntialUrl = updateIntialUrl == '' ? window.location.href : updateIntialUrl;

    let urlObj = new URL(updateIntialUrl, window.location.origin);

    urlObj.searchParams.set('pmin', pmin);
    urlObj.searchParams.set('pmax', pmax);

    let updatedUrl = updateIntialUrl.startsWith('http') ? urlObj.toString() : urlObj.pathname + urlObj.search;
    searchHelper.methods.setMobileFilterApplyUrl(updatedUrl);
}

//Sort order functionality --start
function loadSortbyFunctionality() {
    var defaultSortTimeout = 30000;
        sortTimeout = defaultSortTimeout;

    $('.container').on("click", ".custom-dropdown #sortBy", function (e) {
        e.stopImmediatePropagation();
        if(window.isMobile()) {
            $('html, body').addClass('lock-scroll');
            $('.helpButton')?.addClass('d-none');
        }
        $(".custom-dropdown #sortOptions").toggleClass("d-none");
    });
    if(!window.isMobile()) {
        $(document).on("click", function (e) {
            if (!$(e.target).closest('.custom-dropdown').length) {
                $('.custom-dropdown #sortOptions').addClass('d-none');
            }
        });

        $(".custom-dropdown #sortOptions").on("click", function (e) {
            $('.custom-dropdown #sortOptions').addClass('d-none');
        });
    } else {
        $('.container').on("click", ".sort-apply-btn, .sort-options .btn-container .reset, .sort-options .top-bar .close", function (e) {
            $('html, body').removeClass('lock-scroll');
            $('.helpButton')?.removeClass('d-none');
            $('.custom-dropdown #sortOptions').addClass('d-none');
        });
    }

    // $('[name=sortDropdown]').each(function () {
    //     //Track current selection
    //     var newSelection = this.selectedOptions[0];
    //     $(this).data('sortValueOption', newSelection);
    // });

    // sort order functionality
    $('.container').on('click', '[class=sortDropdown], .sort-options .btn-container .sort-apply-btn, .sort-options .btn-container .reset', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if(window.isMobile()) {
            $('.helpButton')?.addClass('d-none');    // handling the visibility of overlapping .helpButton
        }
        //to avoid multiple click events
        if($('.spinner').length){
            return;
        }

        $(this).trigger('search:sort', $(this).data("href"));
        var sortOrder = $(this).data("href").split('srule')[1];
        var newUrl;
        var url;
        if (window.location.toString().indexOf('?srule') !== -1 && sortOrder) {
            url = window.location.toString().split('?srule')[0];
            newUrl = url + "?srule" + sortOrder;
        } else if (window.location.toString().indexOf('&srule') !== -1 && sortOrder) {
            url = window.location.toString().split('&srule')[0];
            newUrl = url + "&srule" + sortOrder;
        }
        if(!$(this).is('.sort-apply-btn')) {
            $('.sortDropdown').parents("ul").find("button i.fa-check-circle").removeClass("fa-check-circle").addClass("fa-circle-o");
            // Handle Reset button selection
            if(window.isMobile() && $(this).is('.sort-options .btn-container .reset')) {
                $('.sortDropdown').first().find("i").removeClass("fa-circle-o").addClass("fa-check-circle");;
            } else {
                $(this).find("i").removeClass("fa-circle-o").addClass("fa-check-circle");
            }
        }

         // Add Apply button latest refinement URL
        // Prevent Api call on checkbox selection for mobile
        if(window.isMobile() && $(this).is('[class=sortDropdown]')) {
            $('.sort-apply-btn').data('href', $(this).data("href"));
            return;
        }

        var $this = $(this);
        var thisValue = this.dataset.id;
        var thisHref = this.dataset.href;
        $this.trigger('search:sort', thisValue);
        var errorMsg = $this.data().errorMsg;

        var srule = thisValue || '';
        srule = thisHref.indexOf('srule=') !== -1 ? thisHref.replace(/^.+srule\=/,'').replace(/\&.+$/,'') : srule;

        var newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?';
        // Rebuild url without srule
        var params = window.location.search?.replace(/^\?/g,'').split('&')?.filter((param) => ['srule','',null,undefined].indexOf(param?.split('=')?.[0]) === -1 ); // only include param is key exists & NOT srule
        // Add Srule
        params.push('srule=' + srule);
        // Join URL w/ Params
        newUrl += params.join('&');

        var searchAPI = $(this).data("href");

        searchAPI = searchHelper.copyPriceRange(newUrl, searchAPI);

        // var newSelection = this.selectedOptions[0];
        $('[name="sort-order"]').find('option[selected="selected"], option:selected').prop('selected',false).removeAttr('selected');
        // $(newSelection).prop('selected', true).attr('selected', true);

        // Cancel previous request
        $xhr && $xhr.abort && $xhr.abort();

        $xhr = $.ajax({
            url: searchAPI,
            data: {
                selectedUrl: searchAPI
            },
            method: 'GET',
            timeout: sortTimeout,
            beforeSend: function () {
                // $.spinner().start();
            },
            success: function (response) {
                let $response;
                try {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = response;
                    $response = $(tempDiv);
                } catch (e) {
                    console.error("Response parsing failed:", e);
                    window.location.href = newUrl;
                    return;
                }
            
                const $productGridElement = $response.find('.product-grid');
            
                if ($productGridElement.length === 0) {
                    console.warn("No valid product grid found in response. Reloading page.");
                    window.location.href = newUrl;
                    return;
                }
            
                try {
                    const permalink = $response.find(':input.permalink').val();
                    let updatedPermaLink = searchHelper.copyPriceRange(newUrl, permalink);
                    const updatedGridHtml = $productGridElement.children();
                    const $grid = $('.product-grid');
            
                    // Replace grid
                    $grid.empty().html(updatedGridHtml);
            
                    searchHelper.loadProductTiles($grid[0]);
            
                    history.replaceState(undefined, document.title, updatedPermaLink || newUrl);
            
                    $('body').trigger('search:sort--success');
                    $('body').trigger('ajax:load.ajaxEvents', [$grid]);
                    sortTimeout = defaultSortTimeout;
            
                } catch (e) {
                    console.error("DOM update failed:", e);
                    window.location.href = newUrl;
                }
            },            
            error: function () {

                if (errorMsg) {
                    $('body').trigger('show:message', {
                        msg: errorMsg,
                        type: 'warning'
                    });
                }
            
                const sortOption = $this.data('sortValueOption');
                if (sortOption) {
                    $(sortOption).prop('selected', true).attr('selected', true);
                }
            
                sortTimeout += defaultSortTimeout;
            }
            
            // complete: function () {
            //     $.spinner().stop();
            // }
        });

    });
}
//Sort order functionality --end

/* price filter functionality start */

// main calling function to configure and load refine result on page
function loadPriceRefineSearch(){
    // checking for desktop or mobile view
    var querySelector = "";
    if(window.isMobile()){
        querySelector = ".mobile-search-refinements ";
    }
    else{
        querySelector = ".desktop-search-refinements ";
    }

    // get all price/range textboxes, hidden fields for filter url and error paragraph
    const rangeInput = document.querySelectorAll(querySelector + ".range-input input"),
    priceInput = document.querySelectorAll(querySelector + ".price-input input"),
    range = document.querySelector(querySelector + ".slider .progress"),
    priceRangeValues = document.querySelector(querySelector + "#minMaxPriceValue"),
    errorParagraph = document.querySelector(querySelector + "p.error");

    let refineUrlDiv = document.querySelector(querySelector + "#refineUrl");
    let refineUrl = "";
    if(refineUrlDiv){
        refineUrl = refineUrlDiv.value;
    }
    let priceGap = 1;

    //get min-max price range values
    var minMaxPrice = priceRangeValues?.value;
    if(!minMaxPrice){
        return;
    }
    var priceArray = minMaxPrice.split("-");

    // configure price textbox and add event listener on change
    priceInput.forEach((input) => {
        //set min and max price range by default
        if($(input).hasClass("input-min")){
            $(input).val(parseInt(priceArray[0].trim()));
        }
        if($(input).hasClass("input-max")){
            $(input).val(parseInt(priceArray[1].trim()));
        }

        //add on change event listener to load result
        input.addEventListener("change", (e) => {
            e.stopImmediatePropagation();

            let minPrice = parseInt(priceInput[0].value),
            maxPrice = parseInt(priceInput[1].value);

            //price range textbox validation
            $(errorParagraph).addClass('d-none');
            $(priceInput[0]).removeClass("error");
            $(priceInput[1]).removeClass("error");
            if(isNaN(minPrice) || minPrice < parseInt(priceArray[0].trim()) || minPrice > parseInt(priceArray[1].trim())
                || minPrice >= maxPrice){
                $(e.target).addClass("error");
                $(errorParagraph).removeClass('d-none');
                return;
            }
            if(isNaN(maxPrice) || maxPrice > parseInt(priceArray[1].trim()) || maxPrice <= minPrice){
                $(e.target).addClass("error");
                $(errorParagraph).removeClass('d-none');
                return;
            }

            //set UI slider based on price values
            if (maxPrice - minPrice >= priceGap && maxPrice <= rangeInput[1].max) {
                if ($(e.target).hasClass("input-min")) {
                    rangeInput[0].value = minPrice;
                    // range.style.left = (minPrice / rangeInput[0].max) * 100 + "%";
                    range.style.left = (((minPrice - rangeInput[1].min) / (rangeInput[1].max - rangeInput[1].min)) * 100) + "%";
                } else {
                    rangeInput[1].value = maxPrice;
                    // range.style.right = 100 - (maxPrice / rangeInput[1].max) * 100 + "%";
                    range.style.right = 100 - (((maxPrice - rangeInput[1].min) / (rangeInput[1].max - rangeInput[1].min)) * 100) + "%";
                }
            }

            //set user updated min/max value in API url and load result
            refineUrl = decodeURIComponent(refineUrl);
            refineUrl = updateQueryParameter(refineUrl, "pmin", minPrice);
            refineUrl = updateQueryParameter(refineUrl, "pmax", maxPrice);
            // Add Selected pricing value on mobile and return
            if(window.isMobile()) {
                const selectedPrice = {
                    'pmin': minPrice,
                    'pmax': maxPrice
                };
                createSelectedFiltersWithPriceUrl(selectedPrice)
                return;
            }
            window._activePriceFilter = { pmin: minPrice, pmax: maxPrice };
            loadSearchResult(refineUrl);
            setTimeout(function () {
                searchHelper.loadProductTiles(
                    document.querySelector('.product-grid-inner') || document
                );
            }, 0);
        });
    });

    // configure range textbox and add event listener on change
    var sliderRangeMin = parseInt(priceArray[0].trim());
    var sliderRangeMax = parseInt(priceArray[1].trim());
    // Prevent degenerate slider (min===max causes browser to render thumbs broken)
    if (sliderRangeMax <= sliderRangeMin) sliderRangeMax = sliderRangeMin + 1;

    rangeInput.forEach((input) => {
        //set min and max price range by default
        $(input).attr("min", sliderRangeMin);
        $(input).attr("max", sliderRangeMax);
        if($(input).hasClass("range-min")){
            $(input).val(sliderRangeMin);
        }
        if($(input).hasClass("range-max")){
            $(input).val(sliderRangeMax);
            range.style.left = "0%";
            range.style.right = "0%";
        }

        input.addEventListener("input", (event) => {
            if($(event.target).hasClass("range-min")){
                priceInput[0].value = event.target.value;
            }
            else{
                priceInput[1].value = event.target.value;
            }
        });
        //add on change event listener to load result
        input.addEventListener("change", (e) => {
            e.stopImmediatePropagation();

            let minVal = parseInt(rangeInput[0].value),
            maxVal = parseInt(rangeInput[1].value);

            //range input validation
            $(errorParagraph).addClass('d-none');
            $(priceInput[0]).removeClass("error");
            $(priceInput[1]).removeClass("error");
            if(minVal >= maxVal){
                if($(e.target).hasClass("range-min")){
                    minVal = getQueryParameter(location.href, "pmin").replace(/,/g, '');
                    rangeInput[0].value = minVal;
                    // range.style.left = (minVal / rangeInput[0].max) * 100 + "%";
                    range.style.left = (((minVal - rangeInput[1].min) / (rangeInput[1].max - rangeInput[1].min)) * 100) + "%";
                }
                if($(e.target).hasClass("range-max")){
                    maxVal = getQueryParameter(location.href, "pmax").replace(/,/g, '');
                    rangeInput[1].value = maxVal;
                    // range.style.right = 100 - (maxVal / rangeInput[1].max) * 100 + "%";
                    range.style.right = 100 - (((maxVal - rangeInput[1].min) / (rangeInput[1].max - rangeInput[1].min)) * 100) + "%";
                }
                priceInput[0].value = minVal;
                priceInput[1].value = maxVal;
                return;
            }

            //set UI slider and price range textbox based on price values
            if (maxVal - minVal < priceGap) {
                if ($(e.target).hasClass("range-min")) {
                    rangeInput[0].value = maxVal - priceGap;
                } else {
                    rangeInput[1].value = minVal + priceGap;
                }
            } else {
                priceInput[0].value = minVal;
                priceInput[1].value = maxVal;
                range.style.left = (((minVal - rangeInput[1].min) / (rangeInput[1].max - rangeInput[1].min)) * 100) + "%";
                range.style.right = 100 - (((maxVal - rangeInput[1].min) / (rangeInput[1].max - rangeInput[1].min)) * 100) + "%";

                // range.style.left = (minVal / rangeInput[0].max) * 100 + "%";
                // range.style.right = 100 - (maxVal / rangeInput[1].max) * 100 + "%";
            }

            //set user updated min/max value in API url and load result
            refineUrl = decodeURIComponent(refineUrl);
            refineUrl = updateQueryParameter(refineUrl, "pmin", minVal);
            refineUrl = updateQueryParameter(refineUrl, "pmax", maxVal);
            // Add Selected pricing value on mobile and return
            if(window.isMobile()) {
                const selectedPrice = {
                    'pmin': minVal,
                    'pmax': maxVal
                }
                createSelectedFiltersWithPriceUrl(selectedPrice)
                return;
            }
            window._activePriceFilter = { pmin: minVal, pmax: maxVal };
            loadSearchResult(refineUrl);
        });
    });

    // to persist filter after page reload (desktop only — mobile uses filter-apply-btn flow)
    if(!window.isMobile() && (location.href.indexOf("pmin") != -1  || location.href.indexOf("pmax") != -1)){
        var pMinPrice = parseInt(getQueryParameter(decodeURIComponent(location.href), "pmin").replace(/,/g, ''));
        var pMaxPrice = parseInt(getQueryParameter(decodeURIComponent(location.href), "pmax").replace(/,/g, ''));

        var sliderMin = parseInt(rangeInput[1].min);
        var sliderMax = parseInt(rangeInput[1].max);

        var activePF = window._activePriceFilter;
        if (activePF && activePF.pmin != null) {
            // User has an active price selection — display it exactly, extending slider range if needed
            var displayMin = activePF.pmin;
            var displayMax = activePF.pmax;
            var effectiveMin = Math.min(sliderMin, displayMin);
            var effectiveMax = Math.max(sliderMax, displayMax);

            rangeInput[0].min = effectiveMin;
            rangeInput[0].max = effectiveMax;
            rangeInput[1].min = effectiveMin;
            rangeInput[1].max = effectiveMax;

            rangeInput[0].value = displayMin;
            rangeInput[1].value = displayMax;
            priceInput[0].value = displayMin;
            priceInput[1].value = displayMax;

            range.style.left = (((displayMin - effectiveMin) / (effectiveMax - effectiveMin)) * 100) + "%";
            range.style.right = 100 - (((displayMax - effectiveMin) / (effectiveMax - effectiveMin)) * 100) + "%";
        } else {
            // No _activePriceFilter (e.g. direct URL load) — use URL values, extend slider if needed
            var hasOverlap = pMaxPrice >= sliderMin && pMinPrice <= sliderMax;

            if (hasOverlap) {
                window._activePriceFilter = { pmin: pMinPrice, pmax: pMaxPrice };
                var effectiveMin = Math.min(sliderMin, pMinPrice);
                var effectiveMax = Math.max(sliderMax, pMaxPrice);

                rangeInput[0].min = effectiveMin;
                rangeInput[0].max = effectiveMax;
                rangeInput[1].min = effectiveMin;
                rangeInput[1].max = effectiveMax;

            rangeInput[0].value = pMinPrice;
            rangeInput[1].value = pMaxPrice;

            priceInput[0].value = pMinPrice;
            priceInput[1].value = pMaxPrice;

            range.style.left = (((pMinPrice - effectiveMin) / (effectiveMax - effectiveMin)) * 100) + "%";
            range.style.right = 100 - (((pMaxPrice - effectiveMin) / (effectiveMax - effectiveMin)) * 100) + "%";
        }
        else {
                // Truly no overlap (e.g. pmax=500 on a subcategory starting at 2350) — reset
            var currentUrl = location.href;
            currentUrl = updateQueryParameter(decodeURIComponent(currentUrl), "pmin", sliderMin);
            currentUrl = updateQueryParameter(decodeURIComponent(currentUrl), "pmax", sliderMax);
            history.replaceState(undefined, '', currentUrl);
            }
        }
    }

    // Mobile: restore exact user price values from URL — same extend logic as desktop
    if (window.isMobile() && (location.href.indexOf("pmin") !== -1 || location.href.indexOf("pmax") !== -1)) {
        var mobilePMin = parseInt(getQueryParameter(decodeURIComponent(location.href), "pmin").replace(/,/g, ''));
        var mobilePMax = parseInt(getQueryParameter(decodeURIComponent(location.href), "pmax").replace(/,/g, ''));
        var mobileSliderMin = parseInt(rangeInput[1].min);
        var mobileSliderMax = parseInt(rangeInput[1].max);
        var mobileEffectiveMin = Math.min(mobileSliderMin, mobilePMin);
        var mobileEffectiveMax = Math.max(mobileSliderMax, mobilePMax);

        rangeInput[0].min = mobileEffectiveMin;
        rangeInput[0].max = mobileEffectiveMax;
        rangeInput[1].min = mobileEffectiveMin;
        rangeInput[1].max = mobileEffectiveMax;
        rangeInput[0].value = mobilePMin;
        rangeInput[1].value = mobilePMax;
        priceInput[0].value = mobilePMin;
        priceInput[1].value = mobilePMax;
        range.style.left = (((mobilePMin - mobileEffectiveMin) / (mobileEffectiveMax - mobileEffectiveMin)) * 100) + "%";
        range.style.right = 100 - (((mobilePMax - mobileEffectiveMin) / (mobileEffectiveMax - mobileEffectiveMin)) * 100) + "%";
    }
}

//call API url to load result on page
function loadSearchResult(href) {
    //find new attr on Sort if selected, if not use the default
    var sortingRule = "";
    var selectedSort = $('.sortDropdown').find('i.fa-check-circle');
    if (selectedSort.length) {
        sortingRule = selectedSort.parents('button').data('id');
    }
    //create a new url with the correct preferences
    if (href.includes('srule')) {
        var refinementUrl = href.replace(/(&srule=).*?(&|$)/,'$1' + sortingRule + '$2');
    } else if (!href.includes('srule') && sortingRule != null) {
        var refinementUrl = href;
        if(refinementUrl.includes('?'))
            refinementUrl = refinementUrl + '&srule=' + sortingRule;
        else
            refinementUrl = refinementUrl + '?srule=' + sortingRule;
    } else {
        var refinementUrl = href;
    }

    $xhr && $xhr.abort && $xhr.abort();

    //call API url to load refine result
    $xhr = $.ajax({
        url: refinementUrl,
        data: {
            page: $('.grid-footer').data('page-number'),
            selectedUrl: refinementUrl
        },
        method: 'GET',
        timeout: 10000,
        // beforeSend: function () {
        //     $.spinner().start();
        // },
        success: function (response) {
            parseResults(response);
            searchHelper.loadProductTiles(
                document.querySelector('.product-grid-inner') || document
            );
        
            const permalink = $(response).find(':input.permalink').val();
            let updatedPermaLink = searchHelper.copyPriceRange(refinementUrl, permalink);
        
            history.replaceState(undefined, document.title, updatedPermaLink || refinementUrl);
            $('body').trigger('search:filter--success');
        }    
        // complete: function () {
        //     $.spinner().stop();
        // }
    });
}

//parse html response data and update product grid to load refine result
function parseResults(response) {
    var $results = $(response);
    var isMobile = window.isMobile();

    var $filterBar = $results.find('.filter-bar');
    var filterBarStyle = !isMobile ? $filterBar.attr('data-filter-bar-style-desktop') : $filterBar.attr('data-filter-bar-style-mobile');
    var filterBar = !isMobile ? '[data-filter-bar-style-desktop="' + filterBarStyle + '"]' : '[data-filter-bar-style-mobile="' + filterBarStyle + '"]';

    var refinements = '';
    if (!isMobile) {
        refinements = '.desktop-search-refinements';
    } else {
        refinements = '.mobile-search-refinements';
    };

    // update product grid
    [
        '.grid-header .result-count.filter-count',
        '.grid-header #sortOptions ul',
        '.desktop-search-refinements #sortOptions ul',
        '.grid-header',
        '.header-bar',
        '.header.page-title',
        '.product-grid',
        "#noresultfound",
        '.show-more',
        '#filterCount',
        //filterBar
        `${refinements} .refinements .refinement-subcategory`,
        `${refinements} .refinements .refinement-category`,
        `${refinements} .refinements .refinement-brand`,
        `${refinements} .refinements .refinement-refinementcolor`,
        `${refinements} .refinements .refinement-material`,
        `${refinements} .refinements .refinement-condition_name`,
        `${refinements} .refinements .refinement-price`,
        `${refinements} .refinements .refinement-location`
    ].forEach((selector) => {
        updateDom($results, selector);
    });

    if($("#noresultfound").children().length > 0){
        $('#filterView').empty();
    }

    $('body').trigger('ajax:load.ajaxEvents', [$('.search-results')]);
}

//function to update query parameter value in url
function updateQueryParameter(url, param, value) {
    // Use URLSearchParams to manage query parameters
    let urlParts = url.split("?");
    let baseUrl = urlParts[0];
    let queryString = urlParts[1] || "";

    let params = new URLSearchParams(queryString);

    // Update or add the parameter
    params.set(param, value);

    // Rebuild the URL
    return `${baseUrl}?${params.toString()}`;
}

//function to get query parameter from url
function getQueryParameter(url, param) {
    // Use URLSearchParams to manage query parameters
    let urlParts = url.split("?");
    let baseUrl = urlParts[0];
    let queryString = urlParts[1] || "";

    let params = new URLSearchParams(queryString);

    // Update or add the parameter
    return params.get(param);
}

//update DOM result based on product search response
function updateDom($results, selector) {
    var $updates = $results.find(selector);
    $(selector).empty().html($updates.html());
}

/* price filter functionality end */

// Handle filter selection for mobile only
if(window.isMobile()) {
    $('.container').on('click', '.refinements li button',
        function (e){
            e.preventDefault();
            e.stopPropagation();
            var category = $(e.currentTarget).closest('.refinement');

            if (category && category.hasClass('refinement-category')) {
                // Remove the "selected" class and "fa-check-circle" from all icons
                $('.values.content i').removeClass('fa-check-circle').addClass('fa-circle-o');

                // Add the "fa-check-circle" class to the clicked button's icon
                $(this).find('i').removeClass('fa-circle-o').addClass('fa-check-circle');
            } else {
                $(this).trigger('search:filter', e);
                let currentButton = $(e.currentTarget);
                if(currentButton.find("span").hasClass("selected")) {
                    $(currentButton.find("span")[0]).removeClass("selected");
                    currentButton.find("i").removeClass("fa-check-square").addClass("fa-square-o");
                }
                else{
                    $(currentButton.find("span")[0]).addClass("selected");
                    currentButton.find("i").addClass("fa-check-square").removeClass("fa-square-o");
                }
            }
        }
    );
}

