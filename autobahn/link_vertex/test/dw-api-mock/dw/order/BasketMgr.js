var BasketMgr = function () {};

BasketMgr.currentBasket = {
    getGiftCertificateLineItems: function () {
        return {};
    },
    getAllProductLineItems: function () {
        return { length: 1 };
    }
};
BasketMgr.currentOrNewBasket = null;
BasketMgr.storedBasket = null;

BasketMgr.createAgentBasket = function () {};
BasketMgr.createBasketFromOrder = function () {};
BasketMgr.deleteBasket = function () {};
BasketMgr.getBasket = function () {};
BasketMgr.getBaskets = function () {};
BasketMgr.getCurrentBasket = function () {
    return this.currentBasket;
};
BasketMgr.getCurrentOrNewBasket = function () {};
BasketMgr.getStoredBasket = function () {};

module.exports = BasketMgr;
