"use strict";
var transaction = require("dw/system/Transaction");

/**
 * Merges a source basket into the current basket.
 * 
 * @param {dw.order.Basket} sourceBasket - the source basket which will be deleted after script execution, usually retrieve via dw.order.BasketMgr.getStoredBasket();
 * @param {dw.order.Basket} currentBasket - the current basket which remains accessible during the session, usually retrieve via dw.order.BasketMgr.getCurrentBasket();
 */
function mergeBasket(sourceBasket, currentBasket) {
	if (!sourceBasket || !currentBasket) {
		// nothing to merge if there was no source basket (e.g. getStoredBasket() returned null)
		return;
	}
	var isAgentSourceBasket = false;
	try {
		isAgentSourceBasket = typeof sourceBasket.isAgentBasket === "function" && sourceBasket.isAgentBasket();
	} catch (e) {
		isAgentSourceBasket = false;
	}
	var basketMergeContext = new BasketMergeContext(currentBasket, isAgentSourceBasket);
	transaction.wrap(() => {
		// merge shipments
		mergeShipments(sourceBasket, basketMergeContext);
		// merge coupon line items
		sourceBasket.couponLineItems.toArray().forEach(couponItem => {
			var couponCode = couponItem.couponCode;
			if (!currentBasket.getCouponLineItem(couponCode)) {
				var couponInfo = "merge CouponLineItem " + couponCode;
				var isBasedOnCampaign = couponItem.basedOnCampaign;
				dw.system.Logger.debug(couponInfo + " add " + (isBasedOnCampaign ? "campaign based" : "adhoc"));
				var targetCouponItem = currentBasket.createCouponLineItem(couponCode, isBasedOnCampaign);
				var copyInfo = couponInfo + " copy CouponLineItem";
				copySystemAttributes(copyInfo, couponItem, targetCouponItem);
				copyCustomAttributes(copyInfo, couponItem, targetCouponItem);
			}
		});

		// merge gift certificate payment instrument
		mergeGiftCertificatePaymentInstruments(sourceBasket, basketMergeContext);
		
		// calculate basket
		var status = dw.system.HookMgr.callHook("dw.order.calculate", "calculate", currentBasket);
		dw.system.Logger.debug("calculate cart using dw.order.calculate with status: " + status.getCode());

		// merge bonus discount line items
		mergeBonusDiscountLineItems(sourceBasket, basketMergeContext);
	});
}
/**
 * Merge shipments.<br/>
 * Shipments are merged by ID, otherwise a new shipment is created.<br/>
 * 
 * Note: When the basket was transferred via BasketMgr.getCurrentBasket(), then personal information 
 * (e.g. shipping address) are cleaned.
 * 
 * Merged Data:
 * - System and custom attributes were copied if a new stipment is created.
 * - The shipping address is copied if a new shipment is created or the existing shipment does not have a shipping address.
 * - The shipping method is copied if a new shipment is created or the existing shipment does not have a shipping method.
 * @param {dw.order.Basket} sourceBasket - the source basket
 * @param {BasketMergeContext} basketMergeContext - the basket merge context
 */
function mergeShipments(sourceBasket, basketMergeContext) {
	var currentBasket = basketMergeContext.currentBasket;
	sourceBasket.shipments.toArray().forEach(sourceShipment => {
		var targetShipment;
		var shipmentId = sourceShipment.ID;
		var info = "merge Shipment " + shipmentId;
		var existingShipment = currentBasket.getShipment(shipmentId)
		if (existingShipment) {
			targetShipment = existingShipment;
		} else {
			dw.system.Logger.debug(info + " create shipment");
			targetShipment = currentBasket.createShipment(shipmentId);
			var copyInfo = info + " copy Shipment"
			copySystemAttributes(copyInfo, sourceShipment, targetShipment, id => id == "shipmentNo");
			copyCustomAttributes(copyInfo, sourceShipment, targetShipment);
		}
		var sourceAddress = sourceShipment.shippingAddress;
		
		// merge shipping address
		if (sourceAddress && !targetShipment.shippingAddress) {
			dw.system.Logger.debug(info + " create shipping address");
			var targetAddress = targetShipment.createShippingAddress();
			// address1,address2,city,companyName,countryCode,firstName,jobTitle,lastName,phone,postalCode,postBox,salutation,secondName,stateCode,suffix,suite,title
			var copyInfo = info + " copy OrderAddress"
			copySystemAttributes(copyInfo, sourceAddress, targetAddress);
			copyCustomAttributes(copyInfo, sourceAddress, targetAddress);
		}
		// merge shipping method
		copySystemAttributeIfExisting(info + " copy Shipment", sourceShipment, targetShipment, "shippingMethod");
		// merge product line items
		sourceShipment.getProductLineItems().toArray().forEach(sourceItem =>
			mergeProductItem(sourceItem, basketMergeContext)
		);
		
		// merge gift certificate line items
		sourceShipment.getGiftCertificateLineItems().toArray().forEach(sourceItem =>
		    mergeGiftCertifateLineItems(sourceItem, targetShipment, currentBasket)
		);
	});
}

/**
 * Merge product line items.<br/>
 * The merge regards the Basket Preference <b>Add Product to Basket Behavior</b>:
 * - <b>Increment Quantity</b> Quantity of an already existing matching ProductLineItem increased, otherwise a new ProductLineItem is created. 
 * - <b>Allow Repeats</b> Always a new ProductLineItem is created.
 * - <b>Disallow Repeats</b> Ignore if a metching ProductLineItem already exists, otherwise a new ProductLineItem is created. 
 * 
 * Handled product line item types:
 * - SimpleProducts are copied
 * - OptionProducts are copied
 * - Bundles are copied
 * - Variants are copied
 * - Simple BonusProductLineItems skiped - will be added when promotions will be applied (calculate cart) 
 * - ChoiceOfBonusProduct BonusProductLineItems skipped - will be copied with mergeBonusDiscountLineItems
 * - AdHoc  Producs are copied
 * 
 * Merged Data:
 * - System and custom attributes were copied if a new ProductLineItem is created.
 * - The product list item reference (WishListItem) is copied if a new ProductLineItem.
 * @param {dw.order.ProductLineItem} sourceItem - the source product line item
 * @param {BasketMergeContext} mergeContext - the merge context
 */
function mergeProductItem(sourceItem, mergeContext) {
	var currentBasket = mergeContext.currentBasket;
	var shipmentId = sourceItem.shipment.ID;
	var productId = sourceItem.productID;
	var targetShipment = getShipment(currentBasket, shipmentId);
	var info = "merge Shipment " + shipmentId + " Product " + productId;
	if (sourceItem.isBonusProductLineItem()) {
		if (sourceItem.getBonusDiscountLineItem()) {
			// retain  customer selected BONUS_CHOICE
			dw.system.Logger.debug(info + " handle choice of bonus product later");
			return;
		} else {
			// bonus products will be added when promotions will be applied
			dw.system.Logger.debug(info + " skip bonus product");
			return;
		}
	}
	dw.system.Logger.debug(info + " quantity=" + sourceItem.quantity);

	var product = dw.catalog.ProductMgr.getProduct(productId);
	var targetItem
	if (sourceItem.productListItem) {
		targetItem = currentBasket.createProductLineItem(sourceItem.productListItem, targetShipment);
	} else if (product) {
		var optionModel = getOptionModel(info, sourceItem)
		targetItem = currentBasket.createProductLineItem(product, optionModel, targetShipment);
	} else {
		targetItem = currentBasket.createProductLineItem(productId, targetShipment);
	}

	var oldQuantity = mergeContext.getQuantity(targetItem);
	var newQuantity
	if (oldQuantity == targetItem.quantityValue) {
		// handling for Add Product to Basket Behavior : Disallow Repeats
		dw.system.Logger.debug(info + " do not merge because already existing with quantity=" + oldQuantity);
		return;
	} else if (oldQuantity) {
		// item merged
		newQuantity = oldQuantity + sourceItem.quantityValue;
		dw.system.Logger.debug(info + " increase quantity " + oldQuantity + " -> " + newQuantity);
		if (mergeContext.isAgentSourceBasket) {
			// pre-existing target item was not created from the agent basket, so it is not marked
			// as a CSC handoff line item here; the merged-in CSC quantity is not separately locked
			dw.system.Logger.warn(info + " CSC handoff item merged into an existing non-CSC line item, quantity not locked");
		}
	} else {
		// new item created
		newQuantity = sourceItem.quantityValue;
		dw.system.Logger.debug(info + " create with quantity " + newQuantity);
		// copy Attributes only for new product line items
		targetItem.setQuantityValue(newQuantity);
		copyProductItemAttributes(info, sourceItem, targetItem, mergeContext.isAgentSourceBasket);
	}
	// update the merge context
	mergeContext.updateQuantity(targetItem, newQuantity);
}

/**
 * Copy product line item
 * @param {string} info
 * @param {dw.order.ProductLineItem} sourceItem - the source product line item
 * @param {dw.order.ProductLineItem} targetItem - the target product line item
 * @param {boolean} isAgentSourceBasket - true when sourceItem originates from a CSC/BM agent basket
 */
function copyProductItemAttributes(info, sourceItem, targetItem, isAgentSourceBasket) {
	var copyInfo = info + " copy ProductLineItem"
	// copy system attributes
	copySystemAttributes(copyInfo, sourceItem, targetItem)
	// copying custom attributes
	copyCustomAttributes(copyInfo, sourceItem, targetItem);
	if (isAgentSourceBasket) {
		// mark line items handed off from a CSC/BM agent basket so cart locking (agentBasketLineItemLocks)
		// can identify and lock them once they land in the customer's own (non-agent) basket
		targetItem.custom.isCSCHandoffLineItem = true;
		dw.system.Logger.debug(info + " marked as CSC handoff line item");
	}
	// copy productInventoryListID
	copySystemAttributeIfExisting(copyInfo, sourceItem, targetItem, "productInventoryListID", true);
	var sourceDependentItems = getDependentProductItems(sourceItem);
	var targetDependentItems = getDependentProductItems(targetItem);
	if (sourceDependentItems.length > 0) {
		dw.system.Logger.debug(info + " dependent items " + sourceDependentItems.length);
	}
	sourceDependentItems.forEach((sourceDependentItem, key) => {
		var dependentInfo = info + " dependent " + sourceDependentItem.productID;
		var targetDependentItem = resolveTargetProductLineItem(dependentInfo, sourceDependentItem, targetDependentItems)
		if (targetDependentItem) {
			// select the correct variant if possible
			if (targetDependentItem.product && targetDependentItem.product.isMaster() && sourceDependentItem.product && !sourceDependentItem.product.isMaster()) {
				targetDependentItem.replaceProduct(sourceDependentItem.product)
			}
			copyProductItemAttributes(dependentInfo, sourceDependentItem, targetDependentItem, isAgentSourceBasket)
		} else {
			dw.system.Logger.warn(dependentInfo + " target item missing " + key);
		}
	});
}
/**
 * Resolve target product line item
 * @param {string} info - the info for logging
 * @param {dw.order.ProductLineItem} sourceItem - the source product line item
 * @param {Array<dw.order.ProductLineItem>} targetItems - the target product line items
 */
function resolveTargetProductLineItem(info, sourceItem, targetItems) {
	var quantity = sourceItem.quantityValue;
	function findTargetItem(productId) {
		var index = targetItems.findIndex(item => productId == item.productID && quantity == item.quantityValue);
		if (index != -1) {
			var item = targetItems[index];
			targetItems.splice(index, 1);
			return item;
		}
	};

	var targetItem = findTargetItem(sourceItem.productID);
	if (targetItem) {
		return targetItem;
	}
	var product = sourceItem.product;
	if (product && product.isVariant()) {
		var master = product.variationModel.master;
		dw.system.Logger.debug(info + " resolve target master " + master.ID);
		return findTargetItem(master.ID);
	}
}

/**
 * Get the dependet product line items
 * @param {dw.order.ProductLineItem} parent
 * @returns {Array<dw.order.ProductLineItem}
 */
function getDependentProductItems(parent) {
	return parent.bundledProductLineItems.toArray().concat(
		parent.optionProductLineItems.toArray());
}

/**
 * Merge gift certificate line items.
 * @param {dw.order.GiftCertificateLineItem} sourceGiftCertificate - the gift certificate to be merged
 * @param {dw.order.Shipment} targetShipment - the shipment to merge the gift certificate into
 * @param {dw.order.Basket} currentBasket - the current basket to merge into
 */
