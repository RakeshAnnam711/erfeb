const conversionTracker = document.querySelector('.js-conversion-tracker');
let conversionTrackerValue;
let conversionTrackerURL;

/**
 * initialize conversion tracker
 */
function onPurchase() {
    const orderInfoEl = document.getElementById('order');

    if (orderInfoEl && orderInfoEl.hasAttribute('data-order')) {
        const order = JSON.parse(orderInfoEl.getAttribute('data-order'));
        const data = {
            event: order.event, // value needs to be "purchase"
            orderId: order.orderId, // the order id (String)
            orderValue: order.orderValue, // total of all products in the order (Number or String of numbers)
            orderProductIds: order.orderProductIds, // comma-separated string, or array of all product ids in the order
            currency: order.currency, // the currency used for the order (ISO 4217)
        };
        // Send the data to Bambuser
        window._bambuser.collect(data);
    }
}

if (conversionTracker) {
    conversionTrackerValue = conversionTracker.value;
    conversionTrackerURL = conversionTracker.src;
}
if (conversionTrackerValue) {
    // Load the tracking library and sec invoke onPurchase() method
    (function () {
        const bamSrcElm = document.createElement('script');
        bamSrcElm.src = conversionTrackerURL;
        bamSrcElm.onload = onPurchase;
        document.head.appendChild(bamSrcElm);
    }());
}
