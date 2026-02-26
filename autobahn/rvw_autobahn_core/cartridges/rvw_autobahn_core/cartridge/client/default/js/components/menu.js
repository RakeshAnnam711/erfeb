'use strict';

var keyboardAccessibility = require('base/components/keyboardAccessibility');
var SiteConstants = require('constants/SiteConstants');
var hoverIntent = require('jquery-hoverintent');
var headerUtils = require('../utilities/headerUtils');

function clearSelection(element) {
    var $currentPane = $(element).closest('.custom-dropdown.show');

    $currentPane.removeClass('show');

    // Adjust DOM after drawer finishes closing (mobile) or dropdown finishes hiding (desktop)
    setTimeout(() => {
        $currentPane.find('.nav-link').attr('aria-expanded', 'false');
        $currentPane.find('.dropdown-menu').attr('aria-hidden', 'true');
        $currentPane.find('.top-category').detach();
        $currentPane.find('.nav-menu').detach();

        if (!$currentPane.closest('.custom-dropdown.show').length) {
            $currentPane.closest('.menu-group').find('.nav.navbar-nav > li.nav-item > a').attr('aria-hidden', 'false');
        }
    }, SiteConstants.TransitionSpeed);
};

function toggleDrawer(status) {
    var $header = $('header');
    var $headerNav = $header.find('.header-nav');
    var headerNavHeight = headerUtils.getHeaderHeight();
    var $mainMenu = $header.find('.main-menu');
    var $navbar = $mainMenu.find('.navbar-nav');
    var $modalBackground = $('.modal-background');

    if (status === 'open') {
        $('html').scrollTop($headerNav.offset().top);
        $('html').addClass('lock-scroll');
        $('body').addClass('mobile-menu-in');
        $mainMenu
            .addClass('in')
            .attr('aria-hidden', 'false')
            .css('top', headerNavHeight)
            .siblings().attr('aria-hidden', 'true');
        $modalBackground
            .fadeIn(SiteConstants.TransitionSpeed)
            .css('top', headerNavHeight);
        $header
            .siblings().attr('aria-hidden', 'true');
        $navbar
            .find('.nav-link').first().focus();

    } else {
        $('body').removeClass('mobile-menu-in');
        $navbar
            .find('.nav-menu, .top-category').detach();
        $navbar
            .find('.thirdCatOpen').removeClass('thirdCatOpen');
        $navbar
            .find('.show').removeClass('show');
        $mainMenu
            .removeClass('in')
            // WGACA MODIFICATION - Conditional display
            // .attr('aria-hidden', 'true')
            .attr('aria-hidden', status === undefined ? 'false' : 'true')
            //END MODIFICAITON
            .siblings().attr('aria-hidden', 'false');
        $header
            .siblings().attr('aria-hidden', 'false');
        $modalBackground
            .fadeOut(SiteConstants.TransitionSpeed);

        setTimeout(() => {
            $modalBackground.css('top', '');
            $('html').removeClass('lock-scroll');
            $headerNav.addClass('transparent-nav');
        }, SiteConstants.TransitionSpeed);
    }
};

