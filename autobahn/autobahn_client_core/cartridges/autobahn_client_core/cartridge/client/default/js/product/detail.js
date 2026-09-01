'use strict';

var coreProductDetail = require('core/product/detail');

coreProductDetail.accessibility = function() {
    $('.st-custom-button').keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $(this).trigger('click');
        }
    });
}

// document.addEventListener('DOMContentLoaded', function() {
//     loadLoginScreen();
// });

$(document).ready(function(){

    if($('#btnMakeOffer').length > 0){
        $.get($('#pdpGetUserForProductOffer').val(), { product_id: $('#btnMakeOffer').attr('data-pid') }, function (res) {
            if (res.success) {
                //set make an offer button
                $('#btnMakeOffer').attr('data-target', '#submitOfferModal');
                $('#btnMakeOffer').attr('aria-label', 'Make an offer');
                $('#btnMakeOffer').text('Make an offer');
                if(!res.enableOffer){
                    $('#btnMakeOffer').attr('disabled', 'disabled');
                }
                else{
                    $('#btnMakeOffer').removeAttr('disabled');
                }

                // user is logged in and make an offer model is visible
                $('#offerForm #firstname').val(res.firstName);
                $('#offerForm #lastname').val(res.lastName);
                $('#offerForm #phoneNumber').val(res.phone);
                $('#offerForm #phoneNumber').attr('oldPhoneNumber', res.phone);
                // if(!userInfo.phone || userInfo.phone === ''){
                //     $('#offerForm #phoneNumber').removeAttr('readonly');
                // }
                $('#offerForm #email').val(res.email);
                $('#offerForm .currency-symbol').text($('#pdpCurrencySymbol').val());
            } else {
                //set make an offer button
                $('#btnMakeOffer').attr('data-target', '#signInRegisterModal');
                $('#btnMakeOffer').attr('aria-label', 'Login/Register to Make an Offer');
                $('#btnMakeOffer').text('Login/Register to Make an Offer');

                //if user is not logged in and offer button visible on page,
                //then load login page in model popup to reuse functionality
                loadLoginScreen();
            }
        });
    }

    window.addEventListener('message', function(event) {
        if (!event.data)
            return;

        if(event.data.action == 'CustomerOfferSent'){
            sendCustomerOffer();
            if (event.data.phoneNumber != '') {
                UpdateUserProfile(event.data);
            }
        }
    });
});

function UpdateUserProfile(eventData){
    $.ajax({
        url: $('#pdpUpdateUserFromMakeAnOffer').val(),
        method: 'POST',
        data: {
            phoneNumber: eventData.phoneNumber,
        }
    });
}

function sendCustomerOffer() {
    fetch($('#pdpSubmitCustomerOffer').val() + '?productID=' + $('#btnMakeOffer').data('pid'))
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            $('#btnMakeOffer').attr('disabled', 'disabled');
        }
        //console.log(data.message);
    });
}

function loadStyleInIframe(iframeDoc){
    const pdpLoginStyle = document.createElement('style');
        pdpLoginStyle.textContent = `
            #requestPasswordResetModal .modal-dialog {
                margin: 0;
            }
            #requestPasswordResetModal .modal-dialog .modal-content {
                box-shadow: none;
                border: 0;
            }
            #requestPasswordResetModal .modal-dialog .modal-content .modal-body {
                padding: 20px 0;
            }

            #requestPasswordResetModal .modal-header {
                background-color: transparent;
                padding: 0;
                justify-content: center;
            }
            #requestPasswordResetModal .modal-header .close,
            #loginContent .grecaptcha-badge {
                display: none;
            }
        `;
    iframeDoc.head.appendChild(pdpLoginStyle);
}

function loadScriptInIframe(iframeDoc){
    const pdpLoginScript = document.createElement('script');
    pdpLoginScript.textContent = `
        function sendIframeDimensions() {
            const mainContent = document.getElementById('maincontent');
            if (!mainContent) return;

            const height = mainContent.offsetHeight;
            const width = mainContent.offsetWidth;

            parent.postMessage(
                {
                    action: 'setIframeDimensions',
                    height: height,
                    width: width
                }, '*'
            );
        }

        // Run on load
        //document.addEventListener('load', sendIframeDimensions);

        // Run on resize
        //document.addEventListener('resize', sendIframeDimensions);

        // Run periodically (in case resize events don’t catch everything)
        setInterval(sendIframeDimensions, 500); // Optional fallback
    `;
    iframeDoc.head.appendChild(pdpLoginScript);
}

