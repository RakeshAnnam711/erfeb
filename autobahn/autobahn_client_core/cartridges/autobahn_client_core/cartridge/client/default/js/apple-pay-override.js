/**
 * Apple Pay Button Override
 * Forces custom styling on Adyen Apple Pay buttons
 */
(function() {
    'use strict';

    function applyApplePayStyles() {
        const applePayButtons = document.querySelectorAll('.adyen-checkout__applepay__button');
        
        applePayButtons.forEach(function(button) {
            if (button) {
                // Apply inline styles to override any CSS
                button.style.setProperty('margin-top', '10px', 'important');
                button.style.setProperty('height', '47px', 'important');
                button.style.setProperty('width', '100%', 'important');
                button.style.setProperty('max-width', '100%', 'important');
                button.style.setProperty('min-width', '100%', 'important');
                button.style.setProperty('flex', '1 1 100%', 'important');
            }
        });
    }

    // Apply styles immediately
    applyApplePayStyles();

    // Apply styles when DOM changes (for dynamically loaded buttons)
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            if (node.classList && node.classList.contains('adyen-checkout__applepay__button')) {
                                applyApplePayStyles();
                            }
                            // Check for Apple Pay buttons in added nodes
                            const applePayButtons = node.querySelectorAll && node.querySelectorAll('.adyen-checkout__applepay__button');
                            if (applePayButtons && applePayButtons.length > 0) {
                                applyApplePayStyles();
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Apply styles on window load (fallback)
    window.addEventListener('load', applyApplePayStyles);

    // Apply styles when Adyen loads (if available)
    if (window.AdyenCheckout) {
        window.AdyenCheckout.on('ready', applyApplePayStyles);
    }

    console.log('Apple Pay button override script loaded');
})();
