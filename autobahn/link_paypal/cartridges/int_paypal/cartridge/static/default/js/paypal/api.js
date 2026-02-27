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
/******/ 	return __webpack_require__(__webpack_require__.s = "../link_paypal/cartridges/int_paypal/cartridge/client/default/js/paypal/api.js");
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
//# sourceMappingURL=api.js.map