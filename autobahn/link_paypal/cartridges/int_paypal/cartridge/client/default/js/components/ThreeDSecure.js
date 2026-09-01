'use strict';

const helper = require('../helpers/helper');

/**
 * 3DSecure class to handle failed/success events for popup window
 * @class
 */
class ThreeDSecure {
    /** @type {WindowProxy|null} */
    #popup;

    /** @type {boolean} */
    #popupAutoClosed;

    /**
     * @constructor
     */
    constructor() {
        this.#addMessageEventListener();
    }

    /**
     * Sets the options for the 3DSecure
     * @public
     * @param {Object} options - The configuration options
     * @returns {ThreeDSecure} - Returns the instance of the class
     */
    setOptions(options) {
        /** @type {Object} */
        this.options = options;

        return this;
    }

    /**
     * Loads a specified resource into a new or existing browsing context
     * @public
     * @param {string} url - URL or path of the resource to be loaded
     * @param {string} target - Name of the browsing context the resource is being loaded into
     * @param {Object} features - Options for popup window
     * @returns {WindowProxy|null} - WindowProxy object, otherwise null if the browser fails to open the new browsing context
     */
    open(url, target = '__blank', features = { width: 450, height: 510 }) {
        const center = helper.getCenteredPosition(features.width, features.height);
        const windowFeatures = `popup,width=${features.width},height=${features.height},top=${center.top},left=${center.left}`;

        this.#popup = window.open(url, target, windowFeatures);

        this.#waitForPopupToClose();

        return this.#popup;
    }

    /**
     * Checks if the provided argument is a function
     * @private
     * @param {M} callback - The argument to be checked whether it's a function
     * @returns {boolean} Returns `true` if `callback` is a function, otherwise returns `false`
     */
    #isFunction(callback) {
        return callback && typeof callback === 'function';
    }

    /**
     * Triggers on success
     * @private
     * @param {Object} eventData - Event data
     */
    #onApprove(eventData) {
        const { onApprove: callback } = this.options;

        if (this.#isFunction(callback)) {
            callback(eventData);
        }
    }

    /**
     * Triggers on failure
     * @private
     * @param {Object} eventData - Event data
     */
    #onCancel(eventData) {
        const { onCancel: callback } = this.options;

        if (this.#isFunction(callback)) {
            callback(eventData);
        }
    }

    /**
     * Triggers when closed
     * @private
     * @param {Object} source - Target window
     * @param {Object} [eventData] - Event data
     */
    #onClose(source, eventData) {
        const { onClose: callback } = this.options;

        if (this.#isFunction(callback)) {
            source.close();

            this.#popupAutoClosed = true;

            callback(eventData);
        }

        source.close();
    }

    /**
     * Add event listener to handle message
     * @private
     * @returns {void}
     */
    #addMessageEventListener() {
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) {
                return;
            }

            if (typeof event.data !== 'string') {
                return;
            }

            if (event.data.includes('close')) {
                this.#onClose(event.source, event);
            }

            if (event.data.includes('approveFlow')) {
                this.#onApprove(event);
            }

            if (event.data.includes('cancelFlow')) {
                this.#onCancel(event);
            }
        });
    }

    /**
     * Watches for popup window to be closed, then calls onClose callback.
     */
    #waitForPopupToClose() {
        this.#popupAutoClosed = false;

        const checker = setInterval(() => {
            if (this.#popup.closed) {
                clearInterval(checker);

                if (!this.#popupAutoClosed) {
                    this.#onClose(this.#popup);
                }
            }
        }, 500);
    }

    /**
     * Handle opener window
     * @static
     * @public
     */
    static opener() {
        if (window.opener) {
            const searchParams = new URLSearchParams(window.location.search);

            if (searchParams.get('approveFlow') === 'true') {
                window.opener.postMessage('close approveFlow', window.location.origin);
            }

            if (searchParams.get('cancelFlow') === 'true') {
                window.opener.postMessage('close cancelFlow', window.location.origin);
            }
        }
    }
}

module.exports = ThreeDSecure;
