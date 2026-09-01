'use strict';

module.exports = {
    // search types
    SEARCH_BY_TRANSACTION_ID: 'SEARCH_BY_TRANSACTION_ID',
    SEARCH_BY_ORDER_NUMBER: 'SEARCH_BY_ORDER_NUMBER',
    SEARCH_BY_PAYMENT_STATUS: 'SEARCH_BY_PAYMENT_STATUS',
    SEARCH_BY_PAYMENT_METHOD: 'SEARCH_BY_PAYMENT_METHOD',
    // intents
    INTENT_CAPTURE: 'CAPTURE',
    INTENT_AUTHORIZE: 'AUTHORIZE',
    // statuses
    STATUS_COMPLETED: 'COMPLETED',
    STATUS_CAPTURED: 'CAPTURED',
    STATUS_REFUNDED: 'REFUNDED',
    STATUS_CREATED: 'CREATED',
    STATUS_VOIDED: 'VOIDED',
    STATUS_CANCELLED: 'CANCELLED',
    ALL_STATUSES: 'ALL_STATUSES',
    // transaction actions
    ACTION_VOID: 'DoVoid',
    ACTION_REAUTHORIZE: 'DoReauthorize',
    ACTION_REFUND: 'DoRefundTransaction',
    ACTION_CAPTURE: 'DoCapture',
    // payment method id
    PAYMENT_METHOD_ID_PAYPAL: 'PayPal',
    PAYMENT_METHOD_ID_VENMO: 'Venmo',
    PAYMENT_METHOD_ID_APPLEPAY: 'ApplePay',
    PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD: 'PAYPAL_CREDIT_CARD',
    PAYMENT_METHOD_ID_GOOGLE_PAY: 'GooglePay',
    FUNDING_CARD: 'card',
    FUNDING_VENMO: 'venmo',
    FUNDING_PAYLATER: 'paylater',
    ALLOWED_PROCESSORS_IDS: ['PAYPAL', 'PAYPAL_LOCAL'],
    ALLOWED_PAYMENT_METHODS: [
        { value: 'ApplePay', label: 'Apple Pay' },
        { value: 'PAYPAL_CREDIT_CARD', label: 'Credit Card' },
        { value: 'GooglePay', label: 'Google Pay' },
        { value: 'PayPal', label: 'PayPal' },
        { value: 'Venmo', label: 'Venmo' }
    ],
    LOCAL_PAYMENT_METHOD_ABBR: 'LPM',
    LOCAL_PAYMENT_METHODS_FULL: 'Local Payment Methods',
    LIST_OF_LOCAL_PAYMENT_METHODS: ['bancontact', 'blik', 'eps', 'ideal', 'mybank', 'p24'],
    // service
    SERVICE_NAME: 'int_paypal.http.rest',
    BA_TOKEN_TYPE: 'BILLING_AGREEMENT',
    // etc.
    CREDIT_CARD_TYPE_VISA: 'visa',
    UNKNOWN: 'Unknown',
    NOT_APPLICABLE: 'Not applicable',
    NOT_APPLICABLE_SHORT: 'N/A',
    PARTNER_ATTRIBUTION_ID: 'SFCC_EC_B2C_25_3_0',
    ACTION_STATUS_SUCCESS: 'Success',
    INVALID_CLIENT: 'invalid_client',
    CLIENT_AUTHENTICATION_FAILED: 'Client Authentication failed',
    // https://developer.paypal.com/docs/api/payments/v1/#definition-related_resources
    TRANSACTION_STATUSES: [
        'CREATED', 'PARTIALLY_CAPTURED', 'CAPTURED',
        'VOIDED', 'PENDING', 'AUTHORIZED', 'COMPLETED',
        'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED',
        'EXPIRED', 'DENIED', 'DECLINED', 'FAILED'
    ],
    TRANSACTION_FAILED_STATUSES: [
        'EXPIRED', 'DENIED', 'DECLINED', 'FAILED'
    ],
    DISPUTE_STATUSES: [
        'OPEN', 'WAITING_FOR_BUYER_RESPONSE',
        'WAITING_FOR_SELLER_RESPONSE',
        'UNDER_REVIEW', 'RESOLVED', 'OTHER'
    ],
    DISPUTE_REASONS: [
        'MERCHANDISE_OR_SERVICE_NOT_RECEIVED', 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED',
        'UNAUTHORISED', 'CREDIT_NOT_PROCESSED', 'DUPLICATE_TRANSACTION', 'INCORRECT_AMOUNT',
        'PAYMENT_BY_OTHER_MEANS', 'CANCELED_RECURRING_BILLING', 'PROBLEM_WITH_REMITTANCE', 'OTHER'
    ],
    // Instances
    INSTANCE_SANDBOX: 'sandbox',
    INSTANCE_STAGING: 'staging',
    INSTANCE_PRODUCTION: 'production',
    INSTANCE_DEVELOPMENT: 'development',
    VALUE_TYPE: {
        3: 'String',
        4: 'Text',
        5: 'HTML',
        1: 'Integer',
        2: 'Number',
        8: 'Boolean',
        6: 'Date',
        11: 'Date+Time',
        7: 'Image',
        12: 'Email',
        13: 'Password',
        23: 'Set of Strings',
        21: 'Set of Integers',
        22: 'Set of Numbers',
        33: 'Enum of Strings',
        31: 'Enum of Integers'
    },
    ERRORS_WHITE_LIST: [
        'INVALID_RESOURCE_ID',
        'REFUND_AMOUNT_EXCEEDED',
        'MAX_CAPTURE_AMOUNT_EXCEEDED'
    ],
    BUTTON_LOCATIONS: ['billing', 'cart', 'minicart', 'pdp', 'pvp'],
    PAYLATER_MESSAGING_LOCATIONS: ['product', 'cart', 'checkout', 'product_preview', 'category'],
    CWPP_LOCATIONS: ['login', 'billing'],
    // Time period
    HOURS_START_OF_PERIOD: 0,
    MINUTES_START_OF_PERIOD: 0,
    SECONDS_START_OF_PERIOD: 0,
    HOURS_END_OF_PERIOD: 23,
    MINUTES_END_OF_PERIOD: 59,
    SECONDS_END_OF_PERIOD: 59,
    ALL_LOCATIONS: 'all-locations',
    PAYMENT_METHODS_MAP: new Map([
        ['ApplePay', 'Apple Pay'],
        ['PAYPAL_CREDIT_CARD', 'Credit Card'],
        ['GooglePay', 'Google Pay'],
        ['PayPal', 'PayPal'],
        ['Venmo', 'Venmo'],
        ['bancontact', 'Bancontact'],
        ['eps', 'EPS'],
        ['ideal', 'iDEAL'],
        ['mybank', 'MyBank'],
        ['p24', 'Przelewy24'],
        ['blik', 'BLIK']
    ]),
    // Default PayPal buttons styles
    DEFAULT_PAYPAL_BUTTONS_LAYOUT: 'vertical',
    DEFAULT_PAYPAL_BUTTONS_TAGLINE: false
};
