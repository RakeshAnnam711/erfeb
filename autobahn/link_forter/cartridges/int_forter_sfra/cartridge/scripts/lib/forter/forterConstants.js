'use strict';

/**
 * forterConstants contains all static configuration data,
 *
 * To include this script use:
 * require('~/cartridge/scripts/lib/forter/forterConstants').CUSTOMER_CREATE;
 */

module.exports = {
    STATUS_APPROVED: 'APPROVED',
    STATUS_DECLINED: 'DECLINED',
    STATUS_NOT_REVIEWED: 'NOT_REVIEWED',
    STATUS_FAILED: 'FAILED',
    STATUS_NOT_SENT: 'NOT_SENT',
    CUSTOMER_LOGIN: 'LOGIN',
    CUSTOMER_LOGOUT: 'LOGOUT',
    CUSTOMER_CREATE: 'REGISTRATION',
    CUSTOMER_PROFILE_UPDATE: 'UPDATE',
    CUSTOMER_ADDRESS_UPDATE: 'ADDRESS_UPDATE',
    CUSTOMER_PAYMENT_UPDATE: 'PAYMENT_METHOD_UPDATE',
    PHONE_TYPE_PRIMARY: 'Primary',
    PHONE_TYPE_SECONDARY: 'Secondary',
    PHONE_DESC_HOME: 'Home',
    PHONE_DESC_WORK: 'Work',
    PHONE_DESC_MOBILE: 'Mobile'
};
