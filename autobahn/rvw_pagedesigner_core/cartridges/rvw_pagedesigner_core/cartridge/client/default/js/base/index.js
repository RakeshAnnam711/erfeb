'use strict';

const Button = require('./button');
const Hero = require('./hero');

function checkIfVisible($element, context) {
    var pageTop = $(window).scrollTop();
    var pageBottom = pageTop + $(window).height();
    var elementHeight = $element.height();
    var elementTop = $element.offset().top;
    var elementBottom = elementTop + elementHeight;

    // on ititial load if animated element is already in or above viewable area, animate immediately
    if (context === 'initialPageLoad' && elementTop <= pageBottom) {
        return true;
    }

    if (context === 'reset') {
        // element is above fold
        return (elementTop <= pageBottom);
    } else {
        // any portion of element is in viewport
        return ((elementTop <= pageBottom) && (elementBottom >= pageTop));
    }
}

function animateIfVisible($elements, context) {
    $elements?.each((index, element) => {
        var $element = $(element);
        var animationClass = $element.data('animation');
        var isVisible = module.exports.methods.checkIfVisible($element, context);

        if (isVisible) {
            $element.removeClass('animation-initial-state').addClass(animationClass);
        }
    });
}

function resetAnimationElement($elements) {
    $elements.each((index, element) => {
        var $element = $(element);
        var shouldReset = !$element.data('animation-play-once');

        if (shouldReset) {
            var animationClass = $element.data('animation');
            var isVisible = module.exports.methods.checkIfVisible($element, 'reset');

            if (!isVisible) {
                $element.removeClass(animationClass).addClass('animation-initial-state');
                void element.offsetWidth; // allows animation to retrigger
            }
        }
    });
}

// trigger animations when animated component is scrolled to
function initScrollEvents() {
    // Init pageLoad
    module.exports.methods.animateIfVisible($('[data-animation]'), 'initialPageLoad');

    window.addEventListener('scrollUpdate', event => {
        var direction = event?.detail?.direction;

        if (direction === 'down') {
            module.exports.methods.animateIfVisible($('[data-animation]'), null);
        }

        if (direction === 'up') {
            module.exports.methods.resetAnimationElement($('[data-animation]'));
        }
    });

};


module.exports = {
    methods: {
        animateIfVisible: animateIfVisible,
        checkIfVisible: checkIfVisible,
        resetAnimationElement: resetAnimationElement
    },
    initScrollEvents: initScrollEvents,
    button: Button,
    hero: Hero
};
