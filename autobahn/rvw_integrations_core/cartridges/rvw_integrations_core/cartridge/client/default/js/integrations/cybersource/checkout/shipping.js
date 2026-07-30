'use strict';

var cybersourceShipping = {
    methods : {}
};

cybersourceShipping.methods.shippingFormResponseExtension = function(defer, data) {
    if (data.taxError) {
        $('.error-message').css({ display: 'block', 'margin-top': '0' });
        var errorPara = $('.error-message-text');
        if (errorPara.length > 0) {
            errorPara[0].innerText = data.taxErrorMsg;
        }
        defer.reject();
    }
}

cybersourceShipping.editShippingSummary = function(){
    $('.shipping-summary .edit-button').on('click',function(){
        $('#checkout-main[data-checkout-stage = "shipping"]').find('button.submit-payment').attr('id','showSubmitPayment');
    });
};

module.exports = cybersourceShipping;
