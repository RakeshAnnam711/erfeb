'use strict';

/**
 * Controller : VertexEndpoint
 *
 * @module controllers/Vertex
 */
var server = require('server');

server.post('DeleteRequest', function (req, res, next) {
    var requestData;
    var Vertex;
    var vertexResult;
    var reply = {
        error   : true,
        message : ''
    };
    var DeleteHelper = require('*/cartridge/scripts/helper/deleteRequest');

    requestData = DeleteHelper.validateRequestParameters();

    if (requestData.ok) {
        Vertex = require('*/cartridge/scripts/vertex');
        vertexResult = Vertex.DeleteTransaction(requestData.transaction, requestData.source);

        if (vertexResult) {
            reply.message = 'Success. DeleteTransaction sent for processing. Transaction: ' + requestData.transaction + ', Source: ' + requestData.source;
            reply.error = false;
        } else {
            reply.message = 'Internal error, DeleteTransaction call failed. Transaction: ' + requestData.transaction + ', Source: ' + requestData.source;
            response.setStatus(500);
        }
    } else {
        response.setStatus(requestData.httpStatus);
        reply.message = requestData.message;
    }

    res.json(reply);
    return next();
});

server.post('SelectVertexAddress', function (req, res, next) {
    if (!empty(req.form.clear)) {
        delete session.privacy.VertexAddressSelected;
        delete session.privacy.VertexAddressSuggestions;
        delete session.privacy.VertexAddressSuggestionsError;
    } else {
        session.privacy.VertexAddressSelected = true;
    }

    res.json({
        ok: true
    });
    return next();
});

/** Send Transaction Delete Request to Vertex service
 * @see module:controllers/Vertex~deleteRequest */

module.exports = server.exports();
