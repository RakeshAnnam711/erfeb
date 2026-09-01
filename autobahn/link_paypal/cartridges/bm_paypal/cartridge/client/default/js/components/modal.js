'use strict';

/**
 * Modal
 * @class
 */
class Modal {
    /**
     * @param {Object} options - Options for Ext Window component
     */
    constructor(options) {
        this.modal = new Ext.Window(options);
    }

    /**
     * Show modal
     * @returns {void}
     */
    show() {
        this.modal.show();
    }

    /**
     * Close modal
     * @returns {void}
     */
    close() {
        this.modal.close();
    }

    /**
     * Center modal
     * @returns {void}
     */
    center() {
        const windowWidth = window.innerWidth - 30;
        const windowHeight = window.innerHeight - 30;

        this.modal.setHeight('auto');

        if (this.modal.getSize().width > windowWidth) {
            this.modal.setWidth(windowWidth);
        }

        if (this.modal.getSize().height > windowHeight) {
            this.modal.setHeight(windowHeight);
        }

        this.modal.center();
    }
}

module.exports = Modal;
