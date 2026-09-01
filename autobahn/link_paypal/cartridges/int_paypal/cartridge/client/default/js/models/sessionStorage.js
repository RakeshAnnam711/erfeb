'use strict';

/**
 * Constructor of SessionStorageModel
 */
function SessionStorageModel() {
    this.sessionStorage = window.sessionStorage;
}

/**
 * Returns a current session storage
 * @returns {Storage} An object of type storage
 */
SessionStorageModel.prototype.get = function() {
    return this.sessionStorage;
};

/**
 * Set a new item to the session storage
 * @param {string} name A name of the item to set
 * @param {string} value A value of the item to set
 */
SessionStorageModel.prototype.setItem = function(name, value) {
    this.sessionStorage.setItem(name, value);
};

/**
 * Returns a value of session storage item
 * @param {string} name A name of the item to get
 * @returns {string} A value of session storage item
 */
SessionStorageModel.prototype.getItem = function(name) {
    return this.sessionStorage.getItem(name);
};

/**
 * Removes an item from the session storage
 * @param {string} name A name of item to remove
 */
SessionStorageModel.prototype.removeItem = function(name) {
    this.sessionStorage.removeItem(name);
};

/**
 * Completely clears a session storage
 */
SessionStorageModel.prototype.clear = function() {
    this.sessionStorage.clear();
};

/**
 * Sets an active payment method tab name to the session storage
 * @param {string} value A name of the tab
 */
SessionStorageModel.prototype.setActiveBillingPmTab = function(value) {
    this.setItem(window.paypalConstants.ACTIVE_TAB, value);
};

/**
 * Returns a name of active payment method tab
 * @returns {string} A name of the payment tab
 */
SessionStorageModel.prototype.getActiveBillingPmTab = function() {
    return this.getItem(window.paypalConstants.ACTIVE_TAB);
};

module.exports = SessionStorageModel;
