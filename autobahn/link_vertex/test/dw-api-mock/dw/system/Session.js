var Session = function () {};

Session.prototype.getCurrency = function () {};
Session.prototype.setCurrency = function () {};
Session.prototype.getUserName = function () {};
Session.prototype.getCustom = function () {
    return Session.prototype.custom;
};
Session.prototype.getForms = function () {
    return Session.prototype.forms;
};
Session.prototype.getCustomer = function () {};
Session.prototype.getSessionID = function () {};
Session.prototype.isCustomerAuthenticated = function () {};
Session.prototype.isUserAuthenticated = function () {};
Session.prototype.getClickStream = function () {
    return Session.prototype.clickStream;
};
Session.prototype.getPrivacy = function () {};
Session.prototype.getSourceCodeInfo = function () {};
Session.prototype.getLastReceivedSourceCodeInfo = function () {};
Session.prototype.currency = null;
Session.prototype.userName = null;
Session.prototype.custom = {};
Session.prototype.forms = {
    shipping: {
        shippingAddress: {
            addressFields: {
                UUID: 'TEST UUID',
                key: 'vertex',
                address1: { value: '221 Baker st' },
                address2: { value: '222 Baker st' },
                city: { value: 'London' },
                postalCode: { value: '111111' },
                states: { stateCode: { value: 'MN' } },
                country: { value: 'UK' }
            }
        }
    },
    multishipping: {
        editAddress: {
            addressFields: {
                UUID: 'TEST UUID',
                key: 'vertex',
                address1: { value: '221 Baker st' },
                address2: { value: '222 Baker st' },
                city: { value: 'London' },
                postal: { value: '111111' },
                states: { state: { value: 'MN' } },
                country: { value: 'UK' }
            }
        }
    },
    singleshipping: {
        shippingAddress: {
            addressFields: {
                UUID: 'TEST UUID',
                key: 'vertex',
                address1: { value: '221 Baker st' },
                address2: { value: '222 Baker st' },
                city: { value: 'London' },
                postal: { value: '111111' },
                states: { state: { value: 'MN' } },
                country: { value: 'UK' }
            }
        }
    }

};
Session.prototype.customer = null;
Session.prototype.sessionID = null;
Session.prototype.clickStream = new (require('../web/ClickStream'))();
Session.prototype.privacy = {};
Session.prototype.sourceCodeInfo = null;
Session.prototype.lastReceivedSourceCodeInfo = null;

module.exports = Session;
