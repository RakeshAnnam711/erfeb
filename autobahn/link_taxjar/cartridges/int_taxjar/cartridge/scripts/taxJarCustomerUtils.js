'use strict';

/**
 * Gets customer exemption type
 * @param  {dw.customer.Customer} customer - customer to get exemption type for
 * @return {string|null} - exemption type or null when no exemption type has been selected
 */
function getCustomerTaxExemptionType(customer) {
    var customerExemption;
    var customerProfile = customer.getProfile();

    if (customerProfile) {
        customerExemption = customerProfile.custom.TaxJarCustomerExemptionType.getValue();
    } else {
        customerExemption = null;
    }

    return customerExemption;
}

/**
 * Gets customer exemption regions
 * @param  {dw.customer.Customer} customer - customer to get exemptions for
 * @return {Array<string>} - Array of ISO state codes that customer is exempt in
 */
function getCustomerExemptionRegions(customer) {
    var customerProfile = customer.getProfile();
    var exemptRegions = [];

    if (customerProfile) {
        for (var i = 0; i < customerProfile.custom.TaxJarCustomerExemptionRegions.length; i++) {
            exemptRegions.push(customerProfile.custom.TaxJarCustomerExemptionRegions[i].getValue());
        }
    }

    return exemptRegions;
}

/**
 * Determines the exemption type for the region
 * @param  {dw.customer.Customer} customer [description]
 * @param  {string} country - ISO country code
 * @param  {string} state - ISO state code
 * @return {string|null} - exemption type string or null if no exemption type applies to region
 */
function getCustomerExemptionTypeForRegion(customer, country, state) {
    if (country !== 'US') {
        return null;
    }

    var exemptionType = getCustomerTaxExemptionType(customer);
    var exemptionRegions = getCustomerExemptionRegions(customer);

    if (exemptionType === null) {
        return null;
    }

    if (exemptionRegions.length < 1) {
        return exemptionType;
    }

    if (exemptionRegions.indexOf(state) !== -1) {
        return exemptionType;
    }

    return null;
}

module.exports = {
    getCustomerTaxExemptionType: getCustomerTaxExemptionType,
    getCustomerExemptionRegions: getCustomerExemptionRegions,
    getCustomerExemptionTypeForRegion: getCustomerExemptionTypeForRegion
};
