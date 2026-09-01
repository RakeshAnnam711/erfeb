'use strict';

var base = module.superModule;

/**
* Cleans up Zenkraft shipping rates response
* to make it easier to compare with SFCC Shipping Methods.
* Also sets session variable for shipping costs to be used during cart calculation.
*
* @param {Object} data shipping data object
* @return {HashMap} JSON Object of Sanitized Shipping Method Data
*/
var sanitizeShippingData = function cleanShippingData(data) {
  var cleanMethods = [];
  var zenkraftCosts = {};

// Create a new object with all of the Zenkraft carrier data
  data.forEach(function updateMethodsWithDate(meth) {
      var cleanmethod = {};
      var realTimeRates = require('~/cartridge/scripts/realTimeRates');

      cleanmethod.carrier = meth.carrier && !empty(meth.carrier) ? meth.carrier : false;
      cleanmethod.cost = !empty(meth.total_cost) && Site.getCurrent().getCustomPreferenceValue('enableZenkraftShippingRates') ? meth.total_cost : null;
      cleanmethod.estimated_date = !empty(meth.estimated_date) ? meth.estimated_date : '';
      cleanmethod.service_type = meth.service_type;

      cleanMethods.push(cleanmethod);
      zenkraftCosts[meth.service_type] = cleanmethod.cost;

      // set the session variable for later use in cart calculation
      if (!empty(zenkraftCosts)) {
          realTimeRates.updateSessionShippingRates(JSON.stringify(zenkraftCosts));
      } else if (!empty(session.privacy.zenkraftCosts)) {
          realTimeRates.updateSessionShippingRates();
      }
  });

  return cleanMethods;
};


/**
* Create the object that will be passed in the /rates API call
*
* @param {Object} address recipient
* @param {Object} items items being shipped
* @return {Object} JSON Object of Request Data
*/
var getShippingRateRequest = function getRateRequestData(accountID ,address, items) {
  var req = {};
  var sender = {};
  var recipient = {};
  var packages = [];
  var ZenkraftHelper = require('~/cartridge/scripts/helpers/zenkraftHelper');
// eslint-disable-next-line max-len
  var prefs = ZenkraftHelper.prepareZenkraftDataConfiguration('EDD', accountID);
  var productLineItems;
  var shippingAccounts;
  var preferenceShippingAccounts = prefs.SHIP_ACCOUNT.split(',');
  shippingAccounts = (preferenceShippingAccounts.length === 1) ? preferenceShippingAccounts[0] : preferenceShippingAccounts;
// build shipment
  req.shipment = {};
  req.shipment.test = prefs.IS_TEST;
  req.shipment.debug = prefs.IS_DEBUG;
  req.shipment.carrier = prefs.CARRIER;
  req.shipment.type = 'outbound';
  req.shipment.dim_units = prefs.DIM_UNITS;
  req.shipment.weight_units = prefs.WEIGHT_UNITS;
  req.shipment.currency = prefs.CURRENCY;
  req.shipment.packaging = prefs.PACKAGING;
  req.shipment.shipping_account = shippingAccounts;

// build sender data
  sender.street1 = prefs.SENDER_STREET;
  sender.city = prefs.SENDER_CITY;
  sender.state = prefs.SENDER_STATE;
  sender.postal_code = prefs.SENDER_POSTAL;
  sender.country = prefs.SENDER_COUNTRY;
  req.shipment.sender = sender;

// build recipient data from user address
  recipient.street1 = !empty(address.address1) ? address.address1 : '';
// eslint-disable-next-line max-len
  recipient.city = !empty(address.city) ? address.city : '';
// eslint-disable-next-line max-len
  recipient.state = !empty(address.stateCode) && address.stateCode !== 'undefined' ? address.stateCode : '';
  recipient.postal_code = !empty(address.postalCode) ? address.postalCode : '';
  recipient.country = !empty(address.countryCode) ? address.countryCode.value.toUpperCase() : '';
  req.shipment.recipient = recipient;

// build packages using current cart
  productLineItems = items.items;

  productLineItems.forEach(function addProductLines(item) {
      var productLineItem = item;

      var singlepackage = {
          weight: !empty(productLineItem.dimWeight) ? productLineItem.dimWeight : 1,
          value: 1,
          length: !empty(productLineItem.length) ? productLineItem.length : 1,
          width: !empty(productLineItem.dimWidth) ? productLineItem.dimWidth : 1,
          height: !empty(productLineItem.dimHeight) ? productLineItem.dimHeight : 1
      };

      packages.push(singlepackage);
  });

  req.shipment.packages = packages;

  return req;
};

/**
* Get Shipping Data From Zenkraft Web Service
*
* @param {Object} address shipping address
* @param {Object} cart sfcc basket object
* @param {Object} methods available shipping methods
* @return {HashMap} JSON Object of Available Shipping Method Data
*/
var getShippingData = function getShipData(address, cart, methods, date) {
  // eslint-disable-next-line no-unused-vars
    var realTimeRates = require('~/cartridge/scripts/realTimeRates');

    if (!empty(address) && !empty(address.postalCode)) {
        var data = {};
        methods.forEach(function(method) {
            var id = 'id_' +  method.shippingMethodAccountID;

            if (!empty(method.shippingMethodAccountID) && !data[id]) {
                data[id] = getShippingRateRequest(id, address, cart);
                var req = data[id]
                if (data[id] && data[id].shipment && !empty(data[id].shipment) && !empty(date)) {
                }
                data[id].resp = base.configureZenkraftService('http.zenkraft.rate', JSON.stringify(data[id]));
            }
            if (method.shippingMethodAccountID && !empty(data[id].resp) &&
            !empty(data[id].resp.object) && !empty(data[id].resp.object.rates)) {
                data[id].rates = sanitizeShippingData(data[id].resp.object.rates);
                delete data[id].resp;
            }
        });
    } else {
        realTimeRates.updateSessionShippingRates();
    }
    return data;
};

module.exports = base;