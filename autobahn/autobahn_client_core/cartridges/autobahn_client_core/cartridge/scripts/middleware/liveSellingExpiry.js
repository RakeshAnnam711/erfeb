'use strict';

/**
 * Expiry guard for live selling (CSC handoff) baskets.
 *
 * Pick the export that matches what the route responds with - a route that redirects when it
 * meant to answer with JSON breaks its client handler, because a pending redirect discards
 * every queued rendering:
 */

var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var liveSellingHelpers = require('*/cartridge/scripts/helpers/liveSellingHelpers');

/**
 * Empties the current basket when its live selling handoff window has passed.
 *
 * Baskets that were never handed off by a live selling agent carry no cscHandoffExpiration
 * stamp and are left untouched. Failures are logged rather than thrown - this runs on the
 * storefront's busiest routes, so a broken clear must never break the response.
 *
 * Exported so a route that needs to answer in its own shape can reuse the check.
 *
 * @returns {boolean} true if the basket was expired and has been cleared
 */
function clearIfExpired() {
    var basket = BasketMgr.getCurrentBasket();
    var expiration;

    try {
        expiration = basket && basket.custom.cscHandoffExpiration;
        session.custom.liveSelling = !!(basket && basket.custom.isLiveSellingOrder);
    } catch (e) {
        return false;
    }

    if (!expiration || expiration.getTime() > Date.now()) {
        return false;
    }

    try {
        liveSellingHelpers.clearBasket(basket);
    } catch (e) {
        Logger.error('liveSellingExpiry: unable to clear the expired basket: {0}', e.message);
        return false;
    }

    return true;
}

/**
 * Middleware for full page routes: clears an expired live selling basket, then sends the
 * shopper to the cart page where the expiry message is rendered.
 *
 * The redirect terminates after one hop, including on Cart-Show itself: clearing the basket
 * nulls cscHandoffExpiration, so the redirected request finds nothing to expire and only
 * picks the message up from the querystring.
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateBasketExpiry(req, res, next) {
    if (clearIfExpired()) {
        res.redirect(URLUtils.url('Cart-Show', 'liveSellingExpired', 'true'));
    } else if (req.querystring.liveSellingExpired) {
        res.setViewData({ liveSellingExpired: true });
    }

    next();
}

/**
 * Middleware for routes answering with JSON or a rendered fragment: clears an expired live
 * selling basket and lets the route respond as usual, off the now empty basket.
 *
 * No redirect is issued, since a pending one would replace the route's own response. The
 * flag is merged into the view data instead, so it reaches JSON payloads and fragment
 * templates alike and client code can react to it.
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function clearExpiredBasket(req, res, next) {
    if (clearIfExpired()) {
        res.setViewData({ liveSellingExpired: true });
    }

    next();
}

module.exports = {
    clearIfExpired: clearIfExpired,
    validateBasketExpiry: validateBasketExpiry,
    clearExpiredBasket: clearExpiredBasket
};
