'use strict';

const Jobs = require('./jobs');
const Modal = require('../components/modal');
const ProgressBarModel = require('./progressBar');
const WebDAV = require('./webdav');
const OpenCommerceAPI = require('./ocapi');
const AlertHandlerModel = require('../components/alertHandler');

const alertHandler = new AlertHandlerModel();

const configCheckEl = document.querySelector('.js-config-check');

const config = JSON.parse(configCheckEl.dataset.apiConfig);
const resources = JSON.parse(configCheckEl.dataset.resources);
const additionalData = JSON.parse(configCheckEl.dataset.additionalData);
const testConnectionUrl = configCheckEl.dataset.testConnectionUrl;
const selfCheckUrl = configCheckEl.dataset.selfCheckUrl;

const OCAPI = new OpenCommerceAPI(config.ocapi);

let ProgressBar;
let modal;

/**
 * Retrieves the values of checked input elements from a specified form based on the given name attribute.
 * @param {Element} form - The form element from which to retrieve checked values.
 * @param {string} name - The name attribute of the input elements to search for within the form.
 * @returns {Array<string>} An array containing the values of the checked input elements that match the specified name.
 */
const getCheckedValues = (form, name) => {
    return Array.from(form.querySelectorAll(`[name="${name}"]`))
        .filter(element => element.checked)
        .map(element => element.value);
};

/**
 * Handle download archive file
 * @param {string} fileName - file name
 * @returns {void}
 */
const handleDownloadFile = (fileName) => {
    const linkEl = document.createElement('a');

    const WebDav = new WebDAV(config.webdav);

    WebDav.get(`impex/src/instance/${fileName}`)
        .then((response) => response.ok ? response.blob() : response.text())
        .then((data) => {
            if (data instanceof Blob) {
                linkEl.href = URL.createObjectURL(data);
                linkEl.download = fileName;

                linkEl.click();

                URL.revokeObjectURL(linkEl.href);
            } else {
                const parser = new DOMParser();
                const html = parser.parseFromString(data, 'text/html');

                throw new Error([
                    html.querySelector('h1').textContent.trim(),
                    html.querySelector('p').textContent.trim()
                ].join('. '));
            }
        })
        .catch((error) => {
            alertHandler.showAlertMessage({ type: 'warning', message: error.message });
        });
};

/**
 * Handle Generate Plugin Configuration
 * @param {Object} formData - form data object
 * @returns {void}
 */
const handleGenerateConfig = (formData) => {
    const jobs = new Jobs(OCAPI, ProgressBar, resources);
    const selectedConfig = Object.keys(formData).filter(key => typeof formData[key] === 'boolean' && formData[key] === true);
    const totalSelected = selectedConfig.length;

    jobs.handleExportSite(formData)
        .then((isExportFinished) => {
            if (isExportFinished) {
                return jobs.archiveFileProcessing(formData);
            }

            return isExportFinished;
        })
        .then((isChangesCompleted) => {
            if (isChangesCompleted) {
                handleDownloadFile(formData.fileName);

                modal.close();

                alertHandler.showAlertMessage({
                    type: 'success',
                    message: resources[`export${totalSelected > 1 ? 'All' : 'General'}Success`]
                });
            }
        })
        .catch((error) => {
            const hasFiles = error.message.includes('file(s)');

            if (hasFiles) {
                handleDownloadFile(formData.fileName);
            }

            alertHandler.showAlertMessage({
                type: hasFiles ? 'caution' : 'warning',
                message: error.message
            });

            modal.close();
        });
};

/**
 * Handle Test Connection
 * @param {boolean} isExport - True if this is an export process, otherwise false
 * @returns {Promise} - response from Test Connection endpoint
 */
const handleTestConnection = (isExport = false) => {
    alertHandler.fadeAlerts();

    return fetch(testConnectionUrl, {
        method: 'POST',
        body: JSON.stringify({ isExport })
    }).then((response) => response.json());
};

/**
 * Handle Submit Form
 * @param {Object} form - Form element
 * @returns {void}
 */
const handleSubmitForm = (form) => {
    if (!form.checkValidity()) {
        form.reportValidity();
    } else {
        const isExport = true;
        const processedData = {};

        Array.from(form.elements).forEach((element) => {
            processedData[element.name] = element.type === 'checkbox' ? element.checked : element.value;
        });

        ProgressBar.showProgressBar();

        handleTestConnection(isExport)
            .then((response) => {
                const STEP_ID = 'test-connection';
                const result = response.result;

                if (result.error) {
                    alertHandler.showAlertMessage({
                        message: result.message,
                        type: 'warning'
                    });
                }

                processedData.connectionData = result;
                processedData.additionalData = additionalData;

                ProgressBar.handleProgressBarNextStep(STEP_ID);
                handleGenerateConfig(processedData);
            });
    }
};

/**
 * Handle Modal window
 * @returns {void}
 */
const handleModal = () => {
    let formEl;

    const formTemplateEl = document.querySelector('.js-form-template');

    modal = new Modal({
        title: resources.modalTitle,
        width: 600,
        height: 471,
        html: formTemplateEl.innerHTML,
        modal: true,
        autoScroll: true,
        listeners: {
            show: () => {
                formEl = document.querySelector('.js-form-generate-config');

                formEl.addEventListener('submit', (event) => event.preventDefault());
            }
        },
        buttons: [{
            text: resources.submit,
            handler: () => {
                handleSubmitForm(formEl);
            }
        }, {
            text: resources.cancel,
            handler: () => {
                modal.close();
            }
        }]
    });

    ProgressBar = new ProgressBarModel(modal, '.js-progress-bar-template');

    window.addEventListener('resize', () => {
        modal.center();
    });

    window.addEventListener('orientationchange', () => {
        modal.center();
    });

    modal.show();
};

