/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/components/alertHandler.js":
/*!*************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/components/alertHandler.js ***!
  \*************************************************************************************/
/***/ ((module) => {



function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var AlertHandlerModel = /*#__PURE__*/function () {
  function AlertHandlerModel() {
    _classCallCheck(this, AlertHandlerModel);
    this.alertsContainerEl = document.querySelector('.js-flash-messages-container');
  }

  /**
   * Appends Alerts message
   * Available alerts types:
   * primary, secondary, success, danger, warning, info, alert, dark
   * @param {Object} alert Alerts and type messages
   */
  return _createClass(AlertHandlerModel, [{
    key: "showAlertMessage",
    value: function showAlertMessage(alert) {
      var alertTemplateEl = document.querySelector('.js-alert-template');
      var alertContainerEl = alertTemplateEl.cloneNode(true);
      alertContainerEl.insertAdjacentHTML('beforeend', alert.message);
      this.alertsContainerEl.append(alertContainerEl);
      alertContainerEl.classList.add("alert-".concat(alert.type), 'show');
      alertContainerEl.classList.remove('d-none');
    }

    /**
     * Fades Alerts message
     */
  }, {
    key: "fadeAlerts",
    value: function fadeAlerts() {
      var alertContainerEls = document.querySelectorAll('.js-alert-template');
      alertContainerEls.forEach(function (alert) {
        return alert.classList.add('d-none');
      });
    }

    /**
     * Closes an alert message
     */
  }, {
    key: "closeAlert",
    value: function closeAlert() {
      this.alertsContainerEl.addEventListener('click', function (e) {
        if (e.target.parentElement.type === 'button') {
          var closeBtn = e.target.parentElement;
          closeBtn.parentElement.classList.remove('show');
          closeBtn.parentElement.classList.add('hide');
          setTimeout(function () {
            closeBtn.parentElement.classList.add('d-none');
            closeBtn.parentElement.remove();
          }, 1000);
        }
      });
    }
  }]);
}();
module.exports = AlertHandlerModel;

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/helpers/helper.js":
/*!****************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/helpers/helper.js ***!
  \****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
var AlertHandlerModel = __webpack_require__(/*! ../components/alertHandler */ "./cartridges/bm_paypal/cartridge/client/default/js/components/alertHandler.js");

/**
 * Get CSRF Token
 * @returns {string} - csrf token value
 */
function getCsrfToken() {
  var element = document.querySelector('[name="csrf_token"]');
  if (element && element.value !== '') {
    return element.value;
  }
  element = document.querySelector('[data-tokenname="csrf_token"]');
  if (element && element.getAttribute('data-token') !== '') {
    return element.getAttribute('data-token');
  }
  return '';
}

/**
 * Add csrf token param to url
 * @param {string} url - source url
 * @returns {string} - url with csrf_token param
 */
function getUrlWithCsrfToken(url) {
  var urlInstance = new URL(url, window.location.origin);
  urlInstance.searchParams.append('csrf_token', getCsrfToken());
  return urlInstance.toString();
}

/**
 * Returns string with params for url
 * @param {HTMLElement} formEl - form DOM Element
 * @returns {string} - params fo url
 */
function serializeForm(formEl) {
  var formData = new FormData(formEl);
  var serializedData = [];
  var _iterator = _createForOfIteratorHelper(formData.entries()),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var pair = _step.value;
      serializedData.push("".concat(encodeURIComponent(pair[0]), "=").concat(encodeURIComponent(pair[1])));
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return serializedData.join('&');
}

/**
 * Handle and proceed with submit form event
 * @param {Event} event event reference
 * @param {HTMLElement} [loaderEl] loader element from form
 */
var handleSubmitForm = function handleSubmitForm(event, loaderEl) {
  var alertHandler = new AlertHandlerModel();
  event.preventDefault();
  loaderEl === null || loaderEl === void 0 || loaderEl.classList.remove('d-none');
  fetch(event.currentTarget.action, {
    method: 'POST',
    body: new FormData(event.currentTarget)
  }).then(function (response) {
    return response.json();
  }).then(function (response) {
    if (response.error) {
      throw new Error(response.message);
    }
    window.location.href = response.redirectUrl;
  }).catch(function (error) {
    alertHandler.showAlertMessage({
      message: error.message,
      type: 'danger'
    });
  }).finally(function () {
    loaderEl === null || loaderEl === void 0 || loaderEl.classList.add('d-none');
  });
};

/**
 * @param {string} tabName - Tab name
 */
var replaceState = function replaceState(tabName) {
  window.history.replaceState(null, '', "".concat(window.location.pathname, "?tab=").concat(tabName));
};

/**
 * @param {string} defaultLocation - Default location
 * @param {string} sectionName - Name of section in PayPal tab
 * @returns {string} - Location from URL or default
 */
var getLocationFromUrlBySection = function getLocationFromUrlBySection(defaultLocation, sectionName) {
  var tabName = 'paypal';
  var params = new URLSearchParams(window.location.search);
  if (params.get('tab') === tabName && params.get('section') === sectionName) {
    replaceState(tabName);
    if (params.get('location') !== 'all-locations') {
      return params.get('location');
    }
  }
  return defaultLocation;
};
module.exports = {
  getCsrfToken: getCsrfToken,
  getUrlWithCsrfToken: getUrlWithCsrfToken,
  serializeForm: serializeForm,
  handleSubmitForm: handleSubmitForm,
  getLocationFromUrlBySection: getLocationFromUrlBySection
};

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/applePayButtonConfig.js":
/*!************************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/applePayButtonConfig.js ***!
  \************************************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {



var helper = __webpack_require__(/*! ../helpers/helper */ "./cartridges/bm_paypal/cartridge/client/default/js/helpers/helper.js");
(function (win, doc) {
  var loaderEl = doc.getElementById('js-ap-loader');
  var locationEl = doc.getElementById('js-ap-location');
  var buttonStyleEl = doc.getElementById('js-ap-button-style');
  var buttonTypeEl = doc.getElementById('js-ap-type');
  var formEl = doc.getElementById('js-apple-pay-config-form');
  var containerEl = doc.getElementById('js-apple-pay-container');
  if (!formEl) {
    return;
  }
  var currentButtonStyles = JSON.parse(formEl.getAttribute('data-button-styles'));
  var getButtonConfigs = function getButtonConfigs() {
    return {
      buttonStyle: buttonStyleEl.value,
      type: buttonTypeEl.value
    };
  };
  var rebuildApplePayButton = function rebuildApplePayButton(buttonStyles) {
    var applePayButtonEl = document.getElementById('js-apple-pay-btn');
    applePayButtonEl.setAttribute('type', buttonStyles.type);
    applePayButtonEl.setAttribute('buttonstyle', buttonStyles.buttonStyle);
  };
  var updateButtonView = function updateButtonView() {
    rebuildApplePayButton(getButtonConfigs());
  };
  var updateButtonOptions = function updateButtonOptions(buttonStyles) {
    buttonStyleEl.value = buttonStyles.buttonStyle;
    buttonTypeEl.value = buttonStyles.type;
  };
  var handleLocation = function handleLocation() {
    updateButtonOptions(currentButtonStyles[locationEl.value]);
    updateButtonView();
  };
  var applePayInit = function applePayInit() {
    var change = 'change';
    if (containerEl) {
      var params = new URLSearchParams(win.location.search);
      var currentLocation = 'billing';
      if (params.get('tab') === 'apple-pay' && params.has('location')) {
        if (params.get('location') !== 'all-locations') {
          currentLocation = params.get('location');
        }
        window.history.replaceState(null, '', "".concat(window.location.pathname, "?tab=apple-pay"));
      }
      var buttonStylesByLocation = currentButtonStyles[currentLocation];
      locationEl.value = currentLocation;
      updateButtonOptions(buttonStylesByLocation);
      rebuildApplePayButton(buttonStylesByLocation);
      locationEl.addEventListener(change, handleLocation);
      buttonStyleEl.addEventListener(change, updateButtonView);
      buttonTypeEl.addEventListener(change, updateButtonView);
      formEl.addEventListener('submit', function (event) {
        return helper.handleSubmitForm(event, loaderEl);
      });
    }
  };
  doc.addEventListener('DOMContentLoaded', applePayInit);
})(window, document);

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/buttonMessageConfig.js":
/*!***********************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/buttonMessageConfig.js ***!
  \***********************************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {



var helper = __webpack_require__(/*! ../helpers/helper */ "./cartridges/bm_paypal/cartridge/client/default/js/helpers/helper.js");
var AlertHandlerModel = __webpack_require__(/*! ../components/alertHandler */ "./cartridges/bm_paypal/cartridge/client/default/js/components/alertHandler.js");
var PAYPAL_BUTTON_MESSAGE_DEFAULT_CONFIG = {
  align: 'center',
  color: 'black',
  position: 'bottom'
};
(function (win, doc) {
  var BUTTON_MESSAGE_CONTAINER_SELECTOR = '.js-paypal-button-message';
  var buttonMessageConfigForm = doc.querySelector('.js-button-message-form');
  var buttonMessageContainer = doc.querySelector(BUTTON_MESSAGE_CONTAINER_SELECTOR);
  var alertHandler = new AlertHandlerModel();
  if (!buttonMessageConfigForm) {
    return;
  }
  var styleAlign = doc.querySelector('.js-style-align-button-message');
  var styleColor = doc.querySelector('.js-style-color-button-message');
  var stylePosition = doc.querySelector('.js-style-position-button-message');
  var locationEl = doc.querySelector('.js-button-message-location');

  /**
   * Clear the HTML content
   */
  function clearContent() {
    buttonMessageContainer.innerHTML = '';
  }

  /**
   * Return style configurations for PayPal button message
   * Available values:
   *  align: (string) center, left, right
   *  color: (string) black, white,
   *  position: (string) top, bottom
   *
   * @returns {Object} object with align, color, position
   */
  function getButtonMessageStyleConfigs() {
    return {
      align: styleAlign.value,
      color: styleColor.value,
      position: stylePosition.value
    };
  }

  /**
   * Update html option's with saved PayPal button message values from custom pref PP_Button_Message_Styles
   * @param {Object} savedMessageStyles with align, color, position, location
   */
  function updateValuesWithConfigs(savedMessageStyles) {
    styleAlign.value = savedMessageStyles.align;
    styleColor.value = savedMessageStyles.color;
    stylePosition.value = savedMessageStyles.position;
    locationEl.value = savedMessageStyles.location;
  }

  /**
   * Renders the PayPal button message based on the received configuration object (styleConfiguration).
   * @param {Object} styleConfiguration with align, color, position
   */
  function renderButtonMessage(styleConfiguration) {
    clearContent();
    if (!styleConfiguration) {
      styleConfiguration = getButtonMessageStyleConfigs();
      alertHandler.fadeAlerts();
    }
    paypal.Buttons({
      fundingSource: paypal.FUNDING.PAYPAL,
      onInit: function onInit(_, actions) {
        return actions.disable();
      },
      message: {
        amount: 100,
        align: styleConfiguration.align,
        color: styleConfiguration.color,
        position: styleConfiguration.position
      }
    }).render(BUTTON_MESSAGE_CONTAINER_SELECTOR);
  }

  /**
   * Causes the button to be updated
   */
  function handleChangeValue() {
    alertHandler.fadeAlerts();
    renderButtonMessage();
  }
  doc.addEventListener('DOMContentLoaded', function () {
    if (!buttonMessageContainer) {
      return;
    }
    var location = helper.getLocationFromUrlBySection('billing', 'message');
    var buttonMessageConfig = JSON.parse(buttonMessageConfigForm.getAttribute('data-button-message-styles'))[location];
    if (!buttonMessageConfig) {
      buttonMessageConfig = PAYPAL_BUTTON_MESSAGE_DEFAULT_CONFIG;
    }
    buttonMessageConfig.location = location;
    styleAlign.addEventListener('change', handleChangeValue);
    styleColor.addEventListener('change', handleChangeValue);
    stylePosition.addEventListener('change', handleChangeValue);
    locationEl.addEventListener('change', function () {
      var pageButtonMessageConfig = JSON.parse(buttonMessageConfigForm.getAttribute('data-button-message-styles'))[locationEl.value];
      pageButtonMessageConfig.location = locationEl.value;
      updateValuesWithConfigs(pageButtonMessageConfig);
      renderButtonMessage(pageButtonMessageConfig);
    });
    buttonMessageConfigForm.addEventListener('submit', helper.handleSubmitForm);
    updateValuesWithConfigs(buttonMessageConfig);
    renderButtonMessage(buttonMessageConfig);
  });
})(window, document);

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/cardFieldsConfig.js":
/*!********************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/cardFieldsConfig.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {



var helper = __webpack_require__(/*! ../helpers/helper */ "./cartridges/bm_paypal/cartridge/client/default/js/helpers/helper.js");
(function (win, doc) {
  var cardNumberFieldEl = doc.getElementById('card-number');
  var expDataFieldEl = doc.getElementById('exp-date');
  var cvvFieldEl = doc.getElementById('cvv');
  var formEl = doc.getElementById('js-pphf-config-form');
  var colorEl = doc.getElementById('js-pphf-input-color');
  var invalidColorEl = doc.getElementById('js-pphf-invalid-color');
  var validColorEl = doc.getElementById('js-pphf-valid-color');
  var fontSizeFormControlNumberEl = doc.getElementById('js-font-size-number');
  var fontSizeFormControlRangeEl = doc.getElementById('js-font-size-range');
  var allExampleInputEls = doc.getElementsByClassName('js-card-fields-form-input');

  /**
  * Validates inputs based on field values
  */
  function validate() {
    if (cardNumberFieldEl.value === '1111 1111 1111 1111') {
      cardNumberFieldEl.style.color = invalidColorEl.value;
    } else if (cardNumberFieldEl.value.length === 19) {
      cardNumberFieldEl.style.color = validColorEl.value;
    } else {
      cardNumberFieldEl.style.color = colorEl.value;
    }
    if (expDataFieldEl.value === '11 / 11') {
      expDataFieldEl.style.color = invalidColorEl.value;
    } else if (expDataFieldEl.value.length === 7) {
      expDataFieldEl.style.color = validColorEl.value;
    } else {
      expDataFieldEl.style.color = colorEl.value;
    }
    if (cvvFieldEl.value.length === 3) {
      cvvFieldEl.style.color = validColorEl.value;
    } else {
      cvvFieldEl.style.color = colorEl.value;
    }
  }

  /**
   * Updates the credit card view based on selected styles
   */
  function updateView() {
    Array.prototype.forEach.call(allExampleInputEls, function (element) {
      element.style.color = colorEl.value;
      element.style.fontSize = "".concat(fontSizeFormControlRangeEl.value, "pt");
    });
    validate();
  }
  fontSizeFormControlRangeEl.addEventListener('change', function () {
    fontSizeFormControlNumberEl.value = fontSizeFormControlRangeEl.value;
    Array.prototype.forEach.call(allExampleInputEls, function (element) {
      element.style.fontSize = "".concat(fontSizeFormControlRangeEl.value, "pt");
    });
  });
  fontSizeFormControlNumberEl.addEventListener('change', function () {
    fontSizeFormControlRangeEl.value = fontSizeFormControlNumberEl.value;
  });
  formEl.addEventListener('change', function () {
    return updateView();
  });
  cvvFieldEl.addEventListener('input', function () {
    return updateView();
  });
  cardNumberFieldEl.addEventListener('input', function (event) {
    var cardField = event.target;
    var cardValue = cardField.value.replace(/\D/g, '').substring(0, 16);
    var formattedValue = '';
    for (var i = 0; i < cardValue.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += cardValue.charAt(i);
    }
    cardField.value = formattedValue;
    validate();
  });
  expDataFieldEl.addEventListener('input', function (event) {
    var expDateField = event.target;
    var expDateValue = expDateField.value.replace(/\D/g, '').substring(0, 4);
    var formattedValue = '';
    for (var i = 0; i < expDateValue.length; i++) {
      if (i === 2) {
        formattedValue += ' / ';
      }
      formattedValue += expDateValue.charAt(i);
    }
    expDateField.value = formattedValue;
    validate();
  });
  formEl.addEventListener('submit', helper.handleSubmitForm);
  doc.addEventListener('DOMContentLoaded', function () {
    var cardFieldsStyles = JSON.parse(formEl.getAttribute('data-card-fields-styles'));
    colorEl.value = cardFieldsStyles.color;
    invalidColorEl.value = cardFieldsStyles.invalidColor;
    validColorEl.value = cardFieldsStyles.validColor;
    fontSizeFormControlNumberEl.value = cardFieldsStyles.fontSize;
    fontSizeFormControlRangeEl.value = cardFieldsStyles.fontSize;
    var params = new URLSearchParams(win.location.search);
    if (params.get('tab') === 'card-fields' && params.has('location')) {
      win.history.replaceState(null, '', "".concat(win.location.pathname, "?tab=card-fields"));
    }
    updateView();
  });
})(window, document);

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/cwppButtonConfig.js":
/*!********************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/cwppButtonConfig.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {



var helper = __webpack_require__(/*! ../helpers/helper */ "./cartridges/bm_paypal/cartridge/client/default/js/helpers/helper.js");
(function (win, doc, paypal) {
  var formEl = doc.getElementById('js-cwpp-config-form');
  if (!formEl) {
    return;
  }
  var buttonOptions = {
    theme: 'blue',
    buttonType: 'LWP',
    buttonSize: 'lg',
    buttonShape: 'rect'
  };
  var loaderEl = doc.getElementById('js-cwpp-loader');
  var locationEl = doc.getElementById('js-cwpp-location');
  var containerEl = doc.getElementById('js-cwpp-button');
  var themeEl = doc.getElementById('js-cwpp-theme-button');
  var buttonTypeEl = doc.getElementById('js-cwpp-label');
  var buttonSizeEl = doc.getElementById('js-cwpp-size');
  var buttonShapeEl = doc.getElementById('js-cwpp-shape-button');
  var updateButtonStyle = function updateButtonStyle(key, value) {
    containerEl.innerHTML = '';
    if (key !== undefined) {
      buttonOptions[key] = value;
    }
    var payPalApiConfig = JSON.parse(formEl.getAttribute('data-paypal-api-config'));

    // https://developer.paypal.com/docs/log-in-with-paypal/integrate/generate-button
    paypal.use(['login'], function (login) {
      login.render({
        appid: payPalApiConfig.appid,
        scopes: 'openid profile email address',
        authend: payPalApiConfig.authend,
        containerid: 'js-cwpp-button',
        responseType: 'code',
        locale: payPalApiConfig.locale,
        theme: buttonOptions.theme,
        labelType: buttonOptions.buttonType,
        buttonType: buttonOptions.buttonType,
        buttonShape: buttonOptions.buttonShape,
        buttonSize: buttonOptions.buttonSize,
        fullPage: 'true',
        returnurl: payPalApiConfig.returnurl
      });
    });
  };
  var handleSize = function handleSize() {
    updateButtonStyle('buttonSize', buttonSizeEl.value);
  };
  var handleTheme = function handleTheme() {
    return updateButtonStyle('theme', themeEl.value);
  };
  var handleType = function handleType() {
    return updateButtonStyle('buttonType', buttonTypeEl.value);
  };
  var handleShape = function handleShape() {
    return updateButtonStyle('buttonShape', buttonShapeEl.value);
  };
  var updateButtonOptionsByLocation = function updateButtonOptionsByLocation(locationKey) {
    var data = JSON.parse(formEl.getAttribute('data-button-styles'))[locationKey];
    buttonOptions.theme = data.theme;
    buttonOptions.buttonType = data.buttonType;
    buttonOptions.buttonSize = data.buttonSize;
    buttonOptions.buttonShape = data.buttonShape;
    themeEl.value = data.theme;
    buttonTypeEl.value = data.buttonType;
    buttonSizeEl.value = data.buttonSize;
    buttonShapeEl.value = data.buttonShape;
    updateButtonStyle();
  };
  var handleLocation = function handleLocation() {
    updateButtonOptionsByLocation(locationEl.value);
  };
  var cwppInit = function cwppInit() {
    var location = 'login';
    var params = new URLSearchParams(win.location.search);
    if (params.get('tab') === 'cwpp' && params.has('location')) {
      if (params.get('location') !== 'all-locations') {
        location = params.get('location');
      }
      win.history.replaceState(null, '', "".concat(win.location.pathname, "?tab=cwpp"));
    }
    locationEl.value = location;
    updateButtonOptionsByLocation(location);
    themeEl.addEventListener('change', handleTheme);
    buttonTypeEl.addEventListener('change', handleType);
    buttonShapeEl.addEventListener('change', handleShape);
    buttonSizeEl.addEventListener('change', handleSize);
    formEl.addEventListener('submit', function (event) {
      return helper.handleSubmitForm(event, loaderEl);
    });
    locationEl.addEventListener('change', handleLocation);
  };
  doc.addEventListener('DOMContentLoaded', function () {
    if (!containerEl) {
      return;
    }
    var script = doc.createElement('script');
    script.id = 'paypal-api';
    script.src = containerEl.getAttribute('data-cwpp-sdk');
    script.onload = cwppInit;
    doc.body.appendChild(script);
  });
})(window, document, window.paypal);

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/googlePayButtonConfig.js":
/*!*************************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/googlePayButtonConfig.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {



var helper = __webpack_require__(/*! ../helpers/helper */ "./cartridges/bm_paypal/cartridge/client/default/js/helpers/helper.js");
(function (win, doc) {
  var EVENT_TYPE_CHANGE = 'change';
  var loaderEl = doc.querySelector('.js-google-pay-loader');
  var locationEl = doc.querySelector('.js-google-pay-location');
  var buttonColorEl = doc.querySelector('.js-google-pay-color');
  var buttonTypeEl = doc.querySelector('.js-google-pay-type');
  var cornerRadiusChangeEl = doc.querySelector('.js-google-pay-corner-radius-range');
  var cornerRadiusChangeNumberEl = doc.querySelector('.js-google-pay-corner-radius-range-number');
  var customSizeEl = doc.querySelector('.js-google-pay-type-mode');
  var formEl = doc.querySelector('.js-google-pay-config-form');
  var containerEl = doc.querySelector('.js-google-pay-container');
  if (!formEl) {
    return;
  }
  var currentButtonStyles = JSON.parse(formEl.getAttribute('data-button-styles'));
  var getButtonConfigs = function getButtonConfigs() {
    return {
      buttonColor: buttonColorEl.value,
      buttonType: buttonTypeEl.value,
      buttonRadius: cornerRadiusChangeEl.value,
      buttonSizeMode: customSizeEl.value
    };
  };
  var rebuildGooglePayButton = function rebuildGooglePayButton(googlePayStyle) {
    var googlePayButtonEl = document.querySelector('.js-google-pay-button');
    var paymentsClient = new google.payments.api.PaymentsClient({
      environment: 'TEST'
    });
    googlePayStyle.onClick = function () {};
    googlePayButtonEl.innerHTML = '';
    googlePayButtonEl.appendChild(paymentsClient.createButton(googlePayStyle));
  };
  var updateButtonView = function updateButtonView() {
    rebuildGooglePayButton(getButtonConfigs());
  };
  var updateButtonOptions = function updateButtonOptions(buttonStyles) {
    buttonColorEl.value = buttonStyles.buttonColor;
    buttonTypeEl.value = buttonStyles.buttonType;
    cornerRadiusChangeEl.value = buttonStyles.buttonRadius;
    cornerRadiusChangeNumberEl.value = buttonStyles.buttonRadius;
    customSizeEl.value = buttonStyles.buttonSizeMode;
  };
  var handleLocation = function handleLocation() {
    updateButtonOptions(currentButtonStyles[locationEl.value]);
    updateButtonView();
  };
  var googlePayInit = function googlePayInit() {
    if (containerEl) {
      var params = new URLSearchParams(win.location.search);
      var currentLocation = 'billing';
      if (params.get('tab') === 'google-pay' && params.has('location')) {
        if (params.get('location') !== 'all-locations') {
          currentLocation = params.get('location');
        }
        window.history.replaceState(null, '', "".concat(window.location.pathname, "?tab=google-pay"));
      }
      var buttonStylesByLocation = currentButtonStyles[currentLocation.toLowerCase()];
      locationEl.value = currentLocation;
      updateButtonOptions(buttonStylesByLocation);
      rebuildGooglePayButton(buttonStylesByLocation);
      locationEl.addEventListener(EVENT_TYPE_CHANGE, handleLocation);
      buttonColorEl.addEventListener(EVENT_TYPE_CHANGE, updateButtonView);
      buttonTypeEl.addEventListener(EVENT_TYPE_CHANGE, updateButtonView);
      cornerRadiusChangeEl.addEventListener(EVENT_TYPE_CHANGE, updateButtonView);
      cornerRadiusChangeNumberEl.addEventListener(EVENT_TYPE_CHANGE, updateButtonView);
      customSizeEl.addEventListener(EVENT_TYPE_CHANGE, updateButtonView);
      formEl.addEventListener('submit', function (event) {
        return helper.handleSubmitForm(event, loaderEl);
      });
    }
  };
  cornerRadiusChangeEl.addEventListener(EVENT_TYPE_CHANGE, function () {
    cornerRadiusChangeNumberEl.value = cornerRadiusChangeEl.value;
  });
  cornerRadiusChangeNumberEl.addEventListener(EVENT_TYPE_CHANGE, function () {
    cornerRadiusChangeEl.value = cornerRadiusChangeNumberEl.value;
  });
  doc.addEventListener('DOMContentLoaded', googlePayInit);
})(window, document);

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/payLaterMsgConfigurator.js":
/*!***************************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/payLaterMsgConfigurator.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {



(function (doc) {
  var AlertHandlerModel = __webpack_require__(/*! ../components/alertHandler */ "./cartridges/bm_paypal/cartridge/client/default/js/components/alertHandler.js");
  var alertHandlerInstance = new AlertHandlerModel();
  var configuratorEl;

  /**
   * Handles onSave event and makes a request to save configuration on the backend side
   * @param {Object} data Data object from configurator
   * @param {Object} data.config Page's config
   */
  var onSave = function onSave(_ref) {
    var _configuratorEl;
    var config = _ref.config;
    var helper = __webpack_require__(/*! ../helpers/helper */ "./cartridges/bm_paypal/cartridge/client/default/js/helpers/helper.js");
    var onSaveUrl = (_configuratorEl = configuratorEl) === null || _configuratorEl === void 0 ? void 0 : _configuratorEl.getAttribute('data-onsave-url');
    alertHandlerInstance.fadeAlerts();
    if (onSaveUrl) {
      fetch(helper.getUrlWithCsrfToken(onSaveUrl), {
        method: 'POST',
        body: JSON.stringify(config)
      }).then(function (response) {
        return response.json();
      }).then(function (data) {
        alertHandlerInstance.showAlertMessage({
          message: data.message,
          type: data.error ? 'danger' : 'success'
        });
      }).catch(function (error) {
        alertHandlerInstance.showAlertMessage({
          message: error.message,
          type: 'danger'
        });
      });
    }
  };

  /**
   * Initiates PayPal Pay later messaging configurator to the page
   */
  var initConfigurator = function initConfigurator() {
    var _configuratorEl2;
    configuratorEl = doc.querySelector('.js-msg-configurator');
    var attributeData = (_configuratorEl2 = configuratorEl) === null || _configuratorEl2 === void 0 ? void 0 : _configuratorEl2.getAttribute('data-properties');
    var properties = attributeData && JSON.parse(attributeData);
    if (properties && window.merchantConfigurators) {
      window.merchantConfigurators.Messaging(Object.assign(properties, {
        onSave: onSave
      }));
    }
  };
  doc.addEventListener('DOMContentLoaded', initConfigurator);
})(document);

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/settings.js":
/*!************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/settings.js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {



__webpack_require__(/*! ./smartButtonConfig */ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/smartButtonConfig.js");
__webpack_require__(/*! ./cwppButtonConfig */ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/cwppButtonConfig.js");
__webpack_require__(/*! ./cardFieldsConfig */ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/cardFieldsConfig.js");
__webpack_require__(/*! ./applePayButtonConfig */ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/applePayButtonConfig.js");
__webpack_require__(/*! ./buttonMessageConfig */ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/buttonMessageConfig.js");
__webpack_require__(/*! ./googlePayButtonConfig */ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/googlePayButtonConfig.js");
__webpack_require__(/*! ./payLaterMsgConfigurator */ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/payLaterMsgConfigurator.js");

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/smartButtonConfig.js":
/*!*********************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/smartButtonConfig.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {



function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var _formEl$dataset$confi, _formEl$dataset;
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var helper = __webpack_require__(/*! ../helpers/helper */ "./cartridges/bm_paypal/cartridge/client/default/js/helpers/helper.js");
var AlertHandlerModel = __webpack_require__(/*! ../components/alertHandler */ "./cartridges/bm_paypal/cartridge/client/default/js/components/alertHandler.js");
var CLASS_NAME_D_NONE = 'd-none';
var CLASS_NAME_GRID_TWO_COLUMNS = 'grid-two-columns';
var DATA_SMART_STYLE_SELECTOR = 'data-smart-styles';
var PAYPAL_SMART_BUTTON_DEFAULT_CONFIG = {
  height: 35,
  color: 'gold',
  shape: 'rect',
  label: 'checkout'
};
var paypal = window.paypal;
var alertHandler = new AlertHandlerModel();
var options = {
  onInit: function onInit(_, actions) {
    return actions.disable();
  },
  createOrder: function createOrder() {},
  onApprove: function onApprove() {},
  onCancel: function onCancel() {},
  onError: function onError() {}
};
var formEl = document.getElementById('js-smartbutton-form');
var config = JSON.parse((_formEl$dataset$confi = formEl === null || formEl === void 0 || (_formEl$dataset = formEl.dataset) === null || _formEl$dataset === void 0 ? void 0 : _formEl$dataset.config) !== null && _formEl$dataset$confi !== void 0 ? _formEl$dataset$confi : '{}');
var colorButtonEl = document.getElementById('js-color-button');
var shapeButtonEl = document.getElementById('js-shape-button');
var labelEl = document.getElementById('js-label');
var locationButtonEl = document.getElementById('js-location-button');
var heightFormControlNumberEl = document.getElementById('js-height-number');
var heightFormControlRangeEl = document.getElementById('js-height-range');
var venmoNote = document.querySelector('.js-venmo-eligibility');
var buttonsContainer = document.querySelector('.js-buttons-container');
var fundingSources = [paypal.FUNDING.PAYPAL, paypal.FUNDING.VENMO, paypal.FUNDING.PAYLATER, paypal.FUNDING.CARD];
var fundingContainers = fundingSources.map(function (fundingSource) {
  return document.querySelector(".js-".concat(fundingSource, "-button-container"));
});

/**
 * Clear the HTML content
 */
function clearContent() {
  fundingContainers.forEach(function (container) {
    container.innerHTML = '';
  });
}

/**
 * Filter styles for Venmo button
 * @param {string} fundingSource - Funding source
 * @param {Object} style - Button style
 * @returns {Object} - Filtered styles for Venmo button
 */
function filterButtonStyle(fundingSource, style) {
  if (fundingSource === paypal.FUNDING.VENMO) {
    return _objectSpread(_objectSpread({}, style), {}, {
      color: style.color === 'gold' ? 'blue' : style.color
    });
  }
  if (fundingSource === paypal.FUNDING.CARD) {
    return _objectSpread(_objectSpread({}, style), {}, {
      color: ['black', 'white'].includes(style.color) ? style.color : 'black'
    });
  }
  return style;
}

/**
 * Return style configurations for PayPal smart button
 * Available values:
 *  height: (number) from 25 to 55,
 *  color: (string) gold, blue, silver, black, white,
 *  shape: (string) pill, rect,
 *
 * @returns {Object} object with height, color, shape, label configuration values in it
 */
function getSmartButtonStyleConfigs() {
  return {
    height: Math.floor(heightFormControlRangeEl.value),
    color: colorButtonEl.value,
    shape: shapeButtonEl.value,
    label: labelEl.value
  };
}

/**
 * Update html option's with saved PayPal smart button values from custom pref PP_Smart_Button_Styles
 * @param {Object} savedSmartStyles object with height, color, shape, label configs
 */
function updateValuesWithStyleConfigs(savedSmartStyles) {
  heightFormControlNumberEl.value = savedSmartStyles.height;
  heightFormControlRangeEl.value = savedSmartStyles.height;
  colorButtonEl.value = savedSmartStyles.color;
  shapeButtonEl.value = savedSmartStyles.shape;
  labelEl.value = savedSmartStyles.label;
  locationButtonEl.value = savedSmartStyles.location;
}

/**
 * Hide Venmo note block
 */
function hideVenmoNote() {
  venmoNote.classList.add(CLASS_NAME_D_NONE);
}

/**
 * Render buttons
 * @param {Object} style - Button styles
 */
function renderButtons(style) {
  var _style$location;
  var location = (_style$location = style.location) !== null && _style$location !== void 0 ? _style$location : locationButtonEl.value;
  venmoNote.classList.remove(CLASS_NAME_D_NONE);
  buttonsContainer.classList.remove(CLASS_NAME_GRID_TWO_COLUMNS);
  fundingContainers.forEach(function (container) {
    return container.classList.remove(CLASS_NAME_D_NONE);
  });
  fundingSources.forEach(function (fundingSource) {
    var _config$fundingSource;
    var isVenmo = fundingSource === paypal.FUNDING.VENMO;
    if (!config[fundingSource].active) {
      if (isVenmo) {
        hideVenmoNote();
      }
      return;
    }
    if (((_config$fundingSource = config[fundingSource].locations) === null || _config$fundingSource === void 0 ? void 0 : _config$fundingSource[location]) === false) {
      if (isVenmo) {
        hideVenmoNote();
      }
      return;
    }
    var button = paypal.Buttons(_objectSpread(_objectSpread({}, options), {}, {
      fundingSource: fundingSource,
      style: filterButtonStyle(fundingSource, style)
    }));
    if (button.isEligible()) {
      button.render(".js-".concat(fundingSource, "-button-container"));
      if (isVenmo) {
        hideVenmoNote();
      }
    }
  });
}

/**
 * Renders the PayPal smart button based on the received configuration object (styleConfiguration).
 * @param {Object} styleConfiguration object with color, height, label, location, shape, configs
 */
function renderPaypalButton(styleConfiguration) {
  if (!styleConfiguration) {
    styleConfiguration = getSmartButtonStyleConfigs();
    clearContent();
    alertHandler.fadeAlerts();
  }
  renderButtons(styleConfiguration);
}
document.addEventListener('DOMContentLoaded', function () {
  if (!formEl) {
    return;
  }
  alertHandler.closeAlert();
  var location = helper.getLocationFromUrlBySection('billing', 'button');
  var smartButtonConfig = JSON.parse(formEl.getAttribute(DATA_SMART_STYLE_SELECTOR))[location];
  if (!smartButtonConfig) {
    smartButtonConfig = PAYPAL_SMART_BUTTON_DEFAULT_CONFIG;
  }
  smartButtonConfig.location = location;
  updateValuesWithStyleConfigs(smartButtonConfig);
  renderPaypalButton(smartButtonConfig);
  colorButtonEl.addEventListener('change', function () {
    return renderPaypalButton();
  });
  labelEl.addEventListener('change', function () {
    return renderPaypalButton();
  });
  heightFormControlRangeEl.addEventListener('change', function () {
    var smartButtonStyleConfigs = getSmartButtonStyleConfigs();
    clearContent();
    alertHandler.fadeAlerts();
    heightFormControlNumberEl.value = heightFormControlRangeEl.value;
    renderPaypalButton(smartButtonStyleConfigs);
  });
  heightFormControlNumberEl.addEventListener('change', function () {
    alertHandler.fadeAlerts();
    heightFormControlRangeEl.value = heightFormControlNumberEl.value;
    var event = document.createEvent('Event');
    event.initEvent('change', true, true);

    // Dispatch the event
    heightFormControlRangeEl.dispatchEvent(event);
  });
  shapeButtonEl.addEventListener('change', function () {
    return renderPaypalButton();
  });
  locationButtonEl.addEventListener('change', function () {
    var locationButton = locationButtonEl.value;
    var styles = JSON.parse(formEl.getAttribute(DATA_SMART_STYLE_SELECTOR));
    clearContent();
    alertHandler.fadeAlerts();
    if (!styles[locationButton]) {
      styles[locationButton] = PAYPAL_SMART_BUTTON_DEFAULT_CONFIG;
    }
    styles[locationButton].location = locationButton;
    updateValuesWithStyleConfigs(styles[locationButton]);
    Promise.resolve().then(function () {
      renderButtons(styles[locationButton]);
    }).then(function () {
      window.scrollTo(0, 0);
    });
  });
  formEl.addEventListener('submit', helper.handleSubmitForm);
});

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!***************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/styleSettings.js ***!
  \***************************************************************************/


__webpack_require__(/*! ./styleSettings/settings */ "./cartridges/bm_paypal/cartridge/client/default/js/styleSettings/settings.js");
})();

/******/ })()
;