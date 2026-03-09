'use strict';

// Initialize jQuery
var $ = require('jquery');

var base = require('base/components/countrySelector');

module.exports = function () {
    // initialize action to allow default behavior
    var $page = $('.page');

    if (['', null, undefined].indexOf($page.data('action')) !== -1) $page.data('action','Home-Show');

    // add tab index on flags to get tab focus
    $('.country-selector a').attr('tabindex', '0');

    // add aria-label to flag links
    $('.country-selector a').each(function () {
        var linkText = $(this).text().trim();
        $(this).attr('aria-label', linkText);
    });
    
    
    $('.country-selector a').on('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            var action = $('.page').data('action');
            var localeCode = $(this).data('locale');
            var localeCurrencyCode = $(this).data('currencycode');
            var queryString = $('.page').data('querystring');
            var url = $('.country-selector').data('url');
    
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                data: {
                    code: localeCode,
                    queryString: queryString,
                    CurrencyCode: localeCurrencyCode,
                    action: action
                },
                success: function (response) {
                    $.spinner().stop();
                    if (response && response.redirectUrl) {
                        window.location.href = response.redirectUrl;
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });    
        }
    });

    return base.apply(this, arguments);
};