'use strict';

var headerUtils = require('../utilities/headerUtils');

class ScrollDirection {
    constructor() {
        this.$html = $('html'); // Element to add CSS classnames
        this.window = window; // Element to listen to scroll events
        this.direction = null; // Current scroll direction
        this.headerHeight = null; // Track header's height
        this.headerNavHeight = null; // Track sticky portion of header's height
        this.headerNavOffsetTop = 0; // Track header's distance from top of page
        this.isScrolling = false; // Page is scrolling
        this.last = 0; // Last scroll position
        this.stickyHeader = false; // Show CSS header
        this.timeout = null; // Timeout event for scroll handler
        this.threshold = 10; // How far to allow scroll before triggering scroll events

        this.init(); // Initialize scroll handlers
    }

    init() {
        // Check if we can use Passive Event Listening
        let passiveIfSupported = false;
        try {
            window.addEventListener('test', null,
                Object.defineProperty({}, 'passive', {
                    get: function () {
                        passiveIfSupported = {
                            passive: true
                        };
                    }
                })
            );
        } catch (err) { }

        // Add Event Listeners
        this.listener = this.detectDirection.bind(this);
        this.resize = this.detectResize.bind(this);

        this.window.addEventListener('scroll', this.listener, passiveIfSupported);
        this.window.addEventListener('resize', this.resize, passiveIfSupported);
        // Do initial Size Detection
        this.detectResize();
    }

    detectDirection() {
        // Get Scroll Position
        const scrolled = this.window.scrollY || this.window.scrollTop || this.window.pageYOffset;

        // Check if New Scroll Position Breaks Threshold
        if (Math.abs(scrolled - this.last) >= this.threshold || (scrolled <= (this.headerHeight + this.headerNavHeight) && this.stickyHeader)) {
            const currentDirection = (scrolled > this.last) ? 'down' : 'up';

            // Check if Scrolling
            if (scrolled !== this.last && !this.isScrolling) {
                this.onScrollStart();
            }

            // Check if Header exists and if we should trigger Sticky Header
            if (this.header) {
                if (scrolled > (this.headerHeight + this.headerNavHeight) && !this.stickyHeader && this.direction === 'up') {
                    this.stickyHeader = true;
                    this.$html.addClass('sticky-header');
                    // Fire Custom Event `stickyHeaderChange`
                    this.window.dispatchEvent(new CustomEvent('stickyHeaderChange', {
                        detail: {
                            direction: this.direction,
                            last: this.last,
                            stickyHeader: this.stickyHeader
                        }
                    }));
                } else if (scrolled <= this.headerHeight && this.stickyHeader) {
                    this.stickyHeader = false;
                    this.$html.removeClass('sticky-header');
                    // Fire Custom Event `stickyHeaderChange`
                    this.window.dispatchEvent(new CustomEvent('stickyHeaderChange', {
                        detail: {
                            direction: this.direction,
                            last: this.last,
                            stickyHeader: this.stickyHeader
                        }
                    }));
                }
            }

            // Detect Direction Change
            if (this.direction !== currentDirection) {
                this.onDirectionChange(currentDirection);
            }

            // Update Last Scroll Position
            this.last = scrolled;

            // Fire Custom Event `scrollUpdate`
            this.window.dispatchEvent(new CustomEvent('scrollUpdate', {
                detail: {
                    direction: this.direction,
                    last: this.last,
                    stickyHeader: this.stickyHeader
                }
            }));
        }

        // Clear Last Timeout before Recreating it
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // Fire Stop Scroll Event shortly after Scrolling Stops
        this.timeout = setTimeout(this.onScrollStop.bind(this), 500);
    }

    detectResize () {
        // Get Header Height - will only exist if headerFixed preference is set to 'Enhanced'
        const $header = $('.fixed-header-enhanced');

        if ($header.length) {
            var $headerNav = $header.find('.header-nav');
            this.header = $header;
            this.headerHeight = headerUtils.getHeaderHeight('.header-nav');
            this.headerNavHeight = headerUtils.getHeaderHeightNavOnly();
            this.$html.css('--header-height', this.headerNavHeight + 'px');
            this.$html.css('--full-header-height', headerUtils.getHeaderHeight() + 'px');
            // change to position static before getting offset
            $headerNav.css('position', 'static');
            this.headerNavOffsetTop = $headerNav.offset().top;
            $headerNav.css('position', '');
        }
    }

    onDirectionChange(direction) {
        this.direction = direction;

        // Update Scroll Classes
        this.$html.addClass('scroll-direction-' + this.direction);
        this.$html.removeClass('scroll-direction-' + (
            this.direction == 'down' ? 'up' : 'down'
        ));

        // Fire Custom Event `scrollDirectionChange`
        this.window.dispatchEvent(new CustomEvent('scrollDirectionChange', {
            detail: {
                direction: this.direction,
                last: this.last,
                stickyHeader: this.stickyHeader
            }
        }));
    }

    onScrollStart() {
        this.$html.addClass('is-scrolling');
        this.isScrolling = true;

        // Fire Custom Event `scrollStart`
        this.window.dispatchEvent(new CustomEvent('scrollStart', {
            detail: {
                direction: this.direction,
                last: this.last,
                stickyHeader: this.stickyHeader
            }
        }));
    }

    onScrollStop() {
        this.$html.removeClass('is-scrolling');
        this.isScrolling = false;
        this.timeout = null;

        // Fire Custom Event `scrollStop`
        this.window.dispatchEvent(new CustomEvent('scrollStop', {
            detail: {
                direction: this.direction,
                last: this.last,
                stickyHeader: this.stickyHeader
            }
        }));
    }
}

module.exports = () => {
    $(document).ready(() => {
        new ScrollDirection();
    });
};
