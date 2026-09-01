module.exports = {
    // Request Type
    ACCESS_TOKEN: 'access_token',
    // Event types
    PAYMENT_AUTHORIZATION_VOIDED: 'PAYMENT.AUTHORIZATION.VOIDED',
    PAYMENT_CAPTURE_REFUNDED: 'PAYMENT.CAPTURE.REFUNDED',
    PAYMENT_CAPTURE_COMPLETED: 'PAYMENT.CAPTURE.COMPLETED',
    VAULT_PAYMENT_TOKEN_DELETED: 'VAULT.PAYMENT-TOKEN.DELETED',
    // Disputes Webhook event types
    CUSTOMER_DISPUTE_CREATED: 'CUSTOMER.DISPUTE.CREATED',
    CUSTOMER_DISPUTE_UPDATED: 'CUSTOMER.DISPUTE.UPDATED',
    CUSTOMER_DISPUTE_RESOLVED: 'CUSTOMER.DISPUTE.RESOLVED',
    // Intents
    INTENT_CAPTURE: 'CAPTURE',
    INTENT_AUTHORIZE: 'AUTHORIZE',
    // Status
    STATUS_SUCCESS: 'SUCCESS',
    PAYMENT_STATUS_PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
    PAYPAL_CARD_ERROR_STATUSES: [
        'DENIED',
        'DECLINED'
    ],
    // Http methods
    METHOD_POST: 'POST',
    METHOD_GET: 'GET',
    // Pages flows
    PAGE_FLOW_BILLING: 'billing',
    PAGE_FLOW_CHECKOUT: 'checkout',
    PAGE_FLOW_LOGIN: 'login',
    PAGE_FLOW_CART: 'cart',
    PAGE_FLOW_PDP: 'pdp',
    PAGE_FLOW_PRODUCT: 'product',
    PAGE_FLOW_PRODUCT_PREVIEW: 'product_preview',
    PAGE_FLOW_PVP: 'pvp',
    PAGE_FLOW_MINICART: 'minicart',
    PAGE_FLOW_CATEGORY: 'category',
    PAYPAL_BUTTON: 'paypalButton',
    PAYPAL_BUTTON_MESSAGE: 'paypalButtonMessage',
    // Payment status names
    PAYMENT_STATUS_REFUNDED: 'REFUNDED',
    // Connect with Paypal
    CONNECT_WITH_PAYPAL_CONSENT_DENIED: 'Consent denied',
    // Endpoint names
    ENDPOINT_HOME_SHOW: 'Home-Show',
    ENDPOINT_ACCOUNT_SHOW: 'Account-Show',
    ENDPOINT_CHECKOUT_LOGIN: 'Checkout-Login',
    ENDPOINT_APMA_SHOW: 'AutomaticPaymentMethodAdding-Show',
    // Payment method id
    PAYMENT_METHOD_ID_PAYPAL: 'PayPal',
    PAYMENT_METHOD_ID_VENMO: 'Venmo',
    PAYMENT_METHOD_ID_Debit_Credit_Card: 'PayPal Debit/Credit Card',
    PAYMENT_METHOD_ID_PAYPAL_CREDIT_CARD: 'PAYPAL_CREDIT_CARD',
    PAYMENT_METHOD_ID_APPLE_PAY: 'ApplePay',
    PAYMENT_METHOD_ID_GOOGLE_PAY: 'GooglePay',
    AVAILABLE_PM_IDS: [
        'ApplePay',
        'PAYPAL_CREDIT_CARD',
        'PayPal',
        'Venmo',
        'GooglePay'
    ],
    ALLOWED_PROCESSORS_IDS: ['PAYPAL', 'PAYPAL_LOCAL'],
    // Legacy code specific constant
    PAYPAL_ORDER_INDICATOR: 'express',
    // PayPal Smart Buttons funding sources types
    PP_FUNDING_SOURCE_CARD: 'card',
    // PayPal Smart Buttons payments types
    PP_DEBIT_CREDIT_PAYMENT_TYPE: 'PayPal Debit/Credit Card',
    // Connect with PayPal
    LOGIN_PAYPAL: 'login-PayPal',
    // APMA (Automatic Payment Method Adding)
    APMA_STAGE_COMPLETE: 'complete',
    APMA_STAGE_ADDRESS: 'address',
    APMA_STAGE_ACCOUNT: 'account',
    // Flash message types
    FLASH_MESSAGE_SUCCESS: 'success',
    FLASH_MESSAGE_INFO: 'info',
    FLASH_MESSAGE_DANGER: 'danger',
    FLASH_MESSAGE_WARNING: 'warning',
    // Flash messages alerts
    POPUP_CLOSE_DETECT_MESSAGE: 'Detected popup close',
    WINDOW_CLOSE_DETECT_MESSAGE: 'Window is closed, can not determine type',
    POPUP_GOOGLE_PAY_CLOSE_DETECT_CODE: 20,
    ZERO_AMOUNT: 'ZERO_AMOUNT',
    // Authentication Provider ID
    AUTHENTICATION_PAYPAL_PROVIDER_ID: 'PayPal',
    // Processing instructions
    NO_INSTRUCTION: 'NO_INSTRUCTION',
    // Address id
    BILLING_ADDRESS_ID: 'Billing address',
    SHIPPING_ADDRESS_ID: 'Shipping address',
    // RegExp patterns
    REGEXP_PHONE: /^[0-9]{1,14}?$/,
    REGEXP_NAME: /^[A-Z][a-zA-Z '.-]*[A-Za-z][^-]$/,
    // eslint-disable-next-line max-len
    REGEXP_EMAIL: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    // Payment methods tabs
    CREDIT_CARD_TAB: 'credit-card',
    // Includes PayPal and LPMS
    PAYPAL_TAB: 'payPal',
    ACTIVE_TAB: 'active-tab',
    UNKNOWN: 'Unknown',
    SAVE_LIMIT_UNLIMITED: -1,
    // logger related
    PAYPAL_FILE_NAME_PREFIX: 'PayPal',
    PAYPAL_CATEGORY: 'PayPal_General',
    CREDIT_CARD_COMPLEX_BRAND_CODE: ['American Express', 'UnionPay', 'JCB', 'Debit networks'],
    CREDIT_CARD_SAVE_STATUS_VAULTED: 'VAULTED',
    PAYPAL_ORDER_STATUS_COMPLETED: 'COMPLETED',
    // Credit Card number's creating constants
    CC_NUMBER_LIMIT_NUMBER_START: 0,
    CC_NUMBER_LIMIT_NUMBER_END: 10,
    CC_SAVE_LIMIT_UNLIMITED: -1,
    CC_3DS_AUTHENTICATION_REASON_SKIPPED_BY_BUYER: 'SKIPPED_BY_BUYER',
    CC_3DS_LIABILITY_SHIFT_STATUS_NO: 'NO',
    CC_3DS_LIABILITY_SHIFT_STATUS_UNKNOWN: 'UNKNOWN',
    CC_3DS_ALLOWED_ENROLLMENT_STATUS_YES: 'Y',
    CC_3DS_ALLOWED_ENROLLMENT_STATUS_UNAVAILABLE: 'U',
    // Credit Card verification methods on Account page
    DISABLED: 'DISABLED',
    SCA_WHEN_REQUIRED: 'SCA_WHEN_REQUIRED',
    SCA_ALWAYS: 'SCA_ALWAYS',
    PAYER_ACTION_REQUIRED: 'PAYER_ACTION_REQUIRED',
    APPLE_PAY_TOTAL_TYPE_FINAL: 'final',
    APPLE_PAY_TAB_IMAGE_ALT: 'Apple Pay',
    INITIATOR_CUSTOMER: 'CUSTOMER',
    PAYMENT_TYPE_ONE_TIME: 'ONE_TIME',
    PAYMENT_TYPE_UNSCHEDULED: 'UNSCHEDULED',
    USAGE_DERIVED: 'DERIVED',
    USAGE_FIRST: 'FIRST',
    USAGE_SUBSEQUENT: 'SUBSEQUENT',
    VAULT_INDICATOR_ON_SUCCESS: 'ON_SUCCESS',
    SOFT_DESCRIPTOR: '',
    CREDIT_CARD_TYPE_VISA: 'visa',
    SETUP_TOKEN_TYPE: 'SETUP_TOKEN',
    BA_TOKEN_TYPE: 'BILLING_AGREEMENT',
    // Address form
    ADDRESS_FORM_FIELD_COUNTRY: 'country',
    ADDRESS_FORM_FIELD_STATE: 'stateCode',
    ADDRESS_FORM_FIELD_POSTAL_CODE: 'postalCode',
    // Paypal shipping address error codes
    PAYPAL_SHIPPING_ADDRESS_ERROR_CODE: 'ADDRESS_ERROR',
    PAYPAL_SHIPPING_COUNTRY_ERROR_CODE: 'COUNTRY_ERROR',
    PAYPAL_SHIPPING_STATE_ERROR_CODE: 'STATE_ERROR',
    PAYPAL_SHIPPING_ZIP_ERROR_CODE: 'ZIP_ERROR',
    VAULT_MODE_ENABLED: 'Enabled',
    VAULT_MODE_PARTIALLY_DISABLED: 'Partially Disabled',
    VAULT_MODE_DISABLED: 'Disabled',
    // Buttons and Message/Banner Types
    STATUS_ENABLED: 'enabled',
    PAYPAL_BUTTON_LOCATION: 'paypal',
    APPLE_PAY_BUTTON_LOCATION: 'applePay',
    GOOGLE_PAY_BUTTON_LOCATION: 'googlePay',
    VENMO_BUTTON_LOCATION: 'venmo',

    PRODUCTION_SYSTEM_TYPE: 'PRODUCTION',
    DEVELOPMENT_SYSTEM_TYPE: 'TEST',

    GOOGLE_PAY_ORDER_STATUS_APPROVED: 'APPROVED',
    GOOGLE_PAY_ORDER_STATUS_PAYER_ACTION_REQUIRED: 'PAYER_ACTION_REQUIRED',
    THREE_DOMAIN_SECURE_LIABILITY_STATUS_POSSIBLE: 'POSSIBLE',
    THREE_DOMAIN_SECURE_LIABILITY_STATUS_YES: 'YES',
    STATE_SUCCEEDED: 'succeeded',
    STATE_ERRORED: 'errored',
    // Billing address selector options
    BILLING_ADDRESS_SElECTOR_OPTION_EXISTING_SHIPMENTS: '- Existing Shipments -',
    BILLING_ADDRESS_SElECTOR_OPTION_NEW: 'new',
    BILLING_ADDRESS_SElECTOR_OPTION_MANUAL_ENTRY: 'manual-entry',
    // Google Pay constants
    INTENT_INITIALIZE: 'INITIALIZE',
    INTENT_SHIPPING_ADDRESS: 'SHIPPING_ADDRESS',
    INTENT_SHIPPING_OPTION: 'SHIPPING_OPTION',
    REASON_SHIPPING_ADDRESS_UNSERVICEABLE: 'SHIPPING_ADDRESS_UNSERVICEABLE',
    REASON_SHIPPING_OPTION_INVALID: 'SHIPPING_OPTION_INVALID',
    GOOGLEPAY_PHONE_NUMBER_INVALID: 'GOOGLEPAY_PHONE_NUMBER_INVALID',
    // Input values
    SESSION_CARD: 'sessioncard',
    NEW_CARD: 'newcard',
    // PayPal Contact preferences
    CONTACT_PREFERENCE_NO_CONTACT_INFO: 'NO_CONTACT_INFO',
    CONTACT_PREFERENCE_UPDATE_CONTACT_INFO: 'UPDATE_CONTACT_INFO',
    CONTACT_PREFERENCE_RETAIN_CONTACT_INFO: 'RETAIN_CONTACT_INFO',
    // PayPal user actions
    USER_ACTION_PAY_NOW: 'PAY_NOW',
    USER_ACTION_CONTINUE: 'CONTINUE',
    // Shipping preferences
    SHIPPING_PREFERENCE_NO_SHIPPING: 'NO_SHIPPING',
    SHIPPING_PREFERENCE_SET_PROVIDED_ADDRESS: 'SET_PROVIDED_ADDRESS',
    SHIPPING_PREFERENCE_GET_FROM_FILE: 'GET_FROM_FILE',
    // COOKIES
    DWSID: 'dwsid'
};
