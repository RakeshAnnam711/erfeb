'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var cartSummaryBuilder = require('*/cartridge/scripts/cart/cartSummaryBuilder');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

function normalizePostalCode(value) {
    return (value || '').toString().trim().split('-')[0];
}

function postalPrefixInRange(prefix, start, end) {
    return prefix >= start && prefix <= end;
}

function getStateCodeFromPostalCode(postalCode) {
    var zip = normalizePostalCode(postalCode);
    var prefix = parseInt(zip.substring(0, 3), 10);

    if (!zip || zip.length < 3 || isNaN(prefix)) {
        return null;
    }

    if (postalPrefixInRange(prefix, 350, 369)) return 'AL';
    if (postalPrefixInRange(prefix, 995, 999)) return 'AK';
    if (postalPrefixInRange(prefix, 850, 865)) return 'AZ';
    if (postalPrefixInRange(prefix, 716, 729)) return 'AR';
    if (postalPrefixInRange(prefix, 900, 961)) return 'CA';
    if (postalPrefixInRange(prefix, 800, 816)) return 'CO';
    if (postalPrefixInRange(prefix, 60, 69)) return 'CT';
    if (postalPrefixInRange(prefix, 197, 199)) return 'DE';
    if (postalPrefixInRange(prefix, 200, 205)) return 'DC';
    if (postalPrefixInRange(prefix, 320, 349)) return 'FL';
    if (postalPrefixInRange(prefix, 300, 319) || postalPrefixInRange(prefix, 398, 399)) return 'GA';
    if (postalPrefixInRange(prefix, 967, 968)) return 'HI';
    if (postalPrefixInRange(prefix, 832, 838)) return 'ID';
    if (postalPrefixInRange(prefix, 600, 629)) return 'IL';
    if (postalPrefixInRange(prefix, 460, 479)) return 'IN';
    if (postalPrefixInRange(prefix, 500, 528)) return 'IA';
    if (postalPrefixInRange(prefix, 660, 679)) return 'KS';
    if (postalPrefixInRange(prefix, 400, 427)) return 'KY';
    if (postalPrefixInRange(prefix, 700, 714)) return 'LA';
    if (postalPrefixInRange(prefix, 39, 49)) return 'ME';
    if (postalPrefixInRange(prefix, 206, 219)) return 'MD';
    if (postalPrefixInRange(prefix, 10, 27) || prefix === 55) return 'MA';
    if (postalPrefixInRange(prefix, 480, 499)) return 'MI';
    if (postalPrefixInRange(prefix, 550, 567)) return 'MN';
    if (postalPrefixInRange(prefix, 386, 397)) return 'MS';
    if (postalPrefixInRange(prefix, 630, 658)) return 'MO';
    if (postalPrefixInRange(prefix, 590, 599)) return 'MT';
    if (postalPrefixInRange(prefix, 680, 693)) return 'NE';
    if (postalPrefixInRange(prefix, 889, 898)) return 'NV';
    if (postalPrefixInRange(prefix, 30, 38)) return 'NH';
    if (postalPrefixInRange(prefix, 70, 89)) return 'NJ';
    if (postalPrefixInRange(prefix, 870, 884)) return 'NM';
    if (prefix === 5 || prefix === 63 || postalPrefixInRange(prefix, 100, 149)) return 'NY';
    if (postalPrefixInRange(prefix, 270, 289)) return 'NC';
    if (postalPrefixInRange(prefix, 580, 588)) return 'ND';
    if (postalPrefixInRange(prefix, 430, 459)) return 'OH';
    if (postalPrefixInRange(prefix, 730, 749)) return 'OK';
    if (postalPrefixInRange(prefix, 970, 979)) return 'OR';
    if (postalPrefixInRange(prefix, 150, 196)) return 'PA';
    if (postalPrefixInRange(prefix, 6, 9)) return 'PR';
    if (postalPrefixInRange(prefix, 28, 29)) return 'RI';
    if (postalPrefixInRange(prefix, 290, 299)) return 'SC';
    if (postalPrefixInRange(prefix, 570, 577)) return 'SD';
    if (postalPrefixInRange(prefix, 370, 385)) return 'TN';
    if (prefix === 733 || prefix === 885 || postalPrefixInRange(prefix, 750, 799)) return 'TX';
    if (postalPrefixInRange(prefix, 840, 847)) return 'UT';
    if (postalPrefixInRange(prefix, 50, 54) || postalPrefixInRange(prefix, 56, 59)) return 'VT';
    if (prefix === 201 || postalPrefixInRange(prefix, 220, 246)) return 'VA';
    if (postalPrefixInRange(prefix, 980, 994)) return 'WA';
    if (postalPrefixInRange(prefix, 247, 268)) return 'WV';
    if (postalPrefixInRange(prefix, 530, 549)) return 'WI';
    if (postalPrefixInRange(prefix, 820, 831)) return 'WY';

    return null;
}

function hasPostalStateMismatch(stateCode, postalCode) {
    var expectedStateCode = getStateCodeFromPostalCode(postalCode);

    return expectedStateCode && stateCode && expectedStateCode !== stateCode.toString().toUpperCase();
}

function isUSAddress(countryCode) {
    return !countryCode || countryCode.toString().toUpperCase() === 'US';
}

server.append('SelectShippingMethod', server.middleware.https, function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) {
        var currentBasket = BasketMgr.getCurrentBasket();

        if (currentBasket) {
            var totalBasePrice = cartSummaryBuilder.getTotalBasePrice(currentBasket);
            if(res.viewData.order){
                res.viewData.order.totals.totalBasePrice = totalBasePrice;
            }
        }
    });

    return next();
});

server.append('UpdateShippingMethodsList', server.middleware.https, function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) {
        var currentBasket = BasketMgr.getCurrentBasket();

        if (currentBasket) {
            var totalBasePrice = cartSummaryBuilder.getTotalBasePrice(currentBasket);
            if(res.viewData.order){
                res.viewData.order.totals.totalBasePrice = totalBasePrice;
            }
        }
    });

    return next();
});

server.prepend(
    'SubmitShipping',
    server.middleware.https,
    function (req, res, next) {
        var currentBasket = BasketMgr.getCurrentBasket();
        var form = server.forms.getForm('shipping');
        var addressFields = form.shippingAddress.addressFields;
        var countryCode = addressFields.country.value;
        var selectedStateCode = addressFields.states.stateCode.value;
        var postalCode = addressFields.postalCode.value;
        var fieldErrors;
        var postalCodeFieldName;
        var errorMessage;

        if (isUSAddress(countryCode) && hasPostalStateMismatch(selectedStateCode, postalCode)) {
            if (currentBasket) {
                req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'invalid');
            }

            errorMessage = Resource.msg('smarty.error.zipmismatch', 'checkout', null);
            postalCodeFieldName = addressFields.postalCode.htmlName
                || 'dwfrm_shipping_shippingAddress_addressFields_postalCode';
            fieldErrors = {};
            fieldErrors[postalCodeFieldName] = errorMessage;

            res.json({
                form: form,
                fieldErrors: [fieldErrors],
                serverErrors: [errorMessage],
                error: true,
                errorMessage: errorMessage,
                message: errorMessage
            });
            return;
        }

        return next();
    }
);

server.append(
    'SubmitShipping',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) {
            var currentBasket = BasketMgr.getCurrentBasket();

            if (currentBasket) {
                var totalBasePrice = cartSummaryBuilder.getTotalBasePrice(currentBasket);
                if(res.viewData.order){
                    res.viewData.order.totals.totalBasePrice = totalBasePrice;
                }
            }
        });

        return next();
    });

module.exports = server.exports();
