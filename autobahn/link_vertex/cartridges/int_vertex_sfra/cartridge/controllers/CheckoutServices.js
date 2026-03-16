'use strict';

var page = module.superModule;

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Vertex = require('*/cartridge/scripts/vertex');

server.extend(page);

/**
 *  Handle Ajax payment (and billing) form submit
 */
server.append(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var viewData = res.getViewData();

        delete session.privacy.VertexAddressSuggestions;
        delete session.privacy.VertexAddressSuggestionsError;

        res.setViewData(viewData);
        return next();
    }
);

server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var viewData = res.getViewData();

    if(viewData.error) {
        res.json(viewData);
        return next();
    }

    var order = OrderMgr.getOrder(viewData.orderID, viewData.orderToken);
    if (order) {
        Vertex.CalculateTax('Invoice', order);
    }

    res.json(viewData);
    return next();
});


module.exports = server.exports();
