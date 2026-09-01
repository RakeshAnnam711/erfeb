/* eslint-disable no-use-before-define */
/* global Ext */

const paypalAdmin = (function() {
    const helper = require('../helpers/helper.js');

    let actionFormWindow;
    let accordionHandler;
    let transactionDetailWindow;

    const PAYPAL_BM_CONTENT_SELECTOR = '.js-paypalbm-content';
    const PAYPAL_BM_ORDER_DETAIL_SELECTOR = '.js_paypalbm_order_detail';
    const CLOSE_TOOL_SELECTOR = '.x-tool-close';

    const DATA_ATTRIBUTE = {
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

        parentEl.querySelectorAll('textarea[data-maxcount]').forEach(textareaEl => {
            const countInputEl = textareaEl.parentNode.querySelector('.js_textarea_count');
            const maxCount = parseFloat(textareaEl.getAttribute(DATA_ATTRIBUTE.MAX_COUNT));

            countInputEl.textContent = maxCount.toString();

            textareaEl.addEventListener('keyup', (event) => {
                event.preventDefault();

                const text = textareaEl.value;
                const left = maxCount - text.length;

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
        let modalWindow;

        if (typeof element === 'undefined') {
            const xWindowEls = document.querySelectorAll('.x-window');

            xWindowEls.forEach(function(windowEl) {
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

        const windowHeight = window.innerHeight - 30;
        const scrollTop = modalWindow.body.getScroll().top;

        modalWindow.setHeight('auto');

        const modalWindowHeight = modalWindow.getSize().height;

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
                const maxValue = fieldEl.getAttribute(DATA_ATTRIBUTE.MAX_VALUE);

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
        let isValid = true;

        formEl.querySelectorAll('.paypal_error_msg_box').forEach(element => {
            element.style.display = 'none';
        });

        formEl.querySelectorAll('.paypal_error_field').forEach(element => {
            element.classList.remove('paypal_error_field');
        });

        formEl.querySelectorAll('[data-validation]').forEach(element => {
            if (element.disabled) {
                return;
            }

            const rules = element.getAttribute(DATA_ATTRIBUTE.VALIDATION).replace(/\s/, '').split(',');
            const value = element.value.trim();

            const brokenRule = rules.find(rule => rule === validateRule(rule, value, element));

            if (rules.includes(brokenRule)) {
                const name = element.getAttribute(DATA_ATTRIBUTE.GENERAL_VALIDATION) || element.getAttribute('name');

                isValid = false;

                element.closest('tr').classList.add('paypal_error_field');
                formEl.querySelector(`.paypal_error_msg_box_${name}_${brokenRule}`).style.display = 'block';

                recalculateModalWindowSize();
            }
        });

        return isValid;
    }

    /**
     * Reloads page
     */
    function reloadPage() {
        const element = document.querySelector(CLOSE_TOOL_SELECTOR);

        if (!element) {
            window.location.reload();
        }

        element.addEventListener('click', (event) => {
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

        const formData = helper.serializeForm(formEl);

        fetch(`${formEl.action}?${formData}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
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
            })
            .catch(() => {
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
        parentEl.querySelector('form').addEventListener('submit', event => {
            event.preventDefault();

            const targetEl = event.target;

            submitActionForm(targetEl, action);
        });
    }

    /**
     * Validating form
     * @param {Ext} panel - instance of Ext
     * @returns {Object} mask over object
     */
    function createMaskOver(panel) {
        return (function() {
            return {
                ext: new Ext.LoadMask(panel.getEl()),
                show: function(type) {
                    this.ext.msg = window.paypalAdminConfig.resources.loadMaskText[type] || window.paypalAdminConfig.resources.pleaseWait;
                    this.ext.show();
                },
                hide: function() {
                    this.ext.hide();
                }
            };
        }());
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
        const data = {
            format: 'ajax',
            orderNo: transactionData.orderNo || '',
            orderToken: transactionData.orderToken,
            transactionId: transactionData.transactionId || '',
            currencyCode: transactionData.currencyCode
        };

        transactionDetailWindow.maskOver.show();

        fetch(`${window.paypalAdminConfig.urls.orderTransaction}?${new URLSearchParams(data)}`)
            .then(response => response.text())
            .then(_data => {
                if (transactionDetailWindow) {
                    transactionDetailWindow.maskOver.hide();
                }

                const content = transactionDetailWindow
                    ? document.getElementById(transactionDetailWindow.body.id)
                    : document.querySelector(PAYPAL_BM_CONTENT_SELECTOR);

                content.innerHTML = _data;

                if (transactionDetailWindow) {
                    transactionDetailWindow.setHeight('auto');
                    transactionDetailWindow.center();
                }

                initOrderTransaction();
                recalculateModalWindowSize();
            })
            .catch(() => {
                closeTransactionDetailWindow();
            });
    }

    /**
     * Accordion Handler
     * @param {function} callback - callback function
     * @returns {void}
    */
    const createAccordionHandler = function(callback) {
        return (event) => {
            event.preventDefault();

            const parentEl = event.currentTarget.parentElement;
            const accordionActiveClass = 'is_opened';

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
        const accordionEls = document.querySelectorAll('.js_pp_accordion .pp_accordion_head');

        if (accordionHandler) {
            accordionEls.forEach(element => element.removeEventListener('click', accordionHandler));
        }

        accordionHandler = createAccordionHandler(callback);

        accordionEls.forEach(element => element.addEventListener('click', accordionHandler));
    }

    /**
     * Inits order transaction
     */
    function initOrderTransaction() {
        const paypalBmOrderDetailEl = document.querySelector(PAYPAL_BM_ORDER_DETAIL_SELECTOR);

        if (!paypalBmOrderDetailEl) {
            return;
        }

        const dataAttr = paypalBmOrderDetailEl.dataset;

        paypalAdmin.currentOrderNo = dataAttr.orderno;
        paypalAdmin.orderToken = dataAttr.ordertoken;
        paypalAdmin.currentCurrencyCode = dataAttr.currencycode;

        document.querySelectorAll('.js_paypal_action').forEach(buttonEl => {
            buttonEl.addEventListener('click', () => {
                const action = buttonEl.getAttribute(DATA_ATTRIBUTE.ACTION);
                const formContainerElement = document.querySelector(`#paypal_${action}_form`);
                const formContainerClass = 'js_paypal_action_form_container_' + action;

                actionFormWindow = new Ext.Window({
                    title: buttonEl.getAttribute(DATA_ATTRIBUTE.TITLE),
                    width: 700,
                    modal: true,
                    autoScroll: true,
                    cls: 'paypalbm_window_content ' + formContainerClass,
                    listeners: {
                        render: () => {
                            actionFormWindow.body.insertHtml('afterBegin', formContainerElement.innerHTML);
                            initTextareaCharactersLeft(actionFormWindow.body.dom);
                            initActionFormEvents(actionFormWindow.body.dom, action);
                        }
                    },
                    buttons: [
                        {
                            text: window.paypalAdminConfig.resources.submit,
                            handler: () => {
                                submitActionForm(document.querySelector('.' + formContainerClass).querySelector('form'), action);
                            }
                        },
                        {
                            text: window.paypalAdminConfig.resources.cancel,
                            handler: () => {
                                actionFormWindow.close();
                            }
                        }
                    ]
                });

                actionFormWindow.show();
                actionFormWindow.maskOver = createMaskOver(actionFormWindow);

                recalculateModalWindowSize();
            });
        });

        document.querySelector('.js_paypalbm_order_transactions_ids').addEventListener('change', event => {
            event.preventDefault();

            const targetEl = event.target;
            const transactionId = targetEl.value;

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
        const showDetailButtonEls = document.querySelectorAll('.js-paypal-show-detail');

        showDetailButtonEls.forEach(buttonEl => {
            buttonEl.addEventListener('click', event => {
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

                const dataAttr = buttonEl.dataset;

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
        pieChart: () => {
            const colors = {
                CREATED: { color: '#b3e5fc' },
                CAPTURED: { color: '#66bb6a' },
                PARTIALLY_CAPTURED: { color: '#a2bf56' },
                PENDING: { color: '#ffeb3b' },
                COMPLETED: { color: '#2e7d32' },
                PARTIALLY_REFUNDED: { color: '#ffcc80' },
                REFUNDED: { color: '#ef9a9a' },
                VOIDED: { color: '#ba68c8' },
                EXPIRED: { color: '#696969' },
                FAILED: { color: '#e57373' },
                DENIED: { color: '#bcaaa4' },
                DECLINED: { color: '#b71c1c' },
                CANCELLED: { color: '#ffab91' },
                'N/A': { color: '#b0bec5' }
            };

            const PieChart = require('../components/pieChart.js');

            PieChart.init(document.querySelector('.js-transaction-pie-chart'), colors);
        },
        init: () => {
            initEvents();

            if (document.querySelector(PAYPAL_BM_ORDER_DETAIL_SELECTOR)) {
                initOrderTransaction();
            }
        }
    };
}());

module.exports = paypalAdmin;
