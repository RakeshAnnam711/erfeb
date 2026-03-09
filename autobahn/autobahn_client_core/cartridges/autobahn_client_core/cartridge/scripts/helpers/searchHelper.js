'use strict';

var cgidKey = 'cgid';

function getSelectedFilters(refinements, productSearch) {
    var selectedFilters = [];
    var selectedValues = [];

    refinements.forEach(function (refinement) {
        if (refinement.isCategoryRefinement) {
            var selectedCategories = [];
            getAllSelelectedCategories(refinement.values, selectedCategories, true);
            selectedValues = selectedCategories;
        } else if (refinement.isPriceRefinement) {
            var pMin = productSearch.productSearch.priceMin;
            var pMax = productSearch.productSearch.priceMax;
            selectedValues = refinement.values.filter(function (value) {
                if (pMin <= value.valueFrom && pMax >= value.valueTo) {
                    return false;
                }
                return value.selected;
            }).map(function (value) {
                value.id = 'price';
                return value;
            });
        } else {
            selectedValues = refinement.values.filter(function (value) { return value.selected; });
        }
        if (selectedValues.length) {
            selectedFilters.push.apply(selectedFilters, selectedValues);
        }
    });
    return selectedFilters;
}

function getAllSelelectedCategories(categories, selectedCategories, isRoot) {
    if (categories && Array.isArray(categories)) {
        categories.forEach(category => {
            if (category.selected) {
                if (!isRoot) {
                    selectedCategories.push(category);
                } else if (category.subCategories && Array.isArray(category.subCategories)){
                    getAllSelelectedCategories(category.subCategories, selectedCategories, false);
                }
            }
        });
    }
}

function updateRefinementSubCategories(categories, mainCategoryUrl) {
    if (!categories || !Array.isArray(categories)) {
        return [];
    }
    return categories.map(category => {
        const updatedCategory = Object.assign({}, category);
        var queryParams = category.url.includes('?') ? category.url.split('?')[1] : '';
        queryParams = removeFromQueryParams(queryParams, cgidKey);
        if (updatedCategory.selected) {
            if (queryParams) {
                if (mainCategoryUrl.toString().includes('?')) {
                    updatedCategory.url = mainCategoryUrl+'&'+queryParams;
                } else {
                    updatedCategory.url = mainCategoryUrl+'?'+queryParams;
                }
            } else {
                updatedCategory.url = mainCategoryUrl;
            }
        } else if (Array.isArray(category.subCategories)) {
            updatedCategory.subCategories = updateRefinementSubCategories(category.subCategories, mainCategoryUrl);
        }
        if (Array.isArray(updatedCategory.subCategories)) {
            updatedCategory.subCategories.forEach(subCategory => {
                if (subCategory.selected) {
                    updatedCategory.selected = true;
                }
            });
        }
        return updatedCategory;
    });
}

function removeFromQueryParams(queryParams, paramKey) {
    var paramsMap = new Map();
    var params = queryParams.split('&');
    params.forEach(value => {
        var keyValue = value.split('=');
        paramsMap.set(keyValue[0], keyValue[1]);
    });
    if (paramsMap.has(paramKey)) {
        paramsMap.delete(paramKey);
    }
    queryParams = Array.from(paramsMap)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    return queryParams;
}

function transformFiltersInGroup(filters) {
    var map = new Map();
    if (filters && Array.isArray(filters)) {
        filters.forEach(value => {
            var key = value.id.toLowerCase();
            if (value.type === 'category') {
                key = value.type.toLowerCase();
            }
            if (map.has(key)) {
                map.get(key).push(value.displayValue);
            } else {
                map.set(key, [value.displayValue]);
            }
        });
    }
    return map;
}

function mapToObject(map) {
    var obj = {};
    map.forEach(function(value, key) {
        obj[key] = value;
    });
    return obj;
}

module.exports = {
    getSelectedFilters: getSelectedFilters,
    updateRefinementSubCategories: updateRefinementSubCategories,
    transformFiltersInGroup: transformFiltersInGroup,
    mapToObject: mapToObject,
    cgidKey: cgidKey
};
