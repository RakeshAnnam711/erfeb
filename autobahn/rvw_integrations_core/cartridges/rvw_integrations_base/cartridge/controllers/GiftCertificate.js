'use strict';

var server = require('server');
server.extend(module.superModule);

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * GiftCertificate-ActivateGiftCertificate should be used with a server.prepend to add request authentication
 * @name GiftCertificate-ActivateGiftCertificate
 * @memberof GiftCertificate
 * @param {res.viewData.authenticated} needed
 * @function server.prepend to add request authentication for viewData.authenticated
 * @function server.append to append/hook methods to extend or overwrite activation
 * @function server.replace to restructure
 * May want to move this controller to AB_core if our implementation goal changes and we do not expect to allow any future integration to override this endpoint
*/
server.post('ActivateGiftCertificate', server.middleware.https, consentTracking.consent, function(req, res, next) {
    var viewData = res.getViewData();

    //use a prepend to authenticate the system sending this request.
    if (!viewData.authenticated) {
        next();
    }

    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

    var status = false;

    if (!Site.current.getCustomPreferenceValue('giftCertificateEnabled')) {
        res.json({
            success: status,
            msg: Resource.msg('giftcertificate.disabled', 'giftCertificate', null)
        });
        next();
    }

    const reqDataObj = JSON.parse(req.form.data);

    if (reqDataObj.orderID && reqDataObj.giftCertificateID) {

        var OrderMgr = require('dw/order/OrderMgr');
        var order = OrderMgr.getOrder(viewData.orderID);

        if (order) {
            var giftCertificates = order.getGiftCertificateLineItems();

            giftCertificates.toArray().forEach(function(dwLineItem) {
                if (dwLineItem.giftCertificateID === reqDataObj.giftCertificateID) {
                    var HookMgr = require('dw/system/HookMgr');

                    if (HookMgr.hasHook('app.activate.giftCertificate')) {
                        status = HookMgr.callHook('app.activate.giftCertificate', 'activateGiftCertificate', dwLineItem);

                        res.json({
                            success: status
                        });
                    } else {
                        res.json({
                            success: status,
                            msg: Resource.msg('giftcertificate.hook.missing', 'giftCertificate', null)
                        });
                    }
                }
            })
        }
    }


    next();
});

module.exports = server.exports();
