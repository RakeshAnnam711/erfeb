/* globals google */
'use strict';

var googleMapsPromise = require('../thirdParty/googleMaps');

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, params) {
    var newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return newUrl;
}

/**
 * Uses google maps api to render a map
 */
function maps() {
    var map;
    var infowindow = new google.maps.InfoWindow();
    var mapdiv = $('.map-canvas').attr('data-locations');
    var bounds = new google.maps.LatLngBounds();
    var zoom = 4;

    mapdiv = JSON.parse(mapdiv);

    if (mapdiv.length === 1) {
        zoom = 18; // set zoom more specifically if single store
    }

    // Init U.S. Map in the center of the viewport
    var latlng = new google.maps.LatLng(37.09024, -95.712891);
    var mapOptions = {
        scrollwheel: false,
        zoom: zoom,
        center: latlng
    };

    map = new google.maps.Map($('.map-canvas')[0], mapOptions);

    Object.keys(mapdiv).forEach(function (key) {
        var item = mapdiv[key];
        var label = parseInt(key, 10) + 1;
        var storeLocation = new google.maps.LatLng(item.latitude, item.longitude);

        var marker = new google.maps.Marker({
            position: storeLocation,
            type: item.storeType.value,
            map: map,
            title: item.name,
            icon: {
                url: item.backgroundImage,
                size: new google.maps.Size(45, 45),
                scaledSize: new google.maps.Size(45, 45),
                labelOrigin: new google.maps.Point(24, 17)
            },
            label: {
                text: label.toString(),
                color: item.color,
                fontSize: '14px'
            }
        });

        marker.addListener('click', function () {
            infowindow.setOptions({
                content: item.infoWindowHtml
            });
            infowindow.open(map, marker);
        });

        // Create a minimum bound based on a set of storeLocations
        bounds.extend(marker.position);

        // If there is only one store, center the map on that store
        if (mapdiv.length === 1) {
            map.setCenter(storeLocation);
        }
    });
    // Fit the all the store marks in the center of a minimum bounds when any store has been found, unless there is a single store result
    if (mapdiv && mapdiv.length > 1) {
        map.fitBounds(bounds);
    }
}

/**
 * Renders the results of the search and updates the map
 * @param {Object} data - Response from the server
 */
function updateStoresResults(data, scope) {
    var $resultsDiv = scope.find('.results');
    var $mapDiv = $('.map-canvas'); //Not scoped to support multiple maps on page yet
    var hasResults = data.stores.length > 0;

    if (!hasResults) {
        if ('noInventoryStores' in data) {
            scope.find('.store-locator-no-results-for-product').show();
        } else {
            scope.find('.store-locator-no-results').show();
        }
        scope.find('.filter-results').hide();
        $resultsDiv.attr('data-has-results', false);
    } else {
        scope.find('.store-locator-no-results').hide();
        scope.find('.store-locator-no-results-for-product').hide();
        scope.find('.filter-results').show();
        $resultsDiv.attr('data-has-results', true);
    }

    $resultsDiv.empty()
        .data('has-results', hasResults)
        .data('radius', data.radius)
        .data('search-key', data.searchKey)
        .data('store-type', data.storeType);

    $mapDiv.attr('data-locations', data.locations);

    if ($mapDiv.data('has-google-api')) {
        googleMapsPromise().then(() => module.exports.methods.maps());
    } else {
        $('.store-locator-no-apiKey').show();
    }

    if (data.storesResultsHtml) {
        $resultsDiv.append(data.storesResultsHtml);
    }

    if (data.noInventoryStoresHtml) {
        $resultsDiv.append(data.noInventoryStoresHtml);
    }


    if (hasResults) {
        $.each(data.storeTypes, function(storeType) {
            var storeTypeValue = data.storeTypes[storeType].value ||data.storeTypes[storeType].value
            if (scope.find('.results [data-store-type="' + storeTypeValue + '"]').length > 0) {
                scope.find('.filter-results [data-filter="' + storeTypeValue + '"]').show();
            }
        });
    }
}

/**
 * Search for stores with new zip code
 * @param {HTMLElement} element - the target html element
 * @returns {boolean} false to prevent default event
 */
