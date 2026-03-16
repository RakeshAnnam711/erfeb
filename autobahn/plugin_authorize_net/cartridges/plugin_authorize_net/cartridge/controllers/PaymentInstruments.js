'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('List', function (req, res, next) {
    var viewData = res.getViewData();

    viewData.addPaymentUrl = null;

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
