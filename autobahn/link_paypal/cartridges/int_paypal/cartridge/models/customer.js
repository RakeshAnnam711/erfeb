'use strict';

/**
 * SFCC API inclusions.
 */
const CustomerMgr = require('dw/customer/CustomerMgr');

/**
 * Custom API inclusions.
 */
const paypalConstants = require('*/cartridge/config/constants');
const payPalPreferences = require('*/cartridge/config/preferences');
const basicHelpers = require('*/cartridge/scripts/util/basicHelpers');

/**
 * Constructor of the class CustomerModel.
 * @param {dw.customer.Customer} customer SFCC customer to wrap.
 */
function CustomerModel(customer) {
    this.dw = customer;
}

/**
 * Private methods.
 */

/**
 * Generates an unified password that definitely meets all password constraints.
 * @returns {string} Generated password.
 */
const generateNewPassword = function() {
    const upperCaseChar = String.fromCharCode(basicHelpers.generateRandomNumber(65, 90));
    const lowerCaseChar = String.fromCharCode(basicHelpers.generateRandomNumber(97, 122));

    const length = CustomerMgr.passwordConstraints.minLength || 1;
    const digits = basicHelpers.generateRandomNumber(Math.pow(10, length - 1), Math.pow(10, length) - 1);

    const charset = '$%/()[]{}=?!.,-_*|+~#';
    const symbols = Array(CustomerMgr.passwordConstraints.minSpecialChars || 1).fill().reduce(function(acum) {
        return acum + charset.charAt(basicHelpers.generateRandomNumber(0, charset.length - 1));
    }, '');

    return upperCaseChar + lowerCaseChar + symbols + digits;
};

/**
 * Gets the password reset token of a customer
 * @param {Object} customer - the customer requesting password reset token
 * @returns {string} password reset token string
 */
function getPasswordResetToken(customer) {
    const Transaction = require('dw/system/Transaction');

    let passwordResetToken;

    Transaction.wrap(function() {
        passwordResetToken = customer.profile.credentials.createResetPasswordToken();
    });

    return passwordResetToken;
}

/**
 * Public methods.
 */

/**
 * Updates the email of the customer.
 * @param {string} email Email value.
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.setEmail = function(email) {
    this.dw.profile.setEmail(email);

    return this;
};

/**
 * Updates the first name of the customer.
 * @param {string} firstName First name value.
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.setFirstName = function(firstName) {
    this.dw.profile.setFirstName(firstName);

    return this;
};

/**
 * Updates the last name of the customer.
 * @param {string} lastName Last name value.
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.setLastName = function(lastName) {
    this.dw.profile.setLastName(lastName);

    return this;
};

/**
 * Updates the phone number of the customer.
 * @param {string} phoneNumber Phone number value.
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.setPhone = function(phoneNumber) {
    this.dw.profile.setPhoneHome(phoneNumber);

    return this;
};

/**
 * Sets the customer's profile to be external.
 * @param {boolean} value - Whether or not the customer's profile should be external.
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.setIsExternalProfile = function(value) {
    this.dw.profile.custom.isExternalProfile = value;

    return this;
};

/**
 * Retrieves a preferred locale of the customer instance.
 * @returns {string|null} Preferred locale (like "en_US").
 */
CustomerModel.prototype.getPreferredLocale = function() {
    return this.dw.profile.preferredLocale || null;
};

