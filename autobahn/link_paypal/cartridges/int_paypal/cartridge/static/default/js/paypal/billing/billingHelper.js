/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/billingHelper.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/api.js":
/*!**************************************************************************************!*\
  !*** ../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/api.js ***!
  \**************************************************************************************/
/*! exports provided: updateOrderData, getPurchaseUnits, getBillingAgreementToken, createBillingAgreementCall, getOrderDetailsCall, returnFromCart, showCartErrorHtml, showCheckoutErrorHtml, finishLpmOrder */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateOrderData", function() { return updateOrderData; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPurchaseUnits", function() { return getPurchaseUnits; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getBillingAgreementToken", function() { return getBillingAgreementToken; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createBillingAgreementCall", function() { return createBillingAgreementCall; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getOrderDetailsCall", function() { return getOrderDetailsCall; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "returnFromCart", function() { return returnFromCart; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "showCartErrorHtml", function() { return showCartErrorHtml; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "showCheckoutErrorHtml", function() { return showCheckoutErrorHtml; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "finishLpmOrder", function() { return finishLpmOrder; });
var loaderInstance = __webpack_require__(/*! ./loader */ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/loader.js");

var $loaderContainer = document.querySelector('.paypalLoader');
var loader = loaderInstance($loaderContainer);
/**
 *  Appends error message on cart page
 *
 * @param {string} message error message
 */

function showCartErrorHtml(message) {
  $('.checkout-btn').addClass('disabled');
  $('.cart-error').append("<div class=\"alert alert-danger alert-dismissible valid-cart-error fade show cartError\" role=\"alert\">\n            <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">\n                <span aria-hidden=\"true\">&times;</span>\n            </button>\n            ".concat(message, "\n        </div>"));
  window.scrollTo(0, 0);
}
/**
 *  Appends error message on billing checkout page
 *
 * @param {string} message error message
 */


function showCheckoutErrorHtml(message) {
  document.querySelector('.error-message-text').textContent = '';
  document.querySelector('.error-message').style.display = 'block';
  document.querySelector('.error-message-text').append(message);
  window.scrollTo(0, 0);
}
/**
 * Updates information about an order
 *
 * @returns {Object} Call handling result
 */


function updateOrderData() {
  loader.show();
  return $.ajax({
    url: window.paypalUrls.updateOrderData,
    type: 'PATCH',
    success: function success() {
      loader.hide();
      window.location.href = window.paypalUrls.placeOrderStage;
    },
    error: function error(err) {
      loader.hide();
      var error = JSON.parse(err.responseText);
      showCartErrorHtml(error.errorMsg);

      if (error.transactionExpired) {
        location.reload();
      }
    }
  });
}
/**
 * Gets purchase units
 *
 * @returns {Object} with purchase units data
 */


function getPurchaseUnits() {
  return $.get(window.paypalUrls.getPurchaseUnit).then(function (_ref) {
    var purchase_units = _ref.purchase_units;
    return purchase_units;
  });
}
/**
 * Gets Billing Agreement Token
 *
 * @param {boolean} isCartFlow - billing agreement flow from cart
 * @returns {string} billingToken - returns a JSON response that includes token, an approval URL
 */


function getBillingAgreementToken() {
  var isCartFlow = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  return $.get(window.paypalUrls.createBillingAgreementToken + "?isCartFlow=".concat(isCartFlow)).then(function (data) {
    return data;
  });
}
/**
 * Gets Billing Agreement
 * After buyer approval, you use a billing agreement token to create the agreement.
 *
 * @param {string} billingToken - billing agreement token
 * @param {boolean} isAccountFlow - billing agreement flow from account page
 * @returns {Object} JSON response body that includes the billing agreement ID,
 * the state of the agreement, which is ACTIVE, and information about the payer
 */


function createBillingAgreementCall(billingToken) {
  var isAccountFlow = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  return $.ajax({
    url: window.paypalUrls.createBillingAgreement + "?isAccountFlow=".concat(isAccountFlow),
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      billingToken: billingToken
    })
  });
}
/**
 * Gets Order Details
 *
 * @param {string} orderId - billing agreement token
 * @returns {Object} JSON response body that includes payer email
 */


function getOrderDetailsCall(orderId) {
  return $.get(window.paypalUrls.getOrderDetails + "?orderId=".concat(orderId)).then(function (data) {
    return data;
  });
}
/**
 * Calls to returnFromCart endpoint, redirects to place order stage or shows error if it exists
 *
 * @returns {Object} Call handling result
 */


function returnFromCart() {
  loader.show();
  var payerEmail = document.querySelector('#paypal_image').getAttribute('data-paypal-default-ba-email');
  return $.ajax({
    url: window.paypalUrls.returnFromCart,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      payerEmail: payerEmail
    }),
    success: function success() {
      loader.hide();
      window.location.href = window.paypalUrls.placeOrderStage;
    },
    error: function error(err) {
      loader.hide();
      showCartErrorHtml(err.responseText);
    }
  });
}
/**
 * Call finishLpmOrder endpoint
 * @param  {Object} details billing address details
 * @returns {Promise} ajax call
 */


