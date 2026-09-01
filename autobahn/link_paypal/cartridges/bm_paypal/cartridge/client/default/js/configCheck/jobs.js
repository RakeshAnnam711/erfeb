'use strict';

/* eslint-disable no-console */

class Jobs {
    constructor(OCAPI, ProgressBar, resources) {
        this.OCAPI = OCAPI;
        this.interval = 3000;
        this.resources = resources;
        this.ProgressBar = ProgressBar;
    }

    /**
     * Handle Job Execution Fault
     * @param {Object} jobExecution - Job Execution
     * @returns {void}
     */
    handleJobExecutionFault(jobExecution) {
        let errorMessage = this.resources.exportAllFailure;

        if (jobExecution.fault) {
            throw new Error(`${jobExecution.fault.type}: ${jobExecution.fault.message}`);
        }

        if (jobExecution.status === 'ERROR') {
            const { step_executions: [{ exit_status }] } = jobExecution;

            if (exit_status) {
                let message = exit_status.message;

                const indexStart = message.indexOf('{{');
                const indexEnd = message.indexOf('}}');

                if (![indexStart, indexEnd].includes(-1)) {
                    message = message.substring(indexStart + 2, indexEnd);

                    try {
                        const fileList = JSON.parse(message).map(item => item.file).join(', ');

                        if (fileList) {
                            errorMessage = this.resources.exportSomeFailure.replace('{0}', fileList);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            }

            throw new Error(errorMessage);
        }
    }

    /**
     * Check Site Export until finished
     * @param {Object} options - Options
     * @param {string} options.jobId - Job ID
     * @param {number} options.id - Job execute id
     * @param {number} options.interval - Interval of checks in seconds
     * @returns {Promise<boolean>} - Resolves true on success
     */
    checkSiteExportUntilFinished({ jobId, id, interval }) {
        return new Promise((resolve, reject) => {
            /** @returns {void} */
            const checkSiteExportWithInterval = () => {
                this.OCAPI.jobStatus(jobId, id)
                    .then((jobExecution) => {
                        this.handleJobExecutionFault(jobExecution);

                        const { status, execution_status } = jobExecution;

                        if (status === 'OK' && execution_status === 'finished') {
                            this.ProgressBar.handleProgressBarNextStep(jobId);

                            return resolve(true);
                        }

                        if (status === 'RUNNING') {
                            return setTimeout(checkSiteExportWithInterval, interval);
                        }

                        return reject(new Error(`Unexpected job status: ${status}`));
                    }).catch((error) => reject(error));
            };

            checkSiteExportWithInterval();
        });
    }

    /**
     * Handle Export Site Archive
     * @param {Object} formData - Form Data Object
     * @returns {boolean|Promise} - result
     */
    handleExportSite(formData) {
        const jobId = 'sfcc-site-archive-export';

        return this.OCAPI.runJob(jobId, {
            data_units: {
                global_data: {
                    services: formData.services,
                    preferences: true,
                    system_type_definitions: formData.systemTypeDefinitions
                },
                sites: {
                    [formData.siteId]: {
                        shipping: true,
                        site_descriptor: true,
                        site_preferences: true,
                        payment_methods: formData.paymentMethods,
                        payment_processors: formData.paymentMethods
                    }
                }
            },
            export_file: formData.fileName,
            overwrite_export_file: true
        }).then((jobExecution) => {
            this.handleJobExecutionFault(jobExecution);

            return this.checkSiteExportUntilFinished({
                jobId: jobId,
                id: jobExecution.id,
                interval: this.interval
            });
        });
    }

    /**
     * Archive File Processing
     * @param {Object} formData - Form Data Object
     * @returns {boolean|Promise} - result
     */
    archiveFileProcessing(formData) {
        const jobId = 'PpConfigCheckSiteArchiveProcessing';
        const connectionData = formData.connectionData;

        delete formData.connectionData;

        return this.OCAPI.runJob(jobId, { // JobExecutionParameter
            parameters: [{
                name: 'Options', // maxLength=256, minLength=1,
                value: JSON.stringify(formData) // maxLength=1000, minLength=0
            },
            {
                name: 'ConnectionData', // maxLength=256, minLength=1,
                value: JSON.stringify(connectionData) // maxLength=1000, minLength=0
            }]
        })
            .then((jobExecution) => {
                this.handleJobExecutionFault(jobExecution);

                return this.checkSiteExportUntilFinished({
                    jobId: jobId,
                    id: jobExecution.id,
                    interval: this.interval
                });
            });
    }
}

module.exports = Jobs;
