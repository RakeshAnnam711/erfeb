'use strict';

function showMore() {
    $('.container').on('click', '.show-more-blogs button', function (e) {
        e.stopPropagation();
        var $target = $(event.target);
        var showMoreUrl = $(this).data('url');
        e.preventDefault();
        $.spinner().start();

        $.ajax({
            url: showMoreUrl,
            data: { selectedUrl: showMoreUrl },
            method: 'GET',
            success: function (response) {
                $target.closest('.blog-grid-footer').replaceWith(response);
                $.spinner().stop();
                $('body').trigger('blog:lazyLoadImages');
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });
}

function lazyLoadImages() {
    const isMobile = window.innerWidth <= 768;
    let lazyBgElements = document.querySelectorAll('.content-tile-image[data-bg]');

    if (window.IntersectionObserver && isMobile) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const bg = el.getAttribute("data-bg");
                    el.style.backgroundImage = `url('${bg}')`;
                    el.removeAttribute("data-bg");
                    observer.unobserve(el);
                }
            });
        }, {
            rootMargin: "200px 0px",  // preload slightly before visible
            threshold: 0.01
        });

        lazyBgElements.forEach(el => observer.observe(el));
    } else {
        // Fallback for browsers without IntersectionObserver support
        lazyBgElements.forEach(el => {
            const bg = el.getAttribute("data-bg");
            el.style.backgroundImage = `url('${bg}')`;
            el.removeAttribute("data-bg");
        });
        $('.content-tile-image img').attr({
            loading: 'eager',
            fetchpriority: 'high'
        });
    }
}

function init() {
    $('body').on('blog:lazyLoadImages', function (e) {
        lazyLoadImages();
    });
}

module.exports = {
    showMore: showMore,
    lazyLoadImages: lazyLoadImages,
    init: init
};