function search(element) {
    var dialog = element.closest('.in-store-inventory-dialog');
    var spinner = dialog.length ? dialog.spinner() : $.spinner();
    spinner.start();
    var scope = element.closest('.store-locator-container');
    var $form = element.closest('.store-locator');
    var radius = scope.find('.results').data('radius');
    var postalCode = $form.find('[name="postalCode"]').val() ? $.trim($form.find('[name="postalCode"]').val()) : '';
    var url = $form.attr('action');
    var urlParams = {
        radius: radius
    };
    var isForm = $form.is('form');
    var payload = {
        postalCode: postalCode
    }

    if (isForm) {
        payload = decodeURI($form.serialize()).replace(/\s/g, '');
    }

    url = module.exports.methods.appendToUrl(url, urlParams);
    $.ajax({
        url: url,
        type: $form.attr('method'),
        data: payload,
        dataType: 'json',
        success: function (data) {
            module.exports.methods.updateStoresResults(data, scope);
            scope.find('.select-store').prop('disabled', true);
        },
        complete: function () {
            spinner.stop();
        }
    });
    return false;
}

module.exports = {
    init: function () {
        if ($('.map-canvas').data('has-google-api')) {
            googleMapsPromise().then(() => module.exports.methods.maps());
        } else {
            $('.store-locator-no-apiKey').show();
        }
    },

    detectLocation: function () {
        // clicking on detect location.
        $('body').on('click', '.detect-location', function (e) {
            var scope = $(this).closest('.store-locator-container');
            $.spinner().start();
            if (!navigator.geolocation) {
                $.spinner().stop();
                return;
            }

            navigator.geolocation.getCurrentPosition(function (position) {
                var $detectLocationButton = scope.find('.detect-location');
                var url = $detectLocationButton.data('action');
                var radius = scope.find('.results').data('radius');
                var urlParams = {
                    radius: radius,
                    lat: position.coords.latitude,
                    long: position.coords.longitude
                };

                url = module.exports.methods.appendToUrl(url, urlParams);
                $.ajax({
                    url: url,
                    type: 'get',
                    dataType: 'json',
                    success: function (data) {
                        $.spinner().stop();
                        module.exports.methods.updateStoresResults(data, scope);
                        scope.find('.select-store').prop('disabled', true);
                        scope.find('.detect-location-invalid').removeClass('d-block');
                    }
                }).fail(function(){
                    $.spinner().stop();
                });
            },
            function () {
                $.spinner().stop();
                scope.find('.detect-location-invalid').addClass('d-block');
            }, {
                timeout: 5000
            });
        });
    },

    search: function () {
        $('body').on('submit', '.store-locator-container form.store-locator', function (e) {
            e.preventDefault();
            return module.exports.methods.search($(this));
        });
        $('body').on('click', '.store-locator-container .btn-storelocator-search[type="button"]', function (e) {
            e.preventDefault();
            return module.exports.methods.search($(this));
        });
    },
    changeRadius: function () {
        $('body').on('change', '.store-locator-container .radius', function () {
            var radius = $(this).val();
            var scope = $(this).closest('.store-locator-container');
            var searchKeys = scope.find('.results').data('search-key');
            var url = $(this).data('action-url');
            var urlParams = {};

            if (searchKeys.postalCode) {
                urlParams = {
                    radius: radius,
                    postalCode: searchKeys.postalCode
                };
            } else if (searchKeys.lat && searchKeys.long) {
                urlParams = {
                    radius: radius,
                    lat: searchKeys.lat,
                    long: searchKeys.long
                };
            }

            scope.find('.filter-results [data-filter]').removeClass('active btn-primary').addClass('btn-secondary').hide();
            scope.find('.filter-results [data-filter="all"]').addClass('active btn-primary').removeClass('btn-secondary').show();

            url = module.exports.methods.appendToUrl(url, urlParams);
            var dialog = $(this).closest('.in-store-inventory-dialog');
            var spinner = dialog.length ? dialog.spinner() : $.spinner();
            spinner.start();
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    module.exports.methods.updateStoresResults(data, scope);
                    scope.find('.select-store').prop('disabled', true);
                },
                complete: function () {
                    spinner.stop();
                }
            });
        });
    },
    filterResults: function () {
        var $filters = $('.filter-results [data-filter]');

        $filters.on('click', function (e) {
            e.preventDefault();
            var scope = $(this).closest('.store-locator-container');

            $filters.removeClass('active btn-primary').addClass('btn-secondary');
            $(this).addClass('active btn-primary').removeClass('btn-secondary');

            var $filterType = $(this).attr('data-filter');
            var radius = scope.find('.results').data('radius');
            var searchKeys = scope.find('.results').data('search-key');
            var url = scope.find('.filter-results').data('action-url');
            var urlParams = {};

            if (searchKeys.postalCode) {
                urlParams = {
                    radius: radius,
                    postalCode: searchKeys.postalCode,
                    storeType: $filterType
                };
            } else if (searchKeys.lat && searchKeys.long) {
                urlParams = {
                    radius: radius,
                    lat: searchKeys.lat,
                    long: searchKeys.long,
                    storeType: $filterType
                };
            }

            url = module.exports.methods.appendToUrl(url, urlParams);
            var dialog = scope.find('.radius').closest('.in-store-inventory-dialog');
            var spinner = dialog.length ? dialog.spinner() : $.spinner();
            spinner.start();
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    module.exports.methods.updateStoresResults(data, scope);
                    scope.find('.select-store').prop('disabled', true);
                },
                complete: function () {
                    spinner.stop();
                }
            });

        });
    },
    selectStore: function () {
        $('body').on('click', '.store-locator-container .select-store', function (e) {
            e.preventDefault();
            var scope = $(this).closest('.store-locator-container');
            var selectedStore = scope.find('input.select-store-input:checked');
            var data = {
                storeID: selectedStore.val(),
                searchRadius: scope.find('#radius').val(),
                searchPostalCode: scope.find('.results').data('search-key').postalCode,
                storeDetailsHtml: selectedStore.siblings('label').find('.store-details').html(),
                storeInfoJSON: selectedStore.data('store-info') || {},
                event: e,
                scope: scope
            };

            $('body').trigger('store:selected', data);
        });
    },
    updateSelectStoreButton: function () {
        $('body').on('change', '.select-store-input', (function () {
            // Find the correct modal to update the button in
            var modal = $(this).closest('.modal');
            modal.find('.select-store').prop('disabled', false);
        }));
    },
    clickSelectStoreInHeader: function () {
        $('body').on('click', '.js-store-picker-header', function(e) {
            var modalSelector = '#home-store-picker-container';
            var $target = $(e.currentTarget);
            var modalAppendedToBody = $('body').children(modalSelector).length > 0;
            var $modal = $target.find(modalSelector);

            if (!modalAppendedToBody && $modal.length > 0) {
                // remove all modals from inside store selectors (mobile and desktop) and append to body
                $(document.querySelectorAll(modalSelector)).remove();
                $('body').append($modal);
                $modal.modal('show');
            } else {
                $modal = $('body').children(modalSelector);
                $modal.modal('show');
            }
        });
    },
    storeSelectedInHeader: function () {
        $('body').on('store:selected', function (e, data) {
            if (data.scope.parents('#home-store-picker-container').length) {
                var spinner = data.scope.spinner();
                spinner.start();
                $.ajax({
                    url: module.exports.methods.appendToUrl(data.scope.data('setpreferredstoreactionurl'), { preferredStoreID: data.storeID }),
                    type: 'get',
                    dataType: 'json',
                    success: function (result) {
                        if (result && result.success) {
                            var $prompt = $('.js-storelocator-header-prompt');
                            var promptText = $prompt.data('prompt-text');
                            data.scope.find('.store-locator-failed-to-set-preferred').hide();
                            data.scope.closest('.modal').modal('hide');
                            $prompt.html(promptText + ': ' + data.storeInfoJSON.name);
                            $prompt.attr('title', data.storeInfoJSON.name);
                        } else {
                            data.scope.find('.store-locator-failed-to-set-preferred').show();
                        }
                    },
                    complete: function () {
                        spinner.stop();
                    }
                }).fail(function(){
                    data.scope.find('.store-locator-failed-to-set-preferred').show();
                });
            }
        })
    },
    selectStoreInSearch: function() {
        $('body').on('click', '.store-select-map', function (e) {
            e.preventDefault();
            var scope = $(this);
            var storeName = scope.data('store-name');
            scope.spinner().start();
            $.ajax({
                url: scope.data('action'),
                type: 'get',
                dataType: 'json',
                success: function (result) {
                    if (result && result.success) {
                        var $prompt = $('.js-storelocator-header-prompt');
                        var promptText = $prompt.data('prompt-text');
                        scope.closest('.store-locator-failed-to-set-preferred').hide();
                        $prompt.html(promptText + ': ' + storeName);
                        $prompt.attr('title', storeName);
                    } else {
                        scope.closest('.store-locator-failed-to-set-preferred').show();
                    }
                },
                complete: function () {
                    scope.spinner().stop();
                }
            }).fail(function(){
                scope.closest('.store-locator-failed-to-set-preferred').show();
            });
        });
    },
    methods: {
        appendToUrl: appendToUrl,
        maps: maps,
        updateStoresResults: updateStoresResults,
        search: search
    }
};
