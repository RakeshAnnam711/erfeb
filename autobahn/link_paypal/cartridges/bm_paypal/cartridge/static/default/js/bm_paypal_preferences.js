/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/components/alertHandler.js":
/*!*************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/components/alertHandler.js ***!
  \*************************************************************************************/
/***/ ((module) => {

"use strict";


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

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/preferences/actions.js":
/*!*********************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/preferences/actions.js ***!
  \*********************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* eslint-disable no-console */



function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var AlertHandlerModel = __webpack_require__(/*! ../components/alertHandler */ "./cartridges/bm_paypal/cartridge/client/default/js/components/alertHandler.js");
var alertHandler = new AlertHandlerModel();
var JS_DW_VALUES = '.js-dw-values';
var doc = document;
var csrfToken = doc.querySelector('[name="csrf_token"]');
var instanceTypesObj = {
  0: 'sandbox',
  1: 'staging',
  2: 'production'
};

/**
 * Gets the client ID from the DOM.
 * @returns {string} The client ID, or an empty string if not found.
 */
var getClientId = function getClientId() {
  var element = doc.querySelector('[name="client-id"]');
  return element ? element.value : '';
};

/**
 * Adds semi opaque background on form while instance is being changed
 * @param {string} formId form ID
 * @returns {Object} An object with two methods: show and hide
 */
var transitionAnimation = function transitionAnimation(formId) {
  var form = doc.getElementById(formId);
  return {
    show: function show() {
      return form.classList.add('semi-opaque');
    },
    hide: function hide() {
      return form.classList.remove('semi-opaque');
    }
  };
};

/**
 * Handles the default value for a given field in a row. If a default value is found,
 * it sets the field value and old value to this default (in lowercase). If not, it clears the field.
 *
 * @param {HTMLElement} rowEl - The row element in which to find the field.
 * @param {HTMLElement} fieldEl - The field element whose default value should be handled.
 */
var handleDefaultValue = function handleDefaultValue(rowEl, fieldEl) {
  var element = rowEl.querySelector('.js-default-value');
  if (element) {
    var defaultValue = element.dataset.defaultVal.toLowerCase();
    fieldEl.value = defaultValue;
    fieldEl.dataset.oldValue = defaultValue;
  } else {
    fieldEl.value = '';
    fieldEl.dataset.oldValue = '';
  }
};

/**
 * Changes values for preferences of another instance
 * @param {Object} data OCAPI response data
 * @param {Array} prefsWithChangedValues preferences which values have been changed
 * @param {HTMLElement} rowEl row where the preference is located
 */
var handleValuesChange = function handleValuesChange(data, prefsWithChangedValues, rowEl) {
  var changedPrefValue = prefsWithChangedValues.find(function (pref) {
    return rowEl.classList.contains(pref.toLowerCase());
  });
  var fieldEl = rowEl.querySelector('.js-dw-collection-field').firstElementChild;
  var setOfStringsValueFieldEl = rowEl.querySelector('[data-value-type-code="23"]');
  var enumOfIntValueFieldEl = rowEl.querySelector('[data-value-type-code="31"]');
  var enumOfStringsValueFieldEl = rowEl.querySelector('[data-value-type-code="33"]');
  if (setOfStringsValueFieldEl) {
    var valuesContainerEl = rowEl.querySelector(JS_DW_VALUES);
    Array.from(valuesContainerEl.children).forEach(function (elem) {
      if (!elem.classList.contains('d-none')) {
        elem.remove();
      }
    });
    setOfStringsValueFieldEl.value = '';
    fieldEl.dataset.oldValue = '';
    if (changedPrefValue) {
      data["c_".concat(changedPrefValue)].forEach(function (prefValue) {
        var valueContainerEl = valuesContainerEl.firstElementChild.cloneNode(true);
        var valueTextEl = valueContainerEl.firstElementChild;
        var value = setOfStringsValueFieldEl.value.concat("".concat(setOfStringsValueFieldEl.value.length ? ',' : ''), prefValue);
        setOfStringsValueFieldEl.value = value;
        fieldEl.dataset.oldValue = value;
        valueTextEl.append(prefValue);
        valueContainerEl.prepend(valueTextEl);
        valuesContainerEl.append(valueContainerEl);
        valueContainerEl.classList.remove('d-none');
      });
    }
  } else if (enumOfIntValueFieldEl && !changedPrefValue) {
    fieldEl.value = '-1';
    fieldEl.dataset.oldValue = '-1';
  } else if (changedPrefValue) {
    fieldEl.value = data["c_".concat(changedPrefValue)];
    fieldEl.dataset.oldValue = data["c_".concat(changedPrefValue)];
  } else {
    handleDefaultValue(rowEl, fieldEl);
  }
  if (enumOfStringsValueFieldEl) {
    var checkboxEls = rowEl.querySelectorAll('.js-input-checkbox');
    var checkedValues = fieldEl.value.split(',');
    checkboxEls.forEach(function (checkboxEl) {
      checkboxEl.checked = checkedValues.includes(checkboxEl.value);
    });
  }
};

/**
 * Stores the client ID in local storage and updates the client ID field in the DOM.
 */
var storeClientId = function storeClientId() {
  var key = 'bm-client-id';
  var oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  var value = JSON.parse(localStorage.getItem(key));
  var element = doc.querySelector('[name="client-id"]');
  if (value && value.expires > Date.now()) {
    element.value = value.clientId;
  } else {
    var url = new URL('on/demandware.store/Sites-Site/default/ViewApplication-BM#/?preference#site_preference_groups', window.location.origin);
    fetch(url, {
      method: 'GET'
    }).then(function (response) {
      return response.text();
    }).then(function (html) {
      var parser = new DOMParser();
      var htmlDocument = parser.parseFromString(html, 'text/html');
      var clientIdElement = htmlDocument.getElementById('dw-ocapi.client-id');
      var clientId = clientIdElement.getAttribute('content');
      localStorage.setItem(key, JSON.stringify({
        clientId: clientId,
        expires: Date.now() + oneDayInMilliseconds
      }));
      element.value = clientId;
    }).catch(function (error) {
      console.error('Error fetching HTML:', error);
    });
  }
};

/**
 * Get Access Token object
 * @returns {void}
 */
var getAccessToken = function getAccessToken() {
  var searchParams = new URLSearchParams();
  var url = new URL('dw/oauth2/access_token', window.location.origin);
  url.searchParams.append('csrf_token', csrfToken.value);
  searchParams.append('client_id', getClientId());
  searchParams.append('grant_type', 'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken');
  return fetch(url.toString(), {
    method: 'POST',
    body: searchParams
  }).then(function (response) {
    return response.json();
  }).then(function (data) {
    return data;
  }).catch(function (error) {
    alertHandler.showAlertMessage({
      type: 'danger',
      message: error.message
    });
  });
};

/**
 * Send POST request to save preferences
 * @param {Object} event - SubmitEvent
 * @param {Object} data - data sent from apply to other sites popup
 */
var savePreferencesHandler = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(event, data) {
    var targetEl, disabledSelects, groupId, sectionName, instanceTypeEl, siteId, instanceType, url, searchParams, token, prefIdsWithMultiValueType, prefIdsWithPasswordValueType, prefIdsWithStringValueType, formData, dataToSend;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          event.preventDefault();
          targetEl = data ? event.target.form : event.target;
          disabledSelects = targetEl.querySelectorAll('select:disabled');
          groupId = targetEl.id;
          sectionName = targetEl.sectionName.value;
          instanceTypeEl = doc.querySelector(".js-instance-type[data-group-id=\"".concat(groupId, "\"]"));
          siteId = data ? data.siteId : instanceTypeEl.getAttribute('data-site-id');
          instanceType = data ? data.instance : instanceTypesObj[instanceTypeEl.value];
          url = new URL("s/-/dw/data/v99_9/sites/".concat(siteId, "/site_preferences/preference_groups/").concat(groupId, "/").concat(instanceType), window.location.origin);
          searchParams = url.searchParams;
          searchParams.append('mask_passwords', 'true');
          searchParams.append('display_locale', 'default');
          searchParams.append('csrf_token', csrfToken.value);
          _context.n = 1;
          return getAccessToken();
        case 1:
          token = _context.v;
          prefIdsWithMultiValueType = Array.from(targetEl.querySelectorAll('.js-multi-value')).map(function (input) {
            return input.name;
          });
          prefIdsWithPasswordValueType = Array.from(targetEl.querySelectorAll('[data-value-type-code="13"]')).map(function (input) {
            return input.name;
          });
          prefIdsWithStringValueType = Array.from(targetEl.querySelectorAll('[data-value-type-code="3"], [data-value-type-code="4"], [data-value-type-code="33"]')).map(function (input) {
            return input.name;
          });
          disabledSelects.forEach(function (node) {
            node.disabled = false;
          });
          formData = data ? data.prefs : Object.fromEntries(new FormData(targetEl));
          dataToSend = {};
          disabledSelects.forEach(function (node) {
            node.disabled = true;
          });
          Object.keys(formData).forEach(function (key) {
            if (key.includes('PP')) {
              if (prefIdsWithMultiValueType.includes(key)) {
                dataToSend["c_".concat(key)] = formData[key].split(',');
              } else if (prefIdsWithStringValueType.includes(key) || prefIdsWithPasswordValueType.includes(key)) {
                dataToSend["c_".concat(key)] = formData[key];
              } else if (!formData[key]) {
                dataToSend["c_".concat(key)] = null;
              } else {
                dataToSend["c_".concat(key)] = JSON.parse(formData[key]);
              }
            }
          });
          return _context.a(2, fetch(url, {
            method: 'PATCH',
            headers: {
              Authorization: "".concat(token.token_type, " ").concat(token.access_token),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
          }).then(function (response) {
            return response.json();
          }).then(function (_data) {
            _data.fault ? alertHandler.showAlertMessage({
              type: 'danger',
              message: _data.fault.message
            }) : alertHandler.showAlertMessage({
              type: 'success',
              message: "The custom preferences on the \"".concat(sectionName, "\" tab were saved for ").concat(instanceType, " instance of ").concat(_data.site.id, ".")
            });
          }).catch(function (error) {
            alertHandler.showAlertMessage({
              type: 'danger',
              message: error.message
            });
          }));
      }
    }, _callee);
  }));
  return function savePreferencesHandler(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Fetch Property Description
 * @param {Element} element - DOM element
 */
var fetchPropertyDescription = function fetchPropertyDescription(element) {
  var url = new URL('/on/demandware.store/Sites-Site/default/ViewApplication-GetTooltipJson', window.location.origin);
  var searchParams = url.searchParams;
  var attrId = element.getAttribute('data-dw-attr-id');
  searchParams.append('attrid', attrId);
  searchParams.append('tooltip', "c_".concat(attrId));
  searchParams.append('attrtype', 'SitePreferences');
  searchParams.append('csrf_token', csrfToken.value);
  fetch(url.toString()).then(function (response) {
    return response.json();
  }).then(function (response) {
    element.textContent = response.customText ? new DOMParser().parseFromString(response.customText, 'text/html').body.textContent : 'Not set';
  }).catch(function (error) {
    alertHandler.showAlertMessage({
      type: 'danger',
      message: error.message
    });
  });
};

/**
 * Changes preferences values for a specific instance
 * @param {Object} event - SubmitEvent
 * @returns {Promise} - OCAPI call to get preferences with their values for specific site and instance
 */
var handlerInstanceType = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(event) {
    var target, siteId, groupId, instanceType, url, searchParams, token;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          target = event.target;
          siteId = target.getAttribute('data-site-id');
          groupId = target.getAttribute('data-group-id');
          instanceType = instanceTypesObj[target.value];
          transitionAnimation(groupId).show();
          url = new URL("s/-/dw/data/v99_9/sites/".concat(siteId, "/site_preferences/preference_groups/").concat(groupId, "/").concat(instanceType), window.location.origin);
          searchParams = url.searchParams;
          searchParams.append('mask_passwords', 'true');
          searchParams.append('select', '(**)');
          searchParams.append('display_locale', 'default');
          searchParams.append('csrf_token', csrfToken.value);
          _context2.n = 1;
          return getAccessToken();
        case 1:
          token = _context2.v;
          return _context2.a(2, fetch(url, {
            method: 'GET',
            headers: {
              Authorization: "".concat(token.token_type, " ").concat(token.access_token)
            }
          }).then(function (response) {
            return response.json();
          }).then(function (data) {
            var prefsWithChangedValues = [];
            Object.keys(data).forEach(function (key) {
              if (key.match(/c_/g)) {
                prefsWithChangedValues.push(key.replace(/c_/g, ''));
              }
            });
            var attributeRowEls = doc.querySelectorAll("#".concat(groupId, " .js-dw-attr-row"));
            attributeRowEls.forEach(function (rowEl) {
              return handleValuesChange(data, prefsWithChangedValues, rowEl);
            });
            transitionAnimation(groupId).hide();
          }).catch(function (error) {
            alertHandler.showAlertMessage({
              type: 'danger',
              message: error.message
            });
          }));
      }
    }, _callee2);
  }));
  return function handlerInstanceType(_x3) {
    return _ref2.apply(this, arguments);
  };
}();
module.exports = {
  storeClientId: storeClientId,
  handlerInstanceType: handlerInstanceType,
  savePreferencesHandler: savePreferencesHandler,
  fetchPropertyDescription: fetchPropertyDescription
};

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/preferences/applyToOtherSitesWizard.js":
/*!*************************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/preferences/applyToOtherSitesWizard.js ***!
  \*************************************************************************************************/
