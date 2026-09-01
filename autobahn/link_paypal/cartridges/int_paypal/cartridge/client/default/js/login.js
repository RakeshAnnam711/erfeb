'use strict';

if (window.paypalPreferences.isCWPPEnabled) {
    const connectWithPayPal = require('./cwpp/connectWithPayPal');

    connectWithPayPal.init();
}