/**
 * Helper that sends an email to a customer
 * @param {obj} emailObj - An object that contains information about email that will be sentemailHelpers for values.
 * @param {string} template - Location of the ISML template to be rendered in the email.
 * @param {obj} context - Object with context to be passed as pdict into ISML template.
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.sendEmail = function(emailObj, template, context) {
    const emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

    const emailInfo = Object.assign({
        to: this.dw.profile.email,
        from: payPalPreferences.customerServiceEmail
    }, emailObj);

    const userInfo = Object.assign({
        email: this.dw.profile.email,
        lastName: this.dw.profile.lastName,
        firstName: this.dw.profile.firstName
    }, context);

    emailHelpers.sendEmail(emailInfo, template, userInfo);

    return this;
};

/**
 * Sends a registration email.
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.sendRegistrationEmail = function() {
    const Resource = require('dw/web/Resource');
    const URLUtils = require('dw/web/URLUtils');

    this.sendEmail({
        subject: Resource.msg('email.subject.new.registration', 'registration', null)
    }, 'emails/accountRegistration', {
        loginShowURL: URLUtils.https('Login-Show'),
        editPasswordURL: URLUtils.https('Account-EditPassword'),
        setPasswordURL: URLUtils.https('Account-SetNewPassword', 'Token', getPasswordResetToken(this.dw))
    });

    return this;
};

/**
 * Sends a confirmation email after a successful account linking
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.sendLinkedAccountConfirmationEmail = function() {
    const Site = require('dw/system/Site');
    const Resource = require('dw/web/Resource');

    const httpHostName = Site.current.httpHostName;

    this.sendEmail({
        subject: Resource.msgf('email.account.linked.pp.title', 'notifications', null, httpHostName)
    }, 'emails/accountLinkedPP', {
        currentSite: httpHostName
    });

    return this;
};

/**
 * Sends a confirmation email after a successful account unlinking
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.sendUnlinkedAccountConfirmationEmail = function() {
    const Site = require('dw/system/Site');
    const Resource = require('dw/web/Resource');

    const httpHostName = Site.current.httpHostName;

    this.sendEmail({
        subject: Resource.msgf('email.account.unlinked.pp.title', 'notifications', null, httpHostName)
    }, 'emails/accountUnlinkedPP', {
        currentSite: httpHostName
    });

    return this;
};

/**
 * Adds the flash message for the customer.
 * @param {string} text The text of the message.
 * @param {string} type The type of the message.
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.addFlashMessage = function(text, type) {
    const utils = require('*/cartridge/scripts/paypal/utils');

    utils.addFlashMessagesCustomAttribute(this.dw.profile, text, type);

    return this;
};

/**
 * Pulls all the flash messages.
 * @returns {array} Flash messages.
 */
CustomerModel.prototype.pullFlashMessages = function() {
    const flashMessages = JSON.parse(this.dw.profile.custom.flashMessages) || [];

    this.dw.profile.custom.flashMessages = '';

    return flashMessages;
};

/**
 * Identifies whether the Automatic Payment Method Adding (APMA) feature is enabled for the current customer.
 * @returns {boolean} APMA feature is enabled (true) or disabled (false).
 */
CustomerModel.prototype.isEnabledFeatureAPMA = function() {
    return !this.dw.profile.custom.isDisabledFeatureAPMA;
};

/**
 * Disables the Automatic Payment Method Adding (APMA) feature for the current customer.
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.disableFeatureAPMA = function() {
    this.dw.profile.custom.isDisabledFeatureAPMA = true;

    return this;
};

/**
 * Verifies whether the current customer has the specified address in the address book.
 * @param {Object} addressObject Address information of the customer to verify.
 * @returns {boolean} Customer has address (true) or not (false).
 */
CustomerModel.prototype.hasAddress = function(addressObject) {
    return this.dw.profile.addressBook.addresses.toArray().some(function(address) {
        return !Object.keys(addressObject).some(function(key) {
            return Object.hasOwnProperty.call(address, key) && (address[key].value || address[key]) !== addressObject[key];
        });
    });
};

/**
 * Adds the specified address to address book of the current customer.
 * @param {Object} addressObject Address information of the customer to add.
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.addAddress = function(addressObject) {
    const address = this.dw.profile.addressBook.createAddress(addressObject.id);

    address.setAddress1(addressObject.address1);
    address.setCity(addressObject.city);
    address.setCountryCode(addressObject.countryCode);
    address.setFirstName(addressObject.firstName);
    address.setLastName(addressObject.lastName);
    address.setPostalCode(addressObject.postalCode);
    address.setStateCode(addressObject.stateCode);
    address.setPhone(addressObject.phone);

    return this;
};

/**
 * Restores the current basket from the guest basket for the current customer.
 * @param {dw.order.Basket} guestBasket Guest basket.
 * @returns {CustomerModel} Customer instance.
 */
