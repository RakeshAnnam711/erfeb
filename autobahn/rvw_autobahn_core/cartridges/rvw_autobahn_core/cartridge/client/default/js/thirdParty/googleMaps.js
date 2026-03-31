let googleMapsPromise = null;
const regexCallbackFinder = /(\?|\&)callback\=.+?(\&|$)/g;

module.exports = function() {
    if (googleMapsPromise) {
        return googleMapsPromise;
    }

    if (!window.CachedData.googleMapsApi || (window.google && window.google.maps)) {
        googleMapsPromise = Promise.resolve();
    } else {
        // Pull cbFn
        var callbackFnName = (window.CachedData.googleMapsApi || '').match(regexCallbackFinder)?.[0]?.replace(/^.+\=/g,'').replace(/^\&|\&$/g,'')?.split('&')?.[0];

        if (callbackFnName) {
            window[callbackFnName] = window[callbackFnName] || function () { console?.info('Google Maps API Callback', window.google); };
        }

        googleMapsPromise = $.getScript(window.CachedData.googleMapsApi);
    }

    return googleMapsPromise;
}
