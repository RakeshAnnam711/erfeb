'use strict';

const api = require('./helpers/api');
const helper = require('./helpers/helper');

const apmaButtonPaypalEl = document.querySelector('.js-apma-button-paypal');
const redirectUrl = apmaButtonPaypalEl.getAttribute('data-redirect-url');
const isAccountPage = redirectUrl.toLowerCase().includes('account');
const addressObject = helper.tryParseJSON(apmaButtonPaypalEl.getAttribute('data-address-object'));
const addingStage = apmaButtonPaypalEl.getAttribute('data-adding-stage');

const createVaultSetupToken = async() => {
    const result = await api.createSetupToken();

    return result.setupToken;
};

const onApprove = async() => {
    await api.addPaypalAccount({ isAPMA: true });

    if (addingStage === window.paypalConstants.APMA_STAGE_COMPLETE) {
        await api.savePaypalDefaultAddress(addressObject, isAccountPage);
    }

    window.location.href = redirectUrl;
};

if (apmaButtonPaypalEl && window.paypal) {
    if (addingStage === window.paypalConstants.APMA_STAGE_ADDRESS) {
        apmaButtonPaypalEl.classList.add('none');

        document.querySelector('.js-apma-button-yes').addEventListener('click', () => {
            api.savePaypalDefaultAddress(addressObject, isAccountPage).then(() => {
                window.location.href = redirectUrl;
            });
        });
    } else {
        window.paypal.Buttons({
            createVaultSetupToken: createVaultSetupToken,
            onApprove: onApprove
        }).render(apmaButtonPaypalEl);
    }
}
