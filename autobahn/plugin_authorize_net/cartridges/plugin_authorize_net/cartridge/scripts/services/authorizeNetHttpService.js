'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

function cleanResponse(input) {
    var output = "";
    for (var i=0; i<input.length; i++) {
        if (input.charCodeAt(i) <= 127) {
            output += input.charAt(i);
        }
    }
    return output;
}

// Create the Service Definition for the Authorize Net authorizion service
module.exports = LocalServiceRegistry.createService("authorize.net.http.service", {
	createRequest: function (svc, args) {
        var request = JSON.stringify(args.requestBody);
        
        request = request.replace(/{apiLoginID}/, svc.configuration.credential.user);
        request = request.replace(/{transactionKey}/, svc.configuration.credential.password);
        request = request.replace(/"{lineItems}"/, args.lineItems);

        return request;
    },
    parseResponse: function (svc, response) {
        /*
        Can check if response.statusCode != 200 to send back error messages
        */
        return cleanResponse(response.text);
    }  
});