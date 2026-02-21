
'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('History', function (req, res, next) {
    if (req.currentCustomer.profile) {
        res.setViewData({
            customerID: req.currentCustomer.raw.ID,
            customerEmail: req.currentCustomer.profile.email,
            customerNo: req.currentCustomer.profile.customerNo,
            customerProfile: req.currentCustomer.profile
        });
    }
    next();
});

server.append('Details', function (req, res, next) {
    if (req.currentCustomer.profile) {
        res.setViewData({
            customerID: req.currentCustomer.raw.ID,
            customerProfile: req.currentCustomer.profile,
            customerNo: req.currentCustomer.profile.customerNo,
            isOrderDetails: true
        });
    }
    next();
});

server.append('Track', function (req, res, next) {
    res.setViewData({
        isOrderDetails: true
    });
    next();
});


module.exports = server.exports();
