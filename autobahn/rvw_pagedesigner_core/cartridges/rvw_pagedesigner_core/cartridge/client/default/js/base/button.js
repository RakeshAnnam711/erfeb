'use strict';

module.exports = function() {

    // Move modal from button to body to prevent overflow issues, eliminating any duplicates
    if ($('.button.has-modal').length > 0) {
        $('.button.has-modal').each((index, button) => {
            var $modal = $(button).find('.modal');

            if (!$('body > #' + $modal.attr('id')).length > 0) {
                $(button).find('.modal').appendTo('body');
            } else {
                $modal.remove();
            }
        });
    }

};
