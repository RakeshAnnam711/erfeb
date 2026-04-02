'use strict';

$(document).ready(function () {
    var hash = window.location.hash;
    var $toggle = $('.sg-nav__toggle');
    var $exampleInput = $('#textInput');
    var $exampleInputCodeBox = $exampleInput.closest('.row').find('.language-markup');
    var $exampleSelect = $('#selectDropdowns+.row .custom-select');
    var $exampleSelectCodeBox = $('#selectDropdowns+.row .language-markup');
    var $exampleModal = $('#sgExampleModal');
    var $exampleModalCodeBox = $('.example-modal-code');
    var $exampleSlider1 = $('.sg__slider--1 .slider-container');
    var $exampleSlider1CodeBox = $('.sg__slider--1 .language-markup');
    var closeDrawer = () => {
        $toggle.closest('#maincontent').addClass('nav-hidden');
    }
    var openDrawer = () => {
        $toggle.closest('#maincontent').removeClass('nav-hidden');
    }


    // scroll to ID referenced in URL param (for sharing specific section of style guide)
    if (hash) {
        // prevent Chrome from auto-scrolling to last scroll position
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        if ($(hash).length) {
            window.scrollTo(0, $(hash).offset().top);
        } else {
            console.error('ID ' + hash + ' is not found on this page.');
        }
    }

    // Automatically close nav if on mobile
    if (window.isMobile()) closeDrawer();
    $(window).resize(()=> window.isMobile() ? closeDrawer() : openDrawer());

    // Show/Hide Styleguide nav
    $toggle.click(() => $toggle.closest('#maincontent').toggleClass('nav-hidden'));

    // Animate scroll to section after clicking nav option
    $("nav a").click(event => {
        if ($(event.target).attr("href").length > 0 && $(event.target).attr('target') !== "_blank") {
            $("html, body").animate({ scrollTop: $($(event.target).attr("href")).offset().top }, 500);
        }
    });

    // Initiate ScrollSpy for Styleguide nav
    $('body').scrollspy({
        target: '#sgNav',
        offset: 45
    });

    // Compute CSS variables for colors/fonts and add attr to tags
    var existingVarsToUseAsVariables = [
        'brand-primary',
        'brand-secondary',
        'brand-tertiary',
        'primary-font',
        'secondary-font',
        'tertiary-font'
    ];
    // turn list into an object with computed styles
    var root = document.querySelector(':root'),
        rootStyle = getComputedStyle(root),
        existingVarsObj = existingVarsToUseAsVariables.reduce((a, value) => ({ ...a, [value]: rootStyle.getPropertyValue('--'+value)}), {});

    $.each(existingVarsObj, function (key, value) {
        if (value != '') {
            $('.color-value.background--' + key).attr( "data-variable", value );
            $('.' + key).attr( "data-variable", value );
        }
    });

    // Add tooltips to typography headers with font-size, line-height, and font-family info
    var headerTypes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3', 'b4', 'p'];
    headerTypes.forEach(headerType => {
        var headerSelector = '[class*="' + headerType + '--"] > ' + '[class*="' + headerType + '"]';
        $(headerSelector).each((index, element) => {
            var fontSize = $(element).css('fontSize');
            var lineHeight = $(element).css('lineHeight');
            var fontFamily = $(element).css('fontFamily');
            var tooltipHtml = 'Font Size: ' + fontSize + '<br/>Line Height: ' + lineHeight + '<br/>Font: ' + fontFamily;
            $(element).attr('title', tooltipHtml);
            $(element).tooltip({
                "html": true
            });
        });
    });

    // Text input helper class demo
    $("input[name='customInputSizeOptions']").change(event => {
        var option = $(event.target).attr('id');
        var isChecked = event.target.checked;
        var currentClasses = '';

        switch(option) {
            case 'customInputSmall':
                if (isChecked) {
                    $exampleInput.addClass('form-control-sm');
                } else {
                    $exampleInput.removeClass('form-control-sm');
                }
                break;
        }

        currentClasses = $exampleInput.attr('class')
        $exampleInputCodeBox.find('.token.tag:nth-child(4) .attr-name:contains("class")').next('.token').html('<span class="token punctuation">=</span><span class="token punctuation">"</span>' + currentClasses + '<span class="token punctuation">"</span>');
    });

    // Select dropdown helper class demo
    $("input[name='customSelectSizeOptions']").change(event => {
        var option = $(event.target).attr('id');
        var isChecked = event.target.checked;
        var currentClasses = '';

        switch(option) {
            case 'customSelectSmall':
                if (isChecked) {
                    $exampleSelect.addClass('form-control-sm');
                } else {
                    $exampleSelect.removeClass('form-control-sm');
                }
                break;
        }

        currentClasses = $exampleSelect.attr('class')
        $exampleSelectCodeBox.find('.token.tag:first-child .attr-name:contains("class")').next('.token').html('<span class="token punctuation">=</span><span class="token punctuation">"</span>' + currentClasses + '<span class="token punctuation">"</span>');
    });

    // Modal helper class sizing demo
    $("input[name='modalOptions']").change(event => {
        var option = $(event.target).attr('id');

        switch(option) {
            case 'modalScrollbody':
                $exampleModal.find('.modal-dialog').attr('class', 'modal-dialog modal-scrollbody');
                for (var i = 0; i < 100; i++) {
                    $exampleModal.find('.modal-body').append('<p>Modal body text.</p>');
                }
                $exampleModalCodeBox.find('.token.tag:nth-child(2) .attr-value:nth-child(3)').html('<span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>modal-dialog modal-scrollbody<span class="token punctuation">"</span></span>');
                break;
            case 'modalSizeSmall':
                $exampleModal.find('.modal-dialog').attr('class', 'modal-dialog modal-sm');
                $exampleModal.find('.modal-body').html('<p>Modal body text.</p>');
                $exampleModalCodeBox.find('.token.tag:nth-child(2) .attr-value:nth-child(3)').html('<span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>modal-dialog modal-sm<span class="token punctuation">"</span></span>');
                break;
            case 'modalSizeLarge':
                $exampleModal.find('.modal-dialog').attr('class', 'modal-dialog modal-lg');
                $exampleModal.find('.modal-body').html('<p>Modal body text.</p>');
                $exampleModalCodeBox.find('.token.tag:nth-child(2) .attr-value:nth-child(3)').html('<span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>modal-dialog modal-lg<span class="token punctuation">"</span></span>');
                break;
            case 'modalSizeExtraLarge':
                $exampleModal.find('.modal-dialog').attr('class', 'modal-dialog modal-xl');
                $exampleModal.find('.modal-body').html('<p>Modal body text.</p>');
                $exampleModalCodeBox.find('.token.tag:nth-child(2) .attr-value:nth-child(3)').html('<span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>modal-dialog modal-xl<span class="token punctuation">"</span></span>');
                break;
            default:
                $exampleModal.find('.modal-dialog').attr('class', 'modal-dialog');
                $exampleModal.find('.modal-body').html('<p>Modal body text.</p>');
                $exampleModalCodeBox.find('.token.tag:nth-child(2) .attr-value:nth-child(3)').html('<span class="token attr-value"><span class="token punctuation">=</span><span class="token punctuation">"</span>modal-dialog<span class="token punctuation">"</span></span>');
        }

    });

    // Slider helper class demo
    $("[name='sliderClassOptions']").change(event => {
        var option = $(event.target).attr('id');
        var isChecked = event.target.checked;
        var value = event.target.value;
        var currentClasses = '';

        switch(option) {
            case 'sliderButtonsHidden':
                if (isChecked) {
                    $exampleSlider1.addClass('slider-buttons-hidden');
                } else {
                    $exampleSlider1.removeClass('slider-buttons-hidden');
                }
                break;
            case 'sliderButtonsHiddenMedium':
                if (isChecked) {
                    $exampleSlider1.addClass('slider-buttons-hidden-md');
                } else {
                    $exampleSlider1.removeClass('slider-buttons-hidden-md');
                }
                break;
            case 'sliderButtonsHiddenLarge':
                if (isChecked) {
                    $exampleSlider1.addClass('slider-buttons-hidden-lg');
                } else {
                    $exampleSlider1.removeClass('slider-buttons-hidden-lg');
                }
                break;
            case 'sliderButtonsInside':
                if (isChecked) {
                    $exampleSlider1.addClass('slider-buttons-inside');
                } else {
                    $exampleSlider1.removeClass('slider-buttons-inside');
                }
                break;
            case 'sliderButtonsInsideMedium':
                if (isChecked) {
                    $exampleSlider1.addClass('slider-buttons-inside-md');
                } else {
                    $exampleSlider1.removeClass('slider-buttons-inside-md');
                }
                break;
            case 'sliderButtonsInsideLarge':
                if (isChecked) {
                    $exampleSlider1.addClass('slider-buttons-inside-lg');
                } else {
                    $exampleSlider1.removeClass('slider-buttons-inside-lg');
                }
                break;
            case 'sliderBulletsHidden':
                if (isChecked) {
                    $exampleSlider1.addClass('slider-bullets-hidden');
                } else {
                    $exampleSlider1.removeClass('slider-bullets-hidden');
                }
                break;
            case 'sliderBulletsHiddenMedium':
                if (isChecked) {
                    $exampleSlider1.addClass('slider-bullets-hidden-md');
                } else {
                    $exampleSlider1.removeClass('slider-bullets-hidden-md');
                }
                break;
            case 'sliderBulletsHiddenLarge':
                if (isChecked) {
                    $exampleSlider1.addClass('slider-bullets-hidden-lg');
                } else {
                    $exampleSlider1.removeClass('slider-bullets-hidden-lg');
                }
                break;
            case 'sliderBulletsInside':
                if (isChecked) {
                    $exampleSlider1.addClass('slider-bullets-inside');
                } else {
                    $exampleSlider1.removeClass('slider-bullets-inside');
                }
                break;
            case 'sliderBulletsInsideMedium':
                if (isChecked) {
                    $exampleSlider1.addClass('slider-bullets-inside-md');
                } else {
                    $exampleSlider1.removeClass('slider-bullets-inside-md');
                }
                break;
            case 'sliderBulletsInsideLarge':
                if (isChecked) {
                    $exampleSlider1.addClass('slider-bullets-inside-lg');
                } else {
                    $exampleSlider1.removeClass('slider-bullets-inside-lg');
                }
                break;
            case 'nextSlide':
                $exampleSlider1.removeClass('next-slide next-slide-10 next-slide-20 next-slide-30 next-slide-40')
                if (value > 0) {
                    $exampleSlider1.addClass('next-slide-' + value);
                }
                break;
            case 'nextSlideMedium':
                $exampleSlider1.removeClass('next-slide-md next-slide-md-10 next-slide-md-20 next-slide-md-30 next-slide-md-40')
                if (value > 0) {
                    $exampleSlider1.addClass('next-slide-md-' + value);
                }
                break;
            case 'nextSlideLarge':
                $exampleSlider1.removeClass('next-slide-lg next-slide-lg-10 next-slide-lg-20 next-slide-lg-30 next-slide-lg-40')
                if (value > 0) {
                    $exampleSlider1.addClass('next-slide-lg-' + value);
                }
                break;
        }

        currentClasses = $exampleSlider1.attr('class')
        $exampleSlider1CodeBox.find('.token.tag:first-child .attr-name:contains("class")').next('.token').html('<span class="token punctuation">=</span><span class="token punctuation">"</span>' + currentClasses + '<span class="token punctuation">"</span>');
    });

    // Slider data attributes demo
    $("[name='sliderDataAttributes']").change(event => {
        var option = $(event.target).attr('id');
        var value = event.target.value;
        var dataAttribute;

        switch(option) {
            case 'sliderAutoplay':
                dataAttribute = 'data-slider-autoplay';
                break;
            case 'sliderLoop':
                dataAttribute = 'data-slider-loop';
                break;
            case 'sliderGutter':
                dataAttribute = 'data-slider-gutter';
                break;
            case 'sliderGutterMedium':
                dataAttribute = 'data-slider-gutter-md';
                break;
            case 'sliderGutterLarge':
                dataAttribute = 'data-slider-gutter-lg';
                break;
            case 'sliderSpeed':
                dataAttribute = 'data-slider-speed';
                break;
            case 'sliderItems':
                dataAttribute = 'data-slider-items';
                break;
            case 'sliderItemsMedium':
                dataAttribute = 'data-slider-items-md';
                break;
            case 'sliderItemsLarge':
                dataAttribute = 'data-slider-items-lg';
                break;
        }

        if (dataAttribute !== null) {
            $exampleSlider1.attr(dataAttribute, value);
            $exampleSlider1CodeBox.find('.attr-name:contains("' + dataAttribute + '")').next('.token').html('<span class="token punctuation">=</span><span class="token punctuation">"</span>' + value + '<span class="token punctuation">"</span>');
            $exampleSlider1.html($exampleSlider1.data('slide-html'));
            $exampleSlider1.find('.slider').trigger('slider:update');
        }
    });

    // Toast message JS example
    var toastHelpers = require('./components/toast');
    $('#sgToastJsExample').click(event => {
        event.preventDefault();
        toastHelpers.methods.show('success', '<strong>Hooray!</strong> You did it!', false);
    });

    // Icon search
    $('#iconFilter').keyup(event => {
        var value = $(event.target).val();
        if (value !== '') {
            $('.icon-list .icon-container').each(function(index, element) {
                var $icon = $(element);
                if (!$icon.find('[class*="' + value + '"]').length) {
                    $icon.closest('.column').addClass('d-none');
                } else {
                    $icon.closest('.column').removeClass('d-none');
                }
            });
        } else {
            $('.icon-list .column').removeClass('d-none');
        }
    });

    // Theme Toggler
    var $themeToggler = $('#sgThemeToggler');
    var currentTheme = new URL(window.location.href).searchParams.get('src');

    if (currentTheme) {
        $themeToggler.find('option[value=' + currentTheme + ']').prop('selected', true);
    }

    $themeToggler.change(event => {
        var newTheme = $(event.target).val();
        var currentUrl = window.location.href;
        var currentHash = window.location.hash;
        var hasHash = currentHash.length;

        if (hasHash) {
            currentUrl = currentUrl.split(currentHash)[0];
        }

        var newUrl = new URL(currentUrl);
        newUrl.searchParams.set('src', newTheme);

        if (hasHash) {
            newUrl+=currentHash;
        }

        window.location.href = newUrl;
    });

});
