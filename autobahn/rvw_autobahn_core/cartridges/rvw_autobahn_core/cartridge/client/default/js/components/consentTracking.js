'use strict';

/**
 * Renders a modal window that will track the users consenting to accepting site tracking policy
 */
var consent = {
    init: () => {
        var namespace = '.consenttracking ',
            $body = $('body');

        $('.js-tracking-consent-show').on('click' + namespace, (e) => {
            const $trackingConsent = $('.tracking-consent');
            const $consentTracking = $('#consent-tracking');

            e.preventDefault();

            if ($trackingConsent.length === 0 || !$trackingConsent.data('caonline') || $consentTracking.length === 0) return;

            $consentTracking.removeAttr('hidden');
        });

        $body.on('click' + namespace, '.consent-button-wrapper button', (event) => {
            event.preventDefault();

            $.ajax({
                url: $(event.target).data('url'),
                type: 'post',
                dataType: 'json',
                complete: () => $('#consent-tracking').prop('hidden',true)
            });
        });
    }
};

module.exports = consent;
