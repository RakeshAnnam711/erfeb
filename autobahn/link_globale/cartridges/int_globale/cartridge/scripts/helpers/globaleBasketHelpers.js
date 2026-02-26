'use strict';

/**
 * Represents AbstractBasketSnapshot
 * @constructor
 * @param {dw.order.LineItemCtnr} cntr - The container.
 * @param {Object} scopes - Snapshot scopes, e.g. { basket: ['id', 'total'], products: ['pid', 'qty', 'price'] }
 */
function AbstractBasketSnapshot(cntr, scopes) {
    this.cntr = cntr;
    this.scopes = scopes || { basket: ['total'], products: ['pid', 'qty'] };
    this.snapShotData = null;
}

/**
 * Generates a hash for the basket snapshot.
 * @return {string} - The snapshot hash.
 */
AbstractBasketSnapshot.prototype.getHash = function () {
    const MessageDigest = require('dw/crypto/MessageDigest');
    const Bytes = require('dw/util/Bytes');
    const Encoding = require('dw/crypto/Encoding');

    const sha256 = new MessageDigest(MessageDigest.DIGEST_SHA_256);
    var hashMessage = this.getData('string');
    var encodedMessage = new Bytes(hashMessage, 'UTF8');
    var hash = Encoding.toBase64(sha256.digestBytes(encodedMessage));

    return hash;
};

/**
 * Returns the snapshot data.
 * @param {string} format - Data format.
 * @return {Object|string} - The snapshot data.
 */
AbstractBasketSnapshot.prototype.getData = function (format) {
    let result = null;
    let scopedSnapShot = (function (context) {
        let res = {};

        if (context.scopes.basket) {
            context.scopes.basket.forEach(function (prop) {
                if (!res.basket) {
                    res.basket = {};
                }
                res.basket[prop] = context.snapShotData.basket[prop];
            });
        }

        if (context.scopes.products) {
            context.snapShotData.products.forEach(function (pli) {
                if (!res.products) {
                    res.products = [];
                }

                let productItem = {};
                context.scopes.products.forEach(function (productProp) {
                    productItem[productProp] = pli[productProp];
                });

                res.products.push(productItem);
            });
        }

        return res;
    }(this));

    switch (format) {
        case 'json':
            result = scopedSnapShot;
            break;
        case 'string':
        default:
            result = (function (obj) {
                return JSON.stringify(obj);
            }(scopedSnapShot));
            break;
    }
    return result;
};

/**
 * Represents StorefrontBasketShapshot
 * @constructor
 * @param {dw.order.LineItemCtnr} lineItemCtnr - The line item container.
 * @param {string} scopes - Snapshot scopes.
 */
function StorefrontBasketShapshot(lineItemCtnr, scopes) {
    const globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    const gePliFactory = require('*/cartridge/scripts/factories/globale/dw/pli');

    AbstractBasketSnapshot.call(this, lineItemCtnr, scopes);

    this.snapShotData = (function (context) {
        const ArrayList = require('dw/util/ArrayList');
        const PropertyComparator = require('dw/util/PropertyComparator');

        let result = {
            basket: {
                id: context.cntr.getUUID(),
                total: context.cntr.getAdjustedMerchandizeTotalPrice().valueOrNull
            },
            products: []
        };

        // product line items
        context.cntr.allProductLineItems.toArray().forEach(function (pli) {
            let gePli = gePliFactory.get(pli);
            result.products.push({ pid: gePli.geGetProductCode(), qty: pli.quantityValue, price: pli.proratedPrice.valueOrNull });
        });

        // gift certificate line items
        context.cntr.giftCertificateLineItems.toArray().forEach(function (gcli) {
            result.products.push({ pid: gcli.custom[globaleHelpers.customAttr.giftCertificateLineItem.geGiftCertificateID], qty: 1, price: gcli.price.valueOrNull });
        });

        let productsArrList = new ArrayList(result.products);
        let comparator = new PropertyComparator('pid', true);
        productsArrList.sort(comparator);

        result.products = productsArrList.toArray();

        return result;
    }(this));
}
StorefrontBasketShapshot.prototype = Object.create(AbstractBasketSnapshot.prototype);

/**
 * Represents OcapiBasketShapshot
 * @constructor
 * @param {Object} ocapiBasketCntr - The OCAPI line item container.
 * @param {string} scopes - Snapshot scopes.
 */
function OcapiBasketShapshot(ocapiBasketCntr, scopes) {
    const globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    AbstractBasketSnapshot.call(this, ocapiBasketCntr, scopes);

    this.snapShotData = (function (context) {
        const ArrayList = require('dw/util/ArrayList');
        const PropertyComparator = require('dw/util/PropertyComparator');

        let result = {
            basket: {
                id: context.cntr.basket_id,
                total: context.cntr.product_total
            },
            products: []
        };

        // product line items
        if ('product_items' in context.cntr) {
            context.cntr.product_items.forEach(function (pli) {
                result.products.push({ pid: pli.product_id, qty: pli.quantity, price: pli.price_after_order_discount });

                // option items
                if ('option_items' in pli) {
                    pli.option_items.forEach(function (item) {
                        result.products.push({ pid: item.option_id, qty: item.quantity, price: item.price_after_order_discount });
                    });
                }

                // bundled items
                if ('bundled_product_items' in pli) {
                    pli.bundled_product_items.forEach(function (item) {
                        result.products.push({ pid: item.product_id, qty: item.quantity, price: item.price_after_order_discount });
                    });
                }
            });
        }

        // gift certificate line items
        if ('gift_certificate_items' in context.cntr) {
            context.cntr.gift_certificate_items.forEach(function (gcli) {
                result.products.push({ pid: gcli['c_' + globaleHelpers.customAttr.giftCertificateLineItem.geGiftCertificateID], qty: 1, price: gcli.amount });
            });
        }

        let productsArrList = new ArrayList(result.products);
        let comparator = new PropertyComparator('pid', true);
        productsArrList.sort(comparator);

        result.products = productsArrList.toArray();

        return result;
    }(this));
}
OcapiBasketShapshot.prototype = Object.create(AbstractBasketSnapshot.prototype);

