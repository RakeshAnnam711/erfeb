'use strict';

global.domain = 'zzqe-001.sandbox.us01.dx.commercecloud.salesforce.com';

var opts = {
    shortBaseUrl: 'https://' + global.domain + '/s/RefArchGlobal/globale/',
    baseUrl: 'https://' + global.domain + '/on/demandware.store/Sites-RefArchGlobal-Site/en_GB/',
    suite: '*',
    reporter: 'spec',
    timeout: 60000,
    locale: 'x_default',
    customerRegistration: {
        registeredEmail: 'astomtest@mailinator.com',
        guestEmail: 'astomtest-guest@mailinator.com'
    }
};

module.exports = opts;
