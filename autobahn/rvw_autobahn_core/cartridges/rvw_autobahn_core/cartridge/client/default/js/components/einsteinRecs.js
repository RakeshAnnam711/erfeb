'use strict';

var einsteinUtils = require('./einsteinUtils');
var productTile = require('./productTile');
var abSlider = require('./slider');

module.exports = {};

/**
 * Gets all placeholder elements, which hold einstein recommendations queries the details from the
 * einstein engine and feeds them back to the dom element
 * @param {Object} e jquery event
 * @returns {Object} jquery targets
 */
module.exports.loadRecommendations = function ($context) {
    var $recommendationTargets = $context.hasClass('.einstein-data') ? $context : $context.find('.einstein-data');
    $recommendationTargets = $recommendationTargets.filter((i, rec) => {
        return !$(rec).hasClass('einstein-loading') && $(rec).find('.product[data-pid="placeholder"]').length > 0;
    });

    return $recommendationTargets.addClass('einstein-loading').each(function () {
        var $recTrigger = $(this);
        var data = $recTrigger.data() || {};
        var asyncUrl = data.url;

        einsteinUtils.getRecommendations(data, function (einsteinResponse) {
            var response = einsteinUtils.interpretResponse(data, einsteinResponse);

            // Add replace content URL
            $.each(response, function (i, rec) {
                if (!rec || !rec.id) return null;

                var pidURL = asyncUrl;
                pidURL += (pidURL.indexOf('?') === -1 ? '?' : '&') + 'pid=' + rec.id;
                $recTrigger.find('.product[data-pid="placeholder"]:not([data-replace-content])')
                    .first()
                    .attr('data-replace-content', pidURL); //Must be attr to allow productTile.js async selector rule to catch recommendation
            });

            // Remove empty slides
            $recTrigger.removeClass('einstein-loading').find('.slide:has(.product[data-pid="placeholder"]:not([data-replace-content]))').remove();

            // Prepare Slider Container
            var $sliderContainer = $recTrigger.closest('.slider-container').removeClass('delay-init');

            productTile.init($recTrigger.find('.product'), function (status) {
                // Re Initialize sliders to account for TileInclude Errors
                var tns = status.errors > 0 ? $sliderContainer.data('tns') : null;

                if (tns) {
                    tns.destroy();
                    tns.rebuild();
                }
            });

            // Initialize sliders
            abSlider.initializeSliders($sliderContainer.parent());
        });
    });
}

module.exports.init = function (context) {
    var $context = context && context instanceof jQuery ? context : $(document);
    module.exports.loadRecommendations($context);
};
