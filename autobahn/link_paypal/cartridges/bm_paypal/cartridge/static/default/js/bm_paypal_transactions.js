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

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/components/dateShortcuts.js":
/*!**************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/components/dateShortcuts.js ***!
  \**************************************************************************************/
/***/ ((module) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
var MS_PER_DAY = 24 * 60 * 60 * 1000;
var _date = /*#__PURE__*/new WeakMap();
var _endEl = /*#__PURE__*/new WeakMap();
var _startEl = /*#__PURE__*/new WeakMap();
var _hiddenEl = /*#__PURE__*/new WeakMap();
var _elements = /*#__PURE__*/new WeakMap();
var _shortcuts = /*#__PURE__*/new WeakMap();
var _activeClass = /*#__PURE__*/new WeakMap();
var _DateShortcuts_brand = /*#__PURE__*/new WeakSet();
var DateShortcuts = /*#__PURE__*/function () {
  function DateShortcuts() {
    _classCallCheck(this, DateShortcuts);
    /**
     * Add event listeners
     */
    _classPrivateMethodInitSpec(this, _DateShortcuts_brand);
    _classPrivateFieldInitSpec(this, _date, void 0);
    _classPrivateFieldInitSpec(this, _endEl, void 0);
    _classPrivateFieldInitSpec(this, _startEl, void 0);
    _classPrivateFieldInitSpec(this, _hiddenEl, void 0);
    _classPrivateFieldInitSpec(this, _elements, void 0);
    _classPrivateFieldInitSpec(this, _shortcuts, void 0);
    _classPrivateFieldInitSpec(this, _activeClass, void 0);
    _classPrivateFieldSet(_activeClass, this, 'active');
    _classPrivateFieldSet(_startEl, this, document.querySelector('.search-min'));
    _classPrivateFieldSet(_endEl, this, document.querySelector('.search-max'));
    _classPrivateFieldSet(_hiddenEl, this, document.querySelector('[name="dateShortcut"]'));
    _classPrivateFieldSet(_elements, this, Array.from(document.querySelectorAll('.js-date-shortcut')));
    _classPrivateFieldSet(_shortcuts, this, {
      'today': {
        start: _assertClassBrand(_DateShortcuts_brand, this, _today),
        end: _assertClassBrand(_DateShortcuts_brand, this, _today)
      },
      'this-month': {
        start: _assertClassBrand(_DateShortcuts_brand, this, _beginningOfMonth),
        end: _assertClassBrand(_DateShortcuts_brand, this, _endOfMonth)
      },
      'last-month': {
        start: _assertClassBrand(_DateShortcuts_brand, this, _beginningOfLastMonth),
        end: _assertClassBrand(_DateShortcuts_brand, this, _endOfLastMonth)
      },
      'past-thirty-days': {
        start: _assertClassBrand(_DateShortcuts_brand, this, _thirtyDaysAgo),
        end: _assertClassBrand(_DateShortcuts_brand, this, _today)
      },
      'this-year': {
        start: _assertClassBrand(_DateShortcuts_brand, this, _beginningOfYear),
        end: _assertClassBrand(_DateShortcuts_brand, this, _endOfYear)
      }
    });
  }

  /**
   * Init events
   * @returns {void}
   */
  return _createClass(DateShortcuts, [{
    key: "init",
    value: function init() {
      if (!(_classPrivateFieldGet(_elements, this).length && _classPrivateFieldGet(_startEl, this) && _classPrivateFieldGet(_endEl, this))) {
        return;
      }
      _assertClassBrand(_DateShortcuts_brand, this, _addEvents).call(this);
      _assertClassBrand(_DateShortcuts_brand, this, _calendarSetup).call(this);
    }
  }]);
}();
function _addEvents() {
  var _this = this;
  _classPrivateFieldGet(_elements, this).forEach(function (element) {
    element.addEventListener('click', _assertClassBrand(_DateShortcuts_brand, _this, _handleShortcut).bind(_this));
  });
  _classPrivateFieldGet(_endEl, this).addEventListener('input', _assertClassBrand(_DateShortcuts_brand, this, _makeElementsInactive).bind(this));
  _classPrivateFieldGet(_startEl, this).addEventListener('input', _assertClassBrand(_DateShortcuts_brand, this, _makeElementsInactive).bind(this));
}
/**
 * Setup calendar for date from, date to
 * @returns {void}
 */
function _calendarSetup() {
  var _this2 = this;
  if (!(window.Calendar && window.Calendar.setup)) {
    return;
  }
  var format = '%m/%d/%Y';
  [_classPrivateFieldGet(_startEl, this), _classPrivateFieldGet(_endEl, this)].forEach(function (element) {
    window.Calendar.setup({
      ifFormat: format,
      inputField: element.id,
      button: element.id + '-btn',
      onUpdate: _assertClassBrand(_DateShortcuts_brand, _this2, _makeElementsInactive).bind(_this2)
    });
  });
}
/**
 * Handler for click event on shortcut and set date from, date to
 * @param {Object} event - Event object
 * @param {Element} event.target - HTML target element
 * @returns {void}
 */
function _handleShortcut(_ref) {
  var target = _ref.target;
  if (target.classList.contains(_classPrivateFieldGet(_activeClass, this))) {
    return;
  }
  var shortcut = _classPrivateFieldGet(_shortcuts, this)[target.dataset.shortcut];
  _classPrivateFieldGet(_hiddenEl, this).value = target.dataset.shortcut;
  _assertClassBrand(_DateShortcuts_brand, this, _initiateDate).call(this);
  _classPrivateFieldGet(_startEl, this).value = shortcut.start.call(this);
  _assertClassBrand(_DateShortcuts_brand, this, _initiateDate).call(this);
  _classPrivateFieldGet(_endEl, this).value = shortcut.end.call(this);
  _assertClassBrand(_DateShortcuts_brand, this, _makeElementsInactive).call(this);
  target.classList.add(_classPrivateFieldGet(_activeClass, this));
}
/**
 * Make all elements inactive
 */
function _makeElementsInactive() {
  var _this3 = this;
  _classPrivateFieldGet(_elements, this).forEach(function (element) {
    element.classList.remove(_classPrivateFieldGet(_activeClass, _this3));
  });
}
/**
 * Init current date
 */
function _initiateDate() {
  _classPrivateFieldSet(_date, this, new Date());
}
/**
 * Current date format
 * @returns {string} - Formatted current date by format
 */
function _today() {
  return _assertClassBrand(_DateShortcuts_brand, this, _formatDate).call(this);
}
/**
 * Get beginning of month date
 * @returns {string} - Formatted beginning of month date by format
 */
function _beginningOfMonth() {
  _classPrivateFieldGet(_date, this).setDate(1);
  return _assertClassBrand(_DateShortcuts_brand, this, _formatDate).call(this);
}
/**
 * Get end of month date
 * @returns {string} - Formatted end of month date by format
 */
function _endOfMonth() {
  _classPrivateFieldGet(_date, this).setDate(_assertClassBrand(_DateShortcuts_brand, this, _daysInMonth).call(this));
  return _assertClassBrand(_DateShortcuts_brand, this, _formatDate).call(this);
}
/**
 * Get beginning of last month date
 * @returns {string} - Formatted beginning of last month date by format
 */
function _beginningOfLastMonth() {
  _assertClassBrand(_DateShortcuts_brand, this, _setLastMonth).call(this);
  return _assertClassBrand(_DateShortcuts_brand, this, _formatDate).call(this);
}
/**
 * Get end of last month date
 * @returns {string} - Formatted end of last month date by format
 */
function _endOfLastMonth() {
  _assertClassBrand(_DateShortcuts_brand, this, _setLastMonth).call(this);
  _classPrivateFieldGet(_date, this).setDate(_assertClassBrand(_DateShortcuts_brand, this, _daysInMonth).call(this));
  return _assertClassBrand(_DateShortcuts_brand, this, _formatDate).call(this);
}
/**
 * Get beginning of year date
 * @returns {string} - Formatted beginning of year date by format
 */
function _beginningOfYear() {
  _classPrivateFieldGet(_date, this).setMonth(0);
  _classPrivateFieldGet(_date, this).setDate(1);
  return _assertClassBrand(_DateShortcuts_brand, this, _formatDate).call(this);
}
/**
 * Get end of year date
 * @returns {string} - Formatted end-of-year date by format
 */
function _endOfYear() {
  _classPrivateFieldGet(_date, this).setMonth(11);
  _classPrivateFieldGet(_date, this).setDate(31);
  return _assertClassBrand(_DateShortcuts_brand, this, _formatDate).call(this);
}
/**
 * Get date for past 30 days
 * @returns {string} - Formatted past 30 days date by format
 */
function _thirtyDaysAgo() {
  var value = Date.now() - 30 * MS_PER_DAY;
  _classPrivateFieldSet(_date, this, new Date(value));
  return _assertClassBrand(_DateShortcuts_brand, this, _formatDate).call(this);
}
/**
 * Set last month
 */
function _setLastMonth() {
  _classPrivateFieldGet(_date, this).setDate(1);
  if (_classPrivateFieldGet(_date, this).getMonth() <= 0) {
    _classPrivateFieldGet(_date, this).setYear(_classPrivateFieldGet(_date, this).getFullYear() - 1);
    _classPrivateFieldGet(_date, this).setMonth(11);
  } else {
    _classPrivateFieldGet(_date, this).setMonth(_classPrivateFieldGet(_date, this).getMonth() - 1);
  }
}
/**
 * Gets the day-of-the-month
 * @returns {number} - The day-of-the-month
 */
function _daysInMonth() {
  return new Date(_classPrivateFieldGet(_date, this).getFullYear(), _classPrivateFieldGet(_date, this).getMonth() + 1, 0).getDate();
}
/**
 * Format date in format mm/dd/yyyy
 * @returns {string} - Formatted date in format mm/dd/yyyy
 */
function _formatDate() {
  var month = String(_classPrivateFieldGet(_date, this).getMonth() + 1).padStart(2, '0');
  var day = String(_classPrivateFieldGet(_date, this).getDate()).padStart(2, '0');
  var year = _classPrivateFieldGet(_date, this).getFullYear();
  return "".concat(month, "/").concat(day, "/").concat(year);
}
module.exports = DateShortcuts;

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

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/components/tab.js":
/*!****************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/components/tab.js ***!
  \****************************************************************************/
/***/ ((module) => {

"use strict";


class Tab {
    #elements;

    #activeClass;

    constructor() {
        this.#activeClass = 'active';
        this.#elements = Array.from(document.querySelectorAll('[data-toggle="tab"]'));
    }

    init() {
        this.#addEvents();
    }

    /**
     * Add events
     */
    #addEvents() {
        this.#elements.forEach((element) => {
            element.addEventListener('click', this.#handleClick.bind(this));

            if (this.#hasClass(element)) {
                element.click();
            }
        });
    }

    /**
     * Handle click event
     * @param {Object} event - Event listener
     */
    #handleClick(event) {
        event.preventDefault();

        const tabElement = event.target;
        const previousTabElement = document.querySelector('.js_paypalbm_switch.active');

        const isResetNeeded = tabElement !== previousTabElement;

        if (event.isTrusted && this.#hasClass(tabElement)) {
            return;
        }

        const elementId = tabElement.dataset.target.slice(1);
        const tabContentEl = document.getElementById(elementId);

        if (tabContentEl) {
            tabContentEl.parentElement
                .childElements()
                .concat(this.#elements)
                .forEach((element) => {
                        if (this.#hasClass(element) && isResetNeeded) {
                            element.classList.remove(this.#activeClass);

                            const inputElement = element.querySelector('input');
                            const selectElement = element.querySelector('select');

                            if(inputElement){
                                inputElement.value = '';
                            }

                            if(selectElement){
                                selectElement.selectedIndex = 0;
                            }
                        }
                    }
                );

            this.#addClass(tabElement);
            this.#addClass(tabContentEl);
        }
    }

    /**
     * Check if the HTML element has an active class
     * @param {HTMLElement} element - HTML element
     * @returns {boolean} - True if the element has active class, otherwise false
     */
    #hasClass(element) {
        return element.classList.contains(this.#activeClass);
    }

    /**
     * Add an active class for the element
     * @param {HTMLElement} element - HTML element
     */
    #addClass(element) {
        element.classList.add(this.#activeClass);
    }
}

module.exports = Tab;


/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/helpers/componentsHelper.js":
/*!**************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/helpers/componentsHelper.js ***!
  \**************************************************************************************/
/***/ ((module) => {

"use strict";


/**
 * Toggles the disabled state of datepicker elements based on the selected tab.
 *
 * @param {Object} options - The configuration object.
 * @param {string} options.generalTabSelector - The CSS selector for the tabs.
 * @param {string} options.datepickerSelector - The CSS selector for the datepicker elements.
 * @param {string} options.dateShortcutSelector - he CSS selector for the date shortcut tab elements.
 * @param {string[]} options.tabTargets - The data target values that, when matched, disables the datepicker elements.
 */
function toggleDatepickerState(_ref) {
  var generalTabSelector = _ref.generalTabSelector,
    datepickerSelector = _ref.datepickerSelector,
    dateShortcutSelector = _ref.dateShortcutSelector,
    tabTargets = _ref.tabTargets;
  var tabs = document.querySelectorAll(generalTabSelector);
  var datePickers = document.querySelectorAll(datepickerSelector);
  var dateShortcuts = document.querySelectorAll(dateShortcutSelector);
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      if (!tabTargets.includes(tab.dataset.target) && tab.classList.contains('active')) {
        return;
      }
      datePickers.forEach(function (element) {
        element.disabled = tabTargets.includes(tab.dataset.target);
      });
      dateShortcuts.forEach(function (element) {
        element.disabled = tabTargets.includes(tab.dataset.target);
      });
    });
  });
}
module.exports = {
  toggleDatepickerState: toggleDatepickerState
};

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

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/transactions/transactions.js":
/*!***************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/transactions/transactions.js ***!
  \***************************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var paypalAdmin = __webpack_require__(/*! ./paypalAdmin */ "./cartridges/bm_paypal/cartridge/client/default/js/transactions/paypalAdmin.js");
var Tab = __webpack_require__(/*! ../components/tab */ "./cartridges/bm_paypal/cartridge/client/default/js/components/tab.js");
var DateShortcuts = __webpack_require__(/*! ../components/dateShortcuts */ "./cartridges/bm_paypal/cartridge/client/default/js/components/dateShortcuts.js");
var componentsHelper = __webpack_require__(/*! ../helpers/componentsHelper */ "./cartridges/bm_paypal/cartridge/client/default/js/helpers/componentsHelper.js");
document.addEventListener('DOMContentLoaded', function () {
  paypalAdmin.init();
  paypalAdmin.pieChart();
  componentsHelper.toggleDatepickerState({
    tabTargets: ['#search-by-order-id', '#search-by-transaction-id'],
    generalTabSelector: '[data-toggle="tab"]',
    datepickerSelector: '.datepicker',
    dateShortcutSelector: '.js-date-shortcut'
  });
  new Tab().init();
  new DateShortcuts().init();
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
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!**************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/transactions.js ***!
  \**************************************************************************/


__webpack_require__(/*! ./transactions/transactions */ "./cartridges/bm_paypal/cartridge/client/default/js/transactions/transactions.js");
})();

/******/ })()
;