'use strict';

const KEY_IS_SAVE_PP_ACCOUNT = 'isSavePayPalAccount';

/**
 * Reveals a hidden container and shows the loader
 * @param {HTMLElement} container - HTML element to be shown
 * @param {Object} loader - Loader instance with a show method
 */
function showContainerWithLoader(container, loader) {
    loader.show();
    container.closest('.d-none')?.classList.remove('d-none');
}

/**
 * Sets the value of a checkbox in local storage
 * @param {HTMLInputElement} checkboxElement - The checkbox element
 */
function setCheckboxValueInLocalStorage(checkboxElement) {
    if (!checkboxElement) {
        return;
    }

    window.localStorage.setItem(KEY_IS_SAVE_PP_ACCOUNT, checkboxElement.checked);
}

/**
 * Handle save PayPal account checkbox
 */
function handleSavePayPalCheckbox() {
    const savePaypalAccountEl = document.getElementById('savePaypalAccount');
    const sessionValue = JSON.parse(window.localStorage.getItem(KEY_IS_SAVE_PP_ACCOUNT));

    if (!savePaypalAccountEl || !sessionValue) {
        return;
    }

    savePaypalAccountEl.checked = sessionValue;
}

/**
 * Add event listener on save PayPal account checkbox
 */
function addListenerOnSavePayPalCheckbox() {
    const savePaypalAccountEl = document.getElementById('savePaypalAccount');

    savePaypalAccountEl?.addEventListener('change', () => {
        setCheckboxValueInLocalStorage(savePaypalAccountEl);
    });
}

/**
 * Checks if the user agent in the URL matches the current user agent
 * @returns {boolean} True if the user agent matches, otherwise false
 */
function isNotSameUserAgent() {
    const userAgent = new URL(window.location).searchParams.get('uaRef');

    if (!userAgent) {
        return false;
    }

    const reversedUserAgent = userAgent.split('').reverse().join('');

    return atob(reversedUserAgent) !== window.navigator.userAgent;
}

/**
 * Resumes or renders the payment button based on return state
 * @param {Object} options - Options
 * @param {Object} options.button - Button with hasReturned, resume, and render methods
 * @param {HTMLElement} options.container - Element to render the button into
 * @param {Object} options.loader - Loader with a show method
 */
function processReturnOrRender({ button, container, loader }) {
    if (button.hasReturned() && isNotSameUserAgent()) {
        const AlertHandler = require('../models/alertHandler');

        new AlertHandler().showWarning(window.i18nMessages.RETURN_TO_ORIGINAL_BROWSER);

        window.location.hash = '';
    }

    if (button.hasReturned()) {
        if (/^#onApprove/.test(window.location.hash)) {
            document.querySelector('[data-method-id="PayPal"] a')?.click();

            handleSavePayPalCheckbox();
            showContainerWithLoader(container, loader);
        }

        button.resume();

        if (!window.paypalPreferences.isStreamlinedCheckout) {
            button.render(container);
        }
    } else {
        button.render(container).then(() => loader?.hide());
    }
}

/**
 * Checks if the current URL hash indicates a return from an approval flow
 * Expects the hash to be 'onApprove' and contain both 'token' and 'PayerID' query parameters
 * @returns {boolean} True if the return flow is detected, otherwise false
 */
function hasReturnedFlow() {
    const url = new URL(window.location.href);
    const [hash, ...queryParams] = url.hash.slice(1).split('&');

    if (!hash || !queryParams) {
        return false;
    }

    const requiredKeys = ['button_session_id', 'switch_initiated_time'];
    const keys = Object.keys(Object.fromEntries(queryParams.map(part => part.split('='))));

    return ['onApprove', 'onCancel', 'onError'].includes(hash) && requiredKeys.every(key => keys.includes(key));
}

/**
 * Sets up checkout stage navigation and popstate event handler
 */
function setupCheckoutStageNavigation() {
    const plugin = document.getElementById('checkout-main');

    //
    // The different states/stages of checkout
    //
    const checkoutStages = [
        'customer',
        'shipping',
        'payment',
        'placeOrder',
        'submitted'
    ];

    /**
     * Updates the URL to determine stage
     * @param {number} currentStage - The current stage the user is currently on in the checkout
     */
    function updateUrl(currentStage) {
        window.history.pushState(
            checkoutStages[currentStage],
            document.title,
            `${window.location.pathname}?stage=${checkoutStages[currentStage]}#${checkoutStages[currentStage]}`
        );
    }

    //
    // Local member methods of the Checkout plugin
    //
    const members = {
        // initialize the currentStage variable for the first time
        currentStage: 0,

        /**
         * Previous State
         */
        handlePrevStage: function() {
            if (members.currentStage > 0) {
                // move state back
                members.currentStage--;
                updateUrl(members.currentStage);
            }

            plugin.setAttribute('data-checkout-stage', checkoutStages[members.currentStage]);
        },

        /**
         * The next checkout state step updates the css for showing correct buttons etc...
         *
         * @param {boolean} bPushState - boolean when true pushes state using the history api.
         */
        handleNextStage: function(bPushState) {
            if (members.currentStage < checkoutStages.length - 1) {
                // move stage forward
                members.currentStage++;

                //
                // show new stage in url (e.g.payment)
                //
                if (bPushState) {
                    updateUrl(members.currentStage);
                }
            }

            // Set the next stage on the DOM
            plugin.setAttribute('data-checkout-stage', checkoutStages[members.currentStage]);
        }
    };

    members.currentStage = checkoutStages.indexOf(plugin.dataset.checkoutStage);

    /**
     * Handle popstate event
     * @param {Object} e - Event object
     */
    const handlePopstateCallback = function(e) {
        members.currentStage = checkoutStages.indexOf(plugin.dataset.checkoutStage);

        if (hasReturnedFlow()) {
            return;
        }

        //
        // Back button when event state less than current state in ordered
        // checkoutStages array.
        //
        if (e.state === null
            || checkoutStages.indexOf(e.state) < members.currentStage) {
            members.handlePrevStage(false);
        } else if (checkoutStages.indexOf(e.state) > members.currentStage) {
            // Forward button pressed
            members.handleNextStage(false);
        }
    };

    $(function() {
        //
        // Listen for forward/back button press and move to correct checkout-stage
        //
        $(window).off('popstate').on('popstate', handlePopstateCallback);
    });

    ((history) => {
        const pushState = history.pushState;

        history.pushState = function() {
            return hasReturnedFlow() ? undefined : pushState.apply(history, arguments);
        };
    })(window.history);
}

module.exports = {
    hasReturnedFlow: hasReturnedFlow,
    processReturnOrRender: processReturnOrRender,
    setupCheckoutStageNavigation: setupCheckoutStageNavigation,
    setCheckboxValueInLocalStorage: setCheckboxValueInLocalStorage,
    addListenerOnSavePayPalCheckbox: addListenerOnSavePayPalCheckbox
};
