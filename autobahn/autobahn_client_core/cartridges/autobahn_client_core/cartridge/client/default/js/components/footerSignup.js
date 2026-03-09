'use strict';

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('submit-email-btn').addEventListener('click', handleMailSubmit);

    function displayMessage(data) {
        // Stop spinner
        const spinner = document.querySelector('.spinner');
        if (spinner) {
            spinner.classList.add('d-none');
        }

        const status = data.success ? 'alert-success' : 'alert-danger';
        let messageContainer = document.querySelector('.add-to-wishlist-messages');

        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.classList.add('add-to-wishlist-messages');
            document.body.appendChild(messageContainer);
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert text-center add-to-wishlist-alert ${status}`;
        alertDiv.textContent = data.msg; // Safely sets the text content, escaping any HTML
        messageContainer.appendChild(alertDiv);

        setTimeout(() => {
            messageContainer.remove();
        }, 5000);
    }

    function getInputMail() {
        const mailInputElement = document.getElementById('wgaca-updates-sign-up-mail');
        const mailInput = mailInputElement.value.trim(); // Fetching user input
        const subscriptionStatus = document.getElementById('subscription-status');

        subscriptionStatus.style.color = "#C61B1B";
        mailInputElement.style.borderColor = "#C61B1B";

        if (mailInput) {
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;  // Validate email format with basic email regex
            if (!emailPattern.test(mailInput)) {
                subscriptionStatus.innerText = window.signupMessages.enterValidEmail;
            } else {
                return mailInput;
            }
        } else {
            subscriptionStatus.innerText = window.signupMessages.enterEmailSubmit;
        }
        mailInputElement.focus();
        return;
    }

    async function handleMailSubmit() {
        const inputMail = getInputMail();   // Taking user email
        if (inputMail) {
            const form = new FormData();
            form.set("emailId", inputMail);

            try {
                const response = await fetch(window.signupUrls.subscribeUrl, {
                    method: 'POST',
                    body: form
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${('msg' in response) ? response.msg : ''}`);
                }

                const data = await response.json();
                displayMessage(data);
                if (data.success) {
                    if (Array.isArray(data.__gtmEvents)) {
                        window.dataLayer = window.dataLayer || [];
                        data.__gtmEvents.forEach(event => {
                            window.dataLayer.push(event);
                        });
                    }
                    try {
                        sessionStorage.setItem('subscribedEmail', inputMail);
                    } catch (err) {
                        console.warn('Could not save to sessionStorage:', err);
                    }
                    document.getElementById('subscription-status').innerText = '';
                    document.getElementById('wgaca-updates-sign-up-mail').value = '';
                    document.getElementById('wgaca-updates-sign-up-mail').style.borderColor = "initial";
                }
            } catch (error) {
                displayMessage({ msg: window.signupMessages.unexpectedError, success: false });
            }
        }
    }

    async function sendEmailToSFMC(email) {
        const form = new FormData();
        form.set("emailId", email);
        try {
            const response = await fetch(window.signupUrls.subscribeUrl, {
                method: 'POST',
                body: form
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${('msg' in response) ? response.msg : ''}`);
            }

            await response.json();
        } catch (error) {
            console.error("Error during mail submission:", error);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const mailInputElement = document.getElementById('wgaca-updates-sign-up-mail');
        mailInputElement.addEventListener('blur', () => {
            document.getElementById('subscription-status').innerText = '';
            mailInputElement.style.borderColor = "initial";
        });

        const footerLinks = document.getElementById('footercontent').querySelectorAll('a');
        footerLinks.forEach(link => {
            link.addEventListener('click', () => {
                sessionStorage.setItem('activeNavLink', '');
            });
        });
    });
});

document.addEventListener("wunderkindSubscribeEmail", function (event) {
    if (event.detail && event.detail.email) {
        const email = event.detail.email;
        sendEmailToSFMC(email);
    }
});