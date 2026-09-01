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

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/components/modal.js":
/*!******************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/components/modal.js ***!
  \******************************************************************************/
/***/ ((module) => {



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

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/configCheck/configCheck.js":
/*!*************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/configCheck/configCheck.js ***!
  \*************************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {



var Jobs = __webpack_require__(/*! ./jobs */ "./cartridges/bm_paypal/cartridge/client/default/js/configCheck/jobs.js");
var Modal = __webpack_require__(/*! ../components/modal */ "./cartridges/bm_paypal/cartridge/client/default/js/components/modal.js");
var ProgressBarModel = __webpack_require__(/*! ./progressBar */ "./cartridges/bm_paypal/cartridge/client/default/js/configCheck/progressBar.js");
var WebDAV = __webpack_require__(/*! ./webdav */ "./cartridges/bm_paypal/cartridge/client/default/js/configCheck/webdav.js");
var OpenCommerceAPI = __webpack_require__(/*! ./ocapi */ "./cartridges/bm_paypal/cartridge/client/default/js/configCheck/ocapi.js");
var AlertHandlerModel = __webpack_require__(/*! ../components/alertHandler */ "./cartridges/bm_paypal/cartridge/client/default/js/components/alertHandler.js");
var alertHandler = new AlertHandlerModel();
var configCheckEl = document.querySelector('.js-config-check');
var config = JSON.parse(configCheckEl.dataset.apiConfig);
var resources = JSON.parse(configCheckEl.dataset.resources);
var additionalData = JSON.parse(configCheckEl.dataset.additionalData);
var testConnectionUrl = configCheckEl.dataset.testConnectionUrl;
var selfCheckUrl = configCheckEl.dataset.selfCheckUrl;
var OCAPI = new OpenCommerceAPI(config.ocapi);
var ProgressBar;
var modal;

/**
 * Retrieves the values of checked input elements from a specified form based on the given name attribute.
 * @param {Element} form - The form element from which to retrieve checked values.
 * @param {string} name - The name attribute of the input elements to search for within the form.
 * @returns {Array<string>} An array containing the values of the checked input elements that match the specified name.
 */
var getCheckedValues = function getCheckedValues(form, name) {
  return Array.from(form.querySelectorAll("[name=\"".concat(name, "\"]"))).filter(function (element) {
    return element.checked;
  }).map(function (element) {
    return element.value;
  });
};

/**
 * Handle download archive file
 * @param {string} fileName - file name
 * @returns {void}
 */
var handleDownloadFile = function handleDownloadFile(fileName) {
  var linkEl = document.createElement('a');
  var WebDav = new WebDAV(config.webdav);
  WebDav.get("impex/src/instance/".concat(fileName)).then(function (response) {
    return response.ok ? response.blob() : response.text();
  }).then(function (data) {
    if (data instanceof Blob) {
      linkEl.href = URL.createObjectURL(data);
      linkEl.download = fileName;
      linkEl.click();
      URL.revokeObjectURL(linkEl.href);
    } else {
      var parser = new DOMParser();
      var html = parser.parseFromString(data, 'text/html');
      throw new Error([html.querySelector('h1').textContent.trim(), html.querySelector('p').textContent.trim()].join('. '));
    }
  }).catch(function (error) {
    alertHandler.showAlertMessage({
      type: 'warning',
      message: error.message
    });
  });
};

/**
 * Handle Generate Plugin Configuration
 * @param {Object} formData - form data object
 * @returns {void}
 */
var handleGenerateConfig = function handleGenerateConfig(formData) {
  var jobs = new Jobs(OCAPI, ProgressBar, resources);
  var selectedConfig = Object.keys(formData).filter(function (key) {
    return typeof formData[key] === 'boolean' && formData[key] === true;
  });
  var totalSelected = selectedConfig.length;
  jobs.handleExportSite(formData).then(function (isExportFinished) {
    if (isExportFinished) {
      return jobs.archiveFileProcessing(formData);
    }
    return isExportFinished;
  }).then(function (isChangesCompleted) {
    if (isChangesCompleted) {
      handleDownloadFile(formData.fileName);
      modal.close();
      alertHandler.showAlertMessage({
        type: 'success',
        message: resources["export".concat(totalSelected > 1 ? 'All' : 'General', "Success")]
      });
    }
  }).catch(function (error) {
    var hasFiles = error.message.includes('file(s)');
    if (hasFiles) {
      handleDownloadFile(formData.fileName);
    }
    alertHandler.showAlertMessage({
      type: hasFiles ? 'caution' : 'warning',
      message: error.message
    });
    modal.close();
  });
};

/**
 * Handle Test Connection
 * @param {boolean} isExport - True if this is an export process, otherwise false
 * @returns {Promise} - response from Test Connection endpoint
 */
var handleTestConnection = function handleTestConnection() {
  var isExport = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  alertHandler.fadeAlerts();
  return fetch(testConnectionUrl, {
    method: 'POST',
    body: JSON.stringify({
      isExport: isExport
    })
  }).then(function (response) {
    return response.json();
  });
};

/**
 * Handle Submit Form
 * @param {Object} form - Form element
 * @returns {void}
 */
var handleSubmitForm = function handleSubmitForm(form) {
  if (!form.checkValidity()) {
    form.reportValidity();
  } else {
    var isExport = true;
    var processedData = {};
    Array.from(form.elements).forEach(function (element) {
      processedData[element.name] = element.type === 'checkbox' ? element.checked : element.value;
    });
    ProgressBar.showProgressBar();
    handleTestConnection(isExport).then(function (response) {
      var STEP_ID = 'test-connection';
      var result = response.result;
      if (result.error) {
        alertHandler.showAlertMessage({
          message: result.message,
          type: 'warning'
        });
      }
      processedData.connectionData = result;
      processedData.additionalData = additionalData;
      ProgressBar.handleProgressBarNextStep(STEP_ID);
      handleGenerateConfig(processedData);
    });
  }
};

/**
 * Handle Modal window
 * @returns {void}
 */
var handleModal = function handleModal() {
  var formEl;
  var formTemplateEl = document.querySelector('.js-form-template');
  modal = new Modal({
    title: resources.modalTitle,
    width: 600,
    height: 471,
    html: formTemplateEl.innerHTML,
    modal: true,
    autoScroll: true,
    listeners: {
      show: function show() {
        formEl = document.querySelector('.js-form-generate-config');
        formEl.addEventListener('submit', function (event) {
          return event.preventDefault();
        });
      }
    },
    buttons: [{
      text: resources.submit,
      handler: function handler() {
        handleSubmitForm(formEl);
      }
    }, {
      text: resources.cancel,
      handler: function handler() {
        modal.close();
      }
    }]
  });
  ProgressBar = new ProgressBarModel(modal, '.js-progress-bar-template');
  window.addEventListener('resize', function () {
    modal.center();
  });
  window.addEventListener('orientationchange', function () {
    modal.center();
  });
  modal.show();
};

/**
 * Handles the self-check process by collecting checked values from specified form inputs and sending them to a server endpoint.
 * @param {Element} form - The form element from which to retrieve input values.
 * @returns {Promise<Object>} A promise that resolves to the JSON object returned by the server in response to the POST request.
 */
var handleSelfCheck = function handleSelfCheck(form) {
  alertHandler.fadeAlerts();
  var services = getCheckedValues(form, 'service');
  var flows = getCheckedValues(form, 'flow');
  var payments = getCheckedValues(form, 'payment');
  return fetch(selfCheckUrl, {
    method: 'POST',
    body: JSON.stringify({
      services: services,
      flows: flows,
      payments: payments
    })
  }).then(function (response) {
    return response.json();
  });
};

/**
 * Processes and displays the results of a self-check operation on a form by updating the UI based on the validity of each checked item.
 * @param {Object} options - object with params for handling check result
 * @param {Element} options.formEl - The form element containing the checkboxes to be processed.
 * @param {Object} options.result - The result object received from the server, containing validation results for each item.
 * @param {string} options.selector - The name attribute of the checkboxes to be processed.
 * @param {string} options.checkResultKey - A dot-separated string representing the path to the relevant array within the `result` object,
 *                                          where each item's validation status is stored.
 */
var processCheckResults = function processCheckResults(options) {
  var formEl = options.formEl,
    result = options.result,
    selector = options.selector,
    checkResultKey = options.checkResultKey;
  var checkboxEls = Array.from(formEl.querySelectorAll("[name=\"".concat(selector, "\"]"))).filter(function (element) {
    return element.checked;
  });
  var checkObject = checkResultKey.split('.').reduce(function (acc, key) {
    return acc && acc[key];
  }, result);
  checkboxEls.forEach(function (element) {
    var checkResult = checkObject.find(function (item) {
      return item.name === element.value;
    });
    var checkboxContainerEl = element.closest('.form-selfcheck');
    var alertEl = checkboxContainerEl.querySelector('i');
    if (checkResult.isValid) {
      checkboxContainerEl.classList.add('approved');
    } else {
      alertEl.innerText = "\n".concat(checkResult.alert);
      checkboxContainerEl.classList.add('rejected');
    }
  });
};

/**
 * Handle Self Check Modal
 * @returns {void}
 */
var handleSelfCheckModal = function handleSelfCheckModal() {
  var formEl;
  var templateEl = document.querySelector('.js-self-check-template');
  var selfCheckModal = new Modal({
    title: resources.selfCheckModalTitle,
    width: 600,
    height: 200,
    html: templateEl.innerHTML,
    modal: true,
    autoScroll: true,
    listeners: {
      show: function show() {
        formEl = document.querySelector('.js-form-self-check');
        formEl.addEventListener('submit', function (event) {
          return event.preventDefault();
        });
        var allCheckboxEl = document.getElementById('all-config');
        var checkboxEls = document.querySelectorAll('.js-selfcheck-checkbox');
        var updateAllCheckboxState = function updateAllCheckboxState() {
          allCheckboxEl.checked = Array.from(checkboxEls).every(function (element) {
            return element.checked;
          });
        };
        checkboxEls.forEach(function (element) {
          element.addEventListener('change', function () {
            checkboxEls.forEach(function (checkbox) {
              var checkboxContainerEl = checkbox.closest('.form-selfcheck');
              var alertEl = checkboxContainerEl.querySelector('i');
              alertEl.innerText = '';
              checkboxContainerEl.classList.remove('approved');
              checkboxContainerEl.classList.remove('rejected');
              selfCheckModal.center();
            });
            if (!element.checked) {
              allCheckboxEl.checked = false;
            } else {
              updateAllCheckboxState();
            }
          });
        });
        allCheckboxEl.addEventListener('change', function () {
          var isChecked = allCheckboxEl.checked;
          checkboxEls.forEach(function (element) {
            if (!element.required) {
              element.checked = isChecked;
            }
          });
        });
      }
    },
    buttons: [{
      text: resources.submit,
      handler: function handler() {
        handleSelfCheck(formEl).then(function (res) {
          var result = res.result;
          var options = {
            formEl: formEl,
            result: result
          };
          processCheckResults(Object.assign({
            selector: 'service',
            checkResultKey: 'checkedServices'
          }, options));
          processCheckResults(Object.assign({
            selector: 'flow',
            checkResultKey: 'checkedFlow'
          }, options));
          processCheckResults(Object.assign({
            selector: 'payment',
            checkResultKey: 'checkedPM.checkedPayments'
          }, options));
          selfCheckModal.center();
        });
      }
    }, {
      text: resources.cancel,
      handler: function handler() {
        selfCheckModal.close();
      }
    }]
  });
  window.addEventListener('resize', function () {
    selfCheckModal.center();
  });
  window.addEventListener('orientationchange', function () {
    selfCheckModal.center();
  });
  selfCheckModal.show();
  selfCheckModal.center();
};
document.addEventListener('DOMContentLoaded', function () {
  var buttonTestConnectionEl = document.querySelector('.js-test-connection');
  var buttonGenerateConfigEl = document.querySelector('.js-generate-config');
  var buttonSelfCheckEl = document.querySelector('.js-self-check');
  buttonGenerateConfigEl.addEventListener('click', handleModal);
  buttonSelfCheckEl.addEventListener('click', handleSelfCheckModal);
  buttonTestConnectionEl.addEventListener('click', function () {
    handleTestConnection().then(function (response) {
      var result = response.result;
      alertHandler.showAlertMessage({
        message: result.message,
        type: result.error ? 'warning' : 'success'
      });
    });
  });
});

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/configCheck/jobs.js":
/*!******************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/configCheck/jobs.js ***!
  \******************************************************************************/
/***/ ((module) => {



/* eslint-disable no-console */
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Jobs = /*#__PURE__*/function () {
  function Jobs(OCAPI, ProgressBar, resources) {
    _classCallCheck(this, Jobs);
    this.OCAPI = OCAPI;
    this.interval = 3000;
    this.resources = resources;
    this.ProgressBar = ProgressBar;
  }

  /**
   * Handle Job Execution Fault
   * @param {Object} jobExecution - Job Execution
   * @returns {void}
   */
  return _createClass(Jobs, [{
    key: "handleJobExecutionFault",
    value: function handleJobExecutionFault(jobExecution) {
      var errorMessage = this.resources.exportAllFailure;
      if (jobExecution.fault) {
        throw new Error("".concat(jobExecution.fault.type, ": ").concat(jobExecution.fault.message));
      }
      if (jobExecution.status === 'ERROR') {
        var _jobExecution$step_ex = _slicedToArray(jobExecution.step_executions, 1),
          exit_status = _jobExecution$step_ex[0].exit_status;
        if (exit_status) {
          var message = exit_status.message;
          var indexStart = message.indexOf('{{');
          var indexEnd = message.indexOf('}}');
          if (![indexStart, indexEnd].includes(-1)) {
            message = message.substring(indexStart + 2, indexEnd);
            try {
              var fileList = JSON.parse(message).map(function (item) {
                return item.file;
              }).join(', ');
              if (fileList) {
                errorMessage = this.resources.exportSomeFailure.replace('{0}', fileList);
              }
            } catch (error) {
              console.error(error);
            }
          }
        }
        throw new Error(errorMessage);
      }
    }

    /**
     * Check Site Export until finished
     * @param {Object} options - Options
     * @param {string} options.jobId - Job ID
     * @param {number} options.id - Job execute id
     * @param {number} options.interval - Interval of checks in seconds
     * @returns {Promise<boolean>} - Resolves true on success
     */
  }, {
    key: "checkSiteExportUntilFinished",
    value: function checkSiteExportUntilFinished(_ref) {
      var _this = this;
      var jobId = _ref.jobId,
        id = _ref.id,
        interval = _ref.interval;
      return new Promise(function (resolve, reject) {
        /** @returns {void} */
        var _checkSiteExportWithInterval = function checkSiteExportWithInterval() {
          _this.OCAPI.jobStatus(jobId, id).then(function (jobExecution) {
            _this.handleJobExecutionFault(jobExecution);
            var status = jobExecution.status,
              execution_status = jobExecution.execution_status;
            if (status === 'OK' && execution_status === 'finished') {
              _this.ProgressBar.handleProgressBarNextStep(jobId);
              return resolve(true);
            }
            if (status === 'RUNNING') {
              return setTimeout(_checkSiteExportWithInterval, interval);
            }
            return reject(new Error("Unexpected job status: ".concat(status)));
          }).catch(function (error) {
            return reject(error);
          });
        };
        _checkSiteExportWithInterval();
      });
    }

    /**
     * Handle Export Site Archive
     * @param {Object} formData - Form Data Object
     * @returns {boolean|Promise} - result
     */
  }, {
    key: "handleExportSite",
    value: function handleExportSite(formData) {
      var _this2 = this;
      var jobId = 'sfcc-site-archive-export';
      return this.OCAPI.runJob(jobId, {
        data_units: {
          global_data: {
            services: formData.services,
            preferences: true,
            system_type_definitions: formData.systemTypeDefinitions
          },
          sites: _defineProperty({}, formData.siteId, {
            shipping: true,
            site_descriptor: true,
            site_preferences: true,
            payment_methods: formData.paymentMethods,
            payment_processors: formData.paymentMethods
          })
        },
        export_file: formData.fileName,
        overwrite_export_file: true
      }).then(function (jobExecution) {
        _this2.handleJobExecutionFault(jobExecution);
        return _this2.checkSiteExportUntilFinished({
          jobId: jobId,
          id: jobExecution.id,
          interval: _this2.interval
        });
      });
    }

    /**
     * Archive File Processing
     * @param {Object} formData - Form Data Object
     * @returns {boolean|Promise} - result
     */
  }, {
    key: "archiveFileProcessing",
    value: function archiveFileProcessing(formData) {
      var _this3 = this;
      var jobId = 'PpConfigCheckSiteArchiveProcessing';
      var connectionData = formData.connectionData;
      delete formData.connectionData;
      return this.OCAPI.runJob(jobId, {
        // JobExecutionParameter
        parameters: [{
          name: 'Options',
          // maxLength=256, minLength=1,
          value: JSON.stringify(formData) // maxLength=1000, minLength=0
        }, {
          name: 'ConnectionData',
          // maxLength=256, minLength=1,
          value: JSON.stringify(connectionData) // maxLength=1000, minLength=0
        }]
      }).then(function (jobExecution) {
        _this3.handleJobExecutionFault(jobExecution);
        return _this3.checkSiteExportUntilFinished({
          jobId: jobId,
          id: jobExecution.id,
          interval: _this3.interval
        });
      });
    }
  }]);
}();
module.exports = Jobs;

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/configCheck/ocapi.js":
/*!*******************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/configCheck/ocapi.js ***!
  \*******************************************************************************/
/***/ ((module) => {



/**
 * Open Commerce API (OCAPI)
 */
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var OpenCommerceAPI = /*#__PURE__*/function () {
  /**
   * @constructor
   * @param {Object} options - Options
   */
  function OpenCommerceAPI(options) {
    _classCallCheck(this, OpenCommerceAPI);
    this.options = options;
    this.accessToken = {};
    this.expirationTime = 0;
    this.contentType = {
      json: 'application/json;charset=UTF-8',
      formUrlencoded: 'application/x-www-form-urlencoded;charset=UTF-8'
    };
  }

  /**
   * Convert object To FormData
   * @param {Object} obj - Object
   * @returns {string} - result
   */
  return _createClass(OpenCommerceAPI, [{
    key: "objectToFormData",
    value: function objectToFormData(obj) {
      var formData = new URLSearchParams();
      for (var key in obj) {
        formData.append(key, obj[key]);
      }
      return formData.toString();
    }

    /**
     * Authorize in BM
     * @returns {void}
     */
  }, {
    key: "authorizeBM",
    value: (function () {
      var _authorizeBM = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var requestBody, path, auth, requestOptions;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              requestBody = this.objectToFormData({
                grant_type: 'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken'
              });
              path = '/dw/oauth2/access_token?client_id=' + this.options.clientId;
              auth = btoa("".concat(this.options.bmUserLogin, ":").concat(this.options.bmUserPassword, ":").concat(this.options.clientPassword));
              requestOptions = {
                method: 'POST',
                headers: {
                  Authorization: "Basic ".concat(auth),
                  'Content-Type': this.contentType.formUrlencoded
                },
                body: requestBody
              };
              _context.n = 1;
              return this.request(path, requestOptions);
            case 1:
              this.accessToken = _context.v;
              this.expirationTime = Date.now() + this.accessToken.expires_in * 1000;
            case 2:
              return _context.a(2);
          }
        }, _callee, this);
      }));
      function authorizeBM() {
        return _authorizeBM.apply(this, arguments);
      }
      return authorizeBM;
    }()
    /**
     * Get result for Authorization header
     * @returns {string} - Authorization
     */
    )
  }, {
    key: "getAuthorizationHeader",
    value: (function () {
      var _getAuthorizationHeader = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              if (!(Date.now() >= this.expirationTime)) {
                _context2.n = 1;
                break;
              }
              _context2.n = 1;
              return this.authorizeBM();
            case 1:
              return _context2.a(2, "".concat(this.accessToken.token_type, " ").concat(this.accessToken.access_token));
          }
        }, _callee2, this);
      }));
      function getAuthorizationHeader() {
        return _getAuthorizationHeader.apply(this, arguments);
      }
      return getAuthorizationHeader;
    }()
    /**
     * Get Job Execution status
     * @param {string} jobId - Job ID
     * @param {number} executionId - Execution ID
     * @returns {Promise} - Promise
     */
    )
  }, {
    key: "jobStatus",
    value: (function () {
      var _jobStatus = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(jobId, executionId) {
        var path, requestOptions, _t, _t2;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              path = "".concat(this.getDataPath(), "/jobs/").concat(jobId, "/executions/").concat(executionId);
              _context3.n = 1;
              return this.getAuthorizationHeader();
            case 1:
              _t = _context3.v;
              _t2 = {
                Authorization: _t
              };
              requestOptions = {
                method: 'GET',
                headers: _t2
              };
              return _context3.a(2, this.request(path, requestOptions));
          }
        }, _callee3, this);
      }));
      function jobStatus(_x, _x2) {
        return _jobStatus.apply(this, arguments);
      }
      return jobStatus;
    }()
    /**
     * Execute Job by Job ID
     * @param {string} jobId - Job ID
     * @param {Object} properties - Request body
     * @returns {Promise} - Promise
     */
    )
  }, {
    key: "runJob",
    value: (function () {
      var _runJob = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(jobId, properties) {
        var requestBody, path, requestOptions, _t3, _t4, _t5, _t6;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              requestBody = properties && Object.keys(properties).length ? JSON.stringify(properties) : null;
              path = "".concat(this.getDataPath(), "/jobs/").concat(jobId, "/executions");
              _context4.n = 1;
              return this.getAuthorizationHeader();
            case 1:
              _t3 = _context4.v;
              _t4 = this.contentType.json;
              _t5 = {
                Authorization: _t3,
                'Content-Type': _t4
              };
              _t6 = requestBody;
              requestOptions = {
                method: 'POST',
                headers: _t5,
                body: _t6
              };
              return _context4.a(2, this.request(path, requestOptions));
          }
        }, _callee4, this);
      }));
      function runJob(_x3, _x4) {
        return _runJob.apply(this, arguments);
      }
      return runJob;
    }()
    /**
     * Send the request
     * @param {string} path - URL path
     * @param {Object} options - Request data
     * @returns {Promise<Response>} - Promise
     */
    )
  }, {
    key: "request",
    value: function request(path, options) {
      var url = new URL(path, window.location.origin);
      return fetch(url, options).then(function (response) {
        return response.json();
      });
    }

    /**
     * Version
     * @returns {string} - Version
     */
  }, {
    key: "getVersion",
    value: function getVersion() {
      return "v".concat(this.options.apiVersion.replace('.', '_'));
    }

    /**
     * Data Path
     * @returns {string} - Data path
     */
  }, {
    key: "getDataPath",
    value: function getDataPath() {
      return "/s/-/dw/data/".concat(this.getVersion());
    }
  }]);
}();
module.exports = OpenCommerceAPI;

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/configCheck/progressBar.js":
/*!*************************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/configCheck/progressBar.js ***!
  \*************************************************************************************/
/***/ ((module) => {



function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var ProgressBar = /*#__PURE__*/function () {
  function ProgressBar(modal, selector) {
    _classCallCheck(this, ProgressBar);
    this.modal = modal;
    this.progressBar = document.querySelector(selector);
    this.IS_ACTIVE = 'is-active';
    this.IS_DISABLED = 'is-disabled';
  }

  /**
   * Handle Progress Bar Steps
   * @param {string} stepId - progress bar step id
   * @returns {void}
   */
  return _createClass(ProgressBar, [{
    key: "handleProgressBarNextStep",
    value: function handleProgressBarNextStep(stepId) {
      var currentStep = document.querySelector("[data-step-id='".concat(stepId, "'"));
      var nextStep = currentStep.nextElementSibling;
      currentStep.classList.remove(this.IS_ACTIVE);
      currentStep.classList.add(this.IS_DISABLED);
      if (nextStep) {
        nextStep.classList.add(this.IS_ACTIVE);
      }
    }

    /**
     * Shows the progress bar
     * @returns {void}
     */
  }, {
    key: "showProgressBar",
    value: function showProgressBar() {
      this.modal.modal.body.update(this.progressBar.innerHTML);
      this.modal.modal.buttons.forEach(function (btn) {
        return btn.hide();
      });
      this.modal.center();
    }
  }]);
}();
module.exports = ProgressBar;

/***/ }),

/***/ "./cartridges/bm_paypal/cartridge/client/default/js/configCheck/webdav.js":
/*!********************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/configCheck/webdav.js ***!
  \********************************************************************************/
/***/ ((module) => {



/**
 * WebDAV
 */
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var WebDAV = /*#__PURE__*/function () {
  /**
   * @param {Object} options - Options
   */
  function WebDAV(options) {
    _classCallCheck(this, WebDAV);
    this.options = options;
  }

  /**
   * Get file/list of files and folders
   * @param {string} filePath - File path/Directory path
   * @returns {Promise} - Promise
   */
  return _createClass(WebDAV, [{
    key: "get",
    value: (function () {
      var _get = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(filePath) {
        var path, requestOptions;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              path = "".concat(this.getSitesPath(), "/").concat(filePath);
              requestOptions = {
                method: 'GET'
              };
              return _context.a(2, this.request(path, requestOptions));
          }
        }, _callee, this);
      }));
      function get(_x) {
        return _get.apply(this, arguments);
      }
      return get;
    }()
    /**
     * Upload file
     * @param {string} filePath - File path
     * @param {Object} requestBody - Request body
     * @returns {Promise} - Promise
     */
    )
  }, {
    key: "uploadFile",
    value: (function () {
      var _uploadFile = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(filePath, requestBody) {
        var path, requestOptions;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              path = "".concat(this.getSitesPath(), "/").concat(filePath);
              requestOptions = {
                method: 'PUT',
                body: requestBody
              };
              return _context2.a(2, this.request(path, requestOptions));
          }
        }, _callee2, this);
      }));
      function uploadFile(_x2, _x3) {
        return _uploadFile.apply(this, arguments);
      }
      return uploadFile;
    }()
    /**
     * Delete file
     * @param {string} filePath - File path
     * @returns {Promise} - Promise
     */
    )
  }, {
    key: "deleteFile",
    value: (function () {
      var _deleteFile = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(filePath) {
        var path, requestOptions;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              path = "".concat(this.getSitesPath(), "/").concat(filePath);
              requestOptions = {
                method: 'DELETE'
              };
              return _context3.a(2, this.request(path, requestOptions));
          }
        }, _callee3, this);
      }));
      function deleteFile(_x4) {
        return _deleteFile.apply(this, arguments);
      }
      return deleteFile;
    }()
    /**
     * Send Request
     * @param {string} path - URL path
     * @param {Object} options - Request options
     * @returns {Promise} - Promise
     */
    )
  }, {
    key: "request",
    value: function request(path, options) {
      var requestOptions = Object.assign({
        headers: {
          Authorization: this.getAuthorization()
        }
      }, options);
      var url = new URL(path, window.location.origin);
      return fetch(url, requestOptions);
    }

    /**
     * Basic Path
     * @returns {string} - Basic Path
     */
  }, {
    key: "getSitesPath",
    value: function getSitesPath() {
      return '/on/demandware.servlet/webdav/Sites';
    }

    /**
     * Basic Authorization
     * @returns {string} - Basic authorization value
     */
  }, {
    key: "getAuthorization",
    value: function getAuthorization() {
      var token = btoa("".concat(this.options.username, ":").concat(this.options.password));
      return "Basic ".concat(token);
    }
  }]);
}();
module.exports = WebDAV;

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
/*!*************************************************************************!*\
  !*** ./cartridges/bm_paypal/cartridge/client/default/js/configCheck.js ***!
  \*************************************************************************/


__webpack_require__(/*! ./configCheck/configCheck */ "./cartridges/bm_paypal/cartridge/client/default/js/configCheck/configCheck.js");
})();

/******/ })()
;