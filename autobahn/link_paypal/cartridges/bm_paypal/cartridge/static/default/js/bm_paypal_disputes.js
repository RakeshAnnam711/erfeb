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

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/components/modal.js":
/*!******************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/components/modal.js ***!
  \******************************************************************************/
/***/ ((module) => {

"use strict";


/**
 * Modal
 * @class
 */
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Modal = /*#__PURE__*/function () {
  /**
   * @param {Object} options - Options for Ext Window component
   */
  function Modal(options) {
    _classCallCheck(this, Modal);
    this.modal = new Ext.Window(options);
  }

  /**
   * Show modal
   * @returns {void}
   */
  return _createClass(Modal, [{
    key: "show",
    value: function show() {
      this.modal.show();
    }

    /**
     * Close modal
     * @returns {void}
     */
  }, {
    key: "close",
    value: function close() {
      this.modal.close();
    }

    /**
     * Center modal
     * @returns {void}
     */
  }, {
    key: "center",
    value: function center() {
      var windowWidth = window.innerWidth - 30;
      var windowHeight = window.innerHeight - 30;
      this.modal.setHeight('auto');
      if (this.modal.getSize().width > windowWidth) {
        this.modal.setWidth(windowWidth);
      }
      if (this.modal.getSize().height > windowHeight) {
        this.modal.setHeight(windowHeight);
      }
      this.modal.center();
    }
  }]);
}();
module.exports = Modal;

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/components/pieChart.js":
/*!*********************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/components/pieChart.js ***!
  \*********************************************************************************/
/***/ ((module) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
var PI = Math.PI;
var namespaceURI = 'http://www.w3.org/2000/svg';

/**
 * Creates a new Pie Chart
 * @class
 */
var PieChart = /*#__PURE__*/function () {
  /**
   * @param {SVGElement} element - SVG element
   * @param {Array} data - Chart data (value, color, legend label)
   */
  function PieChart(element, data) {
    _classCallCheck(this, PieChart);
    this.data = data;
    this.svg = element;
    this.offset = 7;
    this.rectSize = 15;
  }

  /**
   * Render chart
   */
  return _createClass(PieChart, [{
    key: "render",
    value: function render() {
      if (!this.svg || !this.data.length) {
        return;
      }
      this.chartPosition();
      this.addArcs();
      this.addLegend();
    }

    /**
     * Calculate chart position
     */
  }, {
    key: "chartPosition",
    value: function chartPosition() {
      this.svg.innerHTML = '';
      this.width = parseInt(this.svg.getAttribute('width'));
      this.height = parseInt(this.svg.getAttribute('height'));
      var legendHeight = this.data.length * (this.rectSize + this.offset) - this.offset;
      if (legendHeight > this.height) {
        this.svg.setAttribute('height', legendHeight);
        this.height = legendHeight;
      }
      this.radius = Math.round(Math.min(this.width / 2, this.height) / 2.25);
      this.centerX = this.radius;
      this.centerY = this.height / 2;
      this.chartGroup = document.createElementNS(namespaceURI, 'g');
      this.chartGroup.setAttribute('transform', "translate(".concat(this.centerX, ",").concat(this.centerY, ")"));
      this.svg.appendChild(this.chartGroup);
    }

    /**
     * Add a sector to a chart
     */
  }, {
    key: "addArcs",
    value: function addArcs() {
      var _this = this;
      var startAngle = 0;
      var radius = this.radius;
      if (this.data.length === 1) {
        var circle = document.createElementNS(namespaceURI, 'circle');
        circle.setAttribute('cx', 0);
        circle.setAttribute('cy', 0);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', this.data[0].color);
        this.chartGroup.appendChild(circle);
        return;
      }
      this.data.forEach(function (item) {
        var endAngle = startAngle + item.count / _this.data.reduce(function (total, d) {
          return total + d.count;
        }, 0) * 360;
        var startX = radius * Math.cos((startAngle - 90) * (PI / 180));
        var startY = radius * Math.sin((startAngle - 90) * (PI / 180));
        var endX = radius * Math.cos((endAngle - 90) * (PI / 180));
        var endY = radius * Math.sin((endAngle - 90) * (PI / 180));
        var path = document.createElementNS(namespaceURI, 'path');
        var pathValue = "M ".concat(startX, ",").concat(startY, " A ").concat(radius, ",").concat(radius, " 0 ").concat(endAngle - startAngle > 180 ? 1 : 0, ",1 ").concat(endX, ",").concat(endY, " L 0,0 Z");
        path.setAttribute('d', pathValue);
        path.setAttribute('fill', item.color);
        _this.chartGroup.appendChild(path);
        startAngle = endAngle;
      });
    }

    /**
     * Add legend
     */
  }, {
    key: "addLegend",
    value: function addLegend() {
      var _this2 = this;
      var textSpaceY = 12;
      var offset = this.rectSize + this.offset;
      var legendX = this.centerX + this.radius + this.rectSize;
      var legendY = (this.height - this.data.length * offset) / 2;
      if (legendY < 0) {
        legendY = 0;
      }
      this.data.forEach(function (item) {
        var legendRect = document.createElementNS(namespaceURI, 'rect');
        legendRect.setAttribute('x', legendX);
        legendRect.setAttribute('y', legendY);
        legendRect.setAttribute('width', _this2.rectSize);
        legendRect.setAttribute('height', _this2.rectSize);
        legendRect.setAttribute('fill', item.color);
        var legendText = document.createElementNS(namespaceURI, 'text');
        legendText.setAttribute('x', legendX + offset);
        legendText.setAttribute('y', legendY + textSpaceY);
        legendText.setAttribute('font-weight', '400');
        legendText.textContent = "".concat(item.label, " (").concat(item.count, ")");
        if (item.textColor) {
          legendText.setAttribute('fill', item.textColor);
        }
        _this2.svg.appendChild(legendRect);
        _this2.svg.appendChild(legendText);
        legendY += offset;
      });
    }

    /**
     * Get chart data from element
     * @param {SVGAElement} element - SVG DOM element
     * @param {Object} colors - Colors data
     * @returns {Array} - Chart data (value, color, legend label)
     */
  }], [{
    key: "init",
    value:
    /**
     * Init Pie Chart
     * @param {SVGElement} element - SVG element
     * @param {Array} colors - Colors, format example { key: { color: '#d46a6a' }, ... }
     */
    function init(element, colors) {
      var _this3 = this;
      if (!(element && element instanceof SVGElement)) {
        return;
      }
      var observer = new MutationObserver(function (mutationsList) {
        mutationsList.forEach(function (mutation) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-stats') {
            new PieChart(mutation.target, _assertClassBrand(PieChart, _this3, _getChartData).call(_this3, mutation.target, colors)).render();
          }
        });
      });
      new PieChart(element, _assertClassBrand(PieChart, this, _getChartData).call(this, element, colors)).render();
      observer.observe(element, {
        attributes: true
      });
    }
  }]);
}();
function _getChartData(element, colors) {
  var stats = JSON.parse(element.dataset.stats);
  return Object.values(stats).reduce(function (accum, item) {
    accum.push(Object.assign(item, colors[item.value]));
    return accum;
  }, []).sort(function (prev, next) {
    return prev.label > next.label ? 1 : -1;
  });
}
module.exports = PieChart;

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/disputes/dispute.js":
/*!******************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/disputes/dispute.js ***!
  \******************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Modal = __webpack_require__(/*! ../components/modal */ "./cartridges/bm_paypal/cartridge/client/default/js/components/modal.js");
