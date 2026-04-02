'use strict';

/**
 * Call custom Global-E hook
 * @param {string} hook - Hook's name
 * @return {Object|null} - hook invokation result
 */
function invokeCustomHook(hook) {
    var HookMgr = require('dw/system/HookMgr');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var result = null;

    try {
        var hookFuncName = hook.split('.').pop();
        if (HookMgr.hasHook(hook)) {
            var args = Array.prototype.slice.call(arguments);
            args.shift();
            args.unshift(hook, hookFuncName);
            result = HookMgr.callHook.apply(null, args);
        }
    } catch (e) {
        logger.error('GLOBALE_CUSTOM_HOOK: {0}: {1}', hook, (e.message + '; ' + e.stack));
    }

    return result;
}

/**
 * Call custom Global-E hook
 * @param {string} hook - Hook's name
 * @return {Object|null} - hook invokation result
 */
function invokeCustomHookWithException(hook) {
    var HookMgr = require('dw/system/HookMgr');
    var result = null;

    var hookFuncName = hook.split('.').pop();
    if (HookMgr.hasHook(hook)) {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        args.unshift(hook, hookFuncName);
        result = HookMgr.callHook.apply(null, args);
    }

    return result;
}

module.exports = {
    invokeCustomHook: invokeCustomHook,
    invokeCustomHookWithException: invokeCustomHookWithException
};
