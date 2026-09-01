'use strict';

class Tab {
    #elements;

    #activeClass;

    constructor() {
        this.#activeClass = 'active';
        this.#elements = Array.from(document.querySelectorAll('[data-toggle="tab"]'));
    }

    init() {
        this.#addEvents();
    }

    /**
     * Add events
     */
    #addEvents() {
        this.#elements.forEach((element) => {
            element.addEventListener('click', this.#handleClick.bind(this));

            if (this.#hasClass(element)) {
                element.click();
            }
        });
    }

    /**
     * Handle click event
     * @param {Object} event - Event listener
     */
    #handleClick(event) {
        event.preventDefault();

        const tabElement = event.target;
        const previousTabElement = document.querySelector('.js_paypalbm_switch.active');

        const isResetNeeded = tabElement !== previousTabElement;

        if (event.isTrusted && this.#hasClass(tabElement)) {
            return;
        }

        const elementId = tabElement.dataset.target.slice(1);
        const tabContentEl = document.getElementById(elementId);

        if (tabContentEl) {
            tabContentEl.parentElement
                .childElements()
                .concat(this.#elements)
                .forEach((element) => {
                        if (this.#hasClass(element) && isResetNeeded) {
                            element.classList.remove(this.#activeClass);

                            const inputElement = element.querySelector('input');
                            const selectElement = element.querySelector('select');

                            if(inputElement){
                                inputElement.value = '';
                            }

                            if(selectElement){
                                selectElement.selectedIndex = 0;
                            }
                        }
                    }
                );

            this.#addClass(tabElement);
            this.#addClass(tabContentEl);
        }
    }

    /**
     * Check if the HTML element has an active class
     * @param {HTMLElement} element - HTML element
     * @returns {boolean} - True if the element has active class, otherwise false
     */
    #hasClass(element) {
        return element.classList.contains(this.#activeClass);
    }

    /**
     * Add an active class for the element
     * @param {HTMLElement} element - HTML element
     */
    #addClass(element) {
        element.classList.add(this.#activeClass);
    }
}

module.exports = Tab;
