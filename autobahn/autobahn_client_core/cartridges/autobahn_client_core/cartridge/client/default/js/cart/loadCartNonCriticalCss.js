(function () {
    'use strict';

    function loadNonCriticalCartCss() {
        try {
            var href = document.querySelector('input[name="get-cart-non-critical-css-file"]')?.value;
            if (!href) return;
            var link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = href;
            link.onload = function () {
                this.rel = 'stylesheet';
            };
            document.head.appendChild(link);

            // Fallback for older browsers
            setTimeout(function () {
                if (!document.querySelector('link[href="' + href + '"]') || document.querySelector('link[href="' + href + '"]').rel === 'preload') {
                    var fallback = document.createElement('link');
                    fallback.rel = 'stylesheet';
                    fallback.href = href;
                    document.head.appendChild(fallback);
                }
            }, 3000);
        } catch (e) {
            // Silent fail
            console.error('Failed to load non-critical cart CSS', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadNonCriticalCartCss);
    } else {
        loadNonCriticalCartCss();
    }
})();