function kbAccessibility() {
    keyboardAccessibility('.main-menu .nav-link, .main-menu .dropdown-link, .header-account-container > div, .header-support-container > div, .minicart > div',
        {
            40: function(menuItem) { // down
                if (menuItem.hasClass('nav-item')) { // top level
                    $('.navbar-nav .show').removeClass('show')
                        .children('.megamenu-container').children('.dropdown-menu')
                        .removeClass('show');
                    menuItem.addClass('show').children('.megamenu-container').children('.dropdown-menu').addClass('show');
                    menuItem.find('ul > li > a').first().focus();
                    $(this).attr('aria-expanded', 'true');
                } else if (menuItem.is('.header-account-container, .header-support-container')) { // account/support
                    menuItem.find('.custom-dropdown').addClass('show').children('.megamenu-container').children('.dropdown-menu').addClass('show');
                    menuItem.find('ul > li > a').first().focus();
                    menuItem.find('.dropdown-toggle').attr('aria-expanded', 'true');
                } else {
                    menuItem.removeClass('show').children('.megamenu-container').children('.dropdown-menu').removeClass('show');
                    if (!(menuItem.next().length > 0)) { // if this is the last menuItem
                        menuItem.parent().parent().find('li > a').first().focus(); // set focus to the first menuitem
                    } else {
                        menuItem.next().children().first().focus();
                    }
                }
            },
            39: function(menuItem) { // right
                if (menuItem.hasClass('nav-item')) { // top level
                    menuItem.removeClass('show').children('.megamenu-container').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.next().children().first().focus();
                } else if (menuItem.is('.header-account-container, .header-support-container')) { // account/support
                    menuItem.find('.custom-dropdown').addClass('show').children('.megamenu-container').children('.dropdown-menu').addClass('show');
                    menuItem.find('ul > li > a').first().focus();
                    menuItem.find('.dropdown-toggle').attr('aria-expanded', 'true');
                } else if (menuItem.hasClass('dropdown')) {
                    menuItem.addClass('show').children('.megamenu-container').children('.dropdown-menu').addClass('show');
                    $(this).attr('aria-expanded', 'true');
                    menuItem.find('ul > li > a').first().focus();
                }
            },
            38: function(menuItem) { // up
                if (menuItem.hasClass('nav-item')) { // top level
                    menuItem.removeClass('show').children('.megamenu-container').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                } else if (menuItem.is('.minicart')) { // minicart
                    menuItem.find('.popover').removeClass('show');
                } else if (menuItem.is('.header-account-container, .header-support-container')) { // account/support
                    menuItem.find('.custom-dropdown').removeClass('show').children('.megamenu-container').children('.dropdown-menu').removeClass('show');
                    menuItem.find('.dropdown-toggle').attr('aria-expanded', 'false');
                } else if (menuItem.prev().length === 0) { // first menuItem
                    menuItem.parent().parent().removeClass('show')
                        .children('.nav-link')
                        .attr('aria-expanded', 'false');
                    menuItem.parent().children().last().children().first().focus(); // set the focus to the last menuItem
                } else {
                    menuItem.prev().children().first().focus();
                }
            },
            37: function(menuItem) { // left
                if (menuItem.hasClass('nav-item')) { // top level
                    menuItem.removeClass('show').children('.megamenu-container').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.prev().children().first().focus();
                } else if (menuItem.is('.minicart')) { // minicart
                    menuItem.find('.popover').removeClass('show');
                } else if (menuItem.is('.header-account-container, .header-support-container')) { // account/support
                    menuItem.find('.custom-dropdown').removeClass('show').children('.megamenu-container').children('.dropdown-menu').removeClass('show');
                    menuItem.find('.dropdown-toggle').attr('aria-expanded', 'false');
                } else {
                    menuItem.closest('.show').removeClass('show')
                        .closest('li.show').removeClass('show')
                        .children().first().focus().attr('aria-expanded', 'false');
                }
            },
            27: function(menuItem) { // escape
                if (menuItem.is('.minicart')) { // minicart
                    menuItem.find('.popover').removeClass('show');
                } else if (menuItem.is('.header-account-container, .header-support-container')) { // account/support
                    menuItem.find('.custom-dropdown').removeClass('show').children('.megamenu-container').children('.dropdown-menu').removeClass('show');
                    menuItem.find('.dropdown-toggle').attr('aria-expanded', 'false');
                } else {
                    var parentMenu = menuItem.hasClass('show')
                    ? menuItem
                    : menuItem.closest('.show');
                    parentMenu.children('.show').removeClass('show');
                    parentMenu.removeClass('show').children('.nav-link')
                        .attr('aria-expanded', 'false');
                    parentMenu.children().first().focus();
                }
            }
        },
        function () {
            return $(this).parent();
        }
    );
}