var paypalAdmin = __webpack_require__(/*! ../transactions/paypalAdmin */ "./cartridges/bm_paypal/cartridge/client/default/js/transactions/paypalAdmin.js");

/**
 * Dispute Details
 * @class
 */
var Dispute = /*#__PURE__*/function () {
  /**
   * @constructor
   * @param {string} id - Dispute ID
   */
  function Dispute(id) {
    _classCallCheck(this, Dispute);
    this.id = id;
    this.loader = new Ext.LoadMask(Ext.getBody(), {
      msg: window.paypalAdminConfig.resources.pleaseWait
    });
  }

  /**
   * Render modal window
   * @param {string} html - HTML markup
   */
  return _createClass(Dispute, [{
    key: "render",
    value: function render(html) {
      var _this = this;
      this.modal = new Modal({
        title: "Dispute: ".concat(this.id),
        width: 780,
        height: 200,
        html: html,
        modal: true,
        autoScroll: true,
        cls: 'paypalbm_window_content',
        listeners: {
          show: function show() {
            _this.updateDispute();
            paypalAdmin.init();
            paypalAdmin.accordion();
          }
        }
      });
      this.loader.hide();
      this.modal.show();
      this.modal.center();
      window.addEventListener('resize', function () {
        _this.modal.center();
      });
      window.addEventListener('orientationchange', function () {
        _this.modal.center();
      });
    }

    /**
     * Updates dispute stats in Pie Chart
     * @returns {void}
     */
  }, {
    key: "updateDispute",
    value: function updateDispute() {
      var element = document.querySelector('.js-dispute-for-update');
      if (!element) {
        return;
      }
      var disputeData = JSON.parse(element.dataset.dispute);
      if (!Object.keys(disputeData).length) {
        return;
      }
      var pieChartEl = document.querySelector('.js-dispute-pie-chart');
      if ('status' in disputeData && pieChartEl) {
        pieChartEl.setAttribute('data-stats', element.dataset.stats);
      }
      var dispute = document.querySelector("tr[data-dispute-id=\"".concat(element.dataset.disputeId, "\"]"));
      Object.keys(disputeData).forEach(function (name) {
        dispute.querySelector(".dispute-".concat(name)).textContent = disputeData[name];
      });
    }

    /**
     * Show error message
     * @static
     * @param {string} msg - Message
     */
  }], [{
    key: "showErrorMessage",
    value: function showErrorMessage(msg) {
      Ext.Msg.show({
        msg: msg,
        buttons: Ext.Msg.OK,
        icon: Ext.MessageBox.ERROR,
        title: window.paypalAdminConfig.resources.errorMsgTitle
      });
    }
  }]);
}();
module.exports = Dispute;

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/disputes/disputes.js":
/*!*******************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/disputes/disputes.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/* eslint-disable no-console */
var Dispute = __webpack_require__(/*! ./dispute */ "./cartridges/bm_paypal/cartridge/client/default/js/disputes/dispute.js");
var PieChart = __webpack_require__(/*! ../components/pieChart */ "./cartridges/bm_paypal/cartridge/client/default/js/components/pieChart.js");
(function (doc) {
  /**
   * Init Pie Chart
   */
  var initPieChart = function initPieChart() {
    var colors = {
      OPEN: {
        color: '#d46a6a'
      },
      WAITING_FOR_BUYER_RESPONSE: {
        color: '#ffa366'
      },
      WAITING_FOR_SELLER_RESPONSE: {
        color: '#ffeb85'
      },
      UNDER_REVIEW: {
        color: '#4f9fd1'
      },
      RESOLVED: {
        color: '#6ebd68'
      },
      OTHER: {
        color: '#a3a8b1'
      }
    };
    PieChart.init(doc.querySelector('.js-dispute-pie-chart'), colors);
  };

  /**
   * Init Dispute Details
   */
  var initDisputeDetails = function initDisputeDetails() {
    var buttons = doc.querySelectorAll('.js-dispute-details');
    buttons.forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        var url = new URL(button.href);
        url.searchParams.append('format', 'ajax');
        var dispute = new Dispute(url.searchParams.get('dispute_id'));
        dispute.loader.show();
        fetch(url.toString()).then(function (response) {
          return response.text();
        }).then(function (html) {
          dispute.render(html);
        }).catch(function (error) {
          dispute.loader.hide();
          Dispute.showErrorMessage(error.message);
        });
      });
    });
  };

  /**
   * Handles tab switcher
   * @param {Event} e event in the Event object
   * @returns {boolean} returns false
   */
  var handleTabSwitcher = function handleTabSwitcher(e) {
    var activeTabClass = 'paypalbm_active_link';
    var target = e.target;
    var targetBlockId = target.getAttribute('href');
    var switchBlockClass = '.js_paypalbm_switch_block.table-row';
    if (!target.classList.contains(activeTabClass)) {
      var activeBlock = doc.querySelector(switchBlockClass);
      var targetBlock = doc.querySelector(targetBlockId);
      doc.querySelector('.js_paypalbm_switch.paypalbm_active_link').classList.remove(activeTabClass);
      target.classList.add(activeTabClass);
      activeBlock.classList.remove('table-row');
      activeBlock.classList.add('none');
      targetBlock.classList.remove('none');
      targetBlock.classList.add('table-row');
    }
    return false;
  };

  /**
   * Init Tab Switcher
   */
  var initTabSwitcher = function initTabSwitcher() {
    var isDisputePage = !!doc.querySelector('.js_paypal_disputes_page');
    if (!isDisputePage) {
      return;
    }
    var activeTab = doc.querySelector('.js_paypalbm_switch.paypalbm_active_link');
    if (!activeTab) {
      return;
    }
    doc.querySelectorAll('.js_paypalbm_switch').forEach(function (element) {
      element.addEventListener('click', function (event) {
        handleTabSwitcher(event);
      });
    });
    activeTab.dispatchEvent(new Event('click'));
  };
  doc.addEventListener('DOMContentLoaded', function () {
    initPieChart();
    initDisputeDetails();
    initTabSwitcher();
  });
})(document);

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/helpers/helper.js":
/*!****************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/helpers/helper.js ***!
  \****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


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

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/transactions/paypalAdmin.js":
/*!**************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/transactions/paypalAdmin.js ***!
  \**************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable no-use-before-define */
/* global Ext */

var paypalAdmin = function () {
  var helper = __webpack_require__(/*! ../helpers/helper.js */ "./cartridges/bm_paypal/cartridge/client/default/js/helpers/helper.js");
  var actionFormWindow;
  var accordionHandler;
  var transactionDetailWindow;
  var PAYPAL_BM_CONTENT_SELECTOR = '.js-paypalbm-content';
  var PAYPAL_BM_ORDER_DETAIL_SELECTOR = '.js_paypalbm_order_detail';
  var CLOSE_TOOL_SELECTOR = '.x-tool-close';
  var DATA_ATTRIBUTE = {
    TOKEN: 'data-token',
    MAX_COUNT: 'data-maxcount',
    VALIDATION: 'data-validation',
    GENERAL_VALIDATION: 'data-general-validation',
    MAX_VALUE: 'data-max-value',
    ACTION: 'data-action',
    TITLE: 'data-title',
    ORDERNO: 'data-orderno',
    ORDER_TOKEN: 'data-order-token',
    DISABLE: 'data-disable',
    TEXT_DISABLE: 'data-text-disable',
    TEXT_ENABLE: 'data-text-enable',
    URL: 'data-url'
  };

  /**
   * Inits textarea
   * @param {HTMLElement} parentEl - parent DOM Element
   */
  function initTextareaCharactersLeft(parentEl) {
    parentEl = parentEl || document;
    parentEl.querySelectorAll('textarea[data-maxcount]').forEach(function (textareaEl) {
      var countInputEl = textareaEl.parentNode.querySelector('.js_textarea_count');
      var maxCount = parseFloat(textareaEl.getAttribute(DATA_ATTRIBUTE.MAX_COUNT));
      countInputEl.textContent = maxCount.toString();
      textareaEl.addEventListener('keyup', function (event) {
        event.preventDefault();
        var text = textareaEl.value;
        var left = maxCount - text.length;
        if (left >= 0) {
          countInputEl.textContent = left.toString();
        }
        textareaEl.value = text.slice(0, maxCount);
      });
    });
  }

  /**
   * Shows error message
   * @param {string} text - error text
   */
  function showErrorMessage(text) {
    Ext.Msg.show({
      title: window.paypalAdminConfig.resources.errorMsgTitle,
      msg: text,
      buttons: Ext.Msg.OK,
      icon: Ext.MessageBox.ERROR
    });
  }

  /**
   * Recalculates modal window size
   * @param {HTMLElement} element - DOM Element
   */
  function recalculateModalWindowSize(element) {
    var modalWindow;
    if (typeof element === 'undefined') {
      var xWindowEls = document.querySelectorAll('.x-window');
      xWindowEls.forEach(function (windowEl) {
        recalculateModalWindowSize(windowEl.getAttribute('id'));
      });
      return;
    }
    if (element.ctype === 'Ext.Component') {
      modalWindow = element;
    }
    if (typeof element === 'string') {
      modalWindow = Ext.getCmp(element);
    }
    var windowHeight = window.innerHeight - 30;
    var scrollTop = modalWindow.body.getScroll().top;
    modalWindow.setHeight('auto');
    var modalWindowHeight = modalWindow.getSize().height;
    if (modalWindowHeight > windowHeight) {
      modalWindow.setHeight(windowHeight);
    }
    modalWindow.center();
    modalWindow.body.scrollTo('top', scrollTop);
  }

  /**
   * Validate value by different rules (required, float, greaterzero, limit) for
   * @param {string} rule - Rule.
   * @param {string} value - Value.
   * @param {HTMLElement} fieldEl - HTML element
   * @returns {string|true} - If valid true otherwise broken rule name
   */
  function validateRule(rule, value, fieldEl) {
    switch (rule) {
      case 'required':
        if (!value.length) {
          return rule;
        }
        break;
      case 'float':
        if (Number.isNaN(parseFloat(value)) || !Number.isFinite(parseFloat(value))) {
          return rule;
        }
        break;
      case 'greaterzero':
        if (Number.isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          return rule;
        }
        break;
      case 'maxvalue':
        var maxValue = fieldEl.getAttribute(DATA_ATTRIBUTE.MAX_VALUE);
        if (parseFloat(value) > parseFloat(maxValue)) {
          return rule;
        }
        break;
    }
    return true;
  }

  /**
   * Validating form
   * @param {HTMLElement} formEl - form DOM Element
   * @returns {boolean} true if form is valid
   */
  function isFormValid(formEl) {
    var isValid = true;
    formEl.querySelectorAll('.paypal_error_msg_box').forEach(function (element) {
      element.style.display = 'none';
    });
    formEl.querySelectorAll('.paypal_error_field').forEach(function (element) {
      element.classList.remove('paypal_error_field');
    });
    formEl.querySelectorAll('[data-validation]').forEach(function (element) {
      if (element.disabled) {
        return;
      }
      var rules = element.getAttribute(DATA_ATTRIBUTE.VALIDATION).replace(/\s/, '').split(',');
      var value = element.value.trim();
      var brokenRule = rules.find(function (rule) {
        return rule === validateRule(rule, value, element);
      });
      if (rules.includes(brokenRule)) {
        var name = element.getAttribute(DATA_ATTRIBUTE.GENERAL_VALIDATION) || element.getAttribute('name');
        isValid = false;
        element.closest('tr').classList.add('paypal_error_field');
        formEl.querySelector(".paypal_error_msg_box_".concat(name, "_").concat(brokenRule)).style.display = 'block';
        recalculateModalWindowSize();
      }
    });
    return isValid;
  }

  /**
   * Reloads page
   */
  function reloadPage() {
    var element = document.querySelector(CLOSE_TOOL_SELECTOR);
    if (!element) {
      window.location.reload();
    }
    element.addEventListener('click', function (event) {
      event.preventDefault();
      window.location.reload();
    });
  }

  /**
   * Submits form
   * @param {HTMLElement} formEl - form DOM Element
   * @param {string} action - action name
   * @returns {boolean} true if success
   */
  function submitActionForm(formEl, action) {
    if (!isFormValid(formEl)) {
      return false;
    }
    actionFormWindow.maskOver.show(action);
    var formData = helper.serializeForm(formEl);
    fetch("".concat(formEl.action, "?").concat(formData), {
      method: 'POST'
    }).then(function (response) {
      return response.json();
    }).then(function (data) {
      actionFormWindow.maskOver.hide();
      if (data.result === 'Success' && data.details.ack === 'Success') {
        if (action === 'sale') {
          submitCaptureForm(formEl, data);
        }
        actionFormWindow.close();
        if (paypalAdmin.currentOrderNo) {
          loadOrderTransaction({
            orderToken: paypalAdmin.orderToken,
            orderNo: paypalAdmin.currentOrderNo,
            transactionId: data.transactionid,
            currencyCode: paypalAdmin.currentCurrencyCode
          });
        } else if (data.details && data.details.action !== 'DoAuthorize') {
          window.location.reload();
        }
      } else if (data.details.l_longmessage0) {
        showErrorMessage(data.details.l_longmessage0);
      } else {
        showErrorMessage(window.paypalAdminConfig.resources.serverError);
      }
      reloadPage();
    }).catch(function () {
      actionFormWindow.maskOver.hide();
      transactionDetailWindow.close();
      actionFormWindow.close();
    });
    return true;
  }

  /**
   * Submits form
   * @param {HTMLElement} formEl - form DOM Element
   * @param {Object} responseData - response data
   */
  function submitCaptureForm(formEl, responseData) {
    formEl.querySelector('[name=methodName]').value = 'DoCapture';
    formEl.querySelector('[name=authorizationId]').value = responseData.transactionid;
    submitActionForm(formEl, 'capture');
  }

  /**
   * Validating form
   * @param {HTMLElement} parentEl - form DOM Element
   * @param {string} action - action name
   */
  function initActionFormEvents(parentEl, action) {
    parentEl.querySelector('form').addEventListener('submit', function (event) {
      event.preventDefault();
      var targetEl = event.target;
      submitActionForm(targetEl, action);
    });
  }

  /**
   * Validating form
   * @param {Ext} panel - instance of Ext
   * @returns {Object} mask over object
   */
  function createMaskOver(panel) {
    return function () {
      return {
        ext: new Ext.LoadMask(panel.getEl()),
        show: function show(type) {
          this.ext.msg = window.paypalAdminConfig.resources.loadMaskText[type] || window.paypalAdminConfig.resources.pleaseWait;
          this.ext.show();
        },
        hide: function hide() {
          this.ext.hide();
        }
      };
    }();
  }

  /**
   * Closes transaction detail window
   */
  function closeTransactionDetailWindow() {
    transactionDetailWindow.maskOver.hide();
    if (transactionDetailWindow) {
      transactionDetailWindow.close();
    }
  }

  /**
   * Loads order transaction
   * @param {Object} transactionData - transaction data object.
   * @param {string} transactionData.orderToken - order token
   * @param {string} transactionData.orderNo - order number
   * @param {string} transactionData.transactionId -transaction id
   * @param {string} transactionData.currencyCode - currency code
   */
  function loadOrderTransaction(transactionData) {
    var data = {
      format: 'ajax',
      orderNo: transactionData.orderNo || '',
      orderToken: transactionData.orderToken,
      transactionId: transactionData.transactionId || '',
      currencyCode: transactionData.currencyCode
    };
    transactionDetailWindow.maskOver.show();
    fetch("".concat(window.paypalAdminConfig.urls.orderTransaction, "?").concat(new URLSearchParams(data))).then(function (response) {
      return response.text();
    }).then(function (_data) {
      if (transactionDetailWindow) {
        transactionDetailWindow.maskOver.hide();
      }
      var content = transactionDetailWindow ? document.getElementById(transactionDetailWindow.body.id) : document.querySelector(PAYPAL_BM_CONTENT_SELECTOR);
      content.innerHTML = _data;
      if (transactionDetailWindow) {
        transactionDetailWindow.setHeight('auto');
        transactionDetailWindow.center();
      }
      initOrderTransaction();
      recalculateModalWindowSize();
    }).catch(function () {
      closeTransactionDetailWindow();
    });
  }

  /**
   * Accordion Handler
   * @param {function} callback - callback function
   * @returns {void}
  */
  var createAccordionHandler = function createAccordionHandler(callback) {
    return function (event) {
      event.preventDefault();
      var parentEl = event.currentTarget.parentElement;
      var accordionActiveClass = 'is_opened';
      if (parentEl.classList.contains(accordionActiveClass)) {
        parentEl.classList.remove(accordionActiveClass);
      } else {
        parentEl.classList.add(accordionActiveClass);
        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    };
  };

  /**
   * Accordion function
   * @param {function} callback - callback function
   */
  function accordion(callback) {
    var accordionEls = document.querySelectorAll('.js_pp_accordion .pp_accordion_head');
    if (accordionHandler) {
      accordionEls.forEach(function (element) {
        return element.removeEventListener('click', accordionHandler);
      });
    }
    accordionHandler = createAccordionHandler(callback);
    accordionEls.forEach(function (element) {
      return element.addEventListener('click', accordionHandler);
    });
  }

  /**
   * Inits order transaction
   */
  function initOrderTransaction() {
    var paypalBmOrderDetailEl = document.querySelector(PAYPAL_BM_ORDER_DETAIL_SELECTOR);
    if (!paypalBmOrderDetailEl) {
      return;
    }
    var dataAttr = paypalBmOrderDetailEl.dataset;
    paypalAdmin.currentOrderNo = dataAttr.orderno;
    paypalAdmin.orderToken = dataAttr.ordertoken;
    paypalAdmin.currentCurrencyCode = dataAttr.currencycode;
    document.querySelectorAll('.js_paypal_action').forEach(function (buttonEl) {
      buttonEl.addEventListener('click', function () {
        var action = buttonEl.getAttribute(DATA_ATTRIBUTE.ACTION);
        var formContainerElement = document.querySelector("#paypal_".concat(action, "_form"));
        var formContainerClass = 'js_paypal_action_form_container_' + action;
        actionFormWindow = new Ext.Window({
          title: buttonEl.getAttribute(DATA_ATTRIBUTE.TITLE),
          width: 700,
          modal: true,
          autoScroll: true,
          cls: 'paypalbm_window_content ' + formContainerClass,
          listeners: {
            render: function render() {
              actionFormWindow.body.insertHtml('afterBegin', formContainerElement.innerHTML);
              initTextareaCharactersLeft(actionFormWindow.body.dom);
              initActionFormEvents(actionFormWindow.body.dom, action);
            }
          },
          buttons: [{
            text: window.paypalAdminConfig.resources.submit,
            handler: function handler() {
              submitActionForm(document.querySelector('.' + formContainerClass).querySelector('form'), action);
            }
          }, {
            text: window.paypalAdminConfig.resources.cancel,
            handler: function handler() {
              actionFormWindow.close();
            }
          }]
        });
        actionFormWindow.show();
        actionFormWindow.maskOver = createMaskOver(actionFormWindow);
        recalculateModalWindowSize();
      });
    });
    document.querySelector('.js_paypalbm_order_transactions_ids').addEventListener('change', function (event) {
      event.preventDefault();
      var targetEl = event.target;
      var transactionId = targetEl.value;
      loadOrderTransaction({
        orderToken: paypalAdmin.orderToken,
        orderNo: paypalAdmin.currentOrderNo,
        transactionId: transactionId,
        currencyCode: paypalAdmin.currentCurrencyCode
      });
    });
    accordion(recalculateModalWindowSize);
  }

  /**
   * Inits all events
   */
  function initEvents() {
    var showDetailButtonEls = document.querySelectorAll('.js-paypal-show-detail');
    showDetailButtonEls.forEach(function (buttonEl) {
      buttonEl.addEventListener('click', function (event) {
        event.preventDefault();
        transactionDetailWindow = new Ext.Window({
          title: buttonEl.title,
          width: 780,
          height: 200,
          modal: true,
          autoScroll: true,
          cls: 'paypalbm_window_content'
        });
        transactionDetailWindow.show();
        transactionDetailWindow.maskOver = createMaskOver(transactionDetailWindow);
        var dataAttr = buttonEl.dataset;
        loadOrderTransaction({
          orderToken: dataAttr.ordertoken,
          orderNo: dataAttr.orderno,
          transactionId: dataAttr.transactionid,
          currencyCode: dataAttr.currencycode
        });
      });
    });
  }
  return {
    accordion: accordion,
    pieChart: function pieChart() {
      var colors = {
        CREATED: {
          color: '#b3e5fc'
        },
        CAPTURED: {
          color: '#66bb6a'
        },
        PARTIALLY_CAPTURED: {
          color: '#a2bf56'
        },
        PENDING: {
          color: '#ffeb3b'
        },
        COMPLETED: {
          color: '#2e7d32'
        },
        PARTIALLY_REFUNDED: {
          color: '#ffcc80'
        },
        REFUNDED: {
          color: '#ef9a9a'
        },
        VOIDED: {
          color: '#ba68c8'
        },
        EXPIRED: {
          color: '#696969'
        },
        FAILED: {
          color: '#e57373'
        },
        DENIED: {
          color: '#bcaaa4'
        },
        DECLINED: {
          color: '#b71c1c'
        },
        CANCELLED: {
          color: '#ffab91'
        },
        'N/A': {
          color: '#b0bec5'
        }
      };
      var PieChart = __webpack_require__(/*! ../components/pieChart.js */ "./cartridges/bm_paypal/cartridge/client/default/js/components/pieChart.js");
      PieChart.init(document.querySelector('.js-transaction-pie-chart'), colors);
    },
    init: function init() {
      initEvents();
      if (document.querySelector(PAYPAL_BM_ORDER_DETAIL_SELECTOR)) {
        initOrderTransaction();
      }
    }
  };
}();
module.exports = paypalAdmin;

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
/*!**********************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/disputes.js ***!
  \**********************************************************************/


__webpack_require__(/*! ./disputes/disputes */ "./cartridges/bm_paypal/cartridge/client/default/js/disputes/disputes.js");
})();

/******/ })()
;