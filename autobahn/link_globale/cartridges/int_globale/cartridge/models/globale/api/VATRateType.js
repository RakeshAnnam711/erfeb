'use strict';

var Abstract = require('*/cartridge/models/globale/api/Abstract');

/**
 * Represents VATRateType
 * @constructor
 */
function VATRateType() {
    this.VATRateTypeCode = null;
    this.Name = null;
    this.Rate = null;
}

/* Inherits Abstract */
VATRateType.prototype = Object.create(Abstract.prototype);

module.exports = VATRateType;
