'use strict';

module.exports = {
    msg: function (key, bundle, defaultText) {
        return defaultText || (bundle + ':' + key);
    }
};