function mergeGiftCertifateLineItems(sourceGiftCertificate, targetShipment, currentBasket) {
    var amount = sourceGiftCertificate.priceValue;
    var info = "Create GiftCertificateLineItem amount=" + amount;
    
    var existing;
    
    targetShipment.getGiftCertificateLineItems().toArray().forEach(targetGiftCertificate => {
        if (areGiftCertificateEquals(sourceGiftCertificate, targetGiftCertificate))
        {
            existing = targetGiftCertificate;
        }
    });
		
    if (existing)
    {
        dw.system.Logger.debug("GiftCertificateLineItem already existing, ID=" + existing.getGiftCertificateID());
        return;
    }
	
    var targetGiftCertificate = currentBasket.createGiftCertificateLineItem(amount, sourceGiftCertificate.recipientEmail);
	
    dw.system.Logger.debug(info + " shipment=" + targetShipment.ID);
	
    targetGiftCertificate.shipment = targetShipment;
    var copyInfo = info + " copy GiftCertificateLineItem";
    copySystemAttributes(copyInfo, sourceGiftCertificate, targetGiftCertificate);
    copyCustomAttributes(copyInfo, sourceGiftCertificate, targetGiftCertificate);
		
    // source product list item might already be removed with BasketMgr.getCurrentBasket(); 
    copySystemAttributeIfExisting(copyInfo, sourceGiftCertificate, targetGiftCertificate, "productListItem");
}

/**
 * Checking equality of two gift certificate line items using the following attributes:
 * - RecipientEmail
 * - RecipientName
 * - SenderName
 * - BasePrice
 * 
 * @param {dw.order.GiftCertificateLineItem} giftCertificate1
 * @param {dw.order.GiftCertificateLineItem} giftCertificate2
 * @returns {boolean} true when all attributes are equals, false otherwise
 */
function areGiftCertificateEquals(giftCertificate1, giftCertificate2) {
	
    if (giftCertificate1.getRecipientEmail() != giftCertificate2.getRecipientEmail()) {
        return false;
    }
	
    if (giftCertificate1.getRecipientName() != giftCertificate2.getRecipientName()) {
        return false;
    }
	
    if (giftCertificate1.getSenderName() != giftCertificate2.getSenderName()) {
        return false;
    }
	
    if (giftCertificate1.getBasePrice().getValue() != giftCertificate2.getBasePrice().getValue()) {
        return false;
    }
	
    return true;
}

/**
 * Merge gift certificate paymenent instruments.<br/>
 * GiftCertifatePaymentInstruments are created if no GiftCertifatePaymentInstrument with the same giftCertificateCode exists.<br/>
 * 
 * Note: When the basket was transferred via BasketMgr.getCurrentBasket(), then personal information 
 * (e.g. GiftCertifatePaymentInstruments) are cleaned.
 * 
 * @param {dw.order.Basket} sourceBasket - the source basket
 * @param {BasketMergeContext} basketMergeContext - the basket merge context
 */
function mergeGiftCertificatePaymentInstruments(sourceBasket, basketMergeContext) {
	var currentBasket = basketMergeContext.currentBasket;

	var targetCodes = currentBasket.giftCertificatePaymentInstruments.toArray().map(instr => instr.giftCertificateCode);

	sourceBasket.giftCertificatePaymentInstruments.toArray().forEach(sourceGiftCertificate => {
		var giftCertificateCode = sourceGiftCertificate.giftCertificateCode;
		var info = "merge gift certificate payment instrument " + sourceGiftCertificate.maskedGiftCertificateCode;
		if (targetCodes.includes(giftCertificateCode)) {
			dw.system.Logger.debug(info + " already existing");
			return;
		}
		dw.system.Logger.debug(info + " create");
		var sourceTransaction = sourceGiftCertificate.paymentTransaction;
		var amount = sourceTransaction.amount;
		var targetGiftCertificate = currentBasket.createGiftCertificatePaymentInstrument(giftCertificateCode, amount);
		// ignore paymentMethod
		var copyInfo = info + " copy OrderPaymentInstrument"
		copySystemAttributes(copyInfo, sourceGiftCertificate, targetGiftCertificate, id => id == "paymentMethod");
		copyCustomAttributes(copyInfo, sourceGiftCertificate, targetGiftCertificate);


		var targetTransaction = targetGiftCertificate.paymentTransaction;
		var copyInfo = info + " copy PaymentTransaction"
		copySystemAttributes(copyInfo, sourceTransaction, targetTransaction, id => id == "type");
		copyCustomAttributes(copyInfo, sourceTransaction, targetTransaction);

	});
}

