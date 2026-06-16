'use strict';

module.exports = {

    stickyBarJumpLinks: function () {
        const jumpLinks = document.querySelectorAll('a.jumplink');
        jumpLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                //scrolling indicator may or may not be useful
                document.querySelector('.addtocart-sticky-bar').classList.add('scrolling');

                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop,
                        behavior: 'smooth'
                    });
                    setTimeout(() => {
                        document.querySelector('.addtocart-sticky-bar').classList.remove('scrolling');
                    }, 500);
                }
            });
        });
    },

    addToCartStickyBar: function (){

        //main add to cart sticky vars
        const addToCartStickyBar = document.getElementById('addtocart-sticky-bar');
        const addToCartContainer = document.getElementById('qty-cart-container');
        const body = document.body;
        const topHeader = document.getElementById('top-header');
        const headerNav = document.getElementById('header-nav');
        const headerUtils = require('../utilities/headerUtils');

        if (!addToCartStickyBar || !addToCartContainer || addToCartStickyBar.dataset.stickyBarInitialized) {
            return;
        }

        addToCartStickyBar.dataset.stickyBarInitialized = 'true';
        addToCartStickyBar.style.transition = 'transform 550ms cubic-bezier(0.22, 1, 0.36, 1)';
        addToCartStickyBar.style.willChange = 'transform';
        const showThresholdBuffer = 8;
        let updateFrame = null;

        function isHeaderFixed() {
            return topHeader.classList.contains('fixed-header')
                && headerNav
                && headerNav.classList.contains('fixed');
        }

        function getStickyBarTop() {
            return isHeaderFixed()
                ? headerUtils.getHeaderHeightNavOnly()
                : 0;
        }

        function hideStickyBar() {
            addToCartStickyBar.style.transition = 'transform 220ms ease-in';
            body.classList.remove('showstickybar');
        }

        addToCartStickyBar.addEventListener('transitionend', function (event) {
            if (event.propertyName === 'transform' && !body.classList.contains('showstickybar')) {
                addToCartStickyBar.style.removeProperty('top');
            }
        });

        function updateStickyBar() {
            const addToCartRect = addToCartContainer.getBoundingClientRect();
            const stickyBarTop = getStickyBarTop();
            const canShowWithCurrentHeader = !topHeader.classList.contains('fixed-header')
                || isHeaderFixed();
            const triggerPoint = body.classList.contains('showstickybar')
                ? stickyBarTop
                : stickyBarTop - showThresholdBuffer;
            const isAddToCartAboveViewport = addToCartRect.height > 0
                && addToCartRect.bottom <= triggerPoint
                && canShowWithCurrentHeader;

            if (isAddToCartAboveViewport) {
                addToCartStickyBar.style.transition = 'transform 550ms cubic-bezier(0.22, 1, 0.36, 1)';
                body.classList.add('showstickybar');
                addToCartStickyBar.style.top = `${stickyBarTop}px`;
            } else {
                hideStickyBar();
            }
        }

        function scheduleStickyBarUpdate() {
            if (updateFrame) {
                return;
            }

            updateFrame = window.requestAnimationFrame(function () {
                updateFrame = null;
                updateStickyBar();
            });
        }

        hideStickyBar();

        window.addEventListener('scroll', scheduleStickyBarUpdate, { passive: true });
        window.addEventListener('scrollUpdate', scheduleStickyBarUpdate);
        window.addEventListener('resize', scheduleStickyBarUpdate);
        window.addEventListener('load', scheduleStickyBarUpdate);
        window.addEventListener('stickyHeaderChange', scheduleStickyBarUpdate);
        window.addEventListener('scrollDirectionChange', scheduleStickyBarUpdate);

        if (topHeader.classList.contains('fixed-header') && headerNav && window.MutationObserver) {
            const headerStateObserver = new MutationObserver(() => {
                scheduleStickyBarUpdate();
            });

            headerStateObserver.observe(headerNav, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        if (window.ResizeObserver) {
            const productLayout = addToCartContainer.closest('.product-detail');
            const layoutObserver = new window.ResizeObserver(scheduleStickyBarUpdate);

            layoutObserver.observe(productLayout || addToCartContainer.parentElement);
        }
    }
};
