'use strict';

var BasketMgr = require('dw/order/BasketMgr');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ShippingMgr = require('dw/order/ShippingMgr');
var Transaction = require('dw/system/Transaction');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var HookMgr = require('dw/system/HookMgr');
var Money = require('dw/value/Money');
var collections = require('*/cartridge/scripts/util/collections');

// add a product to the basket to fetch approaching shipping discounts
function addFirstAvailableProductToBasket(category, currentBasket, productAdded) {
    var onlineSubCategories = category.getOnlineSubCategories();
    var searchModel = new ProductSearchModel();
    
    searchModel.setOrderableProductsOnly(true);

    collections.forEach(onlineSubCategories, function(subCategory) {
        searchModel.setCategoryID(subCategory.ID);
        searchModel.search();

        var searchHits = searchModel.getProductSearchHits().asList();

        collections.forEach(searchHits, function(hit) {
            if (!productAdded) {
                var productID = hit.firstRepresentedProductID;
                currentBasket.createProductLineItem(productID, currentBasket.defaultShipment);
                productAdded = true;
            }
        });

        if (!productAdded) {
            addFirstAvailableProductToBasket(subCategory, currentBasket, false);
        }
    });
}

// set a fill percentage for each checkpoint to populate status bar
function applyStatusBarFills(checkpoints) {
    var hasUnfilledStatus = false;
    var previousThreshold = 0;

    checkpoints.forEach(function(checkpoint) {
        var fillPercentage = 0;

        if (!hasUnfilledStatus) {
            if (checkpoint.applied) {
                fillPercentage = 100;
            } else {
                var thresholdSegmentWidth = checkpoint.threshold - previousThreshold;
                fillPercentage = ((thresholdSegmentWidth - checkpoint.distanceFromThreshold) * 100) / thresholdSegmentWidth;
                    hasUnfilledStatus = true; // keep subsequent status bars empty
            }
        }

        checkpoint.fillPercentage = fillPercentage;
        previousThreshold = checkpoint.threshold;
    });
}

// check if discount object is already in list, and add if not
function addDiscoObject(discounts, checkpoints, campaignId, applied) {
    collections.forEach(discounts, function(discountItem) {
        var promoId = discountItem.discount.promotion.ID;
        var isValidCampaign = campaignId === null || campaignId === discountItem.discount.promotion.campaign.ID;
        var isInCheckpoints = checkpoints.some(function(checkpoint) {
            return checkpoint.promoIds.indexOf(promoId) > -1;
        });

        if (isValidCampaign && !isInCheckpoints) {
            var thresholdValue = discountItem.conditionThreshold.value;
            var existingThresholdIndex = checkpoints.map(function(checkpoint) {
                return checkpoint.threshold.value;
            }).indexOf(thresholdValue);

            if (existingThresholdIndex > -1) {
                // group discounts together that have the same threshold
                var existingThresholdCheckpoint = checkpoints[existingThresholdIndex];
                existingThresholdCheckpoint.promoIds.push(promoId)
                existingThresholdCheckpoint.message.push(discountItem.discount.promotion.calloutMsg.markup);
            } else {
                var discoObject = {
                    promoIds: [promoId],
                    threshold: discountItem.conditionThreshold,
                    distanceFromThreshold: discountItem.distanceFromConditionThreshold,
                    message: [discountItem.discount.promotion.calloutMsg.markup],
                    applied: applied
                }
                checkpoints.push(discoObject);
            }
        }
    });
}

// fetch order and shipping discount data
function getDiscoObjects(checkpoints, discountPlan, basket, campaignId, applied) {
    if (discountPlan) {
        var approachingOrderDiscounts = discountPlan.getApproachingOrderDiscounts();
        var approachingShippingDiscounts = discountPlan.getApproachingShippingDiscounts(basket.defaultShipment);
        addDiscoObject(approachingOrderDiscounts, checkpoints, campaignId, applied);
        addDiscoObject(approachingShippingDiscounts, checkpoints, campaignId, applied);
    }
}

function emptyBasket(basket) {
    collections.forEach(basket.allProductLineItems, function(lineItem) {
        basket.removeProductLineItem(lineItem);
    });
}

// get a list of discount checkpoints to display in discount status bar
function getCheckpoints(campaignId) {
    var checkpoints = [];
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var discountPlan = PromotionMgr.getDiscounts(currentBasket);

    // get approaching discounts according to actual basket status
    getDiscoObjects(checkpoints, discountPlan, currentBasket, campaignId, false);

    if (currentBasket.allProductLineItems.empty) {
        // add a product to cart to trigger approaching shipping promotions
        Transaction.begin();

        var catalog = CatalogMgr.getSiteCatalog();
        var rootCategory = catalog.getRoot();
        addFirstAvailableProductToBasket(rootCategory, currentBasket, false);

        var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
        currentBasket.defaultShipment.setShippingMethod(defaultShippingMethod);

        // set price to 1 cent and recalculate shipping in order to find approaching shipping discounts
        var productLineItems = currentBasket.getAllProductLineItems().iterator();
        while (productLineItems.hasNext()) {
            var productLineItem = productLineItems.next();
            productLineItem.setPriceValue(0.1);
        }
        HookMgr.callHook('dw.order.calculateShipping', 'calculateShipping', currentBasket);
        HookMgr.callHook('dw.order.calculateTax', 'calculateTax', currentBasket);
        ShippingMgr.applyShippingCost(currentBasket);
        currentBasket.updateTotals();

        // get approaching discounts according to basket with a 1 cent product in it
        discountPlan = PromotionMgr.getDiscounts(currentBasket);
        getDiscoObjects(checkpoints, discountPlan, currentBasket, campaignId, false);

        Transaction.rollback();

        // re-empty basket
        Transaction.wrap(function() {
            emptyBasket(currentBasket);
            currentBasket.updateTotals();
        });

    } else {
        // empty basket to get any approaching discounts that have already been applied
        Transaction.begin();
        emptyBasket(currentBasket);

        discountPlan = PromotionMgr.getDiscounts(currentBasket);
        getDiscoObjects(checkpoints, discountPlan, currentBasket, campaignId, true);
        Transaction.rollback();
    }

    // re-fetch actual current basket
    currentBasket = BasketMgr.getCurrentOrNewBasket();

    // sort by discount threshold amounts
    checkpoints.sort(function(a, b) {
        return (a.threshold > b.threshold) ? 1 : -1;
    });

    applyStatusBarFills(checkpoints);

    return checkpoints;
}

// grab the basket total for display
function getTotal() {
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var total = new Money(0.0, currentBasket.getCurrencyCode());
    var discountPlan = PromotionMgr.getDiscounts(currentBasket);
    var approachingOrderDiscounts = discountPlan.getApproachingOrderDiscounts();
    var approachingShippingDiscounts = discountPlan.getApproachingShippingDiscounts(currentBasket.defaultShipment);
    
    // check for merchandiseTotal in discounts to exclude non-promo items in basket
    collections.forEach(approachingOrderDiscounts, function(discountItem) {
        if (discountItem.merchandiseTotal > 0 && total.value === 0) {
            total = total.add(discountItem.merchandiseTotal);
        }
    });
    collections.forEach(approachingShippingDiscounts, function(discountItem) {
        if (discountItem.merchandiseTotal > 0 && total.value === 0) {
            total = total.add(discountItem.merchandiseTotal);
        }
    });

    return total;
}

function getData(campaignId) {
    var total = getTotal();
    var checkpoints = getCheckpoints(campaignId);

    return {
        total: total,
        checkpoints: checkpoints
    }
}

module.exports = {
    getData: getData
};