/**
 * Merge bonus discount line items.<br/>
 * The method does not create BonusDiscountLineItems in the target Basket.<br/>
 * The target BonusDiscountLineItems were already created by the basket calculation.<br/>
 * BonusDiscountLineItems are merged by promotionId, maxBonusItems and bonusProducts.<br/>
 * Merging of BonusDiscountLineItems creates BonusDiscountLineItems (ChoiceOfBonusProduct) with the select Bonus Product.
 * @param {dw.order.Basket} sourceBasket - the source basket
 * @param {BasketMergeContext} basketMergeContext - the basket merge context
 */
function mergeBonusDiscountLineItems(sourceBasket, basketMergeContext) {
	function countSelectedQuantities(discountLineItem) {
		return discountLineItem.bonusProductLineItems.toArray().reduce((sum, pli) => sum + pli.quantityValue, 0);
	}

	var currentBasket = basketMergeContext.currentBasket;
	var targetDiscountLineItems = currentBasket.bonusDiscountLineItems.toArray();
	sourceBasket.bonusDiscountLineItems.toArray().forEach(sourceDiscountLineItem => {
		var sourceBonusProductLineItems = sourceDiscountLineItem.bonusProductLineItems;
		if (sourceBonusProductLineItems.size() == 0) {
			dw.system.Logger.debug(info + " without selected Products");
			return;
		}
		var promotionId = sourceDiscountLineItem.promotionID;
		var info = "merge bonus discount " + promotionId;
		var targetDiscountLineItem = targetDiscountLineItems.find(item => promotionId == item.promotionID // 
			&& sourceDiscountLineItem.maxBonusItems == item.maxBonusItems //
			&& collectionEquals(sourceDiscountLineItem.bonusProducts, item.bonusProducts)
		);
		if (!targetDiscountLineItem) {
			dw.system.Logger.debug(info + " no matching target BonusDiscountLineItem")
			return;
		}

		var selectedQuantitySource = countSelectedQuantities(sourceDiscountLineItem);
		var selectedQuantityTarget = countSelectedQuantities(targetDiscountLineItem);
		if (selectedQuantitySource + selectedQuantityTarget > targetDiscountLineItem.maxBonusItems) {
			var alreadySelectedBonusProducts = targetDiscountLineItem.bonusProductLineItems.toArray().map(item => item.productID + "=" + item.quantityValue);
			dw.system.Logger.debug(info + " has already selected bonus products " + alreadySelectedBonusProducts);
			return;
		}

		sourceBonusProductLineItems.toArray().forEach(sourceBonusProductLineItem => {
			var product = sourceBonusProductLineItem.product;
			var optionModel = sourceBonusProductLineItem.optionModel;
			var qty = sourceBonusProductLineItem.quantityValue
			var targetShipment = currentBasket.getShipment(sourceBonusProductLineItem.shipment.ID);
			// createBonusProductLineItem(  bonusDiscountLineItem,product, optionModel,shipment )
			var targetBonusProductLineItem = currentBasket.createBonusProductLineItem(targetDiscountLineItem, product, optionModel, targetShipment);
			var infoSelected = info + " select " + product.ID + "=" + qty
			dw.system.Logger.debug(infoSelected);
			targetBonusProductLineItem.quantityValue = qty;
			var copyInfo = infoSelected + " copy ProductLineItem"
			copySystemAttributes(copyInfo, sourceBonusProductLineItem, targetBonusProductLineItem);
			copyCustomAttributes(copyInfo, sourceBonusProductLineItem, targetBonusProductLineItem);
		})
	});
}

/**
 * Evaluates if two dw.util.Collection are equal
 * @param {dw.util.Collection} collection1 
 * @param {dw.util.Collection} collection2
 * @returns {boolean} 
 */
function collectionEquals(collection1, collection2) {
	var len = collection1.size();
	if (len != collection2.size()) {
		return false;
	}
	for (let i = 0; i < len; i++) {
		if (collection1[i] != collection2[i]) {
			return false;
		}
	}
	return true;
}

/**
 * Optional transform a value.
 * @param {*} value - the value
 * @param {Function<*,*>} optionalTransform - the optional transform  
 */
