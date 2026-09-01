
'use strict';

var BaseAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/base');
var Money = require('dw/value/Money');
var Logger = require('dw/system/Logger');

function PriceAttributeValue(productSearch, refinementDefinition, refinementValue) {
  this.productSearch = productSearch;
  this.refinementDefinition = refinementDefinition;
  this.refinementValue = refinementValue;
  this.initialize();
}


PriceAttributeValue.prototype = Object.create(BaseAttributeValue.prototype);

PriceAttributeValue.prototype.initialize = function () {
   BaseAttributeValue.prototype.initialize.call(this);


   this.type = 'price';
   this.valueFrom = this.refinementValue.valueFrom;
   this.valueTo = this.refinementValue.valueTo;


   var fallbackDisplayValue = this.refinementValue.displayValue;
   this.displayValue = fallbackDisplayValue;


   try {
       var globaleSession = require('*/cartridge/models/globale/session');
       var globalePrice = require('*/cartridge/scripts/factories/globale/price');
       var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
       var Money = require('dw/value/Money');


       var currencyCode =  globaleSession.get('geCurrency');
       var valueFromMoney = new Money(0, currencyCode);
       var valueToMoney = new Money(99999, currencyCode);


       if (this.valueFrom && !isNaN(this.valueFrom)) {
           valueFromMoney = globalePrice(new Money(this.valueFrom, currencyCode));
       } else {
           valueFromMoney = globaleMoney(valueFromMoney.valueOrNull, globaleSession.get('geCurrency'), valueFromMoney);
       }


       if (this.valueTo && !isNaN(this.valueTo)) {
           valueToMoney = globalePrice(new Money(this.valueTo, currencyCode));
       } else {
           valueToMoney = globaleMoney(valueToMoney.valueOrNull, globaleSession.get('geCurrency'), valueToMoney);
       }


       if (valueFromMoney.available || valueToMoney.available) {
           this.displayValue = valueFromMoney.valueOrNull + ' - ' + valueToMoney.valueOrNull;
       }
        var currencySymbol = '';
        if (
            valueFromMoney &&
            valueFromMoney.currency &&
            valueFromMoney.currency.custom &&
            Object.prototype.hasOwnProperty.call(valueFromMoney.currency.custom, 'symbol')
        ) {
            currencySymbol = valueFromMoney.currency.custom.symbol;
        }
        this.symbol = currencySymbol;
      


   } catch (e) {
       var Logger = require('dw/system/Logger');
       Logger.error('PriceRefinementValueWrapper getDisplayValue error: {0}', e.message);
       this.displayValue = fallbackDisplayValue;
   }


   this.selected = this.isSelected(this.productSearch, this.valueFrom, this.valueTo);
   this.url = this.getUrl(
       this.productSearch,
       this.actionEndpoint,
       this.selected,
       this.valueFrom,
       this.valueTo
   );
   this.title = this.getTitle(
       this.selected,
       this.selectable,
       this.refinementDefinition.displayName,
       this.displayValue
   );
};

PriceAttributeValue.prototype.getUrl = function (
  productSearch,
  actionEndpoint,
  selected,
  valueFrom,
  valueTo
) {
  return selected
      ? productSearch.urlRelaxPrice(actionEndpoint).relative().toString()
      : productSearch.urlRefinePrice(actionEndpoint, valueFrom, valueTo).relative().toString();
};




PriceAttributeValue.prototype.isSelected = function (productSearch, valueFrom, valueTo) {
  return productSearch.refinedByPrice;
};




function PriceRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
  var value = new PriceAttributeValue(productSearch, refinementDefinition, refinementValue);
  var items = ['displayValue', 'valueFrom', 'valueTo', 'selected', 'title', 'url','symbol'];
  items.forEach(function (item) {
      this[item] = value[item];
  }, this);
}




module.exports = PriceRefinementValueWrapper;
