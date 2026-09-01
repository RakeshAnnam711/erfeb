'use strict';

$(document).ready(function () {
    var sliderContainer= '.slider-category-product .slider';
    $(sliderContainer).each(function(){


        $(this).slick({
            // slidesToShow: sliderToDisplayInDesktop,
            // slidesToScroll: 1,
            responsive: [
                {
                  breakpoint: 1024,
                  settings: {
                    // slidesToShow: sliderToDisplayInTablet
                  }
                },
                {
                  breakpoint: 768,
                  settings: {
                    // slidesToShow: sliderToDisplayInMobile
                  }
                }
            ],

            infinite: false,
            swipe: false,
            arrows: false,
            dots: false,
            draggable: false,
            speed: 0,
            cssEase: 'linear'
        });
        $(this).removeClass('d-none');

    });
    setTimeout(() => {
        $('.slick-slide a').attr('tabindex', '0');
        $('.slick-slide .wishlist-toggle-product').attr('tabindex', '0');
    }, 500);
});