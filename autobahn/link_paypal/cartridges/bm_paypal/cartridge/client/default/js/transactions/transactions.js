'use strict';

const paypalAdmin = require('./paypalAdmin');
const Tab = require('../components/tab');
const DateShortcuts = require('../components/dateShortcuts');
const componentsHelper = require('../helpers/componentsHelper');

document.addEventListener('DOMContentLoaded', () => {
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
