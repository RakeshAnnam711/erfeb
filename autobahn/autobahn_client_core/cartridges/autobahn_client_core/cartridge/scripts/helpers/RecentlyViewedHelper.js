'use strict';

function getList(req) {
    var sessionList = req.session.privacyCache.get('recentlyViewed');
    if (sessionList == null || typeof sessionList != 'string') {
        return [];
    }
    return sessionList.split(",").map(String);
}

function setList(req, list) {
    if (list != null) {
        req.session.privacyCache.set('recentlyViewed', list.toString());
    }
}

module.exports = {
    getList: getList,
    setList: setList
};
