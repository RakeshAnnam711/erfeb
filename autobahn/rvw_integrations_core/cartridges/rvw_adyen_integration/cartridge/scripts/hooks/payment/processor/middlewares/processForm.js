"use strict";

var base = module.superModule;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var array = require('*/cartridge/scripts/util/array');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
function getCreditCardErrors(req, isCreditCard, paymentForm) {
  if (!req.form.storedPaymentUUID && isCreditCard) {
    // verify credit card form data
    return COHelpers.validateCreditCard(paymentForm);
  }
  return {};
}
function getBillingFormErrors(paymentForm) {
  return COHelpers.validateBillingForm(paymentForm.addressFields);
}
function setSessionPrivacy(_ref) {
  var adyenPaymentFields = _ref.adyenPaymentFields;
  session.privacy.adyenFingerprint = adyenPaymentFields.adyenFingerprint.value;
}
function getPaymentInstrument(req, storedPaymentMethodId) {
  var currentCustomer = req.currentCustomer;
  var findById = function findById(item) {
    return storedPaymentMethodId === item.getCreditCardToken();
  };
  var paymentInstruments = AdyenHelper.getCustomer(currentCustomer).getProfile().getWallet().getPaymentInstruments();
  return array.find(paymentInstruments, findById);
}

// process payment information
function getProcessFormResult(paymentMethod, req, viewData) {
  var _req$currentCustomer$ = req.currentCustomer.raw,
    authenticated = _req$currentCustomer$.authenticated,
    registered = _req$currentCustomer$.registered;
  // AUTOBAHN MOD, if were not collecting the card holders name, then default to the customer name from checkout stage
  if (!dw.system.Site.current.getCustomPreferenceValue('AdyenCardHolderName_enabled')){
    try {
        var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
        if (paymentMethod && 'holderName' in paymentMethod && currentBasket && viewData && viewData.paymentInformation && viewData.paymentInformation.stateData) {
            var stateData = JSON.parse(viewData.paymentInformation.stateData);
            if (stateData && stateData.paymentMethod) {
                if (currentBasket && currentBasket.billingAddress && currentBasket.billingAddress.fullName) {
                    stateData.paymentMethod.holderName = currentBasket.billingAddress.fullName;
                } else if (currentBasket && currentBasket.customer && currentBasket.customer.profile && currentBasket.customer.profile.firstName && currentBasket.customer.profile.lastName) {
                    stateData.paymentMethod.holderName = currentBasket.customer.profile.firstName + ' ' + currentBasket.customer.profile.lastName
                }

                viewData.paymentInformation.stateData = JSON.stringify(stateData);
            }
        }
    } catch (e) {
        AdyenLogs.error_log('Could not change default holder name: ' + e.msg);
    }
  }
  if (paymentMethod.storedPaymentMethodId && authenticated && registered) {
    var paymentInstrument = module.exports.getPaymentInstrument(req, paymentMethod.storedPaymentMethodId);
    return {
      error: false,
      viewData: _objectSpread(_objectSpread({}, viewData), {}, {
        paymentInformation: _objectSpread(_objectSpread({}, viewData.paymentInformation), {}, {
          cardNumber: paymentInstrument.creditCardNumber,
          cardType: paymentInstrument.creditCardType,
          securityCode: req.form.securityCode,
          expirationMonth: paymentInstrument.creditCardExpirationMonth,
          expirationYear: paymentInstrument.creditCardExpirationYear,
          creditCardToken: paymentInstrument.creditCardToken
        })
      })
    };
  }
  return {
    error: false,
    viewData: viewData
  };
}
function getViewData(viewFormData, paymentForm, isCreditCard, adyenPaymentMethod, adyenIssuerName) {
  return _objectSpread(_objectSpread({}, viewFormData), {}, {
    paymentMethod: {
      value: paymentForm.paymentMethod.value,
      htmlName: paymentForm.paymentMethod.value
    },
    paymentInformation: {
      isCreditCard: isCreditCard,
      cardType: paymentForm.creditCardFields.cardType.value,
      cardNumber: paymentForm.creditCardFields.cardNumber.value,
      adyenPaymentMethod: adyenPaymentMethod,
      adyenIssuerName: adyenIssuerName,
      stateData: paymentForm.adyenPaymentFields.adyenStateData.value,
      partialPaymentsOrder: paymentForm.adyenPaymentFields.adyenPartialPaymentsOrder.value
    },
    saveCard: paymentForm.creditCardFields.saveCard.checked
  });
}
function getPaymentMethodFromForm(paymentForm) {
  try {
    var _paymentForm$adyenPay, _paymentForm$adyenPay2;
    return JSON.parse((_paymentForm$adyenPay = paymentForm.adyenPaymentFields) === null || _paymentForm$adyenPay === void 0 ? void 0 : (_paymentForm$adyenPay2 = _paymentForm$adyenPay.adyenStateData) === null || _paymentForm$adyenPay2 === void 0 ? void 0 : _paymentForm$adyenPay2.value).paymentMethod;
  } catch (error) {
    AdyenLogs.error_log('Failed to parse payment form stateData');
    return {};
  }
}

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
  var brand = JSON.stringify(req.form.brandCode);
  var isCreditCard = req.form.brandCode === 'scheme' || (brand === null || brand === void 0 ? void 0 : brand.indexOf('storedCard')) > -1;
  var formFieldErrors = [];
  //AUTOBAHN MODIFICATION collect both cc and billingform errors
  var creditCardErrors = module.exports.getCreditCardErrors(req, isCreditCard, paymentForm);
  if (Object.keys(creditCardErrors).length) {
      Object.keys(creditCardErrors).forEach(function (key) {
          formFieldErrors[key] = creditCardErrors[key];
      });
  }
  var billingFormErrors = module.exports.getBillingFormErrors(paymentForm);
  if (Object.keys(billingFormErrors).length) {
      Object.keys(billingFormErrors).forEach(function (key) {
          formFieldErrors[key] = billingFormErrors[key];
      });
  }
  if (Object.keys(formFieldErrors).length) {
     return {
         error: true,
         fieldErrors: formFieldErrors
     }
  }

  module.exports.setSessionPrivacy(paymentForm);
  var _req$form = req.form,
    _req$form$adyenPaymen = _req$form.adyenPaymentMethod,
    adyenPaymentMethod = _req$form$adyenPaymen === void 0 ? null : _req$form$adyenPaymen,
    _req$form$adyenIssuer = _req$form.adyenIssuerName,
    adyenIssuerName = _req$form$adyenIssuer === void 0 ? null : _req$form$adyenIssuer;
  var paymentMethod = module.exports.getPaymentMethodFromForm(paymentForm);
  var viewData = module.exports.getViewData(viewFormData, paymentForm, isCreditCard, adyenPaymentMethod, adyenIssuerName);
  return module.exports.getProcessFormResult(paymentMethod, req, viewData);
}

module.exports = {
    processForm: processForm,
    getCreditCardErrors: getCreditCardErrors,
    getBillingFormErrors: getBillingFormErrors,
    setSessionPrivacy: setSessionPrivacy,
    getPaymentMethodFromForm: getPaymentMethodFromForm,
    getViewData: getViewData,
    getProcessFormResult: getProcessFormResult,
    getPaymentInstrument: getPaymentInstrument
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
