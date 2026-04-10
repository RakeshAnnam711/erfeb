'use strict';

/**
 * Represents CombineWithoutRepetitionsMgr
 * @constructor
 * @param {Object} combinationOptions - combination options
 * @param {Object} combinationLength - combination length
 */
function CombineWithoutRepetitionsMgr(combinationOptions, combinationLength) {
    /**
     * Returns combinations without repetitions
     * @param {Array} comboOptions - options
     * @param {number} comboLength - combination length
     * @return {Array} - combinations array
     */
    function combineWithoutRepetitions(comboOptions, comboLength) {
        // If the length of the combination is 1 then each element of the original array
        // is a combination itself.
        if (comboLength === 1) {
            return comboOptions.map(function (comboOption) { return [comboOption]; });
        }

        // Init combinations array.
        const combos = [];

        // Extract characters one by one and concatenate them to combinations of smaller lengths.
        // We need to extract them because we don't want to have repetitions after concatenation.
        comboOptions.forEach(function (currentOption, optionIndex) {
            // Generate combinations of smaller size.
            const smallerCombos = combineWithoutRepetitions(comboOptions.slice(optionIndex + 1), comboLength - 1);

            // Concatenate currentOption with all combinations of smaller size.
            smallerCombos.forEach(function (smallerCombo) {
                combos.push([currentOption].concat(smallerCombo));
            });
        });

        return combos;
    }

    var uniqueCombinations = combineWithoutRepetitions(combinationOptions, combinationLength);
    var currentCombinationIndex = 0;

    this.hasNextCombination = function () {
        return uniqueCombinations.length >= (currentCombinationIndex + 1);
    };

    this.getNextCombination = function () {
        var combination = uniqueCombinations[currentCombinationIndex];
        ++currentCombinationIndex;

        return combination;
    };
}

module.exports = {
    CombineWithoutRepetitionsMgr: CombineWithoutRepetitionsMgr
};
