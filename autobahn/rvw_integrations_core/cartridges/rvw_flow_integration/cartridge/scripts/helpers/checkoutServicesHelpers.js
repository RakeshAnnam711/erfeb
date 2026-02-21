const base = module.superModule;

basePlaceOrderPreAuthFraudCheck = base.placeOrderPreAuthFraudCheck;
base.placeOrderPreAuthFraudCheck = function(order, currentBasket) {
    if (order.custom.flowOrderNo) {
        return {};
    }

    return basePlaceOrderPreAuthFraudCheck.apply(this, arguments);
}

basePlaceOrderPostAuthFraudCheck = base.placeOrderPostAuthFraudCheck;
base.placeOrderPostAuthFraudCheck = function(order, handlePaymentResult) {
    // flow orders get the flag status and are updated via the flow fraud check job
    if (dw.system.Site.current.getCustomPreferenceValue('flowEnabled')) {
        if (Object.hasOwnProperty.call(handlePaymentResult, 'flow')) {
            return {
                status: 'flag'
            }
        }
    }

    return basePlaceOrderPostAuthFraudCheck.apply(this, arguments);
}

module.exports = base;
