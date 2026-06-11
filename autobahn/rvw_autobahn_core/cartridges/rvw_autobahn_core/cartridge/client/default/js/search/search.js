var baseSearch = $.extend({}, require('base/search/search'));
var SiteConstants = require('constants/SiteConstants');
var headerUtils = require('core/utilities/headerUtils');
var wishlistHelpers = require('core/wishlist/components/helpers');

baseSearch.methods = baseSearch.methods || {};

baseSearch.methods.displayMessage = data => {
    $.spinner().stop();
    var eventID = 'event' + Math.floor(Math.random() * (Math.floor(10000) - Math.ceil(100)));
    if ($('.toast-messages').length === 0) {
        $('body').append('<div class="toast-messages"></div>');
    }
    $('.toast-messages').append('<div class="' + eventID + ' alert alert-' + data.type + ' text-center" role="alert">' + data.msg + '</div>');
    setTimeout(() => $('.toast-messages').find('.' + eventID).remove(), 5000);
};

baseSearch.methods.setRefinementCollapseStates = status => {

    if (status === 'open') {
        $('.refinement').addClass('active');
    }
    else if (status === 'closed' || status === 'close') {
        $('.refinement').removeClass('active');
        $('.refinement').find('button.title').attr('aria-expanded','false');
    }
};

baseSearch.methods.toggleRefinementDrawer = status => {
    var $refinementBar = $('.refinement-bar');
    var $modalBackground = $('.modal-background');

    if (status === 'open') {
        var headerNavHeight = headerUtils.getHeaderHeight();
        var scrollTopHeight = $('header').offset().top;

        $('html').scrollTop(scrollTopHeight);
        // Following two lines for MS Edge to work
        document.body.scrollTop = scrollTopHeight;
        document.documentElement.scrollTop = scrollTopHeight;
        $('html').addClass('lock-scroll');
        $('body').addClass('mobile-filter-drawer-in');
        $('.helpButton')?.addClass('d-none');    // handling the visibility of overlapping .helpButton
        $refinementBar.addClass('in').css('top', headerNavHeight).siblings().attr('aria-hidden', true);
        // $modalBackground.fadeIn(SiteConstants.TransitionSpeed).css('top', headerNavHeight);
        $refinementBar.closest('.row').siblings().attr('aria-hidden', true);
        $refinementBar.closest('.tab-pane.active').siblings().attr('aria-hidden', true);
        $refinementBar.closest('.container.search-results').siblings().attr('aria-hidden', true);
        $refinementBar.find('.close').focus();
    } else {
        $('html').removeClass('lock-scroll');
        $('body').removeClass('mobile-filter-drawer-in');
        $('.helpButton')?.removeClass('d-none');    // handling the visibility of overlapping .helpButton
        $refinementBar.removeClass('in').css('top', '').siblings().attr('aria-hidden', false);
        $refinementBar.removeClass('in').siblings().attr('aria-hidden', false);
        $modalBackground.fadeOut(SiteConstants.TransitionSpeed);
        $refinementBar.closest('.row').siblings().attr('aria-hidden', false);
        $refinementBar.closest('.tab-pane.active').siblings().attr('aria-hidden', false);
        $refinementBar.closest('.container.search-results').siblings().attr('aria-hidden', false);
        // $('.btn.filter-results').focus();
    }
};

baseSearch.methods.toggleFilters = (e) => {
    e.preventDefault();
    var toggleDirection = 'open';
    if ($('.refinement-bar .refinement').hasClass('active')) {
        toggleDirection = 'closed';
    }
    module.exports.methods.setRefinementCollapseStates(toggleDirection);
};

/**
 * Update DOM elements with Ajax results
 *
 * @param {Object} $results - jQuery DOM element
 * @param {string} selector - DOM element to look up in the $results
 * @return {undefined}
 */
baseSearch.methods.updateDom = ($results, selector) => {
    var $updates = $results.find(selector);
    $(selector).empty().html($updates.html());
};