function searchExpand() {
    //if only search icon is visible, show the input on focus
    $( ".search-field" ).focus(function() {
        $(this).closest('.site-search').addClass('expanded');
    });
};

function dropdownMenu() {
    // Custom dropdown behaviors for top menu
    var $dropdownMenu = $('.custom-dropdown:not(.disabled) [data-toggle="dropdown"]');
    $dropdownMenu.on('click', event => {
        event.stopPropagation(); // Prevent Bootstrap dropdown click events
        if (window.isMobile()) {
            // Drawer behavior on mobile
            event.preventDefault();
            var $dropdownLink = $(event.target);
            var $dropdown = $dropdownLink.closest('.custom-dropdown');
            const listItems = document.querySelectorAll('.navbar-nav > li')
            if($dropdown.hasClass('show')) {
                $dropdown.removeClass('show');
                $dropdownLink.attr('aria-expanded', 'true');
                $dropdown.closest('.menu-group').find('.nav.navbar-nav > li.nav-item > a').attr('aria-hidden', 'true');
                return;
            }

            listItems.forEach((element) => {
                element.classList.remove('show')
            });
            var $li = $('<li class="dropdown-item top-category" role="button"></li>');
            // var $closeMenu = $('<li class="nav-menu"></li>');
            var link = $dropdownLink.clone().removeClass('dropdown-toggle')
                .removeAttr('data-toggle')
                .removeAttr('aria-expanded')
                .attr('aria-haspopup', 'false');
            $li.append(link);
            // $closeMenu.append($('.close-menu').first().clone());
            // if ($dropdown.children('.megamenu-container').length > 0) {
            //     $dropdown.children('.megamenu-container').children('.dropdown-menu')
            //         .prepend($li)
            //         .prepend($closeMenu)
            //         .attr('aria-hidden', 'false')
            //         .find('a').removeAttr('tabindex', '-1');
            // } else {
            //     $dropdown.children('.dropdown-menu')
            //         .prepend($li)
            //         .prepend($closeMenu)
            //         .attr('aria-hidden', 'false')
            //         .find('a').removeAttr('tabindex', '-1');
            // }
            $dropdown.toggleClass('show');
            $dropdownLink.attr('aria-expanded', 'true');
            $dropdown.closest('.menu-group').find('.nav.navbar-nav > li.nav-item > a').attr('aria-hidden', 'true');
            $(link).focus();
            $dropdown[0].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            // handleMainMenuOverflow('hidden');
        } else {
            // Restore link behavior on desktop
            link = $(event.target).attr('href');
            if (link) {
                location.href = $(event.target).attr('href');
            }
            // $closeMenu.append($('.close-menu').first().clone());
            // if ($dropdown.children('.megamenu-container').length > 0) {
            //     $dropdown.children('.megamenu-container').children('.dropdown-menu')
            //         .prepend($li)
            //         .prepend($closeMenu)
            //         .attr('aria-hidden', 'false')
            //         .find('a').removeAttr('tabindex', '-1');
            // } else {
            //     $dropdown.children('.dropdown-menu')
            //         .prepend($li)
            //         .prepend($closeMenu)
            //         .attr('aria-hidden', 'false')
            //         .find('a').removeAttr('tabindex', '-1');
            // }
            // $dropdown.toggleClass('show');
            // $dropdownLink.attr('aria-expanded', 'true');
            // $dropdown.closest('.menu-group').find('.nav.navbar-nav > li.nav-item > a').attr('aria-hidden', 'true');
            // $(link).focus();
            // $('.dropdown-menu').scrollTop(0);
            // handleMainMenuOverflow('hidden'); // WGACA MODIFICATION
        }
    });

    // Desktop - open menu using hoverIntent to prevent unintentional opening
    $dropdownMenu.on('mouseenter', event => {
            if (!window.isMobile()) {
                var eventElement = event.target;
                // Close all dropdowns
                $('.navbar-nav > li').each((index, element) => {
                    if (!$.contains(element, eventElement)) {
                        var $navItem = $(element);
                        $navItem.find('.show').each(() => {
                            clearSelection(element);
                        });
                        if ($navItem.hasClass('show')) {
                            $navItem.removeClass('show');
                            $navItem.children('.megamenu-container').children('dropdown-menu').removeClass('show');
                            $navItem.children('.nav-link').attr('aria-expanded', 'false');
                        }
                    }
                });
                // Open current dropdown
                var $megamenuContainer = $(eventElement).siblings('.megamenu-container');
                var $dropdown = $megamenuContainer.length > 0 ? $megamenuContainer.children('.dropdown-menu') : $(eventElement).siblings('.dropdown-menu');
                $(eventElement).parent().addClass('show');
                $dropdown.addClass('show').attr('aria-hidden', 'false');
                $(eventElement).attr('aria-expanded', 'true');

                // add css variable to reference in css for preventing horizontal scroll
                $('html').attr('style', '--scrollbar-width:' + (window.innerWidth - document.documentElement.clientWidth) + 'px');

                // set max height on dropdown
                var viewportHeight = $(window).height();
                var headerNavHeight = headerUtils.getHeaderHeight();
                var maxDropdownHeight = viewportHeight - (headerNavHeight + SiteConstants.Spacer) + 'px';
                $megamenuContainer.css('max-height', maxDropdownHeight);
            }
    });
    $dropdownMenu.on('keydown', event => {
        if (event.key === 'ArrowDown' || event.keyCode === 40 || event.key === ' ' || event.keyCode === 32) {
            event.preventDefault();
            if ($(event.target).siblings('.dropdown-menu').hasClass('show')) {
                $(event.target).siblings('.dropdown-menu').removeClass('show');
            }else{
                if (!window.isMobile()) {
                    var eventElement = event.target;
                    // Close all dropdowns
                    $('.navbar-nav > li').each((index, element) => {
                        if (!$.contains(element, eventElement)) {
                            var $navItem = $(element);
                            $navItem.find('.show').each(() => {
                                clearSelection(element);
                            });
                            if ($navItem.hasClass('show')) {
                                $navItem.removeClass('show');
                                $navItem.children('.megamenu-container').children('dropdown-menu').removeClass('show');
                                $navItem.children('.nav-link').attr('aria-expanded', 'false');
                            }
                        }
                    });
                    // Open current dropdown
                    var $megamenuContainer = $(eventElement).siblings('.megamenu-container');
                    var $dropdown = $megamenuContainer.length > 0 ? $megamenuContainer.children('.dropdown-menu') : $(eventElement).siblings('.dropdown-menu');
                    $(eventElement).parent().addClass('show');
                    $dropdown.addClass('show').attr('aria-hidden', 'false');
                    $(eventElement).attr('aria-expanded', 'true');

                    // add css variable to reference in css for preventing horizontal scroll
                    $('html').attr('style', '--scrollbar-width:' + (window.innerWidth - document.documentElement.clientWidth) + 'px');

                    // set max height on dropdown
                    var viewportHeight = $(window).height();
                    var headerNavHeight = headerUtils.getHeaderHeight();
                    var maxDropdownHeight = viewportHeight - (headerNavHeight + SiteConstants.Spacer) + 'px';
                    $megamenuContainer.css('max-height', maxDropdownHeight);
                }
            }
        }
    });
    $dropdownMenu.add($dropdownMenu.siblings('.dropdown-menu')).on('focusout', (e)=>{
        setTimeout(() => {
            if (!$(document.activeElement).closest($dropdownMenu).length &&
                !$(document.activeElement).closest($dropdownMenu.siblings('.dropdown-menu')).length) {
                    $dropdownMenu.siblings('.dropdown-menu').removeClass('show');
            }
        }, 0);
    })
     // Desktop - close menu on mouseleave
     $dropdownMenu.parent().on('mouseleave', event => {
        if (!window.isMobile()) {
            var $dropdown = $(event.currentTarget);
            // Close current dropdown
            $dropdown.removeClass('show');
            if ($dropdown.children('.megamenu-container').length > 0) {
                $dropdown.children('.megamenu-container').children('.dropdown-menu').removeClass('show').attr('aria-hidden', 'true');
            } else {
                $dropdown.children('.dropdown-menu').removeClass('show').attr('aria-hidden', 'true');
            }

            $dropdown.children('.nav-link').attr('aria-expanded', 'false');
        }
    });
};

