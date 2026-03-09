'use strict';

var server = require('server');
var logger = require('dw/system/Logger').getLogger('RVW_SOM_Integration', 'SOM');

var somOrderHelper = require('*/cartridge/scripts/helpers/orderUpdateSOMHelper');
/*
 * Controller-Extension has been created (as a post) endpoint for SOM to submit scheduled updates.
 * Uses the orderUpdateSOMHelper to validate the connection and process the status updates based on
 * the RVW SOM Documentation.
 */
server.post('Submit', server.middleware.https, function (req, res, next) {
    // Validate request permission
    var hashRequest = req.httpHeaders.get('X-Secret') || req.httpHeaders.get('x-secret');
    var contentType = req.httpHeaders.get('Content-Type') || req.httpHeaders.get('content-type');

    // Decode Secret Helper
    if (somOrderHelper.authenticateRequest(hashRequest)) {
        let msg = 'Vendor secret does not match.';

        res.json({
            type: 'error',
            message: msg
        });
        logger.warn(msg);

        return next();
    }

    if (contentType !== 'application/json') {
        let msg = 'Wrong request/response type.';

        res.json({
            type: 'error',
            message: msg
        });
        logger.warn(msg);

        return next();
    }

    // Format request body
    var ordersJSON;
    try {
        ordersJSON = JSON.parse(req.body.replace(/<[^>]*>/gi, ''));

        if (typeof ordersJSON !== 'object') {
            throw new Error('Incorrect request body object type.');
        }

        if (ordersJSON.length < 1) {
            throw new Error('Request object array is empty.');
        }
    } catch (err) {
        let msg = 'Cannot parse request body.';

        res.json({
            type: 'error',
            message: msg
        });
        logger.warn(msg + ' ' + err);

        return next();
    }

    // Formulate Response JSON
    var orders = somOrderHelper.processOrders(ordersJSON);

    res.json({
        somResults: orders
    });

    // Send applicable updates
    somOrderHelper.triggerEmailEvents(req.locale.id);

    next();
});

module.exports = server.exports();