/**
 * This function retrieves another page of content to display in the content search grid
 * @param {JQuery} $element - the jquery element that has the click event attached
 * @param {JQuery} $target - the jquery element that will receive the response
 * @return {undefined}
 */
baseSearch.methods.getContent = ($element, $target) => {
    var showMoreUrl = $element.data('url');
    $.spinner().start();
    $.ajax({
        url: showMoreUrl,
        method: 'GET',
        success: function (response) {
            $target.append(response);
        },
        complete: function () {
            $.spinner().stop();
        }
    });
};

/**
 * Update sort option URLs from Ajax response
 *
 * @param {string} response - Ajax response HTML code
 * @return {undefined}
 */
baseSearch.methods.updateSortOptions = (response, promoTileCount) => {
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
};

/**
 * Keep refinement panes expanded/collapsed after Ajax refresh
 *
 * @param {Object} $results - jQuery DOM element
 * @return {undefined}
 */
baseSearch.methods.handleRefinements = ($results, selector) => {
    $('.refinement.active').each(function () {
        $(this).removeClass('active');
        var activeDiv = $results.find('.' + $(this)[0].className.replace(/ /g, '.'));
        activeDiv.addClass('active');
        activeDiv.find('button.title').attr('aria-expanded', 'true');
    });
    module.exports.methods.updateDom($results, selector);
};

/**
 * Parse Ajax results and updated select DOM elements
 *
 * @param {string} response - Ajax response HTML code
 * @param {Object} jqXHR - jQuery XMLHttpRequest
 * @return {undefined}
 */
baseSearch.methods.parseResults = (response, jqXHR) => {
    var $results = $(response);
    var isMobile = window.isMobile();
    var $searchResults = $('.search-results');
    var $incomingSearchResults = $results.find('.search-results').first();

    if (isMobile) {
        var $refinements = $results.find('.refinements[data-refinement-style-mobile]');
        var refinementStyle = $refinements.data('refinement-style-mobile');
        var selector = `[data-refinement-style-mobile="${refinementStyle}"]`;
    } else {
        var $refinements = $results.find('.refinements[data-refinement-style-desktop]');
        var refinementStyle = $refinements.data('refinement-style-desktop');
        var selector = `[data-refinement-style-desktop="${refinementStyle}"]`;
    };

    // Update browser history with Search-Show specific route
    var historyUrl = $results.find('.history-url').data('history-url');
    var newTitle = jqXHR?.getResponseHeader?.('x-sf-cc-title');
    if (historyUrl) {
        history.replaceState(undefined, '', historyUrl);

        if (['', null, undefined].indexOf(newTitle) === -1) {
            document.title = newTitle;
        }
    }

    var $filterBar = $results.find('.filter-bar');
    var filterBarStyle = !isMobile ? $filterBar.attr('data-filter-bar-style-desktop') : $filterBar.attr('data-filter-bar-style-mobile');
    var filterBar = !isMobile ? '[data-filter-bar-style-desktop="' + filterBarStyle + '"]' : '[data-filter-bar-style-mobile="' + filterBarStyle + '"]';

    var verticalMobile = isMobile && selector === '[data-refinement-style-mobile="vertical"]';
    var verticalDesktop = !isMobile && selector === '[data-refinement-style-desktop="vertical"]';
    var horizontalMultipleDropdownsDesktop = !isMobile && selector === '[data-refinement-style-desktop="horizontal-multiple-dropdowns"]';
    var horizontalOneDropdownDesktop = !isMobile && selector === '[data-refinement-style-desktop="horizontal-one-dropdown"]';
    var horizontalOneDropdownDesktopActive = $('.collapse-filters-wrapper').hasClass('active');
    var horizontalOneDropdownDesktopOpen = false;

    if (horizontalOneDropdownDesktop && horizontalOneDropdownDesktopActive) {
        horizontalOneDropdownDesktopOpen = true;
    }

    if (verticalMobile || verticalDesktop) {
        var specialHandlers = {
            selector: module.exports.methods.handleRefinements
        };

        Object.keys(specialHandlers).forEach(function (selector) {
            specialHandlers[selector]($results, selector);
        });
    };

    if (!isMobile) {
        var refinements = '.desktop-search-refinements';
    } else {
        var refinements = '.mobile-search-refinements';
    };

    // Update DOM elements only inside search-results container
    var updateDomInSearch = function (selector) {
        if (!$searchResults.length || !$incomingSearchResults.length) {
            return;
        }
        var $updates = $incomingSearchResults.find(selector);
        var $targets = $searchResults.find(selector);
        if ($updates.length && $targets.length) {
            $targets.empty().html($updates.html());
        }
    };

    [
        '.grid-header',
        '.product-grid',
        "#noresultfound",
        '.show-more',
        refinements,
        filterBar
    ].forEach((selector) => {
        updateDomInSearch(selector);
    });

    if (horizontalOneDropdownDesktopOpen === true) {
        $('.collapse-filters-wrapper').addClass('active');
    }

    $('body').trigger('ajax:load.ajaxEvents', [$('.search-results')]);

    module.exports.refinementStickyBar();
    module.exports.oneDropdownSlideToggle();
};

