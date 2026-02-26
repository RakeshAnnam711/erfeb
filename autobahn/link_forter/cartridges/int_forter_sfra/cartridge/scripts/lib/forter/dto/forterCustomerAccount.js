'use strict';
/**
 * ForterCustomerAccount class is the DTO object of the general parameters for Customer Account Update call.
 *
 * To include this script use:
 * var ForterCustomerAccount = require("~/cartridge/scripts/lib/forter/dto/forterCustomerAccount");
 *
 * @param {string} event - event
 * @param {Object} request - current request
 * @param {Object} customer - current customer
 */
function ForterCustomerAccount(event, request, customer) {
    function ForterConnectionInformation() {
        this.customerIP = request.httpRemoteAddress;     // Required
        this.userAgent = request.httpUserAgent;          // Required
        this.forterTokenCookie = '';                     // Conditional

        for (var i = 0; i < request.httpCookies.cookieCount; i++) {
            if (request.httpCookies[i].name === 'forterToken') {
                this.forterTokenCookie = request.httpCookies[i].value;
            }
        }
    }

    function ForterPersonalDetails() {
        this.firstName = customer.profile.firstName;
        this.lastName = customer.profile.lastName;
    }

    function ForterEmail() {
        this.email = customer.profile.email;
        this.emailRole = 'ACCOUNT';
        this.updateTimes = {};

        if (customer.profile.getCreationDate()) {
            this.updateTimes.creationTime = Number((customer.profile.getCreationDate().getTime() / 1000).toFixed());
        }
    }

    function ForterPaymentMethods(cpi) {
        this.billingDetails = {};
        this.billingDetails.personalDetails = {};

        // add this if credicard exists
        this.creditCard = {};

        // format the expiration month. from 1 to 01, etc.
        var creditCardExpMonth;
        if (cpi.creditCardExpirationMonth.toString().length === 1) {
            creditCardExpMonth = '0' + cpi.creditCardExpirationMonth.toString();
        } else {
            creditCardExpMonth = cpi.creditCardExpirationMonth.toString();
        }

        this.creditCard.nameOnCard = cpi.creditCardHolder;
        this.creditCard.cardBrand = cpi.creditCardType;
        // stored payments will always be masked which causes 400 in forter, so just avoid sending them
        // this.creditCard.bin = cpi.creditCardNumber.substring(0, 6);
        this.creditCard.lastFourDigits = cpi.creditCardNumberLastDigits;
        this.creditCard.expirationMonth = creditCardExpMonth;
        this.creditCard.expirationYear = cpi.creditCardExpirationYear.toString();
        this.creditCard.cardType = 'UNKNOWN';
        this.creditCard.verificationResults = {};
        this.creditCard.verificationResults.avsStreetResult = '';
        this.creditCard.verificationResults.avsZipResult = '';

        // no transaction made in account api, so 0 here
        this.amount = {};
        this.amount.amountUSD = '0';
        this.amount.amountLocalCurrency = '0';
        this.amount.currency = 'USD';
    }

    function GetPaymentMethods() {
        var methods = [];

        // loop by the saved credit card here
        for (var i = 0; i < customer.profile.wallet.paymentInstruments.length; i++) {
            var cc = customer.profile.wallet.paymentInstruments[i];
            var creditCardInfo = new ForterPaymentMethods(cc);
            methods.push(creditCardInfo);
        }

        return methods;
    }

    function ForterAddress(address) {
        this.address1 = address.address1;            // Required

        if (address.address2) {
            this.address2 = address.address2;            // Conditional
        }

        this.zip = address.postalCode;
        this.city = address.city;
        this.region = address.stateCode;
        this.country = address.countryCode.value.toUpperCase();
    }

    function GetAddresses() {
        var addrs = [];

        if (customer.profile) {
            var addresses = customer.profile.addressBook.addresses;

            for (var i = 0; i < addresses.length; i++) {
                var addr = addresses[i];
                var address = new ForterAddress(addr);
                addrs.push(address);
            }
        }

        return addrs;
    }

    this.accountId = customer.ID;                             // Required
    this.triggerEvent = event;                                   // Required
    this.eventTime = (new Date()).getTime();                  // Required
    this.connectionInformation = new ForterConnectionInformation();       // Required
    this.accountData = {};                                      // Required

    this.accountData.personalDetails = new ForterPersonalDetails();       // Required
    this.accountData.status = 'ACTIVE';                          // Conditional

    this.accountData.emailsInAccount = [];                       // Optional
    this.accountData.emailsInAccount.push(new ForterEmail());

    var adresses = new GetAddresses();                                    // Conditional
    if (adresses.length > 0) {
        this.accountData.addressesInAccount = adresses;
    } else {
        this.accountData.addressesInAccount = [];
    }

    function ForterCustomerEngagement() {
        // SFRA core doesn't have wish-list in box. Uncomment and use if any plugin or custom implementation of wish-lists is available.
        /*
        var prodLists = new dw.util.ArrayList(dw.customer.ProductListMgr.getProductLists(customer, dw.customer.ProductList.TYPE_WISH_LIST));

        if (prodLists.size() > 0) {
            var prodItems    = prodLists.get(0).getProductItems();

            if (prodItems.size() == 0) {
                this.wishlist = {};
                this.wishlist.itemInListCount = 0;
            } else {
                this.wishlist = {};
                this.wishlist.itemInListCount = prodItems.size();
            }
        }
        */

        this.wishlist = {};
        this.wishlist.itemInListCount = 0;
    }

    var paymentMethods = new GetPaymentMethods();          // Conditional
    this.accountData.paymentMethodsInAccount = paymentMethods;
    this.accountData.customerEngagement = new ForterCustomerEngagement(); // Required
}

module.exports = ForterCustomerAccount;
