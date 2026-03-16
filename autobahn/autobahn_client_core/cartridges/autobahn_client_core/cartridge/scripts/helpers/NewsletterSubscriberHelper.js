'use strict';

var Logger = require('dw/system/Logger');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');

function validateEmail(email) {
    var regex = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    return regex.test(email);
}

function signUp(email) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');

    Transaction.wrap(function () {
        var newsletterSubscriber = CustomObjectMgr.createCustomObject("NewsletterSubscriber", email);
    });
}

function postEmailToSFMC(email) {
    var SFMCAPIHelper = require('*/cartridge/scripts/services/SFMCAPIService');
    var accessToken = SFMCAPIHelper.fetchAccessToken();
    if (accessToken) {
        // Use the access token for subsequent API calls
        dw.system.Logger.info('Access token: ' + accessToken);
        var eventData = {
            ContactKey: email,
            EventDefinitionKey: SFMCAPIHelper.getEventDefinitionKey(),
            Data: {
                Email_Address: email
            }
        };
        // Trigger the interaction event
        var response = SFMCAPIHelper.triggerInteractionEvent(accessToken, eventData);

        if (response) {
            if (response.eventInstanceId) {
                Logger.info('Interaction event triggered successfully. Event Instance ID: ' + response.eventInstanceId);
            } else {
                Logger.error('Interaction event response received but no eventInstanceId found: ' + JSON.stringify(response));
            }
            return response;
        } else {
            Logger.error('Failed to trigger interaction event.');
        }
    } else {
        Logger.error('Failed to retrieve access token.');
    }
}

module.exports = {
    signUp: signUp,
    validateEmail: validateEmail,
    postEmailToSFMC: postEmailToSFMC
};
