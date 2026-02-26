'use strict';

module.exports = function (object, productLineItem) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleOptionModel = require('*/cartridge/scripts/factories/globale/optionModel');

    var optionModel = globaleOptionModel(productLineItem.getParent().getOptionModel());
    var option = optionModel.super.getOption(productLineItem.optionID);
    var optionValue = optionModel.super.getOptionValue(option, productLineItem.optionValueID);

    Object.defineProperties(object, {
        logger: {
            enumerable: true,
            value: globaleHelpers.getLogger()
        },
        productLineItem: {
            enumerable: true,
            value: productLineItem
        },
        apiProduct: {
            enumerable: true,
            value: productLineItem.getParent().getProduct()
        },
        optionID: {
            enumerable: true,
            value: productLineItem.optionID
        },
        optionValueID: {
            enumerable: true,
            value: productLineItem.optionValueID
        },
        optionModel: {
            enumerable: true,
            value: optionModel
        },
        option: {
            enumerable: true,
            value: option
        },
        optionValue: {
            enumerable: true,
            value: optionValue
        }
    });
};