/***/ ((module) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var TEXT_SELECT_ALL = 'Select all';
var TEXT_UNSELECT_ALL = 'Unselect all';
var DW_ROW_SELECTOR = '.js-dw-row';
var DW_TBODY_SELECTOR = '.js-dw-tbody';
var DW_CHECKBOX_SELECTOR = '.js-dw-checkbox';
var DW_CHECKBOX_CLASS_NAME = 'js-dw-checkbox';
var SELECT_ALL_SELECTOR = '.js-select-all';
var ApplyToOtherSitesWizard = /*#__PURE__*/function () {
  function ApplyToOtherSitesWizard() {
    _classCallCheck(this, ApplyToOtherSitesWizard);
    _defineProperty(this, "PREF_SELECTION", 'preferenceSelection');
    _defineProperty(this, "SITE_SELECTION", 'siteSelection');
    _defineProperty(this, "SUMMARY", 'summary');
    _defineProperty(this, "IS_DISABLED", 'is-disabled');
    _defineProperty(this, "IS_ACTIVE", 'is-active');
    _defineProperty(this, "D_NONE", 'd-none');
    _defineProperty(this, "INSTANCES", {
      0: 'Sandbox',
      1: 'Staging',
      2: 'Production'
    });
    this.wizardEl = document.querySelector('.js-dw-wizard');
    this.btnNextEl = document.querySelector('.js-button-next');
    this.btnBackEl = document.querySelector('.js-button-back');
    this.btnApplyEl = document.querySelector('.js-button-apply');
    this.prefsNames = {};
    this.dataToSend = {
      prefs: {},
      sites: {}
    };
    this.currentStage = null;
    this.currentSite = null;
    this.currentInstance = null;
  }

  /**
   * Handles click on a checkbox having it be checked/unchecked along with its siblings
   * @param {HTMLElement} checkboxEl Input
   * @param {boolean} condition Condition that triggers whether the checkbox should be checked or not
   */
  return _createClass(ApplyToOtherSitesWizard, [{
    key: "handleMultiCheckboxClick",
    value: function handleMultiCheckboxClick(checkboxEl, condition) {
      if (condition) {
        checkboxEl.checked = false;
        checkboxEl.click();
      } else {
        checkboxEl.checked = true;
        checkboxEl.click();
      }
    }

    /**
     * Prepares data
     * @param {HTMLElement} checkboxEl Input
     * @param {null} value If present, it means the checkbox was unchecked
     */
  }, {
    key: "prepDataToSend",
    value: function prepDataToSend(checkboxEl, value) {
      var prefValue = checkboxEl.dataset.prefValue || checkboxEl.dataset.forInstance;
      if ((value === null || !checkboxEl.dataset.prefValue) && checkboxEl.dataset.prefId) {
        this.dataToSend.prefs[checkboxEl.dataset.prefId] = '';
      } else if (checkboxEl.dataset.prefId) {
        this.dataToSend.prefs[checkboxEl.dataset.prefId] = prefValue;
      }
      if (checkboxEl.closest(DW_ROW_SELECTOR)) {
        var siteId = checkboxEl.closest(DW_ROW_SELECTOR).dataset.siteId;
        var siteName = checkboxEl.closest(DW_ROW_SELECTOR).dataset.siteName;
        var siteData = this.dataToSend.sites[siteId];
        if (value === null) {
          var index = siteData.indexOf(checkboxEl.dataset.forInstance);
          siteData.splice(index, 1);
        } else if (siteData && !siteData.includes(prefValue)) {
          siteData.push(prefValue);
        } else if (!siteData) {
          var data = {};
          data[siteId] = [prefValue];
          data[siteId].siteName = siteName;
          Object.assign(this.dataToSend.sites, data);
        }
      }
    }
  }, {
    key: "handleCheckboxTextConditions",
    value: function handleCheckboxTextConditions(checkboxEl, selectAllBtnEl, isAnyNotCheckedStageWide) {
      if (!checkboxEl.checked && selectAllBtnEl && selectAllBtnEl.innerText === TEXT_UNSELECT_ALL) {
        selectAllBtnEl.innerText = TEXT_SELECT_ALL;
      }
      if (!isAnyNotCheckedStageWide && selectAllBtnEl && selectAllBtnEl.innerText === TEXT_SELECT_ALL) {
        selectAllBtnEl.innerText = TEXT_UNSELECT_ALL;
      }
    }

    /**
     * Handles checkbox click and how it influences other elements
     * @param {HTMLElement} checkboxEl Input
     */
  }, {
    key: "handleCheckboxChangeEvent",
    value: function handleCheckboxChangeEvent(checkboxEl) {
      var _this = this;
      checkboxEl.addEventListener('change', function () {
        var parentEl = checkboxEl.closest('[data-wizard-stage]');
        var nextStageEl = parentEl.nextElementSibling;
        var stageAfterNextEl = nextStageEl.nextElementSibling;
        var nextProgressItemEl = _this.wizardEl.querySelector("[data-progress-id=\"".concat(nextStageEl.dataset.wizardStage, "\"]"));
        var selectAllBtnEl = parentEl.querySelector(SELECT_ALL_SELECTOR);
        var checkAllBtnEl = parentEl.querySelector('.js-dw-check-all');
        var afterNextProgressItemEl;
        var isAnyCheckedInNextStage = nextStageEl.querySelector('.js-dw-checkbox:checked');
        var isAnyNotCheckedStageWide = parentEl.querySelector('.js-dw-checkbox:not(:checked)');
        var isAnyCheckedStageWide = parentEl.querySelector('.js-dw-checkbox:checked');
        var isAnyNotChecked = parentEl.querySelector('.js-dw-checkbox:not(:checked):not(.js-attr-selection-row.d-none .js-dw-checkbox)');
        if (checkboxEl.dataset.forInstance) {
          checkAllBtnEl = parentEl.querySelector(".js-dw-check-all[data-for-instance=\"".concat(checkboxEl.dataset.forInstance, "\"]"));
          isAnyNotChecked = parentEl.querySelector(".js-dw-checkbox[data-for-instance=\"".concat(checkboxEl.dataset.forInstance, "\"]:not(:checked)"));
        }
        if (stageAfterNextEl) {
          afterNextProgressItemEl = _this.wizardEl.querySelector("[data-progress-id=\"".concat(stageAfterNextEl.dataset.wizardStage, "\"]"));
        }
        if (checkboxEl.checked) {
          nextProgressItemEl.classList.remove(_this.IS_DISABLED);
          _this.btnNextEl.disabled = false;
          _this.prepDataToSend(checkboxEl);
        } else if (!checkboxEl.checked && !isAnyCheckedStageWide) {
          nextProgressItemEl.classList.add(_this.IS_DISABLED);
          _this.btnNextEl.disabled = true;
        }
        if (!checkboxEl.checked && !isAnyCheckedStageWide && stageAfterNextEl) {
          afterNextProgressItemEl.classList.add(_this.IS_DISABLED);
        } else if (checkboxEl.checked && isAnyCheckedInNextStage && stageAfterNextEl) {
          afterNextProgressItemEl.classList.remove(_this.IS_DISABLED);
        }
        if (checkboxEl.checked && !isAnyNotChecked && !checkAllBtnEl.checked) {
          checkAllBtnEl.checked = true;
        }
        if (!checkboxEl.checked) {
          _this.prepDataToSend(checkboxEl, null);
        }
        if (!checkboxEl.checked && checkAllBtnEl.checked) {
          checkAllBtnEl.checked = false;
        }
        _this.handleCheckboxTextConditions(checkboxEl, selectAllBtnEl, isAnyNotCheckedStageWide);
      });
    }

    /**
     * Handles click on checkbox which should select all other checkboxes
     * @param {HTMLElement} checkboxEl Input
     */
  }, {
    key: "handleApplyToAllCheckboxChangeEvent",
    value: function handleApplyToAllCheckboxChangeEvent(checkboxEl) {
      var _this2 = this;
      checkboxEl.addEventListener('change', function () {
        var parentEl = checkboxEl.closest('[data-wizard-stage]');
        var checkboxEls = parentEl.querySelectorAll(DW_CHECKBOX_SELECTOR);
        if (checkboxEl.dataset.forInstance) {
          checkboxEls = parentEl.querySelectorAll(".js-dw-checkbox[data-for-instance=\"".concat(checkboxEl.dataset.forInstance, "\"]"));
        }
        checkboxEls.forEach(function (inputEl) {
          return _this2.handleMultiCheckboxClick(inputEl, checkboxEl.checked);
        });
      });
    }

    /**
     * Hides checkbox for the currently chosen site and instance
     */
  }, {
    key: "hideCurrentSiteAndInstanceCheckbox",
    value: function hideCurrentSiteAndInstanceCheckbox() {
      var _this3 = this;
      var stageSiteSelectionEl = this.wizardEl.querySelector("#".concat(this.SITE_SELECTION));
      var checkboxEls = stageSiteSelectionEl.querySelectorAll(DW_CHECKBOX_SELECTOR);
      checkboxEls.forEach(function (checkboxEl) {
        if (checkboxEl.dataset.forInstance === _this3.currentInstance && checkboxEl.dataset.forSite === _this3.currentSite) {
          checkboxEl.classList.add(_this3.D_NONE);
          checkboxEl.classList.remove(DW_CHECKBOX_CLASS_NAME);
        }
      });
    }

    /**
     * Initializes the popup by generating rows with preferences and its values,
     * Calls methods related to checkboxes
     * @param {string} formId Form ID
     */
  }, {
    key: "initialize",
    value: function initialize(formId) {
      var _this4 = this;
      var formEl = document.getElementById(formId);
      var instanceTypeEl = document.querySelector(".js-instance-type[data-group-id=".concat(formId, "]"));
      this.currentInstance = instanceTypeEl.value;
      this.currentSite = instanceTypeEl.dataset.siteId;
      this.btnApplyEl.setAttribute('form', formId);
      formEl.querySelectorAll('.js-dw-attr-row .js-dw-attr-label').forEach(function (label) {
        _this4.prefsNames[label.dataset.attrId] = label.innerText;
      });
      formEl.querySelectorAll('[data-old-value]').forEach(function (fieldEl) {
        var rowEl = _this4.wizardEl.querySelector('.js-attr-selection-row').cloneNode(true);
        var fieldValue = fieldEl.dataset.oldValue;
        var value;
        if (fieldValue === 'true') {
          value = 'Yes';
        } else if (fieldValue === 'false') {
          value = 'No';
        } else if (fieldEl.dataset.valueTypeCode === '13') {
          value = fieldValue.replace(/./g, '*');
          rowEl.querySelector(DW_CHECKBOX_SELECTOR).classList.add(_this4.D_NONE);
          rowEl.querySelector(DW_CHECKBOX_SELECTOR).classList.remove(DW_CHECKBOX_CLASS_NAME);
        } else if (fieldEl.dataset.valueTypeCode === '31') {
          value = fieldEl.children[fieldEl.selectedIndex].dataset.displayValue;
        } else if (fieldEl.dataset.valueTypeCode === '33') {
          value = fieldValue.replaceAll(',', ', ');
        } else {
          value = "".concat(fieldValue.charAt(0).toUpperCase()).concat(fieldValue.slice(1));
        }
        rowEl.children[0].firstElementChild.dataset.prefId = fieldEl.name;
        rowEl.children[0].firstElementChild.dataset.prefValue = fieldValue;
        rowEl.children[1].firstElementChild.append(_this4.prefsNames[fieldEl.name]);
        rowEl.children[2].firstElementChild.append(value);
        rowEl.classList.remove(_this4.D_NONE);
        _this4.wizardEl.querySelector(DW_TBODY_SELECTOR).append(rowEl);
        _this4.currentStage = _this4.PREF_SELECTION;
      });
      this.wizardEl.classList.remove(this.D_NONE);
      this.hideCurrentSiteAndInstanceCheckbox();
      this.wizardEl.querySelectorAll('.js-dw-check-all').forEach(function (checkboxEl) {
        return _this4.handleApplyToAllCheckboxChangeEvent(checkboxEl);
      });
      this.wizardEl.querySelectorAll(DW_CHECKBOX_SELECTOR).forEach(function (checkboxEl) {
        return _this4.handleCheckboxChangeEvent(checkboxEl);
      });
    }

    /**
     * Creates a row with preference data for summary stage
     * @param {string} prefId Preference ID
     */
  }, {
    key: "createSummaryPrefRow",
    value: function createSummaryPrefRow(prefId) {
      var templateEl = this.wizardEl.querySelector('.js-summary-pref-row');
      var rowPrefEl = templateEl.cloneNode(true);
      rowPrefEl.children[0].firstElementChild.append(this.prefsNames[prefId]);
      rowPrefEl.children[1].firstElementChild.append(this.dataToSend.prefs[prefId]);
      rowPrefEl.dataset.prefId = prefId;
      rowPrefEl.classList.remove(this.D_NONE);
      templateEl.closest(DW_TBODY_SELECTOR).append(rowPrefEl);
    }

    /**
     * Creates a row with site data for summary stage
     * @param {string} siteId Site ID
     * @param {string} instanceCode Instance code
     */
  }, {
    key: "createSummarySiteRow",
    value: function createSummarySiteRow(siteId, instanceCode) {
      var templateEl = this.wizardEl.querySelector('.js-summary-site-row');
      var rowSiteEl = templateEl.cloneNode(true);
      rowSiteEl.children[0].firstElementChild.append("".concat(this.dataToSend.sites[siteId].siteName, " (").concat(this.INSTANCES[instanceCode], ")"));
      rowSiteEl.dataset.siteId = siteId;
      rowSiteEl.dataset.siteInstance = instanceCode;
      rowSiteEl.classList.remove(this.D_NONE);
      templateEl.closest(DW_TBODY_SELECTOR).append(rowSiteEl);
    }

    /**
     * Prepares rows for stage summary
     */
  }, {
    key: "prepStageSummary",
    value: function prepStageSummary() {
      var _this5 = this;
      Object.keys(this.dataToSend.prefs).forEach(function (key) {
        return _this5.createSummaryPrefRow(key);
      });
      Object.keys(this.dataToSend.sites).forEach(function (key) {
        _this5.dataToSend.sites[key].forEach(function (value) {
          return _this5.createSummarySiteRow(key, value);
        });
      });
    }

    /**
     * Updates rows for stage summary in case if user goes to previous stages to correct data
     */
  }, {
    key: "updateStageSummary",
    value: function updateStageSummary() {
      var _this6 = this;
      var prefRowEls = this.wizardEl.querySelectorAll('.js-summary-pref-row:not(.d-none)');
      var siteRowEls = this.wizardEl.querySelectorAll('.js-summary-site-row:not(.d-none)');
      var prefsInWizard = Array.from(prefRowEls).map(function (rowEl) {
        return rowEl.dataset.prefId;
      });
      var sitesInWizard = Array.from(siteRowEls).map(function (rowEl) {
        return [rowEl.dataset.siteId, rowEl.dataset.siteInstance];
      });
      var savedPrefs = Object.keys(this.dataToSend.prefs);
      var savedSites = Object.keys(this.dataToSend.sites);
      Array.from(prefRowEls).filter(function (rowEl) {
        return !savedPrefs.includes(rowEl.dataset.prefId);
      }).forEach(function (rowEl) {
        return rowEl.remove();
      });
      Array.from(siteRowEls).filter(function (rowEl) {
        return !_this6.dataToSend.sites[rowEl.dataset.siteId].includes(rowEl.dataset.siteInstance);
      }).forEach(function (rowEl) {
        return rowEl.remove();
      });
      savedPrefs.filter(function (prefId) {
        return !prefsInWizard.includes(prefId);
      }).forEach(function (prefId) {
        return _this6.createSummaryPrefRow(prefId);
      });
      savedSites.forEach(function (siteId) {
        var instancesInWizard = [];
        sitesInWizard.filter(function (pair) {
          return pair[0] === siteId;
        }).forEach(function (pair) {
          return instancesInWizard.push(pair[1]);
        });
        _this6.dataToSend.sites[siteId].forEach(function (instanceCode) {
          if (!instancesInWizard.includes(instanceCode)) {
            _this6.createSummarySiteRow(siteId, instanceCode);
          }
        });
      });
    }

    /**
     * Handles stage switch when next/back buttons or progress items are clicked
     * @param {string} currentStage Current stage
     * @param {string} futureStage Future stage
     */
  }, {
    key: "handleStageSwitch",
    value: function handleStageSwitch(currentStage, futureStage) {
      var futureStageProgressItemEl = document.querySelector("[data-progress-id=\"".concat(futureStage, "\"]"));
      var currentStageProgressItemEl = document.querySelector("[data-progress-id=\"".concat(currentStage, "\"]"));
      var summaryStageEl = this.wizardEl.querySelector("#".concat(this.SUMMARY));
      document.getElementById(currentStage).classList.add(this.D_NONE);
      document.getElementById(futureStage).classList.remove(this.D_NONE);
      currentStageProgressItemEl.classList.remove(this.IS_ACTIVE);
      futureStageProgressItemEl.classList.add(this.IS_ACTIVE);
      if (futureStage === this.SUMMARY && !summaryStageEl.dataset.wizardStageStatus) {
        this.prepStageSummary();
        summaryStageEl.dataset.wizardStageStatus = 'generated';
      }
      if (summaryStageEl.dataset.wizardStageStatus) {
        this.updateStageSummary();
      }
      if (futureStage === this.PREF_SELECTION) {
        this.btnBackEl.disabled = true;
        this.btnNextEl.disabled = false;
      } else if (futureStage === this.SITE_SELECTION) {
        var isAnyCheckboxChecked = this.wizardEl.querySelector("#".concat(this.SITE_SELECTION, " .js-dw-checkbox:checked"));
        if (!isAnyCheckboxChecked) {
          this.btnNextEl.disabled = true;
        }
        this.btnBackEl.disabled = false;
      } else if (futureStage === this.SUMMARY) {
        this.btnNextEl.classList.add('ng-hide');
        this.btnApplyEl.classList.remove('ng-hide');
        futureStageProgressItemEl.classList.remove(this.IS_DISABLED);
      }
      if ((futureStage === this.PREF_SELECTION || futureStage === this.SITE_SELECTION) && !this.btnApplyEl.classList.contains('ng-hide')) {
        this.btnApplyEl.classList.add('ng-hide');
        this.btnNextEl.classList.remove('ng-hide');
      }
      this.currentStage = futureStage;
    }

    /**
     * Moves to next stage on next button click
     */
  }, {
    key: "toNextStage",
    value: function toNextStage() {
      if (this.currentStage === this.PREF_SELECTION) {
        this.handleStageSwitch(this.currentStage, this.SITE_SELECTION);
      } else if (this.currentStage === this.SITE_SELECTION) {
        this.handleStageSwitch(this.currentStage, this.SUMMARY);
      }
    }

    /**
     * Moves to previous stage on back button click
     */
  }, {
    key: "toPrevStage",
    value: function toPrevStage() {
      if (this.currentStage === this.SITE_SELECTION) {
        this.handleStageSwitch(this.currentStage, this.PREF_SELECTION);
      } else if (this.currentStage === this.SUMMARY) {
        this.handleStageSwitch(this.currentStage, this.SITE_SELECTION);
      }
    }

    /**
     * Shows corresponding stage based on which progress item was clicked
     * @param {HTMLElement} itemEl Progress item
     */
  }, {
    key: "handleProgressBarClick",
    value: function handleProgressBarClick(itemEl) {
      var progressBarContainerEl = document.querySelector('.js-progress-bar');
      var selectedEl = progressBarContainerEl.querySelector('.is-active');
      var currentStage = selectedEl.dataset.progressId;
      var futureStage = itemEl.dataset.progressId;
      this.handleStageSwitch(currentStage, futureStage);
    }

    /**
     * Restores next/back/apply buttons classes to their initial state
     */
  }, {
    key: "restoreButtonClasses",
    value: function restoreButtonClasses() {
      if (this.btnNextEl.classList.contains('ng-hide')) {
        this.btnNextEl.classList.remove('ng-hide');
      }
      if (!this.btnNextEl.disabled) {
        this.btnNextEl.disabled = true;
      }
      if (!this.btnBackEl.disabled) {
        this.btnBackEl.disabled = true;
      }
      if (!this.btnApplyEl.classList.contains('ng-hide')) {
        this.btnApplyEl.classList.add('ng-hide');
      }
    }

    /**
     * Restores progress items classes to their initial state
     */
  }, {
    key: "restoreProgressBarClasses",
    value: function restoreProgressBarClasses() {
      var progressPrefSelectionEl = document.querySelector("[data-progress-id=\"".concat(this.PREF_SELECTION, "\"]"));
      var progressSiteSelectionEl = document.querySelector("[data-progress-id=\"".concat(this.SITE_SELECTION, "\"]"));
      var progressSummaryEl = document.querySelector("[data-progress-id=\"".concat(this.SUMMARY, "\"]"));
      if (!progressPrefSelectionEl.classList.contains(this.IS_ACTIVE)) {
        progressPrefSelectionEl.classList.add(this.IS_ACTIVE);
      }
      if (progressSiteSelectionEl.classList.contains(this.IS_ACTIVE)) {
        progressSiteSelectionEl.classList.remove(this.IS_ACTIVE);
      }
      if (!progressSiteSelectionEl.classList.contains(this.IS_DISABLED)) {
        progressSiteSelectionEl.classList.add(this.IS_DISABLED);
      }
      if (progressSummaryEl.classList.contains(this.IS_ACTIVE)) {
        progressSummaryEl.classList.remove(this.IS_ACTIVE);
      }
      if (!progressSummaryEl.classList.contains(this.IS_DISABLED)) {
        progressSummaryEl.classList.add(this.IS_DISABLED);
      }
    }

    /**
     * Restores stages to there initial state
     */
  }, {
    key: "restoreStages",
    value: function restoreStages() {
      var stagePrefSelectionEl = document.getElementById(this.PREF_SELECTION);
      var stageSiteSelectionEl = document.getElementById(this.SITE_SELECTION);
      var stageSummaryEl = document.getElementById(this.SUMMARY);
      if (stagePrefSelectionEl.classList.contains(this.D_NONE)) {
        stagePrefSelectionEl.classList.remove(this.D_NONE);
      }
      if (!stageSiteSelectionEl.classList.contains(this.D_NONE)) {
        stageSiteSelectionEl.classList.add(this.D_NONE);
      }
      if (!stageSummaryEl.classList.contains(this.D_NONE)) {
        stageSummaryEl.classList.add(this.D_NONE);
      }
    }

    /**
     * Cleans stage summary of its rows with data
     */
  }, {
    key: "cleanStageSummary",
    value: function cleanStageSummary() {
      var summaryStageEl = this.wizardEl.querySelector("#".concat(this.SUMMARY));
      var summaryStageDataEl = summaryStageEl.querySelectorAll('.js-summary-pref-row:not(.d-none), .js-summary-site-row:not(.d-none)');
      summaryStageDataEl.forEach(function (rowEl) {
        return rowEl.remove();
      });
      summaryStageEl.removeAttribute('data-wizard-stage-status');
    }

    /**
     * Shows hidden checkbox responsible for current site and instance
     */
  }, {
    key: "showCurrentSiteAndInstanceCheckbox",
    value: function showCurrentSiteAndInstanceCheckbox() {
      var stageSiteSelectionEl = this.wizardEl.querySelector("#".concat(this.SITE_SELECTION));
      var checkboxEl = stageSiteSelectionEl.querySelector('.d-none[data-for-instance]');
      checkboxEl.classList.remove(this.D_NONE);
      checkboxEl.classList.add(DW_CHECKBOX_CLASS_NAME);
    }

    /**
     * Closes popup on close button
     */
  }, {
    key: "close",
    value: function close() {
      this.wizardEl.classList.add(this.D_NONE);
      this.wizardEl.querySelectorAll('.js-attr-selection-row:not(.d-none)').forEach(function (elem) {
        return elem.remove();
      });
      this.wizardEl.querySelectorAll('.js-dw-check-all:checked, .js-dw-checkbox:checked').forEach(function (checkboxEl) {
        checkboxEl.checked = false;
      });
      this.wizardEl.querySelector(SELECT_ALL_SELECTOR).innerText = TEXT_SELECT_ALL;
      this.restoreButtonClasses();
      this.restoreProgressBarClasses();
      this.restoreStages();
      this.cleanStageSummary();
      this.showCurrentSiteAndInstanceCheckbox();
      this.dataToSend = {
        prefs: {},
        sites: {}
      };
    }

    /**
     * Check checkboxes for all instances and sites
     */
  }, {
    key: "selectAllSites",
    value: function selectAllSites() {
      var _this7 = this;
      var buttonEl = this.wizardEl.querySelector(SELECT_ALL_SELECTOR);
      var checkboxEls = this.wizardEl.querySelectorAll("#".concat(this.SITE_SELECTION, " .js-dw-check-all"));
      if (buttonEl.innerText === TEXT_SELECT_ALL) {
        buttonEl.innerText = TEXT_UNSELECT_ALL;
      } else {
        buttonEl.innerText = TEXT_SELECT_ALL;
      }
      checkboxEls.forEach(function (checkboxEl) {
        return _this7.handleMultiCheckboxClick(checkboxEl, buttonEl.innerText !== TEXT_SELECT_ALL);
      });
    }

    /**
     * Calls savePreferencesHandler method with given data
     * @param {Object} event Event
     * @param {Function} callback savePreferencesHandler method
     */
  }, {
    key: "apply",
    value: function apply(event, callback) {
      var _this8 = this;
      Object.keys(this.dataToSend.sites).filter(function (siteId) {
        return _this8.dataToSend.sites[siteId].length !== 0;
      }).forEach(function (siteId) {
        _this8.dataToSend.sites[siteId].forEach(function (instance) {
          return callback(event, {
            prefs: _this8.dataToSend.prefs,
            siteId: siteId,
            instance: _this8.INSTANCES[instance].toLowerCase()
          });
        });
      });
      this.close();
    }

    /**
     * Shows popup/alert on Apply to other sites button click
     * @param {string} formId Form ID
     */
  }, {
    key: "show",
    value: function show(formId) {
      var formEl = document.getElementById(formId);
      var formFieldEls = formEl.querySelectorAll('[data-old-value]');
      var unsavedFieldEl = Array.from(formFieldEls).some(function (fieldEl) {
        if (fieldEl.dataset.oldValue.includes('.0') && !fieldEl.value.includes('.0')) {
          return fieldEl.dataset.oldValue.replace('.0', '') !== fieldEl.value;
        }
        return fieldEl.dataset.oldValue !== fieldEl.value;
      });
      if (unsavedFieldEl) {
        this.showAlert(formId);
      } else {
        this.initialize(formId);
      }
    }

    /**
     * Shows alert if the form contains unsaved data
     * @param {string} formId Form ID
     */
  }, {
    key: "showAlert",
    value: function showAlert(formId) {
      var _this9 = this;
      var wizardAlertEl = document.querySelector('.js-wizard-alert');
      var okBtnEl = wizardAlertEl.querySelector('.js-wizard-alert-ok');
      var cancelBtnEl = wizardAlertEl.querySelector('.js-wizard-alert-cancel');
      wizardAlertEl.classList.remove(this.D_NONE);
      okBtnEl.setAttribute('form', formId);
      cancelBtnEl.addEventListener('click', function () {
        return wizardAlertEl.classList.add(_this9.D_NONE);
      });
    }

    /**
     * Resets unsaved form data and initializes the wizard popup
     * @param {string} formId Form ID
     */
  }, {
    key: "proceedToWizard",
    value: function proceedToWizard(formId) {
      var wizardAlertEl = document.querySelector('.js-wizard-alert');
      wizardAlertEl.classList.add(this.D_NONE);
      this.initialize(formId);
    }
  }]);
}();
module.exports = ApplyToOtherSitesWizard;

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/preferences/handlers.js":
/*!**********************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/preferences/handlers.js ***!
  \**********************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

'use script';

var AlertHandlerModel = __webpack_require__(/*! ../components/alertHandler */ "./cartridges/bm_paypal/cartridge/client/default/js/components/alertHandler.js");
var doc = document;
var alertHandler = new AlertHandlerModel();