function finishLpmOrder(details) {
  var lpmName = document.querySelector('#usedPaymentMethod').value;
  var paypalMethodId = document.querySelector('#paypalMethodId').value;
  return $.ajax({
    url: window.paypalUrls.finishLpmOrder,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      details: details,
      lpmName: lpmName,
      paypalMethodId: paypalMethodId
    })
  });
}



/***/ }),

/***/ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/billingHelper.js":
/*!********************************************************************************************************!*\
  !*** ../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/billingHelper.js ***!
  \********************************************************************************************************/
/*! exports provided: injectSDK, showPaypalBlock, showPaypalBtn, hidePaypalBtn, hideContinueButton, handleTabChange, togglePaypalBtnVisibility, updateSessionAccountEmail, isNewAccountSelected, updateClientSide, showContinueButton, isLpmUsed */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "injectSDK", function() { return injectSDK; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "showPaypalBlock", function() { return showPaypalBlock; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "showPaypalBtn", function() { return showPaypalBtn; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hidePaypalBtn", function() { return hidePaypalBtn; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hideContinueButton", function() { return hideContinueButton; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "handleTabChange", function() { return handleTabChange; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "togglePaypalBtnVisibility", function() { return togglePaypalBtnVisibility; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateSessionAccountEmail", function() { return updateSessionAccountEmail; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isNewAccountSelected", function() { return isNewAccountSelected; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateClientSide", function() { return updateClientSide; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "showContinueButton", function() { return showContinueButton; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isLpmUsed", function() { return isLpmUsed; });
/* harmony import */ var _guest_initBillingButton__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./guest/initBillingButton */ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/guest/initBillingButton.js");
/* harmony import */ var _registered_initBillingAgreementButton__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./registered/initBillingAgreementButton */ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/registered/initBillingAgreementButton.js");
/* harmony import */ var _registered_billingAgreementHelper__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./registered/billingAgreementHelper */ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/registered/billingAgreementHelper.js");



var $paypalButton = document.querySelector('.js_paypal_button_on_billing_form');
var $paypalAccountsDropdown = document.querySelector('#paypalAccountsDropdown');
var $continueButton = document.querySelector('button[value=submit-payment]');
var isRegisteredUser = document.querySelector('.data-checkout-stage').getAttribute('data-customer-type') === 'registered';
var $restPaypalAccountsList = document.querySelector('#restPaypalAccountsList');
var $billingButtonContainer = document.querySelector('#billing-paypal-button-container');
var isBAEnabled = $billingButtonContainer && JSON.parse($billingButtonContainer.getAttribute('data-is-ba-enabled'));
/**
 * Shows continue button if it's not visible
 */

function showContinueButton() {
  if ($continueButton.style.display !== '') {
    $continueButton.style.display = '';
  }
}
/**
 * Hides continue button if it's not hidden
 */


function hideContinueButton() {
  if ($continueButton.style.display !== 'none') {
    $continueButton.style.display = 'none';
  }
}
/**
 * Shows PayPal div container if it's not visible and hides continue button
*/


function showPaypalBtn() {
  if (!$paypalButton) {
    $paypalButton = document.querySelector('.js_paypal_button_on_billing_form');
  }

  if ($paypalButton.style.display !== 'block') {
    $paypalButton.style.display = 'block';
  }

  hideContinueButton();
}
/**
 * Hides PayPal div container if it's not hidden and shows continue button
*/


function hidePaypalBtn() {
  if (!$paypalButton) {
    $paypalButton = document.querySelector('.js_paypal_button_on_billing_form');
  }

  if ($paypalButton.style.display !== 'none') {
    $paypalButton.style.display = 'none';
  }

  showContinueButton();
}
/**
 * Shows PayPal block with accounts dropdown if it's not visible
*/


function showPaypalBlock() {
  if (!$paypalAccountsDropdown) {
    $paypalAccountsDropdown = document.querySelector('#paypalAccountsDropdown');
  }

  if ($paypalAccountsDropdown.style.display !== 'block') {
    $paypalAccountsDropdown.style.display = 'block';
  }
}
/**
 * Hides PayPal block with accounts dropdown if it's visible
*/


function hidePaypalBlock() {
  if (!$paypalAccountsDropdown) {
    $paypalAccountsDropdown = document.querySelector('#paypalAccountsDropdown');
  }

  if ($paypalAccountsDropdown.style.display !== 'none') {
    $paypalAccountsDropdown.style.display = 'none';
  }
}
/**
 * Injects SDK into page
*/


function injectSDK() {
  var head = document.getElementsByTagName('head').item(0);
  var script = document.createElement('script');
  script.type = 'text/javascript';

  script.onload = function () {
    isRegisteredUser && isBAEnabled ? Object(_registered_initBillingAgreementButton__WEBPACK_IMPORTED_MODULE_1__["default"])() : Object(_guest_initBillingButton__WEBPACK_IMPORTED_MODULE_0__["default"])();
  };

  script.src = window.paypalUrls.billingSdkUrl;
  script.setAttribute('data-partner-attribution-id', window.paypalUrls.partnerAttributionId);
  head.appendChild(script);
}
/**
 * Shows is new account selected
 * @param {Element} $accountList - $accountList element
 * @returns {boolean} value whether new account selected
*/


function isNewAccountSelected($accountList) {
  return $accountList.querySelector('option:checked').value === 'newaccount';
}
/**
 * Changes PayPal button visibility depending on checked option of element
 * @param {Element} $accountList - $accountList element
*/


function togglePaypalBtnVisibility($accountList) {
  isNewAccountSelected($accountList) ? showPaypalBtn() : hidePaypalBtn();
}
/**
 * Handles tabs changing
 * @param {event} e - event
*/


function handleTabChange(e) {
  var isPaypalContentSelected = e.target.hash === '#paypal-content';

  if (!isPaypalContentSelected) {
    showContinueButton();
    return;
  }

  isNewAccountSelected($restPaypalAccountsList) ? hideContinueButton() : showContinueButton();

  if (isRegisteredUser && isBAEnabled) {
    Object(_registered_billingAgreementHelper__WEBPACK_IMPORTED_MODULE_2__["assignEmailForSavedBA"])(isRegisteredUser);
    Object(_registered_billingAgreementHelper__WEBPACK_IMPORTED_MODULE_2__["handleCheckboxChange"])();
  }
}
/**
 * Updates session account email if it is differ from existed or email doesn't exist (for guest or disabled billing agreement)
 * @param {Object} _ - arg
 *
*/


function updateSessionAccountEmail(_, _ref) {
  var paypalPayerEmail = _ref.order.paypalPayerEmail;
  if (!paypalPayerEmail) return;
  showPaypalBlock();
  var $sessionPaypalAccount = document.querySelector('#sessionPaypalAccount');

  if ($sessionPaypalAccount && $sessionPaypalAccount.value !== paypalPayerEmail) {
    $sessionPaypalAccount.value = paypalPayerEmail;
    $sessionPaypalAccount.innerText = paypalPayerEmail;
    $sessionPaypalAccount.selected = true;
    $restPaypalAccountsList.onchange();
  }
}
/**
 * Updates paypal content to initial state on client side if payment method was changed from paypal to different one
 * @param {Object} _ - arg
 * @param {Object} customer - customer data object
*/


function updateClientSide(_, customer) {
  var selectedPaymentInstruments = customer.order.billing.payment.selectedPaymentInstruments;
  var paypalPaymentMethod = document.querySelector('.nav-link.paypal-tab').parentElement.getAttribute('data-method-id');
  var $sessionBA = $restPaypalAccountsList.querySelector('option[class=sessionBA]');
  var $sessionPaypalAccount = $restPaypalAccountsList.querySelector('option[id=sessionPaypalAccount]');

  if (selectedPaymentInstruments.length > 0 && ($sessionBA || $sessionPaypalAccount && $sessionPaypalAccount.value !== '')) {
    selectedPaymentInstruments.forEach(function (paymentInstr) {
      if (paymentInstr.paymentMethod !== paypalPaymentMethod) {
        if (!isRegisteredUser || !isBAEnabled) {
          $sessionPaypalAccount.value = '';
          $restPaypalAccountsList.querySelector('option:checked').value = 'newaccount';
          hidePaypalBlock();
          togglePaypalBtnVisibility($restPaypalAccountsList);
        } else if (isBAEnabled && $sessionBA) {
          $sessionBA.remove();
          var $defaultBA = $restPaypalAccountsList.querySelector('option[data-default=true]');
          $defaultBA ? $defaultBA.selected = true : hidePaypalBlock();
          Object(_registered_billingAgreementHelper__WEBPACK_IMPORTED_MODULE_2__["toggleBABtnVisibility"])();
        }

        injectSDK();
      }
    });
  }
}
/**
 * Returns value whether LPM was used or not
 * @param {Element} $usedPaymentMethod - $usedPaymentMethod element
 * @returns {boolean} value whether LPM was used
*/


function isLpmUsed($usedPaymentMethod) {
  var disableFunds = ['sepa', 'bancontact', 'eps', 'giropay', 'ideal', 'mybank', 'p24', 'sofort'];

  if (disableFunds.indexOf($usedPaymentMethod.value) !== -1) {
    return true;
  }

  return false;
}



/***/ }),

/***/ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/guest/initBillingButton.js":
/*!******************************************************************************************************************!*\
  !*** ../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/guest/initBillingButton.js ***!
  \******************************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../api */ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/api.js");
/* harmony import */ var _billingHelper__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../billingHelper */ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/billingHelper.js");
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr && (typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]); if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/* eslint-disable no-useless-escape */

/* eslint-disable no-control-regex */



var loaderInstance = __webpack_require__(/*! ../../loader */ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/loader.js");

var $loaderContainer = document.querySelector('.paypalLoader');
var loader = loaderInstance($loaderContainer);
var $usedPaymentMethod = document.querySelector('#usedPaymentMethod');
var regExpPhone = new RegExp(/^[0-9]{1,14}?$/);
var regExpEmail = new RegExp(/(?:[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*|(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/);
var notEmptyString = new RegExp(/=(?!\s*$).+/);
var defaultStyle = {
  color: 'gold',
  shape: 'rect',
  layout: 'vertical',
  label: 'paypal',
  tagline: false
};
/**
 *  Filters valid form elements
 *
 * @param {string} str - arg
 * @returns {string} with valid form element
 */

function filterValidFormElement(str) {
  return (str.indexOf('addressFields') !== -1 || str.indexOf('contactInfoFields') !== -1) && notEmptyString.test(str);
}
/**
 *  Parses billing fields
 *
 * @param {string} acc -
 * @param {string} str - paypal actions
 * @returns {string} decoded string
 */


function parseBillingFields(acc, str) {
  var _str$split = str.split('='),
      _str$split2 = _slicedToArray(_str$split, 2),
      key = _str$split2[0],
      value = _str$split2[1];

  key = key.split('_');
  key = key[key.length - 1];
  var inputValue = decodeURIComponent(value);

  if (key === 'phone' || key === 'email') {
    var validInput = key === 'phone' ? regExpPhone.test(inputValue) : regExpEmail.test(inputValue);
    if (!validInput) return acc;
  }

  acc[key] = inputValue;
  return acc;
}
/**
 *  Creates billing address, serializes address into form
 *
 * @returns {Object} with created billing address
 */


function createBillingAddress() {
  return $('#dwfrm_billing').serialize().split('&').filter(filterValidFormElement).reduce(parseBillingFields, {});
}
/**
 *  Gets cart button styles
 *
 * @returns {Object} with button styles or if error appears with default styles
 */


function getCartButtonStyle() {
  var config = document.querySelector('.js_paypal_button_on_billing_form').getAttribute('data-paypal-button-config');

  try {
    if (config) {
      var cartButtonConfigs = JSON.parse(config);
      return cartButtonConfigs.style;
    }
  } catch (error) {
    return {
      style: defaultStyle
    };
  }
}
/**
 *  Creates payer object with billing address data
 *
 * @param {Object} billingAddress - billing address
 * @returns {Object} with payer data
 */


function createPayerObject(billingAddress) {
  if (billingAddress.country && billingAddress.phone) {
    return {
      name: {
        given_name: billingAddress.firstName,
        surname: billingAddress.lastName
      },
      email_address: billingAddress.email,
      phone: {
        phone_number: {
          national_number: billingAddress.phone
        }
      },
      address: {
        address_line_1: billingAddress.address1,
        address_line_2: billingAddress.address2 || '',
        admin_area_2: billingAddress.city,
        admin_area_1: billingAddress.stateCode,
        postal_code: billingAddress.postalCode,
        country_code: billingAddress.country
      }
    };
  }

  return false;
}
/**
 * Check for contactInfoEmail input field and saves used payment method to hidden input
 *
 * @param {Object} data - object with data
 * @param {Object} actions - actions
 * @returns {Function} reject - if incorrect email or set PaymentMethod
 */


function onClick(data, actions) {
  var $contactInfoEmail = document.querySelector('input[name=dwfrm_billing_contactInfoFields_email]');
  var errDiv = $contactInfoEmail.parentElement.querySelector('.invalid-feedback');
  var errStr = 'Please enter a valid email address';

  if ($contactInfoEmail.value.trim() !== '' && !regExpEmail.test($contactInfoEmail.value)) {
    Object(_api__WEBPACK_IMPORTED_MODULE_0__["showCheckoutErrorHtml"])(errStr);
    errDiv.innerText = errStr;
    errDiv.style = 'display: block';
    $contactInfoEmail.style = 'border-color: red';
    return actions.reject();
  }

  errDiv.innerText = '';
  errDiv.style = 'display: none';
  $contactInfoEmail.style = 'border-color: rgb(206, 212, 218)';
  $usedPaymentMethod.value = data.fundingSource;
}
/**
 *  Gets purchase units object, creates order and returns object with data
 *
 * @param {Object} _ - arg
 * @param {Object} actions - paypal actions
 * @returns {Object} with purchase units, payer and application context
 */


function createOrder(_, actions) {
  loader.show();
  return Object(_api__WEBPACK_IMPORTED_MODULE_0__["getPurchaseUnits"])().then(function (purchase_units) {
    var parsedPurchaseUnit = JSON.parse(purchase_units[0].amount.value);

    if (parsedPurchaseUnit === 0) {
      Object(_api__WEBPACK_IMPORTED_MODULE_0__["showCheckoutErrorHtml"])('Order total 0 is not allowed for PayPal');
    }

    var payer;
    var payerObj = createPayerObject(createBillingAddress());

    if (payerObj) {
      payer = payerObj;
    }

    var application_context = {
      shipping_preference: 'SET_PROVIDED_ADDRESS'
    };
    loader.hide();
    return actions.order.create({
      purchase_units: purchase_units,
      payer: payer,
      application_context: application_context
    });
  });
}
/**
 * Sets orderID to hidden input, clears session account if it exists and irrelevant errors,
 * and clicks submit payment button
 *
 * @param {Object} data - object with data
 * @param {Object} actions - actions
 *
 */


function onApprove(data, actions) {
  loader.show();

  if (Object(_billingHelper__WEBPACK_IMPORTED_MODULE_1__["isLpmUsed"])($usedPaymentMethod)) {
    actions.order.capture().then(_api__WEBPACK_IMPORTED_MODULE_0__["finishLpmOrder"]).then(function (_ref) {
      var redirectUrl = _ref.redirectUrl;
      loader.hide();
      window.location.href = redirectUrl;
    })["catch"](function () {
      loader.hide();
    });
    return;
  }

  var $orderId = document.querySelector('#paypal_orderId');
  var $selectedAccount = document.querySelector('#sessionPaypalAccount');
  $orderId.value = data.orderID;

  if ($selectedAccount.value !== '') {
    $selectedAccount.value = '';
    $selectedAccount.innerText = '';
  }

  $selectedAccount.selected = true;
  $selectedAccount.style.display = 'block';
  var $contactInfoEmail = document.querySelector('input[name=dwfrm_billing_contactInfoFields_email]');

  if ($contactInfoEmail.value.trim() !== '') {
    document.querySelector('button.submit-payment').click();
    loader.hide();
  } else {
    Object(_api__WEBPACK_IMPORTED_MODULE_0__["getOrderDetailsCall"])(data.orderID).then(function (orderData) {
      $contactInfoEmail.value = orderData.payer.email_address;
      document.querySelector('button.submit-payment').click();
      loader.hide();
    }).fail(function () {
      loader.hide();
    });
  }
}
/**
 * Hides loader on paypal widget closing without errors
 *
 */


function onCancel() {
  loader.hide();
}
/**
 * Shows errors if paypal widget was closed with errors
 *
 */


function onError() {
  loader.hide();

  if (document.querySelector('.error-message').style.display !== 'block') {
    Object(_api__WEBPACK_IMPORTED_MODULE_0__["showCheckoutErrorHtml"])('An internal server error has occurred. \r\nRetry the request later.');
  }
}
/**
 *Inits paypal button on billing checkout page
 */


function initPaypalButton() {
  loader.show();
  window.paypal.Buttons({
    onClick: onClick,
    createOrder: createOrder,
    onApprove: onApprove,
    onCancel: onCancel,
    onError: onError,
    style: getCartButtonStyle()
  }).render('.paypal-checkout-button').then(function () {
    loader.hide();
  });
}

/* harmony default export */ __webpack_exports__["default"] = (initPaypalButton);

/***/ }),

/***/ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/registered/billingAgreementHelper.js":
/*!****************************************************************************************************************************!*\
  !*** ../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/registered/billingAgreementHelper.js ***!
  \****************************************************************************************************************************/
/*! exports provided: toggleBABtnVisibility, assignEmailForSavedBA, handleCheckboxChange, appendOption, updateOption, dataAppendAttributeExist */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toggleBABtnVisibility", function() { return toggleBABtnVisibility; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "assignEmailForSavedBA", function() { return assignEmailForSavedBA; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "handleCheckboxChange", function() { return handleCheckboxChange; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "appendOption", function() { return appendOption; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateOption", function() { return updateOption; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "dataAppendAttributeExist", function() { return dataAppendAttributeExist; });
/* harmony import */ var _billingHelper__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../billingHelper */ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/billingHelper.js");

var $billingBAbutton = document.querySelector('.paypal-checkout-ba-button');
var $restPaypalAccountsList = document.querySelector('#restPaypalAccountsList');
var $paypalAccountSave = document.querySelector('#savePaypalAccount');
var $paypalAccountMakeDefault = document.querySelector('#paypalAccountMakeDefault');
/** Shows PayPal BA button if it's not visible and hides continue button
*/

function showPaypalBABtn() {
  if (!$billingBAbutton) {
    $billingBAbutton = document.querySelector('.paypal-checkout-ba-button');
  }

  if ($billingBAbutton.style.display !== 'block') {
    $billingBAbutton.style.display = 'block';
  }

  Object(_billingHelper__WEBPACK_IMPORTED_MODULE_0__["hideContinueButton"])();
}
/** Hides PayPal BA button if it's not hidden and shows continue button
*/


function hidePaypalBABtn() {
  if (!$billingBAbutton) {
    $billingBAbutton = document.querySelector('.paypal-checkout-ba-button');
  }

  if ($billingBAbutton.style.display !== 'none') {
    $billingBAbutton.style.display = 'none';
  }

  Object(_billingHelper__WEBPACK_IMPORTED_MODULE_0__["showContinueButton"])();
}
/** Put value of checkbox makeDefault/saveAccount for backend
*/


function saveCheckboxState() {
  var $paypal_makeDefault = document.querySelector('#paypal_makeDefault');
  var $paypal_saveAccount = document.querySelector('#paypal_saveAccount');
  $paypal_makeDefault.value = $paypalAccountMakeDefault.checked;
  $paypal_saveAccount.value = $paypalAccountSave.checked;
}
/** Handle makeDefault/saveAccount checkboxes state on change
*/


function handleCheckboxChange() {
  var $selectedAccount = $restPaypalAccountsList.querySelector('option:checked');
  var isSessionAccountAppended = JSON.parse($selectedAccount.getAttribute('data-append'));
  var hasDefaultPaymentMethod = JSON.parse($restPaypalAccountsList.getAttribute('data-has-default-account'));

  if (isSessionAccountAppended || $selectedAccount.value === 'newaccount') {
    if (!$paypalAccountSave.checked) {
      $paypalAccountMakeDefault.checked = false;
      $paypalAccountMakeDefault.disabled = true;
    } else {
      $paypalAccountMakeDefault.disabled = false;

      if (!hasDefaultPaymentMethod) {
        $paypalAccountMakeDefault.checked = true;
      }
    }
  }

  saveCheckboxState();
}
/** Show/hide/check/disable checkboxes depends on selected type of account
*/


function toggleCustomCheckbox() {
  var $selectedAccount = $restPaypalAccountsList.querySelector('option:checked');
  var $paypalAccountMakeDefaultContainer = document.querySelector('#paypalAccountMakeDefaultContainer');
  var $paypalAccountSaveContainer = document.querySelector('#savePaypalAccountContainer');
  var hasPPSavedAccount = JSON.parse($restPaypalAccountsList.getAttribute('data-has-saved-account'));
  var hasDefaultPaymentMethod = JSON.parse($restPaypalAccountsList.getAttribute('data-has-default-account'));
  var isSessionAccountAppended = JSON.parse($selectedAccount.getAttribute('data-append'));
  var isBALimitReached = JSON.parse($restPaypalAccountsList.getAttribute('data-ba-limit-reached'));

  if ($paypalAccountSaveContainer) {
    if ($selectedAccount.dataset["default"] === 'true') {
      $paypalAccountMakeDefaultContainer.style.display = 'none';

      if (hasPPSavedAccount && !hasDefaultPaymentMethod) {
        $paypalAccountMakeDefault.checked = true;
        $paypalAccountMakeDefault.disabled = false;
        $paypalAccountSave.checked = true;
        saveCheckboxState();
      } else {
        $paypalAccountSaveContainer.style.display = 'none';
      }
    }

    if ($selectedAccount.dataset["default"] === 'null' && !($selectedAccount.value === 'newaccount') && !isSessionAccountAppended) {
      $paypalAccountMakeDefaultContainer.style.display = 'block';
      $paypalAccountSaveContainer.style.display = 'none';
      $paypalAccountSave.checked = false;
      $paypalAccountMakeDefault.disabled = false;
    }

    if ($selectedAccount.value === 'newaccount' || isSessionAccountAppended) {
      if (!hasPPSavedAccount) {
        $paypalAccountMakeDefaultContainer.style.display = 'none';
        $paypalAccountMakeDefault.checked = true;
        $paypalAccountMakeDefault.disabled = false;
        saveCheckboxState();
        return;
      }

      handleCheckboxChange();

      if (isBALimitReached) {
        $paypalAccountSaveContainer.style.display = 'none';
        $paypalAccountMakeDefaultContainer.style.display = 'none';
      } else {
        $paypalAccountSaveContainer.style.display = 'block';
        $paypalAccountMakeDefaultContainer.style.display = 'block';
      }

      if (hasDefaultPaymentMethod) {
        return;
      }

      hasPPSavedAccount && !hasDefaultPaymentMethod ? $paypalAccountMakeDefaultContainer.style.display = 'none' : $paypalAccountMakeDefault.disabled = true;
      $paypalAccountMakeDefault.checked = true;
    }
  }
}
/** Show billing agreement btn - hide paypal btn and vise versa
*/


function toggleBABtnVisibility() {
  toggleCustomCheckbox();

  if (Object(_billingHelper__WEBPACK_IMPORTED_MODULE_0__["isNewAccountSelected"])($restPaypalAccountsList)) {
    showPaypalBABtn();
    Object(_billingHelper__WEBPACK_IMPORTED_MODULE_0__["hideContinueButton"])();
    return;
  }

  hidePaypalBABtn();
  Object(_billingHelper__WEBPACK_IMPORTED_MODULE_0__["showPaypalBlock"])();
}
/** Assign billing agreement emails on change into input field
*/


function assignEmailForSavedBA(isRegisteredUser) {
  var $paypalActiveAccount = document.querySelector('#paypal_activeAccount');
  var $contractInfoeEmail = document.querySelector('input[name=dwfrm_billing_contactInfoFields_email]');

  if (Object(_billingHelper__WEBPACK_IMPORTED_MODULE_0__["isNewAccountSelected"])($restPaypalAccountsList)) {
    $paypalActiveAccount.value = '';

    if (!isRegisteredUser) {
      $contractInfoeEmail.value = '';
    }
  } else {
    $paypalActiveAccount.value = $restPaypalAccountsList.querySelector('option:checked').value;
    $contractInfoeEmail.value = $paypalActiveAccount.value;
  }
}
/**
 *  Append element to an Existing restPaypalAccountsList Collection
 *
 * @param {string} email - billing agreement email
 */


function appendOption(email) {
  var $select = document.querySelector('#restPaypalAccountsList');
  var option = document.createElement('option');
  option.text = email;
  option.value = email;
  option.classList.add('sessionBA');
  option.setAttribute('data-append', true);
  option.selected = 'selected';
  $select.add(option, $select[1]);
  $select.value = email;
  toggleBABtnVisibility();
}
/**
 *  Update element under restPaypalAccountsList Collection
 *
 * @param {string} email - billing agreement email
 */


function updateOption(email) {
  var $option = document.querySelector('#restPaypalAccountsList .sessionBA');
  $option.text = email;
  $option.value = email;
  $option.selected = 'selected';
  document.querySelector('#restPaypalAccountsList').value = email;
  hidePaypalBABtn();
  Object(_billingHelper__WEBPACK_IMPORTED_MODULE_0__["showContinueButton"])();
}
/**
 *  Attribute already exist
 *
 * @returns {boolean} append element Exist under restPaypalAccountsList Collection
 */


function dataAppendAttributeExist() {
  var $select = document.querySelector('#restPaypalAccountsList .sessionBA');
  return $select ? !!$select.getAttribute('data-append') : false;
}



/***/ }),

/***/ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/registered/initBillingAgreementButton.js":
/*!********************************************************************************************************************************!*\
  !*** ../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/registered/initBillingAgreementButton.js ***!
  \********************************************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../api */ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/api.js");
/* harmony import */ var _billingAgreementHelper__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./billingAgreementHelper */ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/billing/registered/billingAgreementHelper.js");
/* eslint-disable no-useless-escape */

/* eslint-disable no-control-regex */



var loaderInstance = __webpack_require__(/*! ../../loader */ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/loader.js");

var regExprEmail = new RegExp(/(?:[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*|(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/);
var $loaderContainer = document.querySelector('.paypalLoader');
var loader = loaderInstance($loaderContainer);
/**
 * Check for contactInfoEmail input field if not empty
 *
 * @param {Object} _ - arg
 * @param {Object} actions - paypal actions
 * @returns {Function} reject - if incorrect email
 */

function onClick(_, actions) {
  var $contactInfoEmail = document.querySelector('input[name=dwfrm_billing_contactInfoFields_email]');
  var errDiv = $contactInfoEmail.parentElement.querySelector('.invalid-feedback');
  var errStr = 'Please enter a valid email address';

  if ($contactInfoEmail.value.trim() !== '' && !regExprEmail.test($contactInfoEmail.value)) {
    Object(_api__WEBPACK_IMPORTED_MODULE_0__["showCheckoutErrorHtml"])(errStr);
    errDiv.innerText = errStr;
    errDiv.style = 'display: block';
    $contactInfoEmail.style = 'border-color: red';
    return actions.reject();
  }

  errDiv.innerText = '';
  errDiv.style = 'display: none';
  $contactInfoEmail.style = 'border-color: rgb(206, 212, 218)';
}
/**
 *  Create's Billing Agreement
 *
 * @returns {string} returns JSON response that includes an data token
 */


function createBillingAgreement() {
  loader.show();
  return Object(_api__WEBPACK_IMPORTED_MODULE_0__["getBillingAgreementToken"])().then(function (data) {
    return data.token;
  }).fail(function () {
    loader.hide();
  });
}
/**
 *  Makes post call using facilitator Access Token and transfers billingToken
 *  save's billingAgreementID & billingAgreementPayerEmail to input field
 *  and triggers checkout place order stage
 *
 * @param {string} billingToken - billing agreement token
 * @returns {Object} JSON response that includes the billing agreement ID and information about the payer
 */


function onApprove(_ref) {
  var billingToken = _ref.billingToken;
  return Object(_api__WEBPACK_IMPORTED_MODULE_0__["createBillingAgreementCall"])(billingToken).then(function (_ref2) {
    var id = _ref2.id,
        payer = _ref2.payer;
    var payerEmail = payer.payer_info.email;
    document.getElementById('billingAgreementID').value = id;
    document.getElementById('billingAgreementPayerEmail').value = payerEmail;
    var $contactInfoEmail = document.querySelector('input[name=dwfrm_billing_contactInfoFields_email]');

    if ($contactInfoEmail.value.trim() === '') {
      $contactInfoEmail.value = payerEmail;
    }

    document.querySelector('button.submit-payment').click();

    if (!Array.from(document.querySelector('#restPaypalAccountsList').options).some(function (el) {
      return el.value === payerEmail;
    })) {
      Object(_billingAgreementHelper__WEBPACK_IMPORTED_MODULE_1__["dataAppendAttributeExist"])() ? Object(_billingAgreementHelper__WEBPACK_IMPORTED_MODULE_1__["updateOption"])(payerEmail) : Object(_billingAgreementHelper__WEBPACK_IMPORTED_MODULE_1__["appendOption"])(payerEmail);
    }

    loader.hide();
  }).fail(function () {
    loader.hide();
  });
}
/**
 * Hides loader on paypal widget closing without errors

 */


function onCancel() {
  loader.hide();
}
/**
 * Shows errors if paypal widget was closed with errors
 *
 */


function onError() {
  loader.hide();
  Object(_api__WEBPACK_IMPORTED_MODULE_0__["showCheckoutErrorHtml"])('An internal server error has occurred. \r\nRetry the request later.');
}
/**
 *Inits paypal Billing Agreement button on billing checkout page
 */


function initPaypalBAButton() {
  loader.show();
  window.paypal.Buttons({
    onClick: onClick,
    createBillingAgreement: createBillingAgreement,
    onApprove: onApprove,
    onCancel: onCancel,
    onError: onError
  }).render('.paypal-checkout-ba-button').then(function () {
    loader.hide();
  });
}

/* harmony default export */ __webpack_exports__["default"] = (initPaypalBAButton);

/***/ }),

/***/ "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/loader.js":
/*!*****************************************************************************************!*\
  !*** ../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/loader.js ***!
  \*****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/* eslint-disable require-jsdoc */
module.exports = function (containerElement) {
  function Constructor() {
    this.containerEl = containerElement;
  }

  Constructor.prototype.show = function () {
    this.containerEl.style.display = 'block';
  };

  Constructor.prototype.hide = function () {
    this.containerEl.style.display = 'none';
  };

  return new Constructor();
};

/***/ })

/******/ });
//# sourceMappingURL=billingHelper.js.map