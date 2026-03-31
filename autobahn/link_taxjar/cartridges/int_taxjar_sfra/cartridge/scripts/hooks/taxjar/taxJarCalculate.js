'use strict';

var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var taxJar = require('*/cartridge/scripts/taxJar');

/**
 * Calculates tax on basket
 *
 * @param  {dw.order.Basket} basket - basket to calculate tax for
 * @return {dw.system.Status} - Status of calculation
 */
exports.calculateTax = function (basket) {
    if (taxJar.isEnabled()) {
        Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('TaxJar Begin Tax Calculation');

        try {
            var result = taxJar.calculateTax(basket);
            if (result) {
                return new Status(Status.OK);
            }
            Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').warn('Reverting to default calculation.');
            return require('*/cartridge/scripts/hooks/cart/calculate').calculateTax(basket);
        } catch (e) {
            Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').error('TaxJar error when calculating tax with message: ' + JSON.stringify(e));
            Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').warn('Reverting to default calculation.');
            return require('*/cartridge/scripts/hooks/cart/calculate').calculateTax(basket);
        }
    } else {
        Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').warn('TaxJar disabled - reverting to default calculation.');
        return require('*/cartridge/scripts/hooks/cart/calculate').calculateTax(basket);
    }
};
