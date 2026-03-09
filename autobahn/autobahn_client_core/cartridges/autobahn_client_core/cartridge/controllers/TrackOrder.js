'use strict';

/**
 * @namespace TrackOrder
 */

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * TrackOrder-Show : This endpoint is called to load the TrackOrder page
 * @name Base/TrackOrder-Show
 * @function
 */
server.get(
    'Show',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var Resource = require('dw/web/Resource');

        try {
            var breadcrumbs = [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                }
            ];

            var profileForm = server.forms.getForm('profile');
            profileForm.clear();

            // Push querystring values into pdict for automatic form submission
            if (!empty(req.querystring.email) || !empty(req.querystring.postal) || !empty(req.querystring.number)) {
                res.setViewData(Object.assign({autosubmit: true}, req.querystring));
            }

            res.render('/account/trackOrder', {
                breadcrumbs: breadcrumbs
            });
        } catch(err) {
            res.json({
                error: true,
                msg: Resource.msg('message.error.page.load', 'error', null)
            })
        }

        next();
    }
);


module.exports = server.exports();
