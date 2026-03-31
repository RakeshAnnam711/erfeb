"use strict";
var base = module.superModule;

function processPayment(order, handlePaymentResult, req, res, emit) {
  res.json({
    error: false,
    adyenAction: handlePaymentResult.action,
    orderID: order.orderNo,
    orderToken: order.orderToken
  });
  emit('route:Complete');
}

module.exports = {
    processPayment: processPayment
};

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
