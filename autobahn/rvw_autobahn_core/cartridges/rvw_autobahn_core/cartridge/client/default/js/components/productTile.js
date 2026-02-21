'use strict';

var promiseChains = [null, null, null, null, null, null, null],
    promiseIndex = 0;

module.exports = {
    selectors: {
        processing: '.processing',
        sending: '.sending'
    },
    init: function ($context = $('.product[data-replace-content], .product [data-replace-content]'), callbackfn) {
        var scope = this,
            initErrors = 0;

        $context
        .filter(':not(' + scope.selectors.processing + ')')
        .each(function (i, replace) {
            var $target = $(replace);
            var asyncUrl = $target.data('replace-content') || $target.attr('data-replace-content');
            var deferment = $.Deferred();

            if (['', null, undefined].indexOf(asyncUrl) === -1) {
                // Only track deferment if url is requestable
                $target.data('deferment', deferment);

                promiseChains[promiseIndex] = (promiseChains[promiseIndex] || $.when()).then(function () {
                    // Seperate deferment-ness of ajax request from actual deferment to allow failures to progress current promise group
                    $target.data('$xhr', $.ajax({
                        url: asyncUrl,
                        dataType: 'html',
                        timeout: 60000,
                        context: $target,
                        beforeSend: function () {
                            this.addClass(scope.selectors.sending.replace(/\./gi,' '));
                        },
                        error: function () {
                            var $slide = this.parent('.slide').add(this);

                            $slide.eq(0).remove();

                            initErrors++;
                        },
                        success: function (data) {
                            // Per AJAX response populate the product tile placeholder
                            this.replaceWith(data);
                        },
                        complete: function () {
                            deferment.resolve();
                        }
                    }));

                    return deferment;
                });

                promiseIndex = (promiseIndex + 1) % promiseChains.length;
            }
        });

        $.when.apply($, promiseChains).then(function () {
            //reinit tooltips for quick add to cart popover
            $('body').trigger('tooltip:init');

            $('body').trigger('producttiles:init');

            return (callbackfn || function () {}).call(null, {errors: initErrors});
        });
    }
}
