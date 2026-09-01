'use strict';

((doc) => {
    const AlertHandlerModel = require('../components/alertHandler');
    const alertHandlerInstance = new AlertHandlerModel();

    let configuratorEl;

    /**
     * Handles onSave event and makes a request to save configuration on the backend side
     * @param {Object} data Data object from configurator
     * @param {Object} data.config Page's config
     */
    const onSave = ({ config }) => {
        const helper = require('../helpers/helper');

        const onSaveUrl = configuratorEl?.getAttribute('data-onsave-url');

        alertHandlerInstance.fadeAlerts();

        if (onSaveUrl) {
            fetch(helper.getUrlWithCsrfToken(onSaveUrl), {
                method: 'POST',
                body: JSON.stringify(config)
            })
                .then(response => response.json())
                .then(data => {
                    alertHandlerInstance.showAlertMessage({
                        message: data.message,
                        type: data.error ? 'danger' : 'success'
                    });
                })
                .catch(error => {
                    alertHandlerInstance.showAlertMessage({
                        message: error.message,
                        type: 'danger'
                    });
                });
        }
    };

    /**
     * Initiates PayPal Pay later messaging configurator to the page
     */
    const initConfigurator = () => {
        configuratorEl = doc.querySelector('.js-msg-configurator');

        const attributeData = configuratorEl?.getAttribute('data-properties');
        const properties = attributeData && JSON.parse(attributeData);

        if (properties && window.merchantConfigurators) {
            window.merchantConfigurators.Messaging(Object.assign(properties, { onSave: onSave }));
        }
    };

    doc.addEventListener('DOMContentLoaded', initConfigurator);
})(document);
