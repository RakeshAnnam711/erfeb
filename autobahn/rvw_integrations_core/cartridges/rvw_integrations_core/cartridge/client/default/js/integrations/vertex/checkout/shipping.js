'use strict';

var vertexShipping = {
    methods : {}
};

vertexShipping.methods.shippingFormResponseExtension = function(defer, data) {
    if (data.vertexError) {
        vertexShipping.methods.showVertexErrors(data, $('.vertexError'), $('.vertexSuggestions'), $('#vertex-suggestion'));
        defer.reject();
    } else {
        $('.vertexError').addClass('d-none');
    }
}

/**
 * @description view Vertex error container
 *
 * @param {Object} data - response data
 * @param {string} vertexErrorBlock - vertexErrorBlock
 * @param {string} vertexSuggestionBlock - vertexSuggestionBlock
 * @param {Object} vertexAddresses - vertexAddresses container
 */
vertexShipping.methods.showVertexErrors = function showVertexErrors(data, vertexErrorBlock, vertexSuggestionBlock, vertexAddresses) {
    if (!data.vertexAddressSuggestions) {
        vertexErrorBlock.removeClass('d-none');
    } else {
        vertexSuggestionBlock.removeClass('d-none');
        $(vertexAddresses).html('');
        data.vertexAddressSuggestions.forEach(function (item, i, vertexAddressSuggestions) {
            var aid = item.UUID ? item.ID : item.key;
            if (i < 2) {
                $(vertexAddresses).append(
                    $('<option></option>')
                    .attr('value', aid)
                    .text("(" + (aid) + ")" + " " + item.address1 + " " + item.city + " " + item.stateCode + " " + item.postalCode)
                    .attr('data-address', JSON.stringify(item)));
            }
        });
    }
};

/**
 * @description clears error container
 */
vertexShipping.methods.clearVertexErrors = function clearVertexErrors() {
    $('.vertexError').addClass('d-none');
    $('.vertexSuggestions').addClass('d-none');
}

vertexShipping.selectSingleShippingExtension =  function () {
    $('body').on('shipping:selectSingleShipping', function () {
        var url = $('#vertex-suggestions').data('suggest');
        $.ajax({
            url      : url,
            type     : 'post',
            dataType : 'json',
            data     : { clear: 'true' }
        })
    });
};

vertexShipping.vertexSuggestions = function vertexSuggestions() {
    $('select[name="vertex-suggestion"]').change(function (item) {
        var form = $(this).closest('.card').find('.shipping-form');
        module.exports.methods.fillAddressSuggestion($(this).find('option:selected').data('address'), form);
    });
}

/**
 *
 * @param {Object} address - Suggested address
 * @param {Object} form - current form
 */
vertexShipping.methods.fillAddressSuggestion = function fillAddressSuggestion(address, form) {
    $('.btn-show-details').trigger('click');
    var url = $('#vertex-suggestions').data('suggest');
    $.ajax({
        url      : url,
        type     : 'post',
        dataType : 'json'
    })
    $(form).find('input[name$=_address1]').val(address.address1);
    if (address.address2) {
        $(form).find('input[name$=_address2]').val(address.address2);
    }
    $(form).find('input[name$=_city]').val(address.city);
    $(form).find('input[name$=_postalCode]').val(address.postalCode);
    $(form).find('select[name$=_stateCode],input[name$=_stateCode]').val(address.stateCode);
    $(form).find('select[name$=_country]').val(address.countryCode.toUpperCase());
}

module.exports = vertexShipping;
