'use strict';

var footer = require('core/components/footer');
var footerBackToTop = footer.backToTop;

footer.methods = footer.methods || {};
/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 * @param {Object} button - button that was clicked for email sign-up
 */
footer.methods.displayMessage = function (success, msg) {
    var status = success ? 'alert-success' : 'alert-danger';

    var messageInline = document.querySelector('.email-signup-message-inline');
    if (!messageInline) {
        var form = document.querySelector('footer .email-signup-form form');
        if (form) {
            messageInline = document.createElement('div');
            messageInline.className = 'email-signup-message-inline';
            form.appendChild(messageInline);
        }
    } else {
        messageInline.innerHTML = '';
    }

    if (messageInline) {
        var alertDiv = document.createElement('div');
        alertDiv.className = `email-signup-alert alert ${status}`;
        alertDiv.textContent = msg;
        messageInline.appendChild(alertDiv);
    }
};

footer.methods.showBackToPlpButton = function () {
    var backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        if (window.scrollY > 100) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    }
};

footer.backToTop = function () {
    footerBackToTop.apply(this, arguments);

    footer.methods.showBackToPlpButton();

    window.addEventListener('scroll', function () {
        footer.methods.showBackToPlpButton();
    });
};

module.exports = footer;
