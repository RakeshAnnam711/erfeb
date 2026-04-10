
var Profile = require('./Profile');

/**
 * Mock of dw.customer.Customer
 */
function Customer() {
    this.profile = new Profile();
    this.getProfile = function () {
        return this.profile;
    };
}

module.exports = Customer;