function transform(value, optionalTransform) {
	if (optionalTransform) {
		return optionalTransform(value)
	}
	return value
}

/**
 * Get system attributes
 * @param object - the object to determine its system attributes
 * @param {Function<string>} - ignore predicate to determine ignored system attributes
 * @returns {Array<dw.object.ObjectAttributeDefinition>}
 */
function getSystemAttributes(object, ignore) {
	return object.describe().attributeDefinitions.toArray()
		.filter(attribute => attribute.isSystem() && !attribute.isKey() && !ignore(attribute.ID))
		.sort((a, b) => a.ID > b.ID ? 1 : 0);
}

/**
 * copy system attributes by attribute definition
 * @param {string} info - the info for logging
 * @param source - the source object to copy its system attributes
 * @param target - the target object to copy the system attributes into
 * @param {Array<dw.object.ObjectAttributeDefinition>} attributes 
 */
function copySystemAttributesExplicitByAttributes(info, source, target, attributes) {
	var ids = attributes.map(attribute => attribute.ID);
	dw.system.Logger.debug(info + " system attributes  [" + ids + "]", info);
	attributes.forEach(attribute => {
		var id = attribute.ID;
		if (isEnumAttribute(attribute)) {
			copySystemAttributeFromTo(info, source, target, id, id, e => e.value);
		} else {
			copySystemAttributeFromTo(info, source, target, id, id, null);
		}
	});
}

/**
 * Evaluate if the attrubute is an enum. 
 * @param {dw.object.ObjectAttributeDefinition} attribute
 * @returns {boolean}
 */
function isEnumAttribute(attribute) {
	var attributeType = attribute.valueTypeCode;
	return attributeType == dw.object.ObjectAttributeDefinition.VALUE_TYPE_ENUM_OF_INT;
}

/**
 * copy system attribute if exists in source
 * @param {string} info - the info for logging
 * @param source - the source object to copy its system attributes
 * @param target - the target object to copy the system attributes into
 * @param {string} attributeName
 * @param {boolean} logValue - define if the value is logged
 */
function copySystemAttributeIfExisting(info, source, target, attributeName, logValue) {
	var value = source[attributeName];
	if (value) {
		if (logValue) {
			dw.system.Logger.debug(info + " system attribute " + attributeName + "=" + value);
		} else {
			dw.system.Logger.debug(info + " system attribute " + attributeName);
		}
		target[attributeName] = value;
	}
}

/**
 * copy system attributes by name
 * @param {string} info - the info for logging
 * @param source - the source object to copy its system attributes
 * @param target - the target object to copy the system attributes into
 * @param {Array<string>} attributeNames 
 */
function copySystemAttributesExplicitByNames(info, source, target, attributeNames) {
	var desc = target.describe();
	var type = desc.ID;
	dw.system.Logger.debug(info + " copy " + type + " system attributes  [" + attributeNames + "]");
	attributeNames.forEach(id =>
		copySystemAttributeFromTo(info, source, target, id, id, null)
	);
}

/**
 * copy a system attribute
 * @param {string} info - the info for logging
 * @param source - the source object to copy its system attrubute
 * @param target - the target object to copy the system attribute into
 * @param {string} sourceAttributeName 
 * @param {string} targetAttributeName 
 * @param {Function<?,?>} converter - converter to convert the value or null
 */
function copySystemAttributeFromTo(info, source, target, sourceAttributeName, targetAttributeName, converter) {
	if (sourceAttributeName != targetAttributeName) {
		dw.system.Logger.debug("{} system attributes  [{} -> {}]", info, sourceAttributeName, targetAttributeName);
	}
	try {
		var sourceValue = source[sourceAttributeName];
		target[targetAttributeName] = transform(sourceValue, converter);
	}
	catch (e) {
		dw.system.Logger.error("{} set system attribute {} -> {} {}", info, sourceAttributeName, targetAttributeName, e);
	}
}

/**
 * copy system attributes based on the {dw.object.ObjectTypeDefinition}
 * @param {string} info - the info for logging
 * @param source - the source object to copy its system attributes
 * @param target - the target object to copy the system attributes into
 * @param {Function<string>} ignore - predicate to determine ignored system attributes
 */
