'use strict';

var Abstract = require('*/cartridge/models/globale/api/Abstract');

/**
 * Represents ProductCountry
 * @constructor
 */
function ProductCountry() {
    this.ProductCode = null;
    this.CountryCode = null;
    this.IsRestricted = null;
    this.IsForbidden = null;
    this.VATRateType = null;
    this.IsVerified = null;
    this.UploadedViaCatalog = null;
}

/* Inherits Abstract */
ProductCountry.prototype = Object.create(Abstract.prototype);

module.exports = ProductCountry;
