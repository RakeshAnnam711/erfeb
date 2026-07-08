'use strict';

var exports = $.extend({}, require('core/search/search'));
var wishlistHelpers = require('core/wishlist/components/helpers');
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

    try {
        url1Obj = new URL(url1, window.location.origin);
        url2Obj = new URL(url2, window.location.origin);

        ['pmin', 'pmax'].forEach(param => {
            const val = url1Obj.searchParams.get(param);
            if (val) {
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

function copyAppliedFilterParams(sourceUrl, targetUrl) {
    var sourceUrlObj;
    var targetUrlObj;

    if (!targetUrl) {
        return sourceUrl;
    }

    try {
        sourceUrlObj = new URL(sourceUrl, window.location.origin);
        targetUrlObj = new URL(targetUrl, window.location.origin);

        sourceUrlObj.searchParams.forEach(function (value, key) {
            if (/^prefn\d+$/.test(key) || /^prefv\d+$/.test(key) || ['cgid', 'pmin', 'pmax', 'srule', 'start', 'sz'].indexOf(key) > -1) {
                targetUrlObj.searchParams.set(key, value);
            }
        });

        return targetUrl.startsWith('http')
            ? targetUrlObj.toString()
            : targetUrlObj.pathname + targetUrlObj.search;
    } catch (e) {
        return sourceUrl;
    }
}

function normalizeRefinementAttrId(attrId) {
    var refinementAttrIds = {
        cgid: 'cgid',
        category: 'pCategory',
        pcategory: 'pCategory',
        plp_category_refinement: 'pCategory',
        refinementcolor: 'refinementColor',
        subcategory: 'pSubCategory',
        psubcategory: 'pSubCategory'
    };

    return refinementAttrIds[attrId] || attrId;
}

function isCategoryRefinement(attrId) {
    return normalizeRefinementAttrId(attrId) === 'cgid';
}

function getCategoryIdFromUrl(url) {
    try {
        return new URL(url, window.location.origin).searchParams.get('cgid');
    } catch (e) {
        return null;
    }
}

function createSelectedCategoryUrl(initialUrl) {
    var categoryId = getCategoryIdFromUrl(initialUrl);
    var applyUrl = getFilterApplyButton().attr('data-href') || '';
    var sourceUrl = applyUrl || window.location.href || initialUrl;
    var sourceUrlObj;
    var targetUrlObj;

    try {
        sourceUrlObj = new URL(sourceUrl, window.location.origin);
        targetUrlObj = new URL(initialUrl, window.location.origin);
    } catch (e) {
        return initialUrl;
    }

    sourceUrlObj.searchParams.forEach(function (value, key) {
        if (/^prefn\d+$/.test(key) || /^prefv\d+$/.test(key) || ['pmin', 'pmax', 'srule', 'start', 'sz'].indexOf(key) > -1) {
            targetUrlObj.searchParams.set(key, value);
        }
    });

    if (categoryId) {
        targetUrlObj.searchParams.set('cgid', categoryId);
    }

    return initialUrl.startsWith('http') ? targetUrlObj.toString() : targetUrlObj.pathname + targetUrlObj.search;
}

function getPreferencePairFromUrl(url, attrId, fallbackValue) {
    var normalizedAttrId = normalizeRefinementAttrId(attrId);
    var pair = {
        attrId: normalizedAttrId,
        value: fallbackValue
    };

    try {
        var urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.forEach(function (paramValue, paramKey) {
            if (!/^prefn\d+$/.test(paramKey)) {
                return;
            }

            var index = paramKey.replace('prefn', '');
            var preferenceValue = urlObj.searchParams.get('prefv' + index);
            var normalizedParamValue = normalizeRefinementAttrId(paramValue);
            if (normalizedParamValue === normalizedAttrId) {
                pair.attrId = normalizedParamValue;
                if (!pair.value && preferenceValue) {
                    pair.value = preferenceValue;
                }
            }
        });
    } catch (e) {
        // Keep the label fallback when the generated refinement URL cannot be parsed.
    }

    return pair;
}

function readPreferenceParams(url) {
    var filters = {};

    if (!url) {
        return filters;
    }

    try {
        var urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.forEach(function (paramValue, paramKey) {
            if (!/^prefn\d+$/.test(paramKey)) {
                return;
            }

            var index = paramKey.replace('prefn', '');
            var prefv = urlObj.searchParams.get('prefv' + index);
            if (prefv) {
                filters[normalizeRefinementAttrId(paramValue)] = prefv.split('|');
            }
        });
    } catch (e) {
        return filters;
    }

    return filters;
}

function removePreferenceParams(urlObj) {
    Array.from(urlObj.searchParams.keys()).forEach(function (key) {
        if (/^prefn\d+$/.test(key) || /^prefv\d+$/.test(key)) {
            urlObj.searchParams.delete(key);
        }
    });
}

function getFilterApplyButton() {
    var $visibleButton = $('.refinement-bar .filter-apply-btn:visible').first();

    return $visibleButton.length ? $visibleButton : $('.filter-apply-btn').first();
}

function createSelectedFiltersUrl(initialUrl, attrId, selectedFilter) {
    $('.helpButton')?.addClass('d-none');

    if (isCategoryRefinement(attrId)) {
        return createSelectedCategoryUrl(initialUrl);
    }

    var applyUrl = getFilterApplyButton().attr('data-href') || '';
    var baseUrl = applyUrl || window.location.href || initialUrl;
    var urlObj;

    try {
        urlObj = new URL(baseUrl, window.location.origin);
    } catch (e) {
        return initialUrl;
    }

    var selectedFilters = readPreferenceParams(baseUrl);
    var selectedPreference = getPreferencePairFromUrl(initialUrl, attrId, selectedFilter);
    var selectedValues = selectedPreference.value ? selectedPreference.value.split('|') : [];

    removePreferenceParams(urlObj);

    selectedFilters[selectedPreference.attrId] = selectedFilters[selectedPreference.attrId] || [];
    selectedValues.forEach(function (value) {
        var existingIndex = selectedFilters[selectedPreference.attrId].indexOf(value);
        if (existingIndex > -1) {
            selectedFilters[selectedPreference.attrId].splice(existingIndex, 1);
        } else {
            selectedFilters[selectedPreference.attrId].push(value);
        }
    });

    if (!selectedFilters[selectedPreference.attrId].length) {
        delete selectedFilters[selectedPreference.attrId];
    }

    Object.keys(selectedFilters).forEach(function (key, index) {
        urlObj.searchParams.set('prefn' + (index + 1), key);
        urlObj.searchParams.set('prefv' + (index + 1), selectedFilters[key].join('|'));
    });

    return baseUrl.startsWith('http') ? urlObj.toString() : urlObj.pathname + urlObj.search;
}

exports.methods = exports.methods || {};
exports.methods.createSelectedFiltersUrl = createSelectedFiltersUrl;
function applyFilter() {
    $('.container').off(
        'click',
        '.refinements li button, .refinement-bar button.reset, .refinement-bar button.filter-apply-btn, .filter-value button, .swatch-filter button, .filter-value button.reset').on(
        'click',
        '.refinements li button, .refinement-bar button.reset, .refinement-bar button.filter-apply-btn, .filter-value button, .swatch-filter button, .filter-value button.reset',
        function (event) {
            const currentUrl = getFilterApplyButton().attr('data-href') || window.location.href;

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
            const isReset = $(this).is('button.reset');
            if (isReset) {
                window._activePriceFilter = null;
            }
            if (!window.isMobile() && !isReset) {
                const apf = window._activePriceFilter;
                if (apf && apf.pmin != null) {
                    try {
                        const urlObj = new URL(refinementUrl, window.location.origin);
                        urlObj.searchParams.set('pmin', apf.pmin);
                        urlObj.searchParams.set('pmax', apf.pmax);
                        refinementUrl = refinementUrl.startsWith('http') ? urlObj.toString() : urlObj.pathname + urlObj.search;
                    } catch(e) {
                        refinementUrl = copyPriceRange(window.location.href, refinementUrl);
                    }
                } else {
                    refinementUrl = copyPriceRange(window.location.href, refinementUrl);
                }
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

                getFilterApplyButton().attr('data-href', newFilterUrl || refinementUrl);
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

                // beforeSend: () => $.spinner().start(),

                success: function (response, status, xhr) {
                    // Update grid + refinements
                    parseResultsOptimized(response);
                
                    loadProductTiles(document.querySelector('.product-grid'));
                    wishlistHelpers.updateLinkData();
                    const permalink = $(response).find(':input.permalink').val();
                    history.replaceState(
                        undefined,
                        document.title,
                        copyAppliedFilterParams(refinementUrl, permalink)
                    );
                
                    $('body').trigger('search:filter--success');
                },                

                error: function(xhr, status, error) {
                    console.error('Filter request failed:', error);
                    $.spinner().stop();
                },

                // complete: () => $.spinner().stop()
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

        var $btn = $(this);
        var showMoreUrl = $btn.data('url');
        const currentUrl = window.location.href;

        if (!showMoreUrl) return;

        // $.spinner().start();

        showMoreUrl = copyPriceRange(currentUrl, showMoreUrl);

        $.ajax({
            url: showMoreUrl,
            method: 'GET',

            success: function (response) {
                var $response = $(response);
                var $newTiles = $response.find('.plp-product-tile');

                if (!$newTiles.length) {
                    // $.spinner().stop();
                    return;
                }

                var gridInner = document.querySelector('.product-grid-inner');
                $newTiles.each(function () {
                    gridInner.appendChild(this);
                });
                var $updatedFooter = $response.find('.grid-footer');
                $('.grid-footer').replaceWith($updatedFooter);

                updateSortOptions(response);
                // loadProductTiles(gridInner);
                loadProductTiles(gridInner, { startWithNextBatch: true });


                $('body').trigger('search:showMore--success');

                // $.spinner().stop();
            },

            error: function () {
                $.spinner().stop();
            }
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

function loadProductTiles(context, options) {
    var scope = context || document;
    options = options || {};

    var gridInner = scope.classList && scope.classList.contains('product-grid-inner')
        ? scope
        : scope.querySelector('.product-grid-inner');

    if (!gridInner) return;

    var tiles = Array.prototype.slice.call(
        scope.querySelectorAll('.js-tile:not([data-loaded="true"])')
    );

    if (!tiles.length) return;

    var moreResultsButton = document.getElementById('more-results-button');
    // var viewAllResultsButton = document.getElementById('view-all-results-button');

    var FIRST_BATCH_SIZE = 6;
    var NEXT_BATCH_SIZE = 6;

    var index = 0;
    var isFirstBatch = !options.startWithNextBatch;

    if (moreResultsButton) moreResultsButton.style.display = 'none';
    // if (viewAllResultsButton) viewAllResultsButton.style.display = 'none';

    // Hide all tiles initially
    tiles.forEach(function (tile) {
        tile.style.display = 'none';
    });

    function loadBatchSequentially() {
        if (index >= tiles.length) {
            if (moreResultsButton) moreResultsButton.style.display = '';
            // if (viewAllResultsButton) viewAllResultsButton.style.display = '';
            return;
        }

        var batchSize = isFirstBatch ? FIRST_BATCH_SIZE : NEXT_BATCH_SIZE;
        var batch = tiles.slice(index, index + batchSize);
        index += batchSize;

        // Show skeletons for this batch
        batch.forEach(function (tile) {
            tile.style.display = '';
        });

        var results = [];
        var i = 0;

        function loadNextTile() {

            if (i >= batch.length) {

                results.forEach(function (res) {
                    if (!res.html) return;

                    res.tile.innerHTML = res.html;
                    res.tile.dataset.loaded = 'true';
                });
                wishlistHelpers.updateLinkData();

                isFirstBatch = false;

                requestAnimationFrame(loadBatchSequentially);
                return;
            }

            var tile = batch[i++];
            var url = tile.dataset.tileUrl;

            if (!url) {
                results.push({ tile: tile, html: '' });
                loadNextTile();
                return;
            }

            fetch(url, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(function (res) {
                if (!res.ok) throw new Error('Tile failed');
                return res.text();
            })
            .then(function (html) {
                results.push({ tile: tile, html: html });
            })
            .catch(function () {
                results.push({ tile: tile, html: '' });
            })
            .finally(loadNextTile);
        }

        loadNextTile();
    }

    loadBatchSequentially();
}

exports.applyFilter = applyFilter;
exports.parseResults = parseResultsOptimized;
exports.methods = exports.methods || {};
exports.methods.parseResults = parseResultsOptimized;
exports.copyPriceRange = copyPriceRange;
exports.loadProductTiles = loadProductTiles;

module.exports = exports;