baseSearch.oneDropdownSlideToggle = function() {
    var oneDropdownFilter = $('.horizontal-onedropdown-filter');
    if (oneDropdownFilter) {
        var menuToggle = $('.horizontal-onedropdown-filter-btn').unbind();
        menuToggle.removeClass('open');

        menuToggle.on('touchstart click', function(e) {
            e.preventDefault();
            $('.collapse-filters-wrapper').toggleClass('active');
            menuToggle.toggleClass('open');
        });
    }
};

baseSearch.refinementStickyBar = function() {
    var showStickyRefinementData = document.getElementById('horizontal-filter');
    if (showStickyRefinementData) {
        var showStickyRefinementBarCheck = showStickyRefinementData.getAttribute('data-sticky-refinement-bar');

        if (showStickyRefinementData && !window.isMobile() && showStickyRefinementBarCheck == 'true') {
            var $topHeader = $('#top-header');
            var $searchResults = $('.search-results');
            var topHeaderHeight = 0;
            var headerNavHeight = headerUtils.getHeaderHeightNavOnly();
            $('.refinement-bar').addClass('sticky-filter-bar');

            window.addEventListener('scroll', function() {
                //main sticky horiziontal dropdown filter functionality - only show when scrolled past in-page refinement button section
                // if (window.pageYOffset > heightCalculation && mainContent.scrollHeight > (window.innerHeight + showStickyRefinementData.offsetHeight)) {
                //     showStickyRefinementData.classList.add('sticky-filters');
                //     showStickyRefinementData.setAttribute('style', 'top:' + topHeaderHeight + 'px;');
                //     mainContent.setAttribute('style', 'padding-top:' + showStickyRefinementData.offsetHeight + 'px;');
                // } else if (showStickyRefinementData.classList.contains('sticky-filters') && window.pageYOffset < heightCalculation) {
                //     showStickyRefinementData.classList.remove('sticky-filters');
                //     mainContent.removeAttribute('style');
                if ($topHeader.hasClass('fixed-header-enhanced')) {
                    topHeaderHeight = ($('html').hasClass('scroll-direction-down') || !$('html').hasClass('scroll-direction-up')) ? 0 : headerNavHeight;
                }
                if ($topHeader.hasClass('fixed-header')) {
                    topHeaderHeight = headerNavHeight;
                }
                heightCalc = $searchResults.offset().top - topHeaderHeight;
                var stickyFilterBar = $('.sticky-filter-bar')
                stickyFilterBar.css('top', topHeaderHeight + 'px')
                if (window.pageYOffset > heightCalc) {
                    stickyFilterBar.addClass('sticky-bar-stuck');
                } else {
                    stickyFilterBar.removeClass('sticky-bar-stuck');
                }
            });
        }
    }
};

