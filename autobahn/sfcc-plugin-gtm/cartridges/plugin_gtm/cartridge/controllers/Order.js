'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Confirm', function (req, res, next) {
    if(req.form) {
        var viewData = res.getViewData();
        viewData.orderID = req.form.orderID;
        viewData.orderToken = req.form.orderToken;
        res.setViewData(viewData);
    }
    next();
});

module.exports = server.exports();
