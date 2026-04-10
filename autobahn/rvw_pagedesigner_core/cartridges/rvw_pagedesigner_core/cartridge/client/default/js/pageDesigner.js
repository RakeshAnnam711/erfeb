'use strict';

function initBelowFoldRegion() {
    const $belowFoldRegion = $('.pd-async-region');

    // Render any components in the Below Fold region via ajax after page load
    $belowFoldRegion.each(function (i, el) {
        const $el = $(el);
        const belowFoldObserver = new IntersectionObserver((entries, _observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    belowFoldObserver.unobserve(entry.target);

                    const url = $el.data('url');
                    const populateRegion = new Promise(resolve => {
                        var $xhr = $el.data('$xhr');
                        $xhr && $xhr.abort && $xhr.abort();

                        // Send to Page-Show, return HTML for ajaxRegion template
                        $el.data('$xhr', $.ajax({
                            url: url,
                            method: 'GET',
                            beforeSend: () => {
                                $el.addClass('loading');
                                $el.spinner().start();
                            },
                            success: response => {
                                var $html = $(response);
                                $el.replaceWith($html);
                                resolve($html);
                            },
                            error: err => {
                                console.error('Unable to render Below Fold region ', err);
                            },
                            complete: () => {
                                $el.removeClass('loading');
                                $el.spinner().stop();
                            }
                        }));
                    });

                    populateRegion.then(($html) => {
                        var reinitFiles = require('core/utilities/ajaxHelpers');
                        var processInclude = require('base/util');

                        // Init pageLoad
                        reinitFiles.methods.animateIfVisible($html.find('[data-animation]'), 'initialPageLoad');

                        // init global pageDesigner events: animations, buttons, hero
                        processInclude(reinitFiles['pageDesigner']);

                        // init product tiles
                        if ($html.find('.product-tile').length > 0) {
                            processInclude(reinitFiles['productTile']);
                        }

                        // init sliders
                        if ($html.find('.slider-container').length > 0) {
                            var $sliders = $html.find('.slider-container');
                            $sliders.each((_index, slider) => {
                                var $slider = $(slider);
                                if ($slider.closest('.experience-commerce_layouts-sliderEinstein').length > 0) {
                                    reinitFiles['einstein'].init($slider.parent());
                                } else {
                                    reinitFiles['slider'].initializeSliders($slider.parent());
                                }
                            });
                        }

                        // init videos
                        if ($html.find('.video-container').length > 0) {
                            processInclude(reinitFiles['video']);
                        }
                    });
                }
            });
        }, {});

        belowFoldObserver.observe(el);
    });
}

function initShowMoreContentButton() {
    // Delegating this event to body in case Content Grid component is loaded in Below Fold region
    $('body').on('click', '.show-more-content button', function (e) {
        e.stopPropagation();
        var $target = $(event.target);
        var showMoreUrl = $(this).data('url');
        e.preventDefault();

        var $xhr = $target.data('$xhr');
        $xhr && $xhr.abort && $xhr.abort();

        $target.data('$xhr', $.ajax({
            url: showMoreUrl,
            data: { selectedUrl: showMoreUrl },
            method: 'GET',
            context: $target.closest('.content-grid-footer'),
            beforeSend: () => {
                this.spinner().start();
            },
            success: function (response) {
                this.replaceWith(response);
            },
            complete: function () {
                this.spinner().stop();
            }
        }));
    });
}

module.exports = {
    initBelowFoldRegion: initBelowFoldRegion,
    initShowMoreContentButton: initShowMoreContentButton
};