baseSearch.methods.closeOneRefinementsDropdown = (e) => {
    var $oneRefinementsDropdown = $('.horizontal-onedropdown-filter-group');
    if ((!$('.collapse-one-dropdown-filter').is(e.target) && $oneRefinementsDropdown.has(e.target).length === 0)
        || $('.close-one-refinements-dropdown').is(e.target)) {
            $('.collapse-filters-wrapper').removeClass('active');
    }
};

baseSearch.initialize = () => $(document).ready(function () {
    var isMobile = window.isMobile();
    var collapseMobile = $('[data-collapse-mobile]').attr('data-collapse-mobile') === 'true' ? true : false;
    var collapseDesktop = $('[data-collapse-desktop]').attr('data-collapse-desktop') === 'true' ? true : false;
    if (isMobile && collapseMobile) {
        module.exports.methods.setRefinementCollapseStates('close');
    } else if (isMobile && !collapseMobile) {
        module.exports.methods.setRefinementCollapseStates('open');
    } else if (!isMobile && collapseDesktop) {
        module.exports.methods.setRefinementCollapseStates('close');
    } else if (!isMobile && !collapseDesktop) {
        module.exports.methods.setRefinementCollapseStates('open');
    }
    if ($('#articles-tab').hasClass('active') && $('#content-search-results').html() === '') {
        module.exports.methods.getContent($('.content-search'), $('#content-search-results'));
    }

    localStorage.removeItem('refinement-category');
    $('.refinement-category').removeClass('active');
    $('.refinement-category').find('button.title').attr('aria-expanded', 'false');
    wishlistHelpers.updateLinkData();
});

baseSearch.closeRefinements = function () {
    $('html').on('click', '.refinement-bar button.close, .mobile-filter-drawer-in .modal-background', () => module.exports.methods.toggleRefinementDrawer('close'));
    //for horizontal one dropdown menu
    $('html').on('click', (e) => module.exports.methods.closeOneRefinementsDropdown(e));
}

baseSearch.searchShared$XHR = null;

baseSearch.sort = function () {
    var defaultSortTimeout = 30000;
        sortTimeout = defaultSortTimeout;

    $('[name=sort-order]').each(function () {
        //Track current selection
        var newSelection = this.selectedOptions[0];
        $(this).data('sortValueOption', newSelection);
    });

    // Handle sort order menu selection
    $('.container').on('change', '[name=sort-order]', function (e) {
        e.preventDefault();
        e.stopPropagation();

        // $(this).trigger('search:sort', this.value);
        // var sortOrder = $(this).val().split('srule')[1];
        // var newUrl;
        // var url;
        // if (window.location.toString().indexOf('?srule') !== -1) {
        //     url = window.location.toString().split('?srule')[0];
        //     newUrl = url + "?srule" + sortOrder;
        // } else if (window.location.toString().indexOf('&srule') !== -1) {
        //     url = window.location.toString().split('&srule')[0];
        //     newUrl = url + "&srule" + sortOrder;
        // }
        var $this = $(this);
        var thisValue = this.value;
        $this.trigger('search:sort', thisValue);
        var errorMsg = $this.data().errorMsg;

        var srule = thisValue || '';
        srule = srule.indexOf('srule=') !== -1 ? srule.replace(/^.+srule\=/,'').replace(/\&.+$/,'') : '';

        var newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?';
        // Rebuild url without srule
        var params = window.location.search?.replace(/^\?/g,'').split('&')?.filter((param) => ['srule','',null,undefined].indexOf(param?.split('=')?.[0]) === -1 ); // only include param is key exists & NOT srule
        // Add Srule
        params.push('srule=' + srule);
        // Join URL w/ Params
        newUrl += params.join('&');

        var newSelection = this.selectedOptions[0];
        $('[name="sort-order"]').find('option[selected="selected"], option:selected').prop('selected',false).removeAttr('selected');
        $(newSelection).prop('selected', true).attr('selected', true);

        // Cancel previous request
        module.exports.searchShared$XHR?.abort?.();

        module.exports.searchShared$XHR = $.ajax({
            url: thisValue,
            data: {
                isSortUpdate: true
            },
            method: 'GET',
            timeout: sortTimeout,
            beforeSend: function () {
                $.spinner().start();
            },
            success: function (response) {
                var $response = $(response);
                var $productGridElement = $response.find('.product-grid'); // if response is coming from page designer
                var permalink = $response.find(':input.permalink').val();

                var updatedGridHtml = $productGridElement.length > 0 ? $productGridElement.children() : response;
                $('.product-grid').empty().html(updatedGridHtml);

                // Help ensure the correct page is returned when PLP page is cached
                if (permalink) {
                    history.replaceState(undefined, document.title, permalink);
                } else {
                    history.replaceState(undefined, document.title, newUrl);
                }

                $('body').trigger('search:sort--success');
                $('body').trigger('ajax:load.ajaxEvents', [$('.product-grid')]);
                // Reset timeout
                sortTimeout = defaultSortTimeout;
                $this.data('sortValueOption', newSelection);
            },
            error: function () {
                module.exports.methods.displayMessage({ msg: errorMsg, type: 'warning' });
                var sortOption = $this.data('sortValueOption');
                // Reset last active selection
                if (sortOption) {
                    $(sortOption).prop('selected', true).attr('selected', true );
                }
                // Extend timeout for subsequent submissions
                sortTimeout += defaultSortTimeout;
            },
            complete: function () {
                $.spinner().stop();
            }
        });
    });
};

