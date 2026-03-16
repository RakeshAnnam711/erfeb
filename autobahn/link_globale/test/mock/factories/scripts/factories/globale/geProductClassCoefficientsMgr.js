'use strict';

function getGEProductClassCoefficient(productClassCode) {
    var result = null;
    switch (productClassCode) {
        case 'TestProductClassCode_US':
            result = {
                custom: {
                    rate: 1.3
                }
            };
            break;
        default:
            break;
    }
    return result;
}

module.exports = {
    getGEProductClassCoefficient: getGEProductClassCoefficient
};