/**
 * Represents ScapiBasketShapshot
 * @constructor
 * @param {Object} scapiBasketCntr - The OCAPI line item container.
 * @param {string} scopes - Snapshot scopes.
 */
function ScapiBasketShapshot(scapiBasketCntr, scopes) {
    const globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    AbstractBasketSnapshot.call(this, scapiBasketCntr, scopes);

    this.snapShotData = (function (context) {
        const ArrayList = require('dw/util/ArrayList');
        const PropertyComparator = require('dw/util/PropertyComparator');

        let result = {
            basket: {
                id: context.cntr.basketId,
                total: context.cntr.productTotal
            },
            products: []
        };

        // product line items
        if ('productItems' in context.cntr) {
            context.cntr.productItems.forEach(function (pli) {
                result.products.push({ pid: pli.productId, qty: pli.quantity, price: pli.priceAfterOrderDiscount });

                // option items
                if ('optionItems' in pli) {
                    pli.optionItems.forEach(function (item) {
                        result.products.push({ pid: item.optionId, qty: item.quantity, price: item.priceAfterOrderDiscount });
                    });
                }

                // bundled items
                if ('bundledProductItems' in pli) {
                    pli.bundledProductItems.forEach(function (item) {
                        result.products.push({ pid: item.productId, qty: item.quantity, price: item.priceAfterOrderDiscount });
                    });
                }
            });
        }

        // gift certificate line items
        if ('giftCertificateItems' in context.cntr) {
            context.cntr.giftCertificateItems.forEach(function (gcli) {
                result.products.push({ pid: gcli['c_' + globaleHelpers.customAttr.giftCertificateLineItem.geGiftCertificateID], qty: 1, price: gcli.amount });
            });
        }

        let productsArrList = new ArrayList(result.products);
        let comparator = new PropertyComparator('pid', true);
        productsArrList.sort(comparator);

        result.products = productsArrList.toArray();

        return result;
    }(this));
}
ScapiBasketShapshot.prototype = Object.create(AbstractBasketSnapshot.prototype);

/**
 * Represents SotmBasketShapshot
 * @constructor
 * @param {Object} sotmBasketCntr - The SOTM line item container.
 * @param {string} scopes - Snapshot scopes.
 */
function SotmBasketShapshot(sotmBasketCntr, scopes) {
    AbstractBasketSnapshot.call(this, sotmBasketCntr, scopes);

    this.snapShotData = (function (context) {
        const ArrayList = require('dw/util/ArrayList');
        const PropertyComparator = require('dw/util/PropertyComparator');

        let result = {
            basket: {
                id: context.cntr.id,
                total: context.cntr.total
            },
            products: []
        };

        context.cntr.products.forEach(function (pli) {
            result.products.push({ pid: pli.Sku, qty: pli.Quantity, price: pli.InternationalPrice });
        });

        let productsArrList = new ArrayList(result.products);
        let comparator = new PropertyComparator('pid', true);
        productsArrList.sort(comparator);

        result.products = productsArrList.toArray();

        return result;
    }(this));
}
SotmBasketShapshot.prototype = Object.create(AbstractBasketSnapshot.prototype);

/**
 * Creates a new instance of the StorefrontBasketShapshot class using the provided
 * lineItemCtnr and scopes.
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr - The line item container.
 * @param {string} scopes - Snapshot scopes.
 * @return {StorefrontBasketShapshot} - A snapshot of the storefront basket.
 */
function getStorefrontBasketSnapshot(lineItemCtnr, scopes) {
    return new StorefrontBasketShapshot(lineItemCtnr, scopes);
}

/**
 * Creates a new instance of the OcapiBasketShapshot class using the provided
 * ocapiBasketCntr and scopes.
 *
 * @param {Object} ocapiBasketCntr - The OCAPI basket container.
 * @param {string} scopes - Snapshot scopes.
 * @return {OcapiBasketShapshot} - A snapshot of the OCAPI basket.
 */
function getOcapiBasketSnapshot(ocapiBasketCntr, scopes) {
    return new OcapiBasketShapshot(ocapiBasketCntr, scopes);
}

/**
 * Creates a new instance of the ScapiBasketShapshot class using the provided
 * scapiBasketCntr and scopes.
 *
 * @param {Object} scapiBasketCntr - The SCAPI basket container.
 * @param {string} scopes - Snapshot scopes.
 * @return {OcapiBasketShapshot} - A snapshot of the SCAPI basket.
 */
function getScapiBasketSnapshot(scapiBasketCntr, scopes) {
    return new ScapiBasketShapshot(scapiBasketCntr, scopes);
}

/**
 * Creates a new instance of the SotmBasketShapshot class using the provided
 * sotmBasketCntr and scopes.
 *
 * @param {Object} sotmBasketCntr - The SOTM basket container.
 * @param {string} scopes - Snapshot scopes.
 * @return {SotmBasketShapshot} - A snapshot of the SOTM basket.
 */
function getSotmBasketSnapshot(sotmBasketCntr, scopes) {
    return new SotmBasketShapshot(sotmBasketCntr, scopes);
}

module.exports = {
    getStorefrontBasketSnapshot: getStorefrontBasketSnapshot,
    getOcapiBasketSnapshot: getOcapiBasketSnapshot,
    getScapiBasketSnapshot: getScapiBasketSnapshot,
    getSotmBasketSnapshot: getSotmBasketSnapshot
};
