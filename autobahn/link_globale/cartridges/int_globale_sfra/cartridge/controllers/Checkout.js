'use strict';

var page = module.superModule;
var server = require('server');
server.extend(page);

server.prepend(
    'Begin',
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var globaleSession = require('*/cartridge/models/globale/session');
        var globaleRequest = require('*/cartridge/models/globale/request');
        var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

        if (!currentBasket || !currentBasket.allProductLineItems.length || !currentBasket.merchandizeTotalPrice.available) {
            res.redirect(URLUtils.url('Cart-Show'));
            this.done(req, res);
            return;
        }

        if (hooksHelper('app.validate.basket', 'validateBasket', currentBasket, false, require('*/cartridge/scripts/hooks/validateBasket').validateBasket).error) {
            res.redirect(URLUtils.url('Cart-Show'));
            // eslint-disable-next-line consistent-return
            return next();
        }

        // check if "dwsid" exists, otherwise redirect to the same URL (just once)
        if (globaleRequest.getDwSidValue() === null && !globaleSession.getPrivacy('geCheckoutRedirected')) {
            globaleSession.setPrivacy('geCheckoutRedirected', true);
            res.setRedirectStatus(301);
            res.redirect(globaleRequest.getRequestUrl());
        }

        if (globaleSession.get('geOperatedCountry')) {
            res.render('components/globale/remoteinclude', {
                remoteIncludeUrl: URLUtils.url('Globale-CheckoutShow').toString()
            });
            this.done(req, res);
            return;
        }
        next();
    }
);

module.exports = server.exports();
