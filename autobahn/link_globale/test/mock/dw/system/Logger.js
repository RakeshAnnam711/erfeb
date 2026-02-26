'use strict';

var logMessages = {
    info: [],
    debug: [],
    warn: [],
    error: [],
    fatal: []
};

var Logger = {
    getLogger: function () {
        return {
            info: function () { logMessages.info.push({ args: arguments }); },
            debug: function () { logMessages.debug.push({ args: arguments }); },
            warn: function () { logMessages.warn.push(arguments[0]); },
            error: function () { logMessages.error.push(arguments[0]); },
            fatal: function () { logMessages.fatal.push({ args: arguments }); }
        };
    },
    getMessages: function () {
        return logMessages;
    }
};

module.exports = Logger;
