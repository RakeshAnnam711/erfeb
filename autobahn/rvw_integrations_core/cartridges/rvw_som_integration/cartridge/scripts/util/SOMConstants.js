'use strict';

exports.customAttrPrefix = 'SOM_';

exports.communicationStatus = {
    ORDER: {
        LOCKED: 'LOCKED',
        ACCEPTED: 'ACCEPTED',
        NOT_FOUND: 'NOT_FOUND',
        ORDERPREF: 'Please verify storefront order access is not limited.'
    },
    LINE_ITEM: {
        LOCKED: 'LOCKED',
        ACCEPTED: 'ACCEPTED',
        FORMAT_ERR: 'FORMAT_ERR',
        NOT_FOUND: 'NOT_FOUND',
        MULTI_MATCH: 'MULTI_MATCH',
        EVENTDATE_ERROR: 'EVENTDATE_ERR',
        EVENTDATE_RANGE_IGNORE: 'EVENTDATE_RANGE_IGNORE',
        SHIPPING_LINE_ITEM_NOTRACK: 'SHIPPING_LINE_ITEM_NOTRACK'
    }
};

/*
 * Match Statuses against order.properties resources for email subject lines
 */
exports.systemOrderStatus = [
    'ORDER_STATUS_OPEN',        // Order was considered as valid. Order can now be exported to 3rd party systems. Same as New, conceptually
    'ORDER_STATUS_COMPLETED', // Has no meaning by default but can be used by custom implementations but is a synonym for NEW/OPEN
    'ORDER_STATUS_CANCELLED',   // Order was cancelled.
];

// Maps the desired status via approved OrderMgr method
exports.systemOrderMgrStatusMethodMap = {
    ORDER_STATUS_OPEN: 'undoCancelOrder',   // fn(order)
//    ORDER_STATUS_COMPLETED: '',
    ORDER_STATUS_CANCELLED: 'cancelOrder',  // fn(order)
};

exports.customOrderPaymentStatus = [
    'NOT_PAID',
    'PARTIALLY_PAID',
    'PAID_IN_FULL'
];

exports.customLineItemStatus = [
    'ITEM_STATUS_ORDERED',
    'ITEM_STATUS_RETURNED',
    'ITEM_STATUS_CANCELED',
    'ITEM_STATUS_PAID',
    'ITEM_STATUS_RESHIPPED',
    'ITEM_STATUS_FULFILLED',
    'ITEM_STATUS_PARTIALLYFULFILLED',
    'ITEM_STATUS_ALLOCATED',
    'ITEM_STATUS_PARTIALLYALLOCATED'
];

exports.customLineItemStatusWithTracking = [
    'ITEM_STATUS_FULFILLED',
    'ITEM_STATUS_PARTIALLYFULFILLED'
];

exports.customLineItemStatusCanceled = 'ITEM_STATUS_CANCELED';
exports.customLineItemStatusReturned = 'ITEM_STATUS_RETURNED';
