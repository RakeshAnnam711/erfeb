'use strict';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

class DateShortcuts {
    #date;

    #endEl;

    #startEl;

    #hiddenEl;

    #elements;

    #shortcuts;

    #activeClass;

    constructor() {
        this.#activeClass = 'active';
        this.#startEl = document.querySelector('.search-min');
        this.#endEl = document.querySelector('.search-max');
        this.#hiddenEl = document.querySelector('[name="dateShortcut"]');
        this.#elements = Array.from(document.querySelectorAll('.js-date-shortcut'));
        this.#shortcuts = {
            'today': { start: this.#today, end: this.#today },
            'this-month': { start: this.#beginningOfMonth, end: this.#endOfMonth },
            'last-month': { start: this.#beginningOfLastMonth, end: this.#endOfLastMonth },
            'past-thirty-days': { start: this.#thirtyDaysAgo, end: this.#today },
            'this-year': { start: this.#beginningOfYear, end: this.#endOfYear }
        };
    }

    /**
     * Init events
     * @returns {void}
     */
    init() {
        if (!(this.#elements.length && this.#startEl && this.#endEl)) {
            return;
        }

        this.#addEvents();
        this.#calendarSetup();
    }

    /**
     * Add event listeners
     */
    #addEvents() {
        this.#elements.forEach((element) => {
            element.addEventListener('click', this.#handleShortcut.bind(this));
        });

        this.#endEl.addEventListener('input', this.#makeElementsInactive.bind(this));
        this.#startEl.addEventListener('input', this.#makeElementsInactive.bind(this));
    }

    /**
     * Setup calendar for date from, date to
     * @returns {void}
     */
    #calendarSetup() {
        if (!(window.Calendar && window.Calendar.setup)) {
            return;
        }

        const format = '%m/%d/%Y';

        [this.#startEl, this.#endEl].forEach((element) => {
            window.Calendar.setup({
                ifFormat: format,
                inputField: element.id,
                button: element.id + '-btn',
                onUpdate: this.#makeElementsInactive.bind(this)
            });
        });
    }

    /**
     * Handler for click event on shortcut and set date from, date to
     * @param {Object} event - Event object
     * @param {Element} event.target - HTML target element
     * @returns {void}
     */
    #handleShortcut({ target }) {
        if (target.classList.contains(this.#activeClass)) {
            return;
        }

        const shortcut = this.#shortcuts[target.dataset.shortcut];

        this.#hiddenEl.value = target.dataset.shortcut;

        this.#initiateDate();
        this.#startEl.value = shortcut.start.call(this);

        this.#initiateDate();
        this.#endEl.value = shortcut.end.call(this);

        this.#makeElementsInactive();

        target.classList.add(this.#activeClass);
    }

    /**
     * Make all elements inactive
     */
    #makeElementsInactive() {
        this.#elements.forEach((element) => {
            element.classList.remove(this.#activeClass);
        });
    }

    /**
     * Init current date
     */
    #initiateDate() {
        this.#date = new Date();
    }

    /**
     * Current date format
     * @returns {string} - Formatted current date by format
     */
    #today() {
        return this.#formatDate();
    }

    /**
     * Get beginning of month date
     * @returns {string} - Formatted beginning of month date by format
     */
    #beginningOfMonth() {
        this.#date.setDate(1);

        return this.#formatDate();
    }

    /**
     * Get end of month date
     * @returns {string} - Formatted end of month date by format
     */
    #endOfMonth() {
        this.#date.setDate(this.#daysInMonth());

        return this.#formatDate();
    }

    /**
     * Get beginning of last month date
     * @returns {string} - Formatted beginning of last month date by format
     */
    #beginningOfLastMonth() {
        this.#setLastMonth();

        return this.#formatDate();
    }

    /**
     * Get end of last month date
     * @returns {string} - Formatted end of last month date by format
     */
    #endOfLastMonth() {
        this.#setLastMonth();

        this.#date.setDate(this.#daysInMonth());

        return this.#formatDate();
    }

    /**
     * Get beginning of year date
     * @returns {string} - Formatted beginning of year date by format
     */
    #beginningOfYear() {
        this.#date.setMonth(0);
        this.#date.setDate(1);

        return this.#formatDate();
    }

    /**
     * Get end of year date
     * @returns {string} - Formatted end-of-year date by format
     */
    #endOfYear() {
        this.#date.setMonth(11);
        this.#date.setDate(31);

        return this.#formatDate();
    }

    /**
     * Get date for past 30 days
     * @returns {string} - Formatted past 30 days date by format
     */
    #thirtyDaysAgo() {
        const value = Date.now() - (30 * MS_PER_DAY);

        this.#date = new Date(value);

        return this.#formatDate();
    }

    /**
     * Set last month
     */
    #setLastMonth() {
        this.#date.setDate(1);

        if (this.#date.getMonth() <= 0) {
            this.#date.setYear(this.#date.getFullYear() - 1);
            this.#date.setMonth(11);
        } else {
            this.#date.setMonth(this.#date.getMonth() - 1);
        }
    }

    /**
     * Gets the day-of-the-month
     * @returns {number} - The day-of-the-month
     */
    #daysInMonth() {
        return (new Date(this.#date.getFullYear(), this.#date.getMonth() + 1, 0)).getDate();
    }

    /**
     * Format date in format mm/dd/yyyy
     * @returns {string} - Formatted date in format mm/dd/yyyy
     */
    #formatDate() {
        const month = String(this.#date.getMonth() + 1).padStart(2, '0');
        const day = String(this.#date.getDate()).padStart(2, '0');
        const year = this.#date.getFullYear();

        return `${month}/${day}/${year}`;
    }
}

module.exports = DateShortcuts;
