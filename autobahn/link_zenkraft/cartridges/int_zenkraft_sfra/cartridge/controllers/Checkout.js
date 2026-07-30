// Checkout.js

'use strict';

var server = require('server');
var checkout = module.superModule;
server.extend(checkout);

// Extend UpdateShippingMethodsList route to include Estimated Delivery Dates in viewData
server.append('Begin', function estimatedDeliveryDates(req, res, next) {
    var Site = require('dw/system/Site');

    if (Site.getCurrent().getCustomPreferenceValue('enableZenkraftEstimatedDeliveryDates')) {
        /* eslint-disable */
        var zenkraft = require('*/cartridge/scripts/zenkraft');
        var zenkraftHelper = require('~/cartridge/scripts/helpers/zenkraftHelper');
        var _viewData = res.getViewData();
        var _address = _viewData.order.shipping[0].shippingAddress;
        var _methods = _viewData.order.shipping[0].applicableShippingMethods;
        var _items = _viewData.order.items;
        var _dates = [];
        var _methwithdates = [];
        /* eslint-enable */

        _dates = zenkraft.getShippingData(_address, _items, _methods);

    // if we get dates back
    // eslint-disable-next-line no-undef
        if (!empty(_dates)) {
            _methods.forEach(function updateMethods(method) {
                /* eslint-disable */
                var key = method.shippingMethodAccountID ? 'id_' + method.shippingMethodAccountID : false;
                if (key && _dates[key].rates) {
                    var thismethod = zenkraftHelper.filterShippingMethodsForEstimatedDate(method, _dates[key].rates);
                    var dopulocations;

                    if (thismethod.dropOffMethod) {
                        dopulocations = zenkraft.getDropOffLocations(_address);
                        if (dopulocations.length > 0) {
                            thismethod.displayName = dopulocations.locations[0].company_name;
                            thismethod.dropOffLocations = dopulocations.locations;
                        }
                    }
                    /* eslint-enable */
                    _methwithdates.push(thismethod);
                }
            });

            _viewData.order.shipping[0].applicableShippingMethods = _methwithdates;
        } else {
            // WGACA CUSTOMIZATION
            // Remove shipping methods with no price
            var methodsArray = [];

            _methods.forEach(function (method) {
                if (method.shippingCost !== 'N/A') {
                    methodsArray.push(method);
                }
            })

            _viewData.order.shipping[0].applicableShippingMethods = methodsArray;

        res.setViewData(_viewData);
        }
    }
    next();
});

module.exports = server.exports();