CustomerModel.prototype.restoreBasket = function(guestBasket) {
    const BasketMgr = require('dw/order/BasketMgr');
    const cartHelpers = require('*/cartridge/scripts/cart/cartHelpers');
    const shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');
    const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    let currentBasket = BasketMgr.getCurrentBasket();

    // the current basket should be replaced with the guest basket
    if (currentBasket) {
        BasketMgr.deleteBasket(currentBasket);
    }

    currentBasket = BasketMgr.getCurrentOrNewBasket();

    // add products
    guestBasket.productLineItems.toArray().forEach(function(pli) {
        // skip bonus product
        if (pli.bonusProductLineItem) {
            return;
        }

        // required for a product bundle
        const childProducts = pli.bundledProductLineItems.toArray().reduce(function(acum, bpli) {
            acum.push({
                pid: bpli.productID,
                quantity: bpli.quantityValue
            });

            return acum;
        }, []);

        // required for product with options
        const options = pli.optionProductLineItems.toArray().reduce(function(acum, opli) {
            acum.push({
                optionId: opli.optionID,
                selectedValueId: opli.optionValueID
            });

            return acum;
        }, []);

        cartHelpers.addProductToCart(currentBasket, pli.productID, pli.quantityValue, childProducts, options);
    });

    // select the same shipping method
    shippingHelpers.selectShippingMethod(currentBasket.defaultShipment, guestBasket.defaultShipment.shippingMethodID);

    // add coupon codes
    guestBasket.couponLineItems.toArray().forEach(function(cli) {
        try {
            currentBasket.createCouponLineItem(cli.couponCode, cli.basedOnCampaign);
        } catch (e) {
            return;
        }
    });

    // trigger basket recalculation
    basketCalculationHelpers.calculateTotals(currentBasket);

    return this;
};

/**
 * Returns whether or not the customer's profile is external.
 *
 * @returns {boolean} Whether or not the customer's profile is external.
 */
CustomerModel.prototype.isExternalProfile = function() {
    return this.dw.profile.custom.isExternalProfile === true;
};

/**
 * Static properties.
 */

CustomerModel.FLASH_MESSAGE_SUCCESS = paypalConstants.FLASH_MESSAGE_SUCCESS;
CustomerModel.FLASH_MESSAGE_INFO = paypalConstants.FLASH_MESSAGE_INFO;
CustomerModel.FLASH_MESSAGE_DANGER = paypalConstants.FLASH_MESSAGE_DANGER;
CustomerModel.FLASH_MESSAGE_WARNING = paypalConstants.FLASH_MESSAGE_WARNING;

/**
 * Static methods.
 */

/**
 * Searches a customer by the provided identifier (login, number, token) and wraps it with the CustomerModel.
 * @param {string} id Identifier to search the customer.
 * @returns {CustomerModel|null} Searched customer instance.
 */
CustomerModel.get = function(id) {
    const customer = CustomerMgr.getCustomerByLogin(id)
                     || CustomerMgr.getCustomerByCustomerNumber(id)
                     || CustomerMgr.getCustomerByToken(id);

    return customer ? new CustomerModel(customer) : null;
};

/**
 * Creates a new customer based on provided credentials and wraps it with the CustomerModel.
 * @param {string} login Login for the new customer.
 * @param {string} password Password for the new customer.
 * @param {string} customerNo Number for the new customer.
 * @returns {CustomerModel|null} New customer instance.
 */
CustomerModel.create = function(login, password, customerNo) {
    const newPassword = password || generateNewPassword();
    const args = [login, newPassword];

    if (customerNo) {
        args.push(customerNo);
    }

    const customer = CustomerMgr.createCustomer.apply(null, args);

    if (!customer) {
        return null;
    }

    const customerInstance = new CustomerModel(customer);

    customerInstance.password = newPassword;

    return customerInstance;
};

/**
 * Checks whether the external profile with specific email exist.
 * @param {string} email Specified email address.
 * @returns {boolean} Profile exists or not.
 */
CustomerModel.externalProfileExist = function(email) {
    return CustomerMgr.searchProfiles('email = {0}', null, email).asList().toArray().some(function(profile) {
        if (!profile.customer.externallyAuthenticated) {
            return false;
        }

        return profile.customer.externalProfiles.toArray().some(function(extProfile) {
            return extProfile.authenticationProviderID === 'PayPal';
        });
    });
};

module.exports = CustomerModel;
