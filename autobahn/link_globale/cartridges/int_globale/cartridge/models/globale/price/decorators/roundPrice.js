'use strict';

/**
 * Converts the range to Absolute, according to the Rounding Rules configured on Global-e side.
 * @param {number} price - Price
 * @param {Object} range - Range
 * @returns {Object} - result Absolute
 */
function convertRangeToAbsolute(price, range) {
    var result;
    var intPart;
    var base;
    if (range.RangeBehavior === 1) {
        // range already has absolute behavior
        result = range;
    } else {
        result = {};
        result.RangeBehavior = range.RangeBehavior;
        result.RoundingExceptions = [];
        result.From = range.From;
        result.To = range.To;

        intPart = Math.floor(price);
        if (range.RangeBehavior === 2) {
            // Relative Decimal
            result.LowerTarget = intPart - 1;
            result.LowerTarget += range.LowerTarget;
            result.UpperTarget = intPart + range.UpperTarget;
            result.Threshold = intPart + range.Threshold;
            for (let i = 0; i < range.RoundingExceptions.length; i++) {
                let ex = range.RoundingExceptions[i];
                ex.ExceptionValue += intPart;
                result.RoundingExceptions.push(ex);
            }
        } else if (range.RangeBehavior === 3) {
            // Relative Whole
            if (range.TargetBehaviorHelperValue === 0) {
                range.TargetBehaviorHelperValue = 10; // eslint-disable-line no-param-reassign
            }
            base = Math.floor(price / range.TargetBehaviorHelperValue) * range.TargetBehaviorHelperValue;
            result.LowerTarget = (base - range.TargetBehaviorHelperValue) + range.LowerTarget;
            result.UpperTarget = base + range.UpperTarget;
            result.Threshold = base + range.Threshold;
            for (let i = 0; i < range.RoundingExceptions.length; i++) {
                let ex = range.RoundingExceptions[i];
                ex.ExceptionValue += base;
                result.RoundingExceptions.push(ex);
            }
        } else if (range.RangeBehavior === 4) {
            // Nearest target
            if (range.TargetBehaviorHelperValue === 0) {
                range.TargetBehaviorHelperValue = 5; // eslint-disable-line no-param-reassign
            }
            base = Math.floor(price / range.TargetBehaviorHelperValue) * range.TargetBehaviorHelperValue;
            result.LowerTarget = (base - 1) + range.LowerTarget;
            result.UpperTarget = ((base - 1) + range.TargetBehaviorHelperValue) + range.UpperTarget;
            result.Threshold = base + range.Threshold;
            for (let i = 0; i < range.RoundingExceptions.length; i++) {
                let ex = range.RoundingExceptions[i];
                ex.ExceptionValue += base;
                result.RoundingExceptions.push(ex);
            }
        }
    }
    return (result || null);
}

/**
 * Rounds the given price, according to the Rounding Rules configured on Global-e side
 * @param {number} price - Price
 * @param {Object} range - Range
 * @returns {number} - Absolute
 */
function absoluteRounding(price, range) {
    var result = null;
    // check exceptions
    if (range.RoundingExceptions.length > 0) {
        for (let i = 0; i < range.RoundingExceptions.length; i++) {
            let ex = range.RoundingExceptions[i];
            if (price === ex.ExceptionValue) {
                result = price;
            }
        }
    }
    // no exception was found
    if (!result) {
        // check threshold
        if (price < range.Threshold) {
            result = range.LowerTarget;
        } else {
            result = range.UpperTarget;
        }
    }
    return result;
}

/**
 * Applies Rounding Rules to the price, configured in GLOBALE_ROUNDING_RULES Custom Object
 * @param {number} price - Price
 * @returns {number} - Rounded Price
 */
function roundPrice(price) {
    try {
        var globaleSession = require('*/cartridge/models/globale/session');
        var geRoundingRuleMgr = require('*/cartridge/scripts/factories/globale/geRoundingRuleMgr');
        var numbers = require('*/cartridge/scripts/util/globale/numbers');

        var roundingRulesCo = geRoundingRuleMgr.getGERoundingRule(globaleSession.get('geCurrency') + '_' + globaleSession.get('geCountry'));
        if (!roundingRulesCo) {
            roundingRulesCo = geRoundingRuleMgr.getGERoundingRule(globaleSession.get('geCurrency'));
        }
        if (roundingRulesCo && roundingRulesCo.custom.roundingRanges) {
            // eslint-disable-next-line no-param-reassign
            price = numbers.round(price, 2);
            let range = null;
            let roundingRanges = JSON.parse(roundingRulesCo.custom.roundingRanges);
            for (let i = 0; i < roundingRanges.length; i++) {
                let rg = roundingRanges[i];
                if (rg.From < price && price <= rg.To) {
                    range = rg;
                    break;
                }
            }
            if (range) {
                // convert range to form of absolute
                range = convertRangeToAbsolute(price, range);
                // apply logic of absolute range rounding
                price = absoluteRounding(price, range); // eslint-disable-line no-param-reassign
                if (price < 0) {
                    price = 0; // eslint-disable-line no-param-reassign
                }
            }
        }
    } catch (e) {
        this.logger.error('roundPrice: {0}', this.logger.message(e));
    }
    return price;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        roundPrice: {
            value: function () {
                return roundPrice.apply(this, Array.prototype.slice.call(arguments));
            }
        }
    });
};