/**
 * Retrieves the value of an element by its name attribute.
 *
 * @param {string} name - The name attribute of the element to retrieve the value for.
 * @returns {string} The value of the element with the given name attribute, or an empty string if the element was not found.
 */
var getValueByName = function getValueByName(name) {
  var element = doc.querySelector("[name=\"".concat(name, "\"]"));
  return element ? element.value : '';
};

/**
 * Retrieves the value of an element by attribute name.
 *
 * @param {string} name - The name attribute of the element to retrieve the value for.
 * @returns {string} The attribute value of the element with the given name attribute, or an empty string if the element was not found.
 */
var getValueByAttr = function getValueByAttr(name) {
  var element = doc.querySelector("[name=\"".concat(name, "\"]"));
  return element ? element.getAttribute('data-old-value') : '';
};

/**
 * Handles data set attribute oldValue change
 * @param {HTMLElement} element an HTML element
 */
var handleOldValueAttrChange = function handleOldValueAttrChange(element) {
  var prevSelectedOption = element.querySelector('[data-selected="true"]');
  if (prevSelectedOption) {
    element.dataset.oldValue = prevSelectedOption.value;
    delete prevSelectedOption.dataset.selected;
  }
  element.selectedOptions[0].dataset.selected = true;
};

/**
 * Handles the triggers for a relation.
 *
 * @param {Array<Object>} triggers - An array of trigger objects to handle.
 * @returns {void}
 */
