"use strict";
var zenGoogle = require('./zen-google');
/**
 * Displays google map
 * @param {Object} mapContainer - container with map attributes
 */
function initMap(collectionPoint) {
	// set map of location
    var latlng = new google.maps.LatLng(Number.parseFloat(collectionPoint.lat), Number.parseFloat(collectionPoint.lng));
    var bounds = new google.maps.LatLngBounds();

    var mapOptions = {
        zoom: 15,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var locmap = new google.maps.Map($('.collection-map').get(0), mapOptions);

    window.googleDropOffLocationsMap = {
        bounds: bounds,
        map: locmap
    }
}

function getDistanceUnitDisplayValue(units) {
    if (units === 'MI') {
        return 'Miles'
    }
    if (units === 'KM') {
        return 'Kilometers'
    }
}

function getDropOffLocationDisplayName(location) {
    if(location.location_name) {
        return location.location_name;
    }
    if(location.location_company) {
        return location.location_company;
    }
    if(location.location_type) {
        return location.location_type;
    }
}

function getDropOffLocationId(location) {
    if(location.location_id) {
        return location.location_id;
    }
    if(location.location_code) {
        return location.location_code;
    }
}

function getOpeningHours(collectionPoint) {
    var operationalHours = Object.keys(collectionPoint.operational_hours);
    var orderedDays = [
        {key:'MON', formated: 'Monday'},
        {key:'FRI', formated: 'Friday'},
        {key:'TUE', formated: 'Tuesday'},
        {key:'SAT', formated: 'Saturday'},
        {key:'WED', formated: 'Wednesday'},
        {key:'SUN', formated: 'Sunday'},
        {key:'THU', formated: 'Thursday'}
    ]
    var hoursElements = ''
    orderedDays.forEach(function(dayObject) {
        operationalHours.forEach(function(day) {
            if (dayObject.key === day) {
                hoursElements += '<div class="font-weight-light col-6">' + dayObject.formated + ': ';
                if (typeof collectionPoint.operational_hours[day] === 'object') {
                    hoursElements += collectionPoint.operational_hours[day].open + ' - ' + collectionPoint.operational_hours[day].close + '</div>'
                } else {
                    hoursElements += collectionPoint.operational_hours[day] + '</div>'
                }
            }
        })
    });
    return hoursElements;
}

function scrollCollectionPointCard(collectionPoint) {
    if ($(document).width() > 768) {
        $('.collection-points').animate({scrollTop: $('.collection-points').scrollTop() + (collectionPoint.offset().top - $('.collection-points').offset().top)}, 500);
    } else {
        $('.collection-points').animate({scrollLeft: $('.collection-points').scrollLeft() + (collectionPoint.offset().left - $('.collection-points').offset().left)}, 500);
    }
}

function activateCollectionPoint(collectionPoint) {
    var collectionPointData = JSON.parse(sessionStorage['collection-point-' + collectionPoint.attr('id')]);
    $('.collection-point').removeClass('border-primary');
    $('.collection-point').find('.choose-location').addClass('d-none');
    collectionPoint.find('.choose-location').removeClass('d-none');
    collectionPoint.addClass('border-primary');
    var location = new google.maps.LatLng(parseFloat(collectionPointData.lat), parseFloat(collectionPointData.lng));
    window.googleDropOffLocationsMap.map.panTo(location);
    scrollCollectionPointCard(collectionPoint);
}

function createCollectionPointElement(locationsContainer, collectionPoint, selected) {
    sessionStorage['collection-point-' + getDropOffLocationId(collectionPoint)] = JSON.stringify(collectionPoint);
    locationsContainer.append(
        '<div class="collection-point border mb-2 p-1" id="' + getDropOffLocationId(collectionPoint) + '">' +
            '<div class="collection-point-distance">' +
                collectionPoint.distance + collectionPoint.distance_units + ' away' +
            '</div>' +
            '<div class="collection-point-title font-weight-bold">' +
                getDropOffLocationDisplayName(collectionPoint) +
            '</div>' +
            '<div class="collection-point-opening-hours row">' +
                getOpeningHours(collectionPoint) +
            '</div>' +
            '<button type="button" data-dismiss="modal" class="choose-location btn btn-primary d-none">Select <i class="fa fa-play-circle ml-3" aria-hidden="true"></i></button>' +
        '</div>'
    );
    if (selected) {
        var selectedCollectionPoint = $('#' + getDropOffLocationId(collectionPoint));
        activateCollectionPoint(selectedCollectionPoint);
    }
    var marker = new google.maps.Marker({ position: { lat: Number.parseFloat(collectionPoint.lat), lng: Number.parseFloat(collectionPoint.lng) }, map: window.googleDropOffLocationsMap.map, title: getDropOffLocationDisplayName(collectionPoint)});
    google.maps.event.addListener(marker, 'click', function() {
        window.googleDropOffLocationsMap.map.panTo(marker.getPosition());
        var card = $('#' + getDropOffLocationId(collectionPoint));
        activateCollectionPoint(card);
    });
    window.googleDropOffLocationsMap.bounds.extend(marker.position);
}
function updateDropOffModal(collectionPoints, eventTarget) {
    initMap(collectionPoints[0]);
    collectionPoints.forEach(function(collectionPoint) {
        var selected = getDropOffLocationId(collectionPoint).toString() === eventTarget.data('activelocation').toString();
        createCollectionPointElement($('#drop-off-modal').find('.collection-points'), collectionPoint, selected);
    });
    $('#drop-off-modal').modal('show');
}

function init() {
    var placeInput = $('#change-modal-address')[0];
    var autocomplete = new google.maps.places.Autocomplete(placeInput);
    google.maps.event.addListener(autocomplete, 'place_changed', function () {
        var place = autocomplete.getPlace();
        var doesPlaceHavePostalCode = zenGoogle.checkPlaceForPostalCode(place)
        if (!doesPlaceHavePostalCode) {
            $('#change-modal-address').addClass('is-invalid');
            $('#change-modal-address-error').html('Requested place must have postal-code.');
            return;
        } else {
            $('#change-modal-address').removeClass('is-invalid');
            $('#change-modal-address-error').empty();
        }
        $('#drop-off-modal').spinner().start();
        place = zenGoogle.getGeoAddressFromGoogleObject(place)
        var requestAddress = {
            city: place.city,
            countryCode: {
                value: place.countryCode
            },
            postalCode: place.postalCode,
            stateCode: place.stateCode,
            address1: place.address1
        }
        var url = $('#change-modal-address').data('locationsurl');
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: url,
            contentType: 'application/json',
            data: JSON.stringify({
                address: requestAddress
            }),
            success: function (data) {
                var selected = true
                var collectionPoints = Object.keys(data);
                $('.collection-points').empty();
                collectionPoints.forEach(function (collectionPoint) {
                    if (typeof data[collectionPoint] === 'object' && data[collectionPoint].lat && data[collectionPoint].lng) {
                        createCollectionPointElement($('.collection-points'), data[collectionPoint], selected);
                        selected = false;
                    }
                });
                $('#drop-off-modal').spinner().stop();
            },
            error: function (err) {
                $('#drop-off-modal').spinner().stop();
            }
        })
    });

    $('.collection-points').on('scroll', function() {
        if ($(document).width() < 768) {
            var container = $(this);
            clearTimeout($.data(this, 'scrollTimer'));
            $.data(this, 'scrollTimer', setTimeout(function() {
                for (var i = 0; i < container.find('.collection-point').length; i++) {
                    var collectionPoint = $(container.find('.collection-point')[i]);
                    if (collectionPoint.offset().left >= container.offset().left) {
                        activateCollectionPoint(collectionPoint);
                        break;
                    }
                }
            }, 250));
        }
    });
    $(document).on('click', '.collection-point', function() {
        activateCollectionPoint($(this));
    });
    $(document).on('click', '.change-dopu-link', function() {
        var sessionKey = $(this).data('sessionid');
        if ($('#drop-off-modal').attr('data-sessionid') && $('#drop-off-modal').data('sessionid') === sessionKey) {
            $('#drop-off-modal').modal('show');
        } else {
            $('#drop-off-modal').attr('data-sessionid', sessionKey);
            updateDropOffModal(JSON.parse(sessionStorage[sessionKey]), $(this));
            $('#drop-off-modal').modal('show');
        }
    });

    $(document).on('click', 'button.btn-show-more-locations', function() {
        var dataItem = JSON.parse(sessionStorage.nearestLocation);
        var card = $(this).parents('.card')
        var url = $(this).data('url');
        var requestAddress = {
            city: dataItem.city,
            countryCode: {
                value: dataItem.country
            },
            postalCode: dataItem.postal_code,
            stateCode: dataItem.state,
            address1: dataItem.street1
        }
        card.spinner().start();
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: url,
            contentType: 'application/json',
            data: JSON.stringify({
                address: requestAddress
            }),
            success: function (data) {
                var selected = true;
                var collectionPoints = Object.keys(data);
                $('.collection-points').empty();
                collectionPoints.forEach(function (collectionPoint) {
                    if (typeof data[collectionPoint] === 'object' && data[collectionPoint].lat && data[collectionPoint].lng) {
                        if (selected) {
                            initMap(data[collectionPoint]);
                            $(this).attr('data-activelocation', getDropOffLocationId(data[collectionPoint]));
                        }
                        createCollectionPointElement($('.collection-points'), data[collectionPoint], selected);
                        selected = false;
                    }
                });
                $('#drop-off-modal').modal('show');
                card.spinner().stop();
            }
        })
    });
}

$(document).ready(function() {
    init();
});

module.exports = {
    initMap: initMap,
    activateCollectionPoint: activateCollectionPoint,
    createCollectionPointElement: createCollectionPointElement,
    getDropOffLocationDisplayName: getDropOffLocationDisplayName,
    getDropOffLocationId: getDropOffLocationId,
    getOpeningHours: getOpeningHours,
    getDistanceUnitDisplayValue: getDistanceUnitDisplayValue
}
