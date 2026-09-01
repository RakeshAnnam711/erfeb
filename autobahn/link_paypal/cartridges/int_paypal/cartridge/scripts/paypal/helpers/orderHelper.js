'use strict';

/**
 * Returns the first productLineItem from a collection of productLineItems.
 * @param {Object} productLineItemsModel - line items model
 * @return {Object} returns an object with image properties
*/
function getFirstProductLineItem(productLineItemsModel) {
    if (productLineItemsModel && productLineItemsModel.items[0]) {
        const firstItemImage = productLineItemsModel.items[0].images.small[0];

        return {
            imageURL: firstItemImage.url,
            alt: firstItemImage.alt,
            title: firstItemImage.title
        };
    }

    return null;
}

/**
 * @param {Object} req - Request
 * @param {Object[]} orders - List of orders
 * @returns {Object[]} - orders
 */
function fillOrderDetails(req, orders) {
    const ProductLineItemsModel = require('*/cartridge/models/productLineItems');

    const containerView = 'order';
    const orderHistory = req.currentCustomer.raw.getOrderHistory();

    if (orderHistory.orderCount > 0) {
        const orderHistoryList = orderHistory.orders.asList().toArray().reduce(function(accumulator, currentOrder) {
            accumulator[currentOrder.orderNo] = currentOrder;

            return accumulator;
        }, {});

        return orders.map(function(order) {
            if (!order.firstLineItem) {
                const lineItemContainer = orderHistoryList[order.orderNumber];
                const productLineItemsModel = new ProductLineItemsModel(lineItemContainer.productLineItems, containerView);

                order.firstLineItem = getFirstProductLineItem(productLineItemsModel);
            }

            if (!order.shippedToFirstName) {
                order.shippedToFirstName = customer.profile.firstName;
            }

            if (!order.shippedToLastName) {
                order.shippedToLastName = customer.profile.lastName;
            }

            return order;
        });
    }

    return [];
}

module.exports = {
    fillOrderDetails: fillOrderDetails
};
