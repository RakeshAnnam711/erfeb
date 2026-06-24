var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

/**
 * Test case:
 * should be able to register, logout, login, update profile
 */

describe('Main customer actions', function () {
    this.timeout(50000);

    var date = new Date();
    var timestamp = date.getTime();

    it('Must register', function () {
        var cookieJar = request.jar();
        var myRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        // ----- Step submit the Registration form
        myRequest.url = config.baseUrl + '/CSRF-Generate';

        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);

                myRequest.url = config.baseUrl + '/Account-SubmitRegistration?'
                    + csrfJsonResponse.csrf.tokenName + '='
                    + csrfJsonResponse.csrf.token;
                myRequest.form = {
                    dwfrm_profile_customer_email: 'John' + timestamp + '@Cena.com',
                    dwfrm_profile_customer_emailconfirm: 'John' + timestamp + '@Cena.com',
                    dwfrm_profile_customer_firstname: 'John',
                    dwfrm_profile_customer_lastname: 'Cena',
                    dwfrm_profile_customer_phone: '9786543213',
                    dwfrm_profile_login_password: 'John' + timestamp + '@Cena.com',
                    dwfrm_profile_login_passwordconfirm: 'John' + timestamp + '@Cena.com'
                };

                return request(myRequest)
                    .then(function (response) {
                        var bodyAsJson = JSON.parse(response.body);
                        assert.equal(bodyAsJson.success, true);
                        assert.equal(bodyAsJson.email, 'John' + timestamp + '@Cena.com');
                    });
            });
    });

    it('Must login', function () {
        var cookieJar = request.jar();
        var myRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        // ----- Step submit the Login form
        myRequest.url = config.baseUrl + '/CSRF-Generate';

        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);

                myRequest.url = config.baseUrl + '/Account-Login?'
                    + csrfJsonResponse.csrf.tokenName + '='
                    + csrfJsonResponse.csrf.token;
                myRequest.form = {
                    loginEmail: 'John' + timestamp + '@Cena.com',
                    loginPassword: 'John' + timestamp + '@Cena.com',
                    loginRememberMe: false
                };

                return request(myRequest)
                    .then(function (response) {
                        var bodyAsJson = JSON.parse(response.body);
                        assert.equal(bodyAsJson.success, true);
                    });
            });
    });

    it('Must login and update profile', function () {
        var cookieJar = request.jar();
        var myRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        // ----- Step submit the Login form
        myRequest.url = config.baseUrl + '/CSRF-Generate';

        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);

                myRequest.url = config.baseUrl + '/Account-Login?'
                    + csrfJsonResponse.csrf.tokenName + '='
                    + csrfJsonResponse.csrf.token;
                myRequest.form = {
                    loginEmail: 'John' + timestamp + '@Cena.com',
                    loginPassword: 'John' + timestamp + '@Cena.com',
                    loginRememberMe: false
                };

                return request(myRequest);
            })
            .then(function () {
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);

                myRequest.url = config.baseUrl + '/Account-SaveProfile?'
                    + csrfJsonResponse.csrf.tokenName + '='
                    + csrfJsonResponse.csrf.token;
                myRequest.form = {
                    dwfrm_profile_customer_email: 'John' + timestamp + '@Cena.com',
                    dwfrm_profile_customer_emailconfirm: 'John' + timestamp + '@Cena.com',
                    dwfrm_profile_customer_firstname: 'John1',
                    dwfrm_profile_customer_lastname: 'Cena1',
                    dwfrm_profile_customer_phone: '9786543213',
                    dwfrm_profile_login_password: 'John' + timestamp + '@Cena.com',
                    dwfrm_profile_login_passwordconfirm: 'John' + timestamp + '@Cena.com'
                };

                return request(myRequest)
                    .then(function (response) {
                        var bodyAsJson = JSON.parse(response.body);
                        assert.equal(bodyAsJson.success, true);
                        assert.equal(bodyAsJson.firstName, 'John1');
                        assert.equal(bodyAsJson.lastName, 'Cena1');
                    });
            });
    });

    it('Must login and add payment instrument', function () {
        var cookieJar = request.jar();
        var myRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        // ----- Step submit the Login form
        myRequest.url = config.baseUrl + '/CSRF-Generate';

        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);

                myRequest.url = config.baseUrl + '/Account-Login?'
                    + csrfJsonResponse.csrf.tokenName + '='
                    + csrfJsonResponse.csrf.token;
                myRequest.form = {
                    loginEmail: 'John' + timestamp + '@Cena.com',
                    loginPassword: 'John' + timestamp + '@Cena.com',
                    loginRememberMe: false
                };

                return request(myRequest);
            })
            .then(function () {
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);

                myRequest.url = config.baseUrl + '/PaymentInstruments-SavePayment?'
                    + csrfJsonResponse.csrf.tokenName + '='
                    + csrfJsonResponse.csrf.token;
                myRequest.form = {
                    dwfrm_creditCard_cardOwner: 'John card',
                    dwfrm_creditCard_cardNumber: '4111111111111111',
                    dwfrm_creditCard_cardType: 'Visa',
                    dwfrm_creditCard_expirationMonth: 10,
                    dwfrm_creditCard_expirationYear: 2020
                };

                return request(myRequest)
                    .then(function (response) {
                        var bodyAsJson = JSON.parse(response.body);
                        assert.equal(bodyAsJson.success, true);
                        assert.equal(bodyAsJson.cardNumber, '4111111111111111');
                        assert.equal(bodyAsJson.name, 'John card');
                    });
            });
    });

    it('Must login and list saved payment instruments', function () {
        var cookieJar = request.jar();
        var myRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        // ----- Step submit the Login form
        myRequest.url = config.baseUrl + '/CSRF-Generate';

        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);

                myRequest.url = config.baseUrl + '/Account-Login?'
                    + csrfJsonResponse.csrf.tokenName + '='
                    + csrfJsonResponse.csrf.token;
                myRequest.form = {
                    loginEmail: 'John' + timestamp + '@Cena.com',
                    loginPassword: 'John' + timestamp + '@Cena.com',
                    loginRememberMe: false
                };

                return request(myRequest);
            })
            .then(function () {
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                return request(myRequest);
            })
            .then(function () {
                myRequest.method = 'GET';
                myRequest.url = config.baseUrl + '/PaymentInstruments-List';

                return request(myRequest)
                    .then(function (response) {
                        assert.equal(response.statusCode, 200);
                    });
            });
    });

    it('Must login and list saved addresses', function () {
        var cookieJar = request.jar();
        var myRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        // ----- Step submit the Login form
        myRequest.url = config.baseUrl + '/CSRF-Generate';

        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);

                myRequest.url = config.baseUrl + '/Account-Login?'
                    + csrfJsonResponse.csrf.tokenName + '='
                    + csrfJsonResponse.csrf.token;
                myRequest.form = {
                    loginEmail: 'John' + timestamp + '@Cena.com',
                    loginPassword: 'John' + timestamp + '@Cena.com',
                    loginRememberMe: false
                };

                return request(myRequest);
            })
            .then(function () {
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                return request(myRequest);
            })
            .then(function () {
                myRequest.method = 'GET';
                myRequest.url = config.baseUrl + '/Address-List';

                return request(myRequest)
                    .then(function (response) {
                        assert.equal(response.statusCode, 200);
                    });
            });
    });

    it('Must login and logout', function () {
        var cookieJar = request.jar();
        var myRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        // ----- Step submit the Login form
        myRequest.url = config.baseUrl + '/CSRF-Generate';

        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);

                myRequest.url = config.baseUrl + '/Account-Login?'
                    + csrfJsonResponse.csrf.tokenName + '='
                    + csrfJsonResponse.csrf.token;
                myRequest.form = {
                    loginEmail: 'John' + timestamp + '@Cena.com',
                    loginPassword: 'John' + timestamp + '@Cena.com',
                    loginRememberMe: false
                };

                return request(myRequest);
            })
            .then(function () {
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                return request(myRequest);
            })
            .then(function () {
                myRequest.method = 'GET';
                myRequest.url = config.baseUrl + '/Login-Logout';

                return request(myRequest)
                    .then(function (response) {
                        assert.equal(response.statusCode, 200);
                    });
            });
    });
});