/**
 * Handles the self-check process by collecting checked values from specified form inputs and sending them to a server endpoint.
 * @param {Element} form - The form element from which to retrieve input values.
 * @returns {Promise<Object>} A promise that resolves to the JSON object returned by the server in response to the POST request.
 */
const handleSelfCheck = (form) => {
    alertHandler.fadeAlerts();

    const services = getCheckedValues(form, 'service');
    const flows = getCheckedValues(form, 'flow');
    const payments = getCheckedValues(form, 'payment');

    return fetch(selfCheckUrl, {
        method: 'POST',
        body: JSON.stringify({ services, flows, payments })
    }).then(response => response.json());
};

/**
 * Processes and displays the results of a self-check operation on a form by updating the UI based on the validity of each checked item.
 * @param {Object} options - object with params for handling check result
 * @param {Element} options.formEl - The form element containing the checkboxes to be processed.
 * @param {Object} options.result - The result object received from the server, containing validation results for each item.
 * @param {string} options.selector - The name attribute of the checkboxes to be processed.
 * @param {string} options.checkResultKey - A dot-separated string representing the path to the relevant array within the `result` object,
 *                                          where each item's validation status is stored.
 */
const processCheckResults = (options) => {
    const { formEl, result, selector, checkResultKey } = options;

    const checkboxEls = Array.from(formEl.querySelectorAll(`[name="${selector}"]`)).filter(element => element.checked);
    const checkObject = checkResultKey.split('.').reduce((acc, key) => acc && acc[key], result);

    checkboxEls.forEach(element => {
        const checkResult = checkObject.find(item => item.name === element.value);
        const checkboxContainerEl = element.closest('.form-selfcheck');
        const alertEl = checkboxContainerEl.querySelector('i');

        if (checkResult.isValid) {
            checkboxContainerEl.classList.add('approved');
        } else {
            alertEl.innerText = `\n${checkResult.alert}`;

            checkboxContainerEl.classList.add('rejected');
        }
    });
};

/**
 * Handle Self Check Modal
 * @returns {void}
 */
const handleSelfCheckModal = () => {
    let formEl;

    const templateEl = document.querySelector('.js-self-check-template');

    const selfCheckModal = new Modal({
        title: resources.selfCheckModalTitle,
        width: 600,
        height: 200,
        html: templateEl.innerHTML,
        modal: true,
        autoScroll: true,
        listeners: {
            show: () => {
                formEl = document.querySelector('.js-form-self-check');

                formEl.addEventListener('submit', (event) => event.preventDefault());

                const allCheckboxEl = document.getElementById('all-config');
                const checkboxEls = document.querySelectorAll('.js-selfcheck-checkbox');

                const updateAllCheckboxState = () => {
                    allCheckboxEl.checked = Array.from(checkboxEls).every(element => element.checked);
                };

                checkboxEls.forEach(element => {
                    element.addEventListener('change', () => {
                        checkboxEls.forEach((checkbox) => {
                            const checkboxContainerEl = checkbox.closest('.form-selfcheck');
                            const alertEl = checkboxContainerEl.querySelector('i');

                            alertEl.innerText = '';

                            checkboxContainerEl.classList.remove('approved');
                            checkboxContainerEl.classList.remove('rejected');

                            selfCheckModal.center();
                        });

                        if (!element.checked) {
                            allCheckboxEl.checked = false;
                        } else {
                            updateAllCheckboxState();
                        }
                    });
                });

                allCheckboxEl.addEventListener('change', () => {
                    const isChecked = allCheckboxEl.checked;

                    checkboxEls.forEach(element => {
                        if (!element.required) {
                            element.checked = isChecked;
                        }
                    });
                });

            }
        },
        buttons: [{
            text: resources.submit,
            handler: () => {
                handleSelfCheck(formEl).then((res) => {
                    const result = res.result;

                    const options = {
                        formEl: formEl,
                        result: result
                    };

                    processCheckResults(Object.assign({
                        selector: 'service',
                        checkResultKey: 'checkedServices'
                    }, options));

                    processCheckResults(Object.assign({
                        selector: 'flow',
                        checkResultKey: 'checkedFlow'
                    }, options));

                    processCheckResults(Object.assign({
                        selector: 'payment',
                        checkResultKey: 'checkedPM.checkedPayments'
                    }, options));

                    selfCheckModal.center();
                });
            }
        }, {
            text: resources.cancel,
            handler: () => {
                selfCheckModal.close();
            }
        }]
    });

    window.addEventListener('resize', () => {
        selfCheckModal.center();
    });

    window.addEventListener('orientationchange', () => {
        selfCheckModal.center();
    });

    selfCheckModal.show();
    selfCheckModal.center();
};

document.addEventListener('DOMContentLoaded', () => {
    const buttonTestConnectionEl = document.querySelector('.js-test-connection');
    const buttonGenerateConfigEl = document.querySelector('.js-generate-config');
    const buttonSelfCheckEl = document.querySelector('.js-self-check');

    buttonGenerateConfigEl.addEventListener('click', handleModal);
    buttonSelfCheckEl.addEventListener('click', handleSelfCheckModal);
    buttonTestConnectionEl.addEventListener('click', () => {
        handleTestConnection()
            .then((response) => {
                const result = response.result;

                alertHandler.showAlertMessage({
                    message: result.message,
                    type: result.error ? 'warning' : 'success'
                });
            });
    });
});
