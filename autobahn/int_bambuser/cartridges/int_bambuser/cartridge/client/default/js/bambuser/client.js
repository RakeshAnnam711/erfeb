const bambuserHeroWrapper = document.querySelectorAll('.bambuser-hero-trigger');
const bambuser = require('./modules/bambuser');

if (bambuserHeroWrapper.length) {
    /**
     * example bambuser frontend module integration
     */
    document.querySelectorAll('.js_bambuser-stream-trigger:not(.js_processed)').forEach((el) => {
        const { streamId } = el.dataset;
        if (streamId) {
            bambuser.initStream(streamId, el);
            el.classList.add('js_processed');
        }
    });
}

// initializing the miniplayer skip pages
bambuser.miniplayerSkipPages();
// initializing the shopping floating action button widget
bambuser.initLiveShoppingWidget();