function megaLeftHover() {
    //Megamenu Mega-left menu
    $('.mega-left-menu-link').hoverIntent( function() {
            var menuName = this.id,
                menuRight = $('#' + menuName + '-right'),
                menuLeft = $(this).parent().parent(),
                menuRightParent = menuRight.closest('.mega-left');

            if (!window.isMobile()) {
                // clear classes
                menuLeft.find('.active').removeClass('active');
                menuRightParent.removeClass('has-sub-asset');
                menuRightParent.find('.active-list').removeClass('active-list');
                // add classes
                $(this).addClass('active');
                menuRight.parent().addClass('active-list');
                // add a class to the parent Ul if a third level asset is displayed; css-hides the top level asset
                if (menuRight.parent().next().hasClass('sub-asset-1') || menuRight.parent().next().hasClass('sub-asset-2')) {
                    menuRightParent.addClass('has-sub-asset');
                }
            }
        },
        50
    );
};

function navbarBackBtn() {
    $('.navbar-nav').on('click', '.back', event => {
        event.preventDefault();
        clearSelection(event.target);
        handleMainMenuOverflow('initial'); // WGACA MODIFICATION
    });
};

function navbarToggler() {
    $('.navbar-toggler').click(event => {
        const navTogglebtn = $('.navbar-toggler'); 
        event.preventDefault();
        if ($('body').hasClass('mobile-menu-in')) {
            toggleDrawer('close');
            $('.header-nav').addClass('transparent-nav');
            handleMainMenuOverflow('initial'); // WGACA MODIFICATION
            navTogglebtn.attr('aria-expanded', 'false'); 
        } else {
            toggleDrawer('open');
            $('.header-nav').removeClass('transparent-nav');
            navTogglebtn.attr('aria-expanded', 'true');  
        }
    });

    $('html').on('click', '.mobile-menu-in .modal-background', () => {
        toggleDrawer('close');
        $('.navbar-toggler').attr('aria-expanded', 'false');
    });
};

// WGACA MODIFICATION - collapse overflow
function handleMainMenuOverflow(overflowValue) {
    try {
        document.getElementById('sg-navbar-collapse').style.overflowY = overflowValue; //reset/restrict main-menu overflow when sub-catg menu is opened/closed in mobile
    } catch (error) {
        console.log(error);
    }
}
// END MODIFICATION

function mobileSearchFix() {
    // Prevent iOS from scrolling to bad position on search field input focus
    $('.search-mobile .search-field').focus(event => {
        if (window.isMobile()) {
            var currentScrollPosition = $('html').scrollTop();
            setTimeout(() => {
                $('html').scrollTop(currentScrollPosition);
                $('.modal-background').show();
            }, SiteConstants.TransitionSpeed);
        }
    });
};

module.exports = {
    clearSelection: clearSelection,
    toggleDrawer: toggleDrawer,
    kbAccessibility: kbAccessibility,
    searchExpand: searchExpand,
    dropdownMenu: dropdownMenu,
    megaLeftHover: megaLeftHover,
    navbarBackBtn: navbarBackBtn,
    navbarToggler: navbarToggler,
    mobileSearchFix: mobileSearchFix
}
