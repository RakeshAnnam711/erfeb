'use strict';

var velocity = require('dw/template/Velocity');
var UUIDUtils = require('dw/util/UUIDUtils');
var gtmHelpers = require('*/cartridge/scripts/gtm/gtmHelpers');

function registerRoute(route) {
    var onCompleteListeners = route.listeners('route:Complete');
    // deregister existing Complete listeners
    route.off('route:Complete');

    // ensuring our listener executes first
    route.on('route:Complete', function onRouteCompleteHandler(req, res) {
        var isJson = false;
        if (res.renderings.length) {
            for (var i = res.renderings.length - 1; i >= 0; i--) {
                if (res.renderings[i].type === 'render' && res.renderings[i].subType === 'json') {
                    isJson = true;
                    break;
                }
            }
        }

        if (isJson) {
            res.viewData.__gtmEvents = [];

            if (gtmHelpers.isEnabled) {
                var dataLayerEvent = gtmHelpers.getDataLayer(res.viewData);

                if (dataLayerEvent) {
                    if (Array.isArray(dataLayerEvent)) {
                        res.viewData.__gtmEvents = res.viewData.__gtmEvents.concat(dataLayerEvent);
                    } else {
                        res.viewData.__gtmEvents.push(dataLayerEvent);
                        }
                }
            }
        }
    });

    // re-register Complete listeners
    onCompleteListeners.forEach(function(listener){
        route.on('route:Complete', listener);
    });
}

/**
 * Inject GTM JSON attributes against product DOM element
 * @param {Object} pdict - The current pdict
 * @returns {String} attributes string for product DOM element
 */
function productTile(pdict) {
    if (pdict && pdict.product && !empty(pdict.product.gtmData)) {
        var obj = {
            'uuid': [pdict.product.id,UUIDUtils.createUUID()].join('-'),
            'gtmData': JSON.stringify(pdict.product.gtmData)
        };
        velocity.render('<script id=\"$uuid\"> var gtmDataFn = (uid, gtm, g4gtm) => { var p = document.getElementById(uid)?.parentNode; p.dataset.gtmdata = JSON.stringify(gtm); }; gtmDataFn(\'$uuid\', $gtmData); </script>',obj);
    }
}

// Ensure gtm is enabled before registering hooks
if (gtmHelpers.isEnabled) {
    module.exports = {
        registerRoute: registerRoute,
        productTile: productTile
    }
} else {
    module.exports = {
        registerRoute: function () {},
        productTile: function () {}
    }
}
