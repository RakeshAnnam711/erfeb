'use strict';

var Abstract = require('*/cartridge/models/globale/api/Abstract');

/**
 * Represents AddressDetails
 * @constructor
 */
function AddressDetails() {
    this.UserIdNumber = null;
    this.UserIdNumberType = {
        UserIdNumberTypeCode: null,
        Name: null
    };
    this.FirstName = null;
    this.LastName = null;
    this.MiddleName = null;
    this.Salutation = null;
    this.Phone1 = null;
    this.Phone2 = null;
    this.Fax = null;
    this.Email = null;
    this.Company = null;
    this.Address1 = null;
    this.Address2 = null;
    this.City = null;
    this.CityRegion = null;
    this.StateOrProvince = null;
    this.StateCode = null;
    this.Zip = null;
    this.CountryCode = null;
    this.IsShipping = null;
    this.IsBilling = null;
    this.IsDefaultShipping = null;
    this.IsDefaultBilling = null;
    this.AddressBookId = null;
    this.AddressBookName = null;
}

/* Inherits Abstract */
AddressDetails.prototype = Object.create(Abstract.prototype);

module.exports = AddressDetails;
