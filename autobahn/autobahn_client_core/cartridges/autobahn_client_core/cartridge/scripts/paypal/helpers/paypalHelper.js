'use strict';

function tryAssignObjectMethod(methodName, methodFn) {
    if (typeof Object[methodName] === 'function') {
        return;
    }

    try {
        if (Object.isExtensible(Object)) {
            Object[methodName] = methodFn;
        }
    } catch (e) {
        // Some environments seal/freeze native objects; skip global mutation safely.
    }
}

if (typeof Object.entries !== 'function') {
    tryAssignObjectMethod('entries', function (obj) {
        return Object.keys(obj).map(function (key) {
            return [key, obj[key]];
        });
    });
}

module.exports = module.superModule;
