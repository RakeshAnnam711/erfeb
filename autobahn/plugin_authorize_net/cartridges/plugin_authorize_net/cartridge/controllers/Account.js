'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var viewData = res.getViewData();

    viewData.viewSavedPaymentsUrl = null;
    viewData.addPaymentUrl = null;
    viewData.payment = null;

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