var handlerTriggers = function handlerTriggers(triggers) {
  for (var index = 0; index < triggers.length; index++) {
    var action = triggers[index];
    var element = doc.querySelector("[name=\"".concat(action.id, "\""));
    if (action.type === 'alert') {
      alertHandler.showAlertMessage({
        type: 'primary',
        message: action.message
      });
    }
    if (action.type === 'change') {
      element.value = action.value;
      handleOldValueAttrChange(element);
    }
    if (action.type === 'disable') {
      element.disabled = action.value;
    }
  }
};

/**
 * Handles the conditions for a relation.
 *
 * @param {Array<Object>} conditions - An array of condition objects to handle.
 * @returns {boolean} Whether or not all conditions were met.
 */
var handlerConditions = function handlerConditions(conditions) {
  var conditionMatched = true;
  for (var index = 0; index < conditions.length; index++) {
    var condition = conditions[index];
    var conditionId = condition.id,
      conditionValue = condition.value,
      operator = condition.operator;
    if (operator === 'and') {
      if (conditionValue !== getValueByName(conditionId)) {
        conditionMatched = false;
        break;
      }
    } else if (operator === 'or') {
      if (conditionValue === getValueByName(conditionId)) {
        conditionMatched = true;
        break;
      } else {
        conditionMatched = false;
      }
    }
  }
  return conditionMatched;
};