function loadLoginScreen() {
    $('#loginContent').spinner().start();
    //const currentURL = window.location.pathname + window.location.search;
    var loginUrl = $('#pdpLogInUrl').val() + '?isLoginFromPDP=true';
    $('#loginIframe').attr('src', loginUrl);

    $('#loginIframe').on('load', function() {
        var iframe = this;
        var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc = $(iframeDoc);

        loadStyleInIframe(iframeDoc[0]);
        loadScriptInIframe(iframeDoc[0]);

        // remove unwanted tags from iframe
        // modifying some tags for PDP popup screen view
        iframeDoc.find('.grecaptcha-badge').addClass('d-none');    // remove recaptcha content
        iframeDoc.find('#onetrust-consent-sdk').addClass('d-none');
        iframeDoc.find('#globalePopupWrapper').addClass('d-none');
        iframeDoc.find('#globale_overlay').addClass('d-none');

        iframeDoc.find('header.fixed-header').addClass('d-none');    // remove header content
        iframeDoc.find('footer').addClass('d-none'); // remove footer content
        iframeDoc.find('.login-page .breadcrumb-wrapper').addClass('d-none'); // remove breadcrumb content
        iframeDoc.find('.login-page .page-title').addClass('d-none');    // remove page title content

        iframeDoc.find('.login-page .justify-content-center .col-md-6').removeClass('col-md-6').addClass('col-md-12'); // adjust content view
        iframeDoc.find('.login-page .page, #signInRegisterModal .page').css({'margin-top':''});  // remove top of login page
        iframeDoc.find('.login-page #requestPasswordResetModal').removeClass('modal').removeClass('fade').addClass('d-none'); // disable model popup functionality for requestPasswordResetModal
        iframeDoc.find('.login-page .send-email-btn').append('<a href="#" class="btn btn-block btn btn-secondary mt-3" id="backToLogin" aria-label="B\ack to Login">Back to Login</a>'); // add back to login link
        iframeDoc.find('#consent-tracking').remove(); // remove cache consent tracking

        // keeping only one link for password reset, removing other screen
        iframeDoc.find('.login-page .login .forgot-password a#password-reset').removeAttr('data-target');
        iframeDoc.find('body').css('overflow-y', 'hidden');

        var checkHelpButtonInterval = setInterval(function () {
            var helpButton = iframeDoc.find('.embeddedServiceHelpButton');
            if (helpButton.length > 0) {
                helpButton.addClass('d-none');
                clearInterval(checkHelpButtonInterval); // Stop checking once found
            }
        }, 100); // Retry every 100ms

        //forgot password click in login screen
        iframeDoc.find('.login-page form.login .forgot-password a#password-reset').click(function (e) {
            e.preventDefault();
            iframeDoc.find('.login-page .login').addClass('d-none'); // hide login screen
            iframeDoc.find('.login-page #requestPasswordResetModal').removeClass('d-none') // display forget password screen
            iframeDoc.find('.login-page .login-nav-tabs').addClass('d-none') // hide tabs
        });

        // back to login functionality, load login screen again
        iframeDoc.find('.login-page .send-email-btn a#backToLogin').click(function (e) {
            // if reset password done successfully, reload screen
            if(iframeDoc.find('#submitEmailButton').hasClass('d-none')){
                // show loader till iframe load
                $('#loginContent').spinner().start();
                iframeDoc[0].location.reload(true);
                return;
            }

            // if reset password not done and clicked on back to login link
            // load login screen again
            iframeDoc.find('.login-page .login').removeClass('d-none'); // hide login screen
            iframeDoc.find('.login-page #requestPasswordResetModal').addClass('d-none')  // display forget password screen
            iframeDoc.find('.login-page .login-nav-tabs').removeClass('d-none')  // hide tabs
        });

        // hide loader after iframe loaded
        $('#loginContent').spinner().stop();
    });

    window.addEventListener('message', function(event) {
        if(!event.data)
            return;

        if (event.data.action && event.data.action === 'userLoggedInFromPDP') {
            location.reload();
        }

        if (event.data.action && event.data.action === 'setIframeDimensions') {
            const iframe = document.getElementById('loginIframe');
            if (event.data.height) {
                iframe.style.height = event.data.height + 'px';
            }
            // if (event.data.width) {
            //     iframe.style.width = event.data.width + 'px'; // Optional
            // }
        }
    });

}

module.exports = coreProductDetail;
