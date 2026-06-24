'use strict';

var debounce = require('lodash/debounce');
var headerUtils = require('../utilities/headerUtils');

var updateHeader = status => {
    var $headerNav = $('.header-nav');
    var headerNavHeight = headerUtils.getHeaderHeightNavOnly();
    var $page = $('.page');

    if (status === 'fixed') {
        $headerNav.addClass('fixed');
        if (!($headerNav.closest('.transparent-header').length)) {
            $page.css('margin-top', headerNavHeight + 'px');
        }
        $headerNav.removeClass('transparent-nav');
    } else {
        $headerNav.removeClass('fixed');
        $page.css('margin-top', '');
        var isMobileOpen = $('body').hasClass('mobile-menu-in');
        if (!isMobileOpen){
            $headerNav.addClass('transparent-nav');
        }
    }
}

module.exports = function() {
    // Fix/unfix header to top of screen, dependent on class added by custom preference
    // Note: This is intentionally not using utilities/scroll.js so that it can fix immediately vs. being debounced.
    if ($('header').hasClass('fixed-header')) {
        $(window).scroll(debounce(event => {
            var preNavHeight = headerUtils.getHeaderHeight('.header-nav');
            var scrollTop = $(event.target).scrollTop();

            updateHeader(scrollTop > preNavHeight ? 'fixed' : 'unfixed');
        }, 10, {leading: true, trailing: true}));
    }

    var isMobile = window.isMobile();
    if ($('header').hasClass('transparent-header') && !isMobile) {
        $(($('.logo-left').length ? '.header-nav' : '.header-nav:not(.secondary-nav)')).hover(
                function() {
                    $(this).removeClass('transparent-nav').find('.secondary-nav').removeClass('transparent-nav');
                    $(this)[$(this).hasClass('secondary-nav') ? 'prev' : 'next']('.header-nav').removeClass('transparent-nav');
                }, function() {
                    $(this).addClass('transparent-nav').find('.secondary-nav').addClass('transparent-nav');
                    $(this)[$(this).hasClass('secondary-nav') ? 'prev' : 'next']('.header-nav').addClass('transparent-nav');
                }
        );
    }

    // Check for presence of content assets in MegaMenu
    var $megamenuDropdown = $('.megamenu > .megamenu-container > .dropdown-menu');

    $megamenuDropdown.each((index, element) => {
        var $megamenu = $(element);
        if ($megamenu.find('.megamenu-asset-1').children().length) {
            $megamenu.addClass('has-asset-1');
        }
        if ($megamenu.find('.megamenu-asset-2').children().length) {
            $megamenu.addClass('has-asset-2');
        }
    });

    // Show/hide content assets on mobile based on category level
    if (isMobile) {
        var $thirdMenuBackBtn = $('.megamenu .menu-subcategories > .dropdown-item'),
            $thirdSubLink = $('.megamenu .menu-subcategories > .dropdown-item > .dropdown-link');

        $thirdSubLink.on('click', function () {
            $('.megamenu.show .menu-subcategories').parent('li').addClass('thirdCatOpen');
        });
        $thirdMenuBackBtn.on('click', function () {
            $('.megamenu.show .menu-subcategories').parent('li').removeClass('thirdCatOpen');
        });
    }

    $('.main-menu .navbar-nav').on('mouseenter mouseleave', function () {
        $(this).toggleClass('nav-item-hover');
    });

    //opening suggestion modal for desktop search icon
    $('header #search-icon-btn').on('click', event => {
        var $siteSearch = $(event.target).closest('.site-search');
        var $input = $siteSearch.find('input');
        
        // Toggle the 'expanded' class when .site-search is clicked
        $siteSearch.toggleClass('expanded');
        
        // Focus or blur the input field based on the toggle state
        if ($siteSearch.hasClass('expanded')) {
            $input.focus();
        } else {
            // Only remove focus if the input is empty
            if (!$input.val()) {
                $input.blur();
            }
        }
    });
    
    //opening suggestion modal for mobile search icon
    $('header #search-icon-btn-mobile').on('click', event => {
        var $searchMobile = $(event.target).siblings('.search-mobile');
        var $siteSearch = $searchMobile.find('.site-search');
        var $input = $siteSearch.find('input');
        
        // Toggle the 'expanded' class when .site-search is clicked
        $siteSearch.toggleClass('expanded');
    
        // Focus or blur the input field based on the toggle state
        if ($siteSearch.hasClass('expanded')) {
            $input.focus();
        } else {
            // Only remove focus if the input is empty
            if (!$input.val()) {
                $input.blur();
            }
        }

        $('body').toggleClass('modal-open');    // toggling the stylings of .model-open
        $('.helpButton')?.toggleClass('d-none');    // toggling the visibility of overlapping .helpButton
        // removing the .modal-background if its blocked
        const $modal = $('.modal-background');
        if ($modal && $modal.css('display') === 'block') {
            $modal.css('display', 'none');
        }
    });

    $('form[name=simpleSearch]').on('submit', event => {
        var $form = $(event.target);
        var $input = $('input[name=q]',$form);
        //keep search from submitting if query is empty
        if ($input.val() == "") {
            $input.focus();
            event.preventDefault();
        }
    });

};
