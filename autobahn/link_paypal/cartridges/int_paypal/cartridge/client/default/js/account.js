const loaderInstance = require('./components/loader');
const AlertHandlerModel = require('./models/alertHandler');
const CreditCardAccountModel = require('./models/creditCard/creditCardAccount');
const helper = require('./helpers/helper');
const PayPalAccountModel = require('./models/buttons/paypalAccount');
const loaderContainerEl = document.querySelector('.paypalLoader');
const loader = loaderInstance(loaderContainerEl);

const paypalAccountBtnEl = document.querySelector('.paypal-account-button');
const addNewAccountBtnEl = document.querySelector('.add-paypal-account');
const submitCwppUnlinkBtnEl = document.querySelector('.js-unlink-submit');
const unlinkSectionEl = document.querySelector('.js-unlink-section');
const paypalBlockEl = document.querySelector('.paypal-block');

if (addNewAccountBtnEl && paypalAccountBtnEl) {
    const payPalAccountInstance = new PayPalAccountModel('.paypal-account-button');

    payPalAccountInstance.limitMsgHandler();

    addNewAccountBtnEl.addEventListener('click', function() {
        this.classList.add('d-none');

        if (window.paypal && paypalAccountBtnEl.innerHTML === '') {
            payPalAccountInstance.initPayPalButton();
        }
    });
}

if (paypalBlockEl) {
    paypalBlockEl.onclick = function(e) {
        const alertHandler = new AlertHandlerModel();
        const target = e.target;
        const payPalAccountModel = new PayPalAccountModel();

        if (target.classList.contains('remove-paypal-button')) {
            const paypalEmail = target.dataset.paypalEmail;

            loader.show();

            return $.ajax({
                url: helper.getUrlWithCsrfToken(window.paypalUrls.deletePaypalAccount + `?paypalEmail=${paypalEmail}`),
                type: 'DELETE'
            })
                .then((data) => {
                    if (data.error) {
                        alertHandler.showError(data.message);
                    } else {
                        payPalAccountModel.getPayPalAccountsList(window.paypalUrls.renderPayPalAccountsUrl);
                        alertHandler.showInfo(data.alertMessage);
                        loader.hide();
                    }
                })
                .fail(() => {
                    loader.hide();
                });
        }

        return false;
    };
}

if (submitCwppUnlinkBtnEl && unlinkSectionEl) {
    submitCwppUnlinkBtnEl.addEventListener('click', () => {
        const alertHandler = new AlertHandlerModel();

        fetch(helper.getUrlWithCsrfToken(window.paypalUrls.unlinkCwppUrl), {
            method: 'POST'
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.errorMessage) {
                    alertHandler.showError(res.errorMessage);
                } else {
                    unlinkSectionEl.classList.add('d-none');

                    alertHandler.showInfo(res.alertMessage);
                }
            })
            .catch(() => {
                window.location.reload();
            });
    });
}

const isAccountPage = Boolean(document.querySelector('.js-account-dashboard'));

if (isAccountPage) {
    const CreditCardAccount = new CreditCardAccountModel();

    CreditCardAccount.initEvents();
}
