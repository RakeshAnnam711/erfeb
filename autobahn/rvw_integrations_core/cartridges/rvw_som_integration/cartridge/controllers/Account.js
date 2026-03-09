
"use strict";

var server = require("server");
server.extend(module.superModule);

server.append("Show", function (req, res, next) {
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

module.exports = server.exports();
