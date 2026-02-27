'use strict';

module.exports = {
    getPendingNotifications: require('*/cartridge/models/globale/jobs/order/actions/decorators/getPendingNotifications'),
    findOrder: require('*/cartridge/models/globale/jobs/order/actions/decorators/findOrder'),
    writeOrderStats: require('*/cartridge/models/globale/jobs/order/actions/decorators/writeOrderStats'),
    writeOrderNote: require('*/cartridge/models/globale/jobs/order/actions/decorators/writeOrderNote'),
    removeNotificationCO: require('*/cartridge/models/globale/jobs/order/actions/decorators/removeNotificationCO'),
    getServiceResponse: require('*/cartridge/models/globale/jobs/generic/decorators/getServiceResponse'),
    getPayByLinkOrders: require('*/cartridge/models/globale/jobs/order/actions/decorators/getPayByLinkOrders'),
    cancelOrder: require('*/cartridge/models/globale/jobs/order/actions/decorators/cancelOrder')
};
