"use strict";

var base = module.superModule;
var dwutil = require('dw/util');

base.getCurrencyValueForApi = function getCurrencyValueForApi(amount) {
    if (amount && amount.value > 0) {
        var currencyCode = dwutil.Currency.getCurrency(amount.currencyCode);
        var digitsNumber = base.getFractionDigits(currencyCode.toString());
        var value = Math.round(amount.multiply(Math.pow(10, digitsNumber)).value); // eslint-disable-line no-restricted-properties
        return new dw.value.Money(value, currencyCode);
    } else {
        return new dw.value.Money(0, dw.system.Site.current.defaultCurrency);
    }
}

base.getAdyenGivingConfig = function getAdyenGivingConfig(order) {
    var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
    var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
    var constants = require('*/cartridge/adyen/config/constants');

    var paymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
    if (!paymentInstrument.length) {
        paymentInstrument = order.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_DW_APPLE_PAY);
    }

    if (paymentInstrument.length) {
        paymentInstrument = paymentInstrument[0];

        if (paymentInstrument && paymentInstrument.paymentTransaction) {
            var paymentMethod = paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod;
            if (!AdyenConfigs.getAdyenGivingEnabled() || !adyenHelperObj.isAdyenGivingAvailable(paymentMethod)) {
                return null;
            }
            var givingConfigs = {};
            var configuredAmounts = module.exports.getDonationAmounts();
            givingConfigs.adyenGivingAvailable = true;
            givingConfigs.configuredAmounts = configuredAmounts;
            givingConfigs.charityName = AdyenConfigs.getAdyenGivingCharityName();
            givingConfigs.charityWebsite = AdyenConfigs.getAdyenGivingCharityWebsite();
            givingConfigs.charityDescription = AdyenConfigs.getAdyenGivingCharityDescription();
            givingConfigs.adyenGivingBackgroundUrl = AdyenConfigs.getAdyenGivingBackgroundUrl();
            givingConfigs.adyenGivingLogoUrl = AdyenConfigs.getAdyenGivingLogoUrl();
            givingConfigs.donationAmounts = JSON.stringify({
                currency: session.currency.currencyCode,
                values: configuredAmounts
            });
            givingConfigs.pspReference = paymentInstrument.paymentTransaction.custom.Adyen_pspReference;
            for (var config in givingConfigs) {
                if (Object.prototype.hasOwnProperty.call(givingConfigs, config)) {
                    if (givingConfigs[config] === null) {
                        AdyenLogs.error_log('Could not render Adyen Giving component. Please make sure all Adyen Giving fields in Custom Preferences are filled in correctly');
                        return null;
                    }
                }
            }
            return givingConfigs;
        }
    }
}

base.createShopperObject = function createShopperObject(args) {
    var _args$order, _args$order$getDefaul, _args$order$getDefaul2;
    var gender = 'UNKNOWN';
    if (args.paymentRequest.shopperName && args.paymentRequest.shopperName.gender) {
      gender = args.paymentRequest.shopperName.gender;
    }
    var customer = args.order.getCustomer();
    var profile = customer && customer.registered && customer.getProfile() ? customer.getProfile() : null;
    if (args.order.customerEmail) {
      args.paymentRequest.shopperEmail = args.order.customerEmail;
    }
    if (!args.order.customerEmail && profile && profile.getEmail()) {
      args.paymentRequest.shopperEmail = profile.getEmail();
    }
    var address = args.order.getBillingAddress() || args.order.getDefaultShipment().getShippingAddress();
    var shopperDetails = {
      firstName: address === null || address === void 0 ? void 0 : address.firstName,
      gender: gender,
      infix: '',
      lastName: address === null || address === void 0 ? void 0 : address.lastName
    };
    args.paymentRequest.shopperName = shopperDetails;
    if (profile && profile.getCustomerNo()) {
      args.paymentRequest.shopperReference = profile.getCustomerNo();
    } else if (args.order.getCustomerNo()) {
      args.paymentRequest.shopperReference = args.order.getCustomerNo();
    }
    if (request.getLocale()) {
      args.paymentRequest.shopperLocale = request.getLocale();
    }
    args.paymentRequest.shopperIP = request.getHttpRemoteAddress();
    return args.paymentRequest;
  }

module.exports = base;
