'use strict';

var exports = $.extend({}, require('core/search/search'));
function updateSortOptions(response) {
    var $wrapper = $('<div>').append(response);
    var footer = $wrapper.find('.grid-footer');
    if (!footer.length) return;

    var sortOptions = footer.data('sort-options')?.options || [];
    sortOptions.forEach(function (option) {
        $('option.' + option.id).val(option.url);
    });
}
function copyPriceRange(url1, url2) {
    let url1Obj, url2Obj;
    let base = 'https://dummy.com';

    try {
        url1Obj = new URL(url1.startsWith('http') ? url1 : base + url1);
        url2Obj = new URL(url2.startsWith('http') ? url2 : base + url2);

        ['pmin', 'pmax'].forEach(param => {
            const val = url1Obj.searchParams.get(param);
            if (val && url2Obj.searchParams.has(param)) {
                url2Obj.searchParams.set(param, val);
            }
        });

        return url2.startsWith('http')
            ? url2Obj.toString()
            : url2Obj.pathname + url2Obj.search;
    } catch (e) {
        return url2;
    }
}
function applyFilter() {
    $('.container').off(
        'click',
        '.refinements li button, .refinement-bar button.reset, .refinement-bar button.filter-apply-btn, .filter-value button, .swatch-filter button, .filter-value button.reset').on(
        'click',
        '.refinements li button, .refinement-bar button.reset, .refinement-bar button.filter-apply-btn, .filter-value button, .swatch-filter button, .filter-value button.reset',
        function (event) {
            const currentUrl = $('.filter-apply-btn').attr('data-href') || window.location.href;

            if (!window.isMobile()) {
                var category = $(event.currentTarget).closest('.refinement');
                if (category && category.hasClass('refinement-category')) {
                    localStorage.setItem('refinement-category', true);
                    return;
                }
            }

            let sortingRule = '';
            let selectedSort = $('.sortDropdown').find('i.fa-check-circle');
            if (selectedSort.length) {
                sortingRule = selectedSort.parents('button').data('id');
            }

            let refinementUrl = $(this).attr('data-href');

            // Safety check: ensure refinementUrl exists
            if (!refinementUrl) {
                console.warn('Filter button: data-href attribute is missing');
                return;
            }

            // Handle sort rule in URL
            if (refinementUrl.includes('srule')) {
                refinementUrl = refinementUrl.replace(/(&srule=).*?(&|$)/, '$1' + sortingRule + '$2');
            } else if (sortingRule) {
                refinementUrl += (refinementUrl.includes('?') ? '&' : '?') + 'srule=' + sortingRule;
            }

            event.preventDefault();
            event.stopPropagation();

            $(this).trigger('search:filter', event);
            module.exports.searchShared$XHR?.abort?.();
            if (!window.isMobile()) {
                refinementUrl = copyPriceRange(currentUrl, refinementUrl);
            }
            if (window.isMobile() && $(this).is('.refinements li button')) {
                refinementUrl = copyPriceRange(currentUrl, refinementUrl);
                const cardBody = $(this).closest('.card-body');
                let attrId = cardBody.attr('id').split('-').slice(2).join('-');
                let label =
                    $(this).find('.swatch-color-text').text().trim() ||
                    $(this).find('span').first().text().trim();

                const newFilterUrl = module.exports.methods.createSelectedFiltersUrl(
                    refinementUrl,
                    attrId,
                    label
                );

                $('.filter-apply-btn').attr('data-href', newFilterUrl || refinementUrl);
                return;
            }
            if (
                window.isMobile() &&
                ($(this).is('.refinement-bar button.filter-apply-btn') ||
                    $(this).is('.refinement-bar button.reset'))
            ) {
                module.exports.methods.toggleRefinementDrawer('close');
            }
            module.exports.searchShared$XHR = $.ajax({
                url: refinementUrl,
                data: { page: $('.grid-footer').data('page-number') },
                method: 'GET',
                timeout: 10000,

                beforeSend: () => $.spinner().start(),

                success: function (response, status, xhr) {
                    // Use parseResultsOptimized which now properly updates refinements and filter UI
                    parseResultsOptimized(response);

                    const permalink = $(response).find(':input.permalink').val();
                    history.replaceState(
                        undefined,
                        document.title,
                        copyPriceRange(refinementUrl, permalink) || refinementUrl
                    );

                    $('body').trigger('search:filter--success');
                },

                error: function(xhr, status, error) {
                    console.error('Filter request failed:', error);
                    $.spinner().stop();
                },

                complete: () => $.spinner().stop()
            });
        }
    );
}

function parseResultsOptimized(response) {
    const $res = $(response);
    const isMobile = window.isMobile();

    // Determine which refinements selector to use
    var refinements = '';
    if (!isMobile) {
        refinements = '.desktop-search-refinements';
    } else {
        refinements = '.mobile-search-refinements';
    }

    // Update all necessary DOM elements (matching develop branch behavior)
    // This ensures checkboxes/tick marks are properly updated
    const selectors = [
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
        // '.filter-bar',
        // Update individual refinement types (for granular updates)
        `${refinements} .refinements .refinement-subcategory`,
        `${refinements} .refinements .refinement-category`,
        `${refinements} .refinements .refinement-brand`,
        `${refinements} .refinements .refinement-refinementcolor`,
        `${refinements} .refinements .refinement-material`,
        `${refinements} .refinements .refinement-condition_name`,
        `${refinements} .refinements .refinement-price`,
        `${refinements} .refinements .refinement-location`,
        // Update entire refinements section (ensures all checkboxes are updated)
        `${refinements} .refinements`
    ];

    selectors.forEach((selector) => {
        const $updates = $res.find(selector);
        if ($updates.length && $(selector).length) {
            $(selector).empty().html($updates.html());
        }
    });

    // Handle no results case
    if ($("#noresultfound").children().length > 0) {
        $('#filterView').empty();
        $('.product-grid').empty();
    }

    updateSortOptions(response);
    requestAnimationFrame(() => {
        $('body').trigger('ajax:load.ajaxEvents', [$('.search-results')]);
    });
}
exports.showMore = function () {
    $('body').on('click', '.show-more button', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var showMoreUrl = $(this).data('url');
        const currentUrl = window.location.href;

        $.spinner().start();
        showMoreUrl = copyPriceRange(currentUrl, showMoreUrl);

        $.ajax({
            url: showMoreUrl,
            data: { selectedUrl: showMoreUrl },
            method: 'GET',

            success: function (response) {
                const $newTiles = $(response).find('.product-grid-inner .plp-product-tile');
                const frag = document.createDocumentFragment();
                $newTiles.each((i, el) => frag.appendChild(el));

                document.querySelector('.product-grid-inner').appendChild(frag);
                const $updatedFooter = $(response).find('.grid-footer');
                $('.grid-footer').replaceWith($updatedFooter);

                updateSortOptions(response);

                $('body').trigger('search:showMore--success');
                $.spinner().stop();
            },

            error: () => $.spinner().stop()
        });
    });
};
exports.productGridView = function () {
    $('.product-tile-layout .grid').on('click', function () {
        $('.product-tile-layout .grid').removeClass('active');
        $(this).addClass('active');

        $('.product-grid-inner').toggleClass('three-tile', $(this).hasClass('three-tile'));
    });
};
exports.applyFilter = applyFilter;
exports.parseResults = parseResultsOptimized;
exports.methods = exports.methods || {};
exports.methods.parseResults = parseResultsOptimized;
exports.copyPriceRange = copyPriceRange;

module.exports = exports;