baseSearch.showMore = function () {
    // Show more products
    $('.container').on('click', '.show-more button', function (e) {
        e.stopPropagation();
        e.preventDefault();
        var showMoreUrl = $(this).data('url');
        var $showMoreButton = $(e.target);
        $.spinner().start();
        $(this).trigger('search:showMore', e);

        // Cancel previous request
        module.exports.searchShared$XHR?.abort?.();

        module.exports.searchShared$XHR = $.ajax({
            url: showMoreUrl,
            method: 'GET',
            success: function (response) {
                var $response = $(response);
                var $productGridElement = $response.find('.product-grid'); // if response is coming from page designer
                var updatedGridHtml = $productGridElement.length > 0 ? $productGridElement.children() : response;

                var promoTileCount = $showMoreButton.closest('.product-grid').find('[class*="experience-promoTile"]').length;
                $('.grid-footer').replaceWith(updatedGridHtml);
                var permalink = $(response).find(':input.permalink').val();

                // Help ensure the correct page is returned when PLP page is cached
                if (permalink) {
                    history.replaceState(undefined, document.title, permalink);
                }

                module.exports.methods.updateSortOptions(response, promoTileCount);
                wishlistHelpers.updateLinkData();
                $('body').trigger('search:showMore--success');
            },
            complete: function () {
                $.spinner().stop();
            }
        });
    });
};

//function to update query parameter value in url
// function updateQueryParameter(url, param, value) {
//     // Use URLSearchParams to manage query parameters
//     let urlParts = url.split("?");
//     let baseUrl = urlParts[0];
//     let queryString = urlParts[1] || "";

//     let params = new URLSearchParams(queryString);

//     // Update or add the parameter
//     params.set(param, value);

//     // Rebuild the URL
//     return `${baseUrl}?${params.toString()}`;
// }

// //function to get query parameter from url
// function getQueryParameter(url, param) {
//     // Use URLSearchParams to manage query parameters
//     let urlParts = url.split("?");
//     let baseUrl = urlParts[0];
//     let queryString = urlParts[1] || "";

//     let params = new URLSearchParams(queryString);

//     // Update or add the parameter
//     return params.get(param);
// }

let updateIntialUrl;
let result = {};

