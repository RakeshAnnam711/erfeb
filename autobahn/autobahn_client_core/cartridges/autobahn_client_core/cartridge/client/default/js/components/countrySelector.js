'use strict';

const base = require('base/components/countrySelector');

module.exports = function () {
    // initialize action to allow default behavior
    const page = document.querySelector('.page');

    if (['', null, undefined].includes(page.dataset.action)) {
        page.dataset.action = 'Home-Show';
    }

    // add tab index on flags to get tab focus
    document.querySelectorAll('.country-selector a').forEach(link => {
        link.setAttribute('tabindex', '0');
    });

    // add aria-label to flag links
    document.querySelectorAll('.country-selector a').forEach(link => {
        const linkText = link.textContent.trim();
        link.setAttribute('aria-label', linkText);
    });

    document.querySelectorAll('.country-selector a').forEach(link => {
        link.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const action = page.dataset.action;
                const localeCode = link.dataset.locale;
                const localeCurrencyCode = link.dataset.currencycode;
                const queryString = page.dataset.querystring;
                const url = document.querySelector('.country-selector').dataset.url;

                fetch(`${url}?code=${localeCode}&queryString=${queryString}&CurrencyCode=${localeCurrencyCode}&action=${action}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data && data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    }
                })
                .catch(() => {
                    console.error('Error occurred while processing the request.');
                });
            }
        });
    });

    return base.apply(this, arguments);
};