/**
 * Handles all relations in the document.
 * @param {string} prefId preference id
 * @returns {void}
 */
var handlerRelations = function handlerRelations(prefId) {
  alertHandler.fadeAlerts();
  var relations = JSON.parse(doc.querySelector('[data-relations]').getAttribute('data-relations'));
  relations.filter(function (relation) {
    if (prefId) {
      return relation.id === prefId;
    }
    return relation;
  }).forEach(function (relation) {
    var conditionMatched = handlerConditions(relation.conditions);
    var arrayOfOldValue = [].concat(relation.oldValue);
    var arrayOfNewValue = [].concat(relation.newValue);
    if (conditionMatched && arrayOfOldValue.includes(getValueByAttr(relation.id)) && arrayOfNewValue.includes(getValueByName(relation.id))) {
      handlerTriggers(relation.triggers);
      if (prefId) {
        var prefFieldEl = doc.querySelector(".js-dw-select[name=\"".concat(prefId, "\"]"));
        prefFieldEl.dataset.oldValue = prefFieldEl.value;
      }
    }
  });
};

/**
 * Data handler before form submission
 * @param {Object} event - ClickEvent
 */
var handlerBeforeSubmit = function handlerBeforeSubmit(event) {
  var target = event.target;
  var site = target.form.querySelector('[name="site"]');
  site.value = target.name === 'apply-to-sites' ? 'multiple' : 'single';
  handlerRelations();
};
module.exports = {
  handlerRelations: handlerRelations,
  handlerBeforeSubmit: handlerBeforeSubmit,
  handlerConditions: handlerConditions,
  handleOldValueAttrChange: handleOldValueAttrChange
};

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/preferences/preferences.js":
/*!*************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/preferences/preferences.js ***!
  \*************************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* eslint-disable no-console */