// Funcation to create url of selected filters for mobile
baseSearch.methods.createSelectedFiltersUrl = function (intialUrl, attrId, selectedFilter) {
    $('.helpButton')?.addClass('d-none');    // handling the visibility of overlapping .helpButton
    attrId = attrId === 'refinementcolor' ? 'refinementColor' : attrId
    updateIntialUrl =  $('.filter-apply-btn').attr('data-href')
    if(updateIntialUrl == undefined || updateIntialUrl == '') {
        updateIntialUrl = intialUrl
        return;
    }

    const splitPath = updateIntialUrl.split('?');
    const splitUrl = splitPath[1].split('&');
    let otherParams = [];

    // Create Object from filter Url
    for (let i = 0; i < splitUrl.length; i++) {
        if (splitUrl[i].includes('prefn')) {
            const key = splitUrl[i].split('=')[1];
            const value = splitUrl[i + 1].split('=')[1];
            result = {
                ...result,
                [key]: value.split('%7C') // %7C is decoded value of "|" symbol
            };
            i++; // Skip the next parameter since it's part of the current `prefn`
        } else if (!splitUrl[i].includes('prefv')) {
            otherParams.push(splitUrl[i]);
        }
    }

    if (attrId != 'category') {
    attrId = encodeURIComponent(attrId)
    selectedFilter = encodeURIComponent(selectedFilter)
    // Selected Filter Option Add and Remove Logic
    if(updateIntialUrl.includes(attrId)) {
        // Add new value into existing filter object
        if(!updateIntialUrl.includes(selectedFilter)) {
            result[attrId].push(selectedFilter);
        } else { // Remove value from filter object
            for (const key in result) {
                const index = result[key].indexOf(selectedFilter);
                if (index > -1) {
                    if (result[key].length > 1) {
                        result[key].splice(index, 1);
                    } else {
                        delete result[key];
                    }
                    break;
                }
            }
        }
    } else { // Add new filter value in object
        result = {
            ...result,
            [attrId]: [selectedFilter]
        }
    }

}

    splitPath[0] = attrId == 'category' ? `${selectedFilter?.split('?')[0]}?` :  `${splitPath[0]}?`
    let finalUrl = splitPath[0];
    const result2 = Object.entries(result);
    for (const [i, [key, value]] of result2.entries()) {
        finalUrl += `prefn${i + 1}=${key}&prefv${i + 1}=${value.join('%7C')}&` // %7C is decoded value of "|" symbol
    }
    // Append other parameters at the end of the URL
    if (otherParams.length > 0) {
        finalUrl += otherParams.join('&');
    }
    // finalUrl += `${splitUrl[splitUrl.length - 1]}`;
    updateIntialUrl = finalUrl;
    return updateIntialUrl
}


