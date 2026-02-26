'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Vertex = require('*/cartridge/scripts/vertex');

server.append(
    'AddNewAddress',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var viewData = res.getViewData();

        if (viewData.error) {
            res.json(viewData);
            return next();
        }

        var shipmentUUID = req.form.shipmentSelector || req.form.shipmentUUID;
        var currentBasket = BasketMgr.getCurrentBasket();
        var form = server.forms.getForm('shipping');
        var resultVertex = Vertex.LookupTaxAreas(form, currentBasket, shipmentUUID);

        if (!resultVertex) {
            res.json({
                error                    : true,
                form                     : form,
                vertexError              : true,
                vertexAddressSuggestions : session.privacy.VertexAddressSuggestions ? JSON.parse(session.privacy.VertexAddressSuggestions) : null
            });
        } else {
            res.setViewData(viewData);
        }

        return next();
    }
);

module.exports = server.exports();
