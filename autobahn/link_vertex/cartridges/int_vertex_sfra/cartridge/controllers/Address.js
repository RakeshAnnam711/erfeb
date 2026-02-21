'use strict';

var page = module.superModule;
var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.extend(page);

server.append('SaveAddress', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
 
    this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
        var viewData = res.getViewData();
        if (viewData.success) {
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var addressBook = customer.getProfile().getAddressBook();
            var addressId = req.querystring.addressId ? req.querystring.addressId : viewData.addressId;
            Transaction.wrap(function () {
                var address = addressBook.getAddress(addressId);
                address.custom.taxnumber = viewData.taxnumber;
            });
        }
    });
    
    return next();
});

module.exports = server.exports();
