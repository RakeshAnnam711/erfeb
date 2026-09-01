'use strict';

/**
 * Open Commerce API (OCAPI)
 */
const OpenCommerceAPI = class {
    /**
     * @constructor
     * @param {Object} options - Options
     */
    constructor(options) {
        this.options = options;
        this.accessToken = {};
        this.expirationTime = 0;

        this.contentType = {
            json: 'application/json;charset=UTF-8',
            formUrlencoded: 'application/x-www-form-urlencoded;charset=UTF-8'
        };
    }

    /**
     * Convert object To FormData
     * @param {Object} obj - Object
     * @returns {string} - result
     */
    objectToFormData(obj) {
        const formData = new URLSearchParams();

        for (const key in obj) {
            formData.append(key, obj[key]);
        }

        return formData.toString();
    }

    /**
     * Authorize in BM
     * @returns {void}
     */
    async authorizeBM() {
        const requestBody = this.objectToFormData({
            grant_type: 'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken'
        });

        const path = '/dw/oauth2/access_token?client_id=' + this.options.clientId;
        const auth = btoa(`${this.options.bmUserLogin}:${this.options.bmUserPassword}:${this.options.clientPassword}`);

        const requestOptions = {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': this.contentType.formUrlencoded
            },
            body: requestBody
        };

        this.accessToken = await this.request(path, requestOptions);
        this.expirationTime = Date.now() + this.accessToken.expires_in * 1000;
    }

    /**
     * Get result for Authorization header
     * @returns {string} - Authorization
     */
    async getAuthorizationHeader() {
        if (Date.now() >= this.expirationTime) {
            await this.authorizeBM();
        }

        return `${this.accessToken.token_type} ${this.accessToken.access_token}`;
    }

    /**
     * Get Job Execution status
     * @param {string} jobId - Job ID
     * @param {number} executionId - Execution ID
     * @returns {Promise} - Promise
     */
    async jobStatus(jobId, executionId) {
        const path = `${this.getDataPath()}/jobs/${jobId}/executions/${executionId}`;

        const requestOptions = {
            method: 'GET',
            headers: {
                Authorization: await this.getAuthorizationHeader()
            }
        };

        return this.request(path, requestOptions);
    }

    /**
     * Execute Job by Job ID
     * @param {string} jobId - Job ID
     * @param {Object} properties - Request body
     * @returns {Promise} - Promise
     */
    async runJob(jobId, properties) {
        const requestBody = properties && Object.keys(properties).length ? JSON.stringify(properties) : null;

        const path = `${this.getDataPath()}/jobs/${jobId}/executions`;

        const requestOptions = {
            method: 'POST',
            headers: {
                Authorization: await this.getAuthorizationHeader(),
                'Content-Type': this.contentType.json
            },
            body: requestBody
        };

        return this.request(path, requestOptions);
    }

    /**
     * Send the request
     * @param {string} path - URL path
     * @param {Object} options - Request data
     * @returns {Promise<Response>} - Promise
     */
    request(path, options) {
        const url = new URL(path, window.location.origin);

        return fetch(url, options).then(response => response.json());
    }

    /**
     * Version
     * @returns {string} - Version
     */
    getVersion() {
        return `v${this.options.apiVersion.replace('.', '_')}`;
    }

    /**
     * Data Path
     * @returns {string} - Data path
     */
    getDataPath() {
        return `/s/-/dw/data/${this.getVersion()}`;
    }
};

module.exports = OpenCommerceAPI;