var actions = __webpack_require__(/*! ./actions */ "./cartridges/bm_paypal/cartridge/client/default/js/preferences/actions.js");
var handlers = __webpack_require__(/*! ./handlers */ "./cartridges/bm_paypal/cartridge/client/default/js/preferences/handlers.js");
var AlertHandlerModel = __webpack_require__(/*! ../components/alertHandler */ "./cartridges/bm_paypal/cartridge/client/default/js/components/alertHandler.js");
var ApplyToOtherSitesWizard = __webpack_require__(/*! ./applyToOtherSitesWizard */ "./cartridges/bm_paypal/cartridge/client/default/js/preferences/applyToOtherSitesWizard.js");

/**
 * Makes fields inactive which should be inactive depending on pref value that influences their state
 * @param {Object} doc -
 * @returns {void}
 */
var makeFieldsInactive = function makeFieldsInactive(doc) {
  var relations = JSON.parse(doc.querySelector('[data-relations]').getAttribute('data-relations'));
  relations.forEach(function (relation) {
    var _doc$querySelector;
    var arrayOfOldValue = [].concat(relation.oldValue);
    var relationValue = (_doc$querySelector = doc.querySelector("[name=\"".concat(relation.id, "\"]"))) === null || _doc$querySelector === void 0 ? void 0 : _doc$querySelector.value;
    var conditionMatched = handlers.handlerConditions(relation.conditions);
    if (!(arrayOfOldValue.includes(relationValue) && conditionMatched)) {
      return;
    }
    relation.triggers.filter(function (trigger) {
      return trigger.type === 'disable' && trigger.value && trigger.onLoad;
    }).forEach(function (trigger) {
      doc.querySelector("[name=\"".concat(trigger.id, "\"]")).disabled = true;
    });
  });
};
(function (doc) {
  var alertHandler = new AlertHandlerModel();
  var applyToOtherSitesWizard = new ApplyToOtherSitesWizard();
  var JS_DW_VALUES = '.js-dw-values';
  var savedMultiValues = {};
  alertHandler.closeAlert();

  /**
   * Filters an array of rows based on whether their class name includes the given value.
   * @param {Array<HTMLElement>} rows - An array of row elements to filter.
   * @param {Array<HTMLElement>} messages - An array of messages elements.
   * @param {string} value - The value to filter the rows by.
   * @returns {void}
   */
  var filterRowsByValue = function filterRowsByValue(rows, messages, value) {
    var count = 0;
    rows.forEach(function (row) {
      if (row.className.includes(value)) {
        row.classList.remove('d-none');
      } else {
        row.classList.add('d-none');
        count++;
      }
    });
    messages.forEach(function (element) {
      element.classList[rows.length === count ? 'remove' : 'add']('ng-hide');
    });
  };

  /**
   * Handles filtering of preference attribute grids.
   * @returns {void}
   */
  var handlerFilterPreferences = function handlerFilterPreferences() {
    var inputs = doc.querySelectorAll('.js-search-field');
    var buttons = doc.querySelectorAll('.js-button-search');
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var parent = button.closest('.dw-PreferenceAttributegrid');
        var input = parent.querySelector('.js-search-field');
        var rows = parent.querySelectorAll('.dw-row');
        var messages = parent.querySelectorAll('.grid-message');
        filterRowsByValue(rows, messages, input.value.toLowerCase().trim());
      });
    });
    inputs.forEach(function (input) {
      input.addEventListener('change', function () {
        var parent = input.closest('.dw-PreferenceAttributegrid');
        var rows = parent.querySelectorAll('.dw-row');
        var messages = parent.querySelectorAll('.grid-message');
        filterRowsByValue(rows, messages, input.value.toLowerCase().trim());
      });
    });
  };

  /**
   * Stores saved multi values as serialized HTML fragment
   */
  var storeSavedMultiValues = function storeSavedMultiValues() {
    doc.querySelectorAll(JS_DW_VALUES).forEach(function (elem) {
      savedMultiValues[elem.dataset.attrName] = elem.outerHTML;
    });
  };

  /**
   * Updates fields data attr old-value
   * And stores saved multi values as serialized HTML fragment
   * @returns {void}
   */
  var updateDataAttrOldValue = function updateDataAttrOldValue() {
    var formId = this.form.id;
    doc.querySelectorAll("#".concat(formId, " .js-dw-collection-field")).forEach(function (elem) {
      var fieldOldValue = elem.firstElementChild.dataset.oldValue;
      var fieldCurrentValue = elem.firstElementChild.value;
      if (fieldOldValue !== fieldCurrentValue) {
        var multiValuesContainerEl = elem.querySelector(JS_DW_VALUES);
        if (multiValuesContainerEl) {
          savedMultiValues[multiValuesContainerEl.dataset.attrName] = multiValuesContainerEl.outerHTML;
        }
        elem.firstElementChild.dataset.oldValue = fieldCurrentValue;
      }
    });
  };

  /**
   * Restores Set of String newly added entries on cancel button click
   * @param {string} formId - Form ID
   * @returns {void}
   */
  var restoreMultiValues = function restoreMultiValues(formId) {
    doc.querySelectorAll("#".concat(formId, " .js-multi-value")).forEach(function (inputEl) {
      var oldValue = inputEl.dataset.oldValue;
      var currentValue = inputEl.value;
      if (oldValue !== currentValue) {
        var valuesContainerEl = inputEl.parentElement.querySelector(JS_DW_VALUES);
        valuesContainerEl.outerHTML = savedMultiValues[valuesContainerEl.dataset.attrName];
        inputEl.value = oldValue;
      }
    });
  };

  /**
   * Adds Set of Strings value as a separate value below the input
   * And stores it in hidden input to further submit it in the form
   * @returns {void}
   */
  var addMultiValue = function addMultiValue() {
    var storedValuesInputEl = this.parentElement.previousElementSibling;
    var valuesContainerEl = this.parentElement.nextElementSibling;
    var valueContainerEl = valuesContainerEl.firstElementChild.cloneNode(true);
    var valueTextEl = valueContainerEl.firstElementChild;
    var value = this.previousElementSibling.value.replace(/\s/g, '');
    valueTextEl.append(value);
    valueContainerEl.prepend(valueTextEl);
    valuesContainerEl.append(valueContainerEl);
    storedValuesInputEl.value = storedValuesInputEl.value.concat("".concat(storedValuesInputEl.value.length ? ',' : ''), value);
    this.previousElementSibling.value = '';
    this.disabled = true;
    valueContainerEl.classList.remove('d-none');
  };

  /**
   * The function adds value from the checkbox to the hidden multi-select input field
   * @returns {void}
   */
  var addValueFromCheckbox = function addValueFromCheckbox() {
    var checkboxContainerEl = this.parentElement;
    var inputFieldEl = checkboxContainerEl.parentElement.querySelector('.js-multi-value');
    var inputValue = inputFieldEl.value.length ? inputFieldEl.value.split(',') : [];
    if (this.checked) {
      inputValue.push(this.value);
    } else {
      inputValue.splice(inputValue.indexOf(this.value), 1);
    }
    inputFieldEl.value = inputValue.join(',');
  };

  /**
   * Removes Set of String value
   * @returns {void}
   */
  var removeMultiValue = function removeMultiValue() {
    var storedValuesInputEl = doc.querySelector("input[name=\"".concat(this.dataset.attrName, "\"]"));
    var value = this.previousElementSibling.innerText;
    storedValuesInputEl.value = storedValuesInputEl.value.split(',').filter(function (val) {
      return val !== value;
    }).join(',');
    this.parentElement.remove();
  };

  /**
   * Disables the button on input submit
   * @returns {void}
   */
  var enableAddButton = function enableAddButton() {
    this.nextElementSibling.disabled = false;
  };

  /**
   * Submits input value on enter
   * @param {Event} event keydown event
   * @returns {void}
   */
  var submitOnEnter = function submitOnEnter(event) {
    var KEY_ENTER = 13;
    if (event.keyCode === KEY_ENTER) {
      event.preventDefault();
      this.nextElementSibling.click();
    }
  };
  doc.addEventListener('DOMContentLoaded', function () {
    var forms = doc.querySelectorAll('.js-form-preferences');
    var attributes = doc.querySelectorAll('[data-dw-attr-id]');
    var instanceTypes = doc.querySelectorAll('.js-instance-type');
    var multiValueInputs = doc.querySelectorAll('.js-text-field');
    var checkboxInputs = doc.querySelectorAll('.js-input-checkbox');
    var dropdowns = doc.querySelectorAll('.js-dw-select');
    var actionSave = doc.querySelectorAll('.js-action-save');
    var actionAdd = doc.querySelectorAll('.js-action-add');
    var actionCancel = doc.querySelectorAll('.js-action-cancel');
    var actionApplyToSites = doc.querySelectorAll('.js-action-apply-to-sites');
    var wizardActionClose = doc.querySelector('.js-dw-wizard-close');
    var wizardToNextStage = doc.querySelector('.js-button-next');
    var wizardToPrevStage = doc.querySelector('.js-button-back');
    var wizardProgressItems = doc.querySelectorAll('[data-progress-id]');
    var wizardSelectAllSites = doc.querySelector('.js-select-all');
    var wizardActionApply = doc.querySelector('.js-button-apply');
    var wizardAlertActionProceed = doc.querySelector('.js-wizard-alert-ok');
    actions.storeClientId();
    handlerFilterPreferences();
    storeSavedMultiValues();
    makeFieldsInactive(doc);
    forms.forEach(function (form) {
      form.addEventListener('submit', actions.savePreferencesHandler);
    });
    attributes.forEach(function (element) {
      actions.fetchPropertyDescription(element);
    });
    instanceTypes.forEach(function (element) {
      element.addEventListener('change', actions.handlerInstanceType);
    });
    actionSave.forEach(function (button) {
      button.addEventListener('click', handlers.handlerBeforeSubmit);
      button.addEventListener('click', updateDataAttrOldValue);
    });
    actionAdd.forEach(function (button) {
      button.addEventListener('click', addMultiValue);
    });
    actionCancel.forEach(function (button) {
      button.addEventListener('click', function () {
        restoreMultiValues(this.form.id);
      });
    });
    multiValueInputs.forEach(function (input) {
      input.addEventListener('input', enableAddButton);
      input.addEventListener('keydown', submitOnEnter);
    });
    checkboxInputs.forEach(function (checkbox) {
      checkbox.addEventListener('click', addValueFromCheckbox);
    });
    actionApplyToSites.forEach(function (button) {
      button.addEventListener('click', handlers.handlerBeforeSubmit);
      button.addEventListener('click', function () {
        applyToOtherSitesWizard.show(this.form.id);
      });
    });
    dropdowns.forEach(function (dropdown) {
      dropdown.addEventListener('change', function () {
        handlers.handleOldValueAttrChange(this);
        handlers.handlerRelations(this.name);
      });
    });
    wizardProgressItems.forEach(function (itemEl) {
      itemEl.addEventListener('click', function () {
        return applyToOtherSitesWizard.handleProgressBarClick(itemEl);
      });
    });
    wizardAlertActionProceed.addEventListener('click', function () {
      applyToOtherSitesWizard.proceedToWizard(this.form.id);
      restoreMultiValues(this.form.id);
    });
    wizardActionClose.addEventListener('click', function () {
      return applyToOtherSitesWizard.close();
    });
    wizardToNextStage.addEventListener('click', function () {
      return applyToOtherSitesWizard.toNextStage();
    });
    wizardToPrevStage.addEventListener('click', function () {
      return applyToOtherSitesWizard.toPrevStage();
    });
    wizardSelectAllSites.addEventListener('click', function () {
      return applyToOtherSitesWizard.selectAllSites();
    });
    wizardActionApply.addEventListener('click', function (event) {
      return applyToOtherSitesWizard.apply(event, actions.savePreferencesHandler);
    });
    doc.body.addEventListener('click', function (event) {
      if (event.target.classList.contains('js-action-remove')) {
        removeMultiValue.call(event.target);
      }
    });
  });
})(document);

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
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!*************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/preferences.js ***!
  \*************************************************************************/


__webpack_require__(/*! ./preferences/preferences */ "./cartridges/bm_paypal/cartridge/client/default/js/preferences/preferences.js");
})();

/******/ })()
;