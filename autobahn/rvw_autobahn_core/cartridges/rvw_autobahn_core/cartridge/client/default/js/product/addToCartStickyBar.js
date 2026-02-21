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
        const SiteConstants = require('constants/SiteConstants');
        const addToCartStickyBar = document.getElementById('addtocart-sticky-bar');
        const addToCartContainer = document.getElementById('qty-cart-container');
        const body = document.body;
        const topHeader = document.getElementById('top-header');
        const headerUtils = require('../utilities/headerUtils');

        //if header is fixed, use just the nav bar to measure top of page, else use the entire header (may contain promo bar)
        let topHeaderHeight = 0;
        if (topHeader.classList.contains('fixed-header')) {
            topHeaderHeight = headerUtils.getHeaderHeightNavOnly(); // WGACA MODIFICATION cleanup definition vs setting
        }

        // WGACA MODIFICATION - Update the value whenever the window is resized
        window.addEventListener('resize', () => {
            if (topHeader.classList.contains('fixed-header')) {
                topHeaderHeight = document.getElementById('header-nav').offsetHeight;
            }
            if (addToCartStickyBar) {
                addToCartStickyBar.style.top = `${topHeaderHeight}px`;
            }
        });
        // END MODIFICATION

        if (addToCartStickyBar && addToCartContainer) {
            window.addEventListener('scrollUpdate', function() {
                //main sticky add to cart functionality - only show when scrolled past in-page add to cart section
                if (window.pageYOffset > (addToCartContainer.offsetTop + addToCartContainer.offsetHeight + topHeaderHeight)) {
                    body.classList.add('showstickybar');
                    // WGACA MODIFICATION - reset header height
                    if (topHeader.classList.contains('fixed-header')) {
                        topHeaderHeight = document.getElementById('header-nav').offsetHeight;
                    }
                    // END MODIFICATION
                    if (addToCartStickyBar) {
                        addToCartStickyBar.style.top = `${topHeaderHeight}px`;
                    }
                } else if (body.classList.contains('showstickybar')) {
                    body.classList.remove('showstickybar');
                    setTimeout(() => {
                        if (addToCartStickyBar) {
                            addToCartStickyBar.removeAttribute('style');
                        }
                    }, SiteConstants.TransitionSpeed);
                }
            });
        }
    }
};
