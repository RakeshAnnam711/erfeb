'use strict';

document.addEventListener('DOMContentLoaded', function () {
    const sliderContainer = document.querySelectorAll('.slider-frenzy-product .slider');
    sliderContainer.forEach(function (slider) {
        if (typeof $(slider).slick === 'function') {
            $(slider).slick({
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
                cssEase: 'linear',
            });
        }
        slider.classList.remove('d-none');
    });

    document.querySelectorAll('.product-click-track').forEach(function (element) {
        element.addEventListener('click', function (e) {
            const data = e.currentTarget.dataset;
            const requestData = {
                sku: data.id,
                event_name: data.eventname,
                query_id: data.queryid,
                user_id: data.userid
            };
            send_events(requestData);
        });
    });

    async function send_events(requestData) {
        const eventsUrl_Frenzy = "https://wgaca.search.frenzy.ai/events";
        const data_json = JSON.stringify([requestData]);
        const response = await fetch(eventsUrl_Frenzy, {
            method: 'POST',
            body: data_json,
            headers: {
                'Content-Type': 'application/json',
                'x-frenzy-authorization': 'b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5'
            }
        });
        const data = await response.json();
    }
});