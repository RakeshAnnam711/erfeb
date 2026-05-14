'use strict';

var page = module.superModule;

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Vertex = require('*/cartridge/scripts/vertex');

server.extend(page);

/**
 * Handle Ajax shipping form submit
 */
server.append(
    'SubmitShipping',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var viewData = res.getViewData();

        if (viewData.error) {
            res.json(viewData);
            return next();
        }

        var currentBasket = BasketMgr.getCurrentBasket();
        var form = server.forms.getForm('shipping');
        var resultVertex = Vertex.LookupTaxAreas(form, currentBasket);

        if (!resultVertex) {
            res.json({
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
