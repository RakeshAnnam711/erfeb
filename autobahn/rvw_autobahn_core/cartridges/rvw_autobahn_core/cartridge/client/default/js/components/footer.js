'use strict';

// Lazy load scrollAnimate only when back-to-top button is clicked
let scrollAnimate = null;
const loadScrollAnimate = function() {
    if (!scrollAnimate) {
        scrollAnimate = require('core/components/scrollAnimate');
    }
    return scrollAnimate;
};

/**
 * Display success/error message for email signup
 * @param {boolean} success - Whether the operation was successful
 * @param {string} msg - Message to display
 */
function displayMessage(success, msg) {
    const status = success ? 'alert-success' : 'alert-danger';
    let messageContainer = document.querySelector('.email-signup-message');

    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'email-signup-message';
        messageContainer.setAttribute('aria-live', 'polite');
        document.body.appendChild(messageContainer);
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `email-signup-alert text-center alert ${status}`;
    alertDiv.textContent = msg;
    messageContainer.appendChild(alertDiv);

    setTimeout(() => {
        messageContainer.remove();
    }, 3000);
}

const footer = {
    elementNameMap: {
        hpEmailSignUp: 'emailId'
    },
    methods: {
        displayMessage: displayMessage
    },
    backToTop: function () {
        if (this._backToTopInitialized) return;
        this._backToTopInitialized = true;

        document.addEventListener('click', (event) => {
            if (event.target.closest('.back-to-top')) {
                loadScrollAnimate()();
            }
        });
    },
    forms: 'footer .email-signup-form form',
    init: function () {
        if (this._initCalled) return;
        this._initCalled = true;

        const parent = this;
        const nameMap = parent.elementNameMap;

        const footerElement = document.querySelector('footer');
        if (!footerElement) return;

        const forms = footerElement.querySelectorAll(parent.forms);
        if (!forms.length) return;

        forms.forEach((form) => {
            const inputs = form.querySelectorAll(':not(:disabled)');

            if (nameMap) {
                inputs.forEach((input) => {
                    const oldName = input.getAttribute('name');
                    const newName = oldName && nameMap[oldName];

                    if (newName) {
                        input.setAttribute('name', newName);
                    }
                });
            }

            form.addEventListener('submit', (e) => {
                e.preventDefault();

                const xhr = form.dataset.xhr;
                form.dataset.xhr = fetch(form.getAttribute('action'), {
                    method: form.getAttribute('method') || 'POST',
                    body: new URLSearchParams(new FormData(form)),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    parent.methods.displayMessage(data.success, data.msg);
                    form.dispatchEvent(new CustomEvent('footer:signup:success', { detail: data }));
                })
                .catch(() => {
                    parent.methods.displayMessage(false, 'An error occurred.');
                })
                .finally(() => {
                    form.reset();
                });
            });

            form.querySelector('.subscribe-email')?.addEventListener('click', (e) => {
                e.preventDefault();
                form.dispatchEvent(new Event('submit'));
            });
        });
    },
    _initCalled: false,
    _backToTopInitialized: false,
    _initAsync: function() {
        this.init();
        this.backToTop();
    }
};

const initFooterAsync = function() {
    const footerElement = document.querySelector('footer');
    if (!footerElement) return;

    if ('IntersectionObserver' in window) {
        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    footerObserver.unobserve(entry.target);
                    if (window.requestIdleCallback) {
                        requestIdleCallback(() => footer._initAsync(), { timeout: 500 });
                    } else {
                        setTimeout(() => footer._initAsync(), 100);
                    }
                }
            });
        }, {
            rootMargin: '200px 0px'
        });

        footerObserver.observe(footerElement);
    } else {
        const initFn = () => footer._initAsync();

        if (window.requestIdleCallback) {
            requestIdleCallback(initFn, { timeout: 2000 });
        } else {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => setTimeout(initFn, 500));
            } else {
                setTimeout(initFn, 500);
            }
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooterAsync);
} else {
    initFooterAsync();
}

module.exports = footer;
