'use strict';

/**
 * WebDAV
 */
const WebDAV = class {
    /**
     * @param {Object} options - Options
     */
    constructor(options) {
        this.options = options;
    }

    /**
     * Get file/list of files and folders
     * @param {string} filePath - File path/Directory path
     * @returns {Promise} - Promise
     */
    async get(filePath) {
        const path = `${this.getSitesPath()}/${filePath}`;

        const requestOptions = { method: 'GET' };

        return this.request(path, requestOptions);
    }

    /**
     * Upload file
     * @param {string} filePath - File path
     * @param {Object} requestBody - Request body
     * @returns {Promise} - Promise
     */
    async uploadFile(filePath, requestBody) {
        const path = `${this.getSitesPath()}/${filePath}`;

        const requestOptions = {
            method: 'PUT',
            body: requestBody
        };

        return this.request(path, requestOptions);
    }

    /**
     * Delete file
     * @param {string} filePath - File path
     * @returns {Promise} - Promise
     */
    async deleteFile(filePath) {
        const path = `${this.getSitesPath()}/${filePath}`;

        const requestOptions = { method: 'DELETE' };

        return this.request(path, requestOptions);
    }

    /**
     * Send Request
     * @param {string} path - URL path
     * @param {Object} options - Request options
     * @returns {Promise} - Promise
     */
    request(path, options) {
        const requestOptions = Object.assign({
            headers: {
                Authorization: this.getAuthorization()
            }
        }, options);

        const url = new URL(path, window.location.origin);

        return fetch(url, requestOptions);
    }

    /**
     * Basic Path
     * @returns {string} - Basic Path
     */
    getSitesPath() {
        return '/on/demandware.servlet/webdav/Sites';
    }

    /**
     * Basic Authorization
     * @returns {string} - Basic authorization value
     */
    getAuthorization() {
        const token = btoa(`${this.options.username}:${this.options.password}`);

        return `Basic ${token}`;
    }
};

module.exports = WebDAV;