function copySystemAttributes(info, source, target, ignore) {
	var attributes = getSystemAttributes(target, id => {
		if (ignore && ignore(id)) {
			return true;
		}
		// skip some unmodifiable system attributes
		return id == "creationDate" || id == "lastModified" || id == "UUID";
	});
	copySystemAttributesExplicitByAttributes(info, source, target, attributes);
}

/**
 * copy custom attributes
 * @param {string} into - the info for logging
 * @param source - the source object to copy its custom attributes
 * @param target - the target object to copy the custom attributes into
 */
function copyCustomAttributes(info, source, target) {
	var array = new Array();
	for (var id in source.custom) {
		var value = source.custom[id];
		target.custom[id] = value;
		array.push(id);
	}
	dw.system.Logger.debug(info + " custom attributes  [" + array + "]");
}

/**
 * Get a Map by item uuid
 * @param {dw.order.Basket} basket - the basket
 * @param {Function<dw.order.ProductLineItem>} transform - the transform to extract a value out of the ProductLineItem
 * @returns {Map<string,?>} 
 */
function getItemsByUUID(basket, transform) {
	// collecting all items from basket
	return basket.productLineItems.toArray().reduce((map, item) => {
		map.set(item.getUUID(), transform(item));
		return map;
	}, new Map());
}

/**
 * @param {dw.order.ProductLineItem} targetItem 
 * @param {double} initialQuatity 
 */
function TargetProductLineItem(targetItem) {
	var _quantity = targetItem.quantity;
	this.targetItem = targetItem;
	this.updateQuantity =
		/**
		 * @param {double} quantity
		 */
		function(quantity) {
			_quantity = quantity;
			targetItem.setQuantityValue(quantity);
		}
	this.getQuantity =
		/**
		 * @returns {dw.value.Quantity} 
		 */
		function() {
			return _quantity;
		}
	return this;
}

/**
 * @param {dw.order.Basket} currentBasket
 * @param {boolean} isAgentSourceBasket - true when the basket being merged in is a CSC/BM agent basket
 */
function BasketMergeContext(currentBasket, isAgentSourceBasket) {
	this.currentBasket = currentBasket;
	this.isAgentSourceBasket = isAgentSourceBasket;
	var _targetProductLineItems = getItemsByUUID(currentBasket, item => new TargetProductLineItem(item));

	this.getTargetProductLineItems =
		/**
		 * @returns {Map<string,TargetProductLineItem}
		 */
		function() {
			return _targetProductLineItems;
		};

	/**
	 * @param {string} uuid
	 * @returns {TargetProductLineItem}
	 */
	function getTargetProductLineItem(uuid) {
		return _targetProductLineItems.get(uuid);
	};
	this.updateQuantity =
		/**
		 * @param {dw.order.ProductLineItem} targetItem
		 * @param {double} quantity
		 */
		function(targetItem, quantity) {
			var target = getTargetProductLineItem(targetItem.UUID);
			if (!target) {
				target = new TargetProductLineItem(targetItem);
				_targetProductLineItems.set(targetItem.UUID, target);
			}
			target.updateQuantity(quantity);
		};
	this.getQuantity =
		/**
		 * @param {dw.order.ProductLineItem} targetItem
		 * @returns {sw.value.Quantity}
		 */
		function(targetItem) {
			var target = getTargetProductLineItem(targetItem.UUID);
			return target ? target.getQuantity() : null;
		};
	return this;
}

/**
 * Get the ProductOptionModel or null.
 * @param {string} info - the info for logging
 * @param {dw.order.ProductLineItem} item - the product line item
 * @returns {dw.catalog.ProductOptionModel}
 */
function getOptionModel(info, item) {
	var optionModel = item.optionModel;
	if (optionModel) {
		optionModel.options.toArray().forEach(option => {
			var optionValue = optionModel.getSelectedOptionValue(option);
			dw.system.Logger.debug(info + " option " + option.ID + "=" + optionValue.ID);
		});
	}
	return optionModel;
}
/**
 * Get the Shipment with the provided shipment id or the default shipment.
 * @param {dw.order.Basket} basket: the basket
 * @param {string} shipmentId: the shipment Id
 * @returns {dw.order.Shipment}
 * 
 */
function getShipment(basket, shipmentId) {
	return basket.getShipment(shipmentId) || basket.defaultShipment;
}

module.exports = {
	mergeBasket: mergeBasket
};