baseSearch.applyFilter = function () {
    // Handle refinement value selection and reset click
    $('.container').on(
        'click',
        '.refinements li button, .refinement-bar button.reset, .refinement-bar button.filter-apply-btn, .filter-value button, .swatch-filter button, .filter-value button.reset', // WGACA MODIFICATION - additional selector
        function (event) {
            if(!window.isMobile()) {
                var category = $(event.currentTarget).closest('.refinement');

                if (category && category.hasClass('refinement-category')) {
                    localStorage.removeItem('refinement-category');
                }
            }
            //find new attr on Sort if selected, if not use the default

            // var selectedSort = $('select[name="sort-order"]').find('option[selected="selected"]');
            // if (selectedSort.data('id') != null) {
            //     var sortingRule = selectedSort.data('id');
            // } else {
            //     var sortingRule = $('select[name="sort-order"] option:selected').data('id');
            // }

            var sortingRule = "";
            var selectedSort = $('.sortDropdown').find('i.fa-check-circle');
            if (selectedSort.length) {
                sortingRule = selectedSort.parents('button').data('id');
            }
            //create a new url with the correct preferences
            if ($(this).attr('data-href').includes('srule')) {
                var refinementUrl = $(this).attr('data-href').replace(/(&srule=).*?(&|$)/,'$1' + sortingRule + '$2');
            } else if (!$(this).attr('data-href').includes('srule') && sortingRule != null) {
                var refinementUrl = $(this).attr('data-href');
                 if(refinementUrl.includes('?'))
                     refinementUrl = refinementUrl + '&srule=' + sortingRule;
                else
                     refinementUrl = refinementUrl + '?srule=' + sortingRule;
            } else {
                var refinementUrl = $(this).attr('data-href');
            }

            // apply price range filter
            // if(!$(this).hasClass('reset') && (location.href.indexOf("pmin") != -1  || location.href.indexOf("pmax") != -1)){
            //     var pMinPrice = parseInt(getQueryParameter(decodeURIComponent(location.href), "pmin").replace(/,/g, ''));
            //     var pMaxPrice = parseInt(getQueryParameter(decodeURIComponent((location.href)), "pmax").replace(/,/g, ''));

            //     refinementUrl = decodeURIComponent(refinementUrl);
            //     refinementUrl = updateQueryParameter(refinementUrl, "pmin", pMinPrice);
            //     refinementUrl = updateQueryParameter(refinementUrl, "pmax", pMaxPrice);
            // }


            var refinementId = $(this).closest('.horizontal-filter-refinement').attr('id');

            event.preventDefault();
            event.stopPropagation();
            $(this).trigger('search:filter', event);

            // Cancel previous request
            module.exports.searchShared$XHR?.abort?.();

            // Add Apply button latest refinement URL
            // Prevent Api call on checkbox selection for mobile
            if(window.isMobile() && $(this).is('.refinements li button')) {
                $('.helpButton')?.addClass('d-none');    // handling the visibility of overlapping .helpButton
                let attrId = $(this).closest('.card-body').attr('id');
                attrId = attrId.split('-').slice(2).join('-') // Get Selected attribute of filter
                if (attrId === 'category' || attrId === 'plp_category_refinement') {
                    $('.refinement-bar .filter-apply-btn:visible').first().attr('data-href', refinementUrl);
                    return;
                }
                const selectedLabelFilter =
                attrId == 'category' ? ($(this).attr('data-href') || $(this).data('href')) :
                $(this).find('.swatch-color-text').text()?.trim() || $(this).find('span').first().text()?.trim(); // Get Selected filter label
                const newFilterUrl = module.exports.methods.createSelectedFiltersUrl(refinementUrl, attrId, selectedLabelFilter);
                $('.refinement-bar .filter-apply-btn:visible').first().attr('data-href', newFilterUrl || refinementUrl);
                return;
            }

            // close refinment modal on click of apply and reset
            if(window.isMobile() && ($(this).is('.refinement-bar button.filter-apply-btn') || $(this).is('.refinement-bar button.reset'))) {
                // toggleRefinementDrawer('close');
                module.exports.methods.toggleRefinementDrawer('close');
            }

            module.exports.searchShared$XHR = $.ajax({
                url: refinementUrl,
                data: {
                    page: $('.grid-footer').data('page-number')
                },
                method: 'GET',
                timeout: 10000,
                beforeSend: function () {
                    $.spinner().start();
                },
                success: function (response, status, xhr) {
                    module.exports.methods.parseResults(response, xhr);
                    const permalink = $(response).find(':input.permalink').val();
                    refinementId = '#' + refinementId;
                    $(refinementId).find('.dropdown-toggle').trigger('click');
                    history.replaceState(undefined, document.title, permalink || refinementUrl);
                    $('body').trigger('search:filter--success');
                },
                complete: function () {
                    $.spinner().stop();
                }
            });
        });
};

baseSearch.filter = () => $('html').on('click', 'button.filter-results', () => module.exports.methods.toggleRefinementDrawer('open'));
baseSearch.toggle = () => $('html').on('click', '.js-toggle-filters', (e) => module.exports.methods.toggleFilters(e));
baseSearch.reset = () => $('html').on('click', '.js-reset', (e) => $('.refinements li button').trigger('click'));
baseSearch.resize = () => {
    var windowWidth = $(window).width();

    $(window).resize(() => {
        // iOS fix: make sure window actually resized before triggering resize functions
        if (windowWidth !== $(window).width()) {
            windowWidth = $(window).width();
            module.exports.methods.toggleRefinementDrawer('close');
            module.exports.oneDropdownSlideToggle();
        }
    });
};

module.exports = baseSearch;
