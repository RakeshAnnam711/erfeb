'use strict';

var AbstractRequest = require('*/cartridge/models/globale/generic/AbstractRequest');

/**
 * Represents KeepAliveRequest
 * @constructor
 * @throws {Error}
 */
function KeepAliveRequest() {
    AbstractRequest.call(this);
}

/* Inherits AbstractRequest */
KeepAliveRequest.prototype = Object.create(AbstractRequest.prototype);

module.exports = KeepAliveRequest;
