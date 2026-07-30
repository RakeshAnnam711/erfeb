'use strict';

var base = module.superModule;

var HashMap = require('dw/util/HashMap');

module.exports = function (context, modelIn) {
    var model = modelIn || new HashMap();

    model.CurrentRequest = request;

    return base.call(this, context, model);
}
