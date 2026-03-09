'use strict';

var base = module.superModule;
var baseInitialize = base.prototype.initialize;

// Replace base initialize
base.prototype.initialize = function () {
    baseInitialize.apply(this, arguments);

    // reset count when null/undefined
    this.hitCount = this.hitCount || 0;
};

module.exports = base;
