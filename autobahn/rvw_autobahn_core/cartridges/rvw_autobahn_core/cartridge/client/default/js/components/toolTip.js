'use strict';

function getTooltipTitle() {
    return $(this).find('.tooltip');
}

function enableTooltipsAndPopovers() {
    // Initialize tooltips. This also replaces the SFRA custom tooltip with the Bootstrap one
    // "trigger" is set to manual in order to add functionality to allow for tooltip to stay open on hover
    $('[data-toggle="tooltip"], .info-icon').tooltip({
        title: getTooltipTitle,
        trigger: 'manual',
        sanitize: false // prevents removal of inline styles in tooltip content markup
    }).on('mouseenter focus', buttonEnterEvent => {
        var $button = $(buttonEnterEvent.target).closest('[data-toggle="tooltip"]');
        var showDelay = $button.data('delay') && $button.data('delay').show || 0;
        var hideDelay = $button.data('delay') && $button.data('delay').hide || 0;

        setTimeout(() => {
            $button.tooltip('show');
        }, showDelay);

        $('body').on('mouseleave blur', '.tooltip', tooltipLeaveEvent => {
            setTimeout(() => {
                $(tooltipLeaveEvent.target).closest('.tooltip').tooltip('hide');
            }, hideDelay);
        });
    }).on('mouseleave blur', buttonLeaveEvent => {
        var $button = $(buttonLeaveEvent.target).closest('[data-toggle="tooltip"]');
        var hideDelay = $button.data('delay') && $button.data('delay').hide || 0;

        setTimeout(() => {
            if (!$('.tooltip:hover').length) {
                $(buttonLeaveEvent.target).tooltip('hide');
            }
        }, hideDelay);
    });

    // Enables Bootstrap Popovers, which rely on the Tooltip library and provide extra functionality
    $('[data-toggle="popover"]:not(.interactive)').popover({
        html: true,
        trigger: 'focus',
        sanitize: false // prevents removal of inline styles in tooltip content markup
    });
    $('[data-toggle="popover"].interactive').popover({
        html: true,
        sanitize: false // prevents removal of inline styles in tooltip content markup
    });
    if ($('[data-toggle="popover"].interactive').length) {
        $(document).mouseup(function(e) {
            if ($('.popover.show').length) {
                var container = $('.popover.show');

                // if the target of the click isn't the container nor a descendant of the container
                if (!container.is(e.target) && container.has(e.target).length === 0) {
                    $('[data-toggle="popover"].interactive').popover('hide');
                }
            }
        });
    }
}

module.exports = function() {
    enableTooltipsAndPopovers();

    $('body').on('tooltip:init', enableTooltipsAndPopovers);
};
