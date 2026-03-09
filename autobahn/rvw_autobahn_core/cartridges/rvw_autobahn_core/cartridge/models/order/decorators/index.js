'use strict'

module.exports = {
    productQuantityTotal: require('*/cartridge/models/order/decorators/productQuantityTotal'),
    orderEmail: require('*/cartridge/models/order/decorators/orderEmail'),
    giftCertificateLineItems: require('*/cartridge/models/order/decorators/giftCertificateLineItems'),
    orderUUID: require('*/cartridge/models/order/decorators/orderUUID'),
    hideShipping: require('*/cartridge/models/order/decorators/hideShipping')
}
