'use strict';

const helper = require('./helpers/helper');

const loginForm = document.querySelector('form.login');
const errorMessageBlock = document.querySelector('.error');

/**
 * Creates a html element with the error message
 * @param  {string} message error
 */
function createErrorNotification(message) {
    errorMessageBlock.classList.remove('d-none');

    const errorMessage = errorMessageBlock.querySelector('.error-message');

    errorMessage.innerHTML = message;

    setTimeout(() => {
        errorMessageBlock.querySelector('.close').addEventListener('click', function() {
            errorMessageBlock.classList.add('d-none');
        });
    });
}

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const url = loginForm.getAttribute('action');

    loginForm.dispatchEvent(new CustomEvent('login:submit', { detail: e }));

    fetch(helper.getUrlWithCsrfToken(url), {
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(new FormData(loginForm))
    }).then(function(response) {
        return response.json();
    }).then(function(data) {
        if (data.error) {
            createErrorNotification(data.error);
        } else {
            window.location.href = data.redirectUrl;
        }
    }).catch(function(error) {
        createErrorNotification(error);
    });
});

document.querySelector('.cancel-btn').addEventListener('click', function(e) {
    e.preventDefault();

    const url = loginForm.getAttribute('action');

    fetch(helper.getUrlWithCsrfToken([url, 'isCancel=true'].join('&')), {
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(function(response) {
        return response.json();
    }).then(function(data) {
        window.location.href = data.redirectUrl;
    }).catch(function(error) {
        createErrorNotification(error);
    });
});
