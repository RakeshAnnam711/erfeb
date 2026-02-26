'use strict';

var Abstract = require('*/cartridge/models/globale/api/Abstract');

/**
 * Represents CustomerDetails
 * @constructor
 */
function CustomerDetails() {
    this.FirstName = null;
    this.LastName = null;
    this.FirstNameInLocalCulture = null;
    this.LastNameInLocalCulture = null;
    this.MiddleName = null;
    this.Salutation = null;
    this.Company = null;
    this.Address1 = null;
    this.Address2 = null;
    this.City = null;
    this.CityRegion = null;
    this.StateCode = null;
    this.StateOrProvince = null;
    this.Zip = null;
    this.Email = null;
    this.Phone1 = null;
    this.Phone2 = null;
    this.Fax = null;
    this.CountryCode = null;
    this.CountryCode3 = null;
    this.CountryName = null;
    this.AddressBookId = null;
    this.AddressBookName = null;
    this.SaveAddress = null;
    this.VATRegistrationNumber = null;
    this.CustomerTaxId = null;
    this.CollectionPointId = null;
}

/* Inherits Abstract */
CustomerDetails.prototype = Object.create(Abstract.prototype);

CustomerDetails.prototype.toDwOrderAddressObject = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var dwOrderAddressObject = {
        address1: this.Address1,
        address2: this.Address2,
        city: this.City,
        companyName: this.Company,
        countryCode: {
            displayValue: this.CountryCode,
            value: this.CountryCode
        },
        firstName: this.FirstName,
        fullName: null,
        jobTitle: null,
        lastName: this.LastName,
        phone: this.Phone1,
        postalCode: this.Zip,
        postBox: null,
        salutation: this.Salutation,
        secondName: null,
        stateCode: this.StateCode,
        suffix: null,
        suite: null,
        title: null
    };

    var custom = {};
    custom[globaleHelpers.customAttr.orderAddress.geCityRegion] = this.CityRegion;
    custom[globaleHelpers.customAttr.orderAddress.geDeliveryStoreId] = this.CollectionPointId;
    custom[globaleHelpers.customAttr.orderAddress.geVATRegistrationNumber] = this.VATRegistrationNumber;
    custom[globaleHelpers.customAttr.orderAddress.geCustomerTaxId] = this.CustomerTaxId;
    dwOrderAddressObject.custom = custom;

    return dwOrderAddressObject;
};

module.exports = CustomerDetails;
