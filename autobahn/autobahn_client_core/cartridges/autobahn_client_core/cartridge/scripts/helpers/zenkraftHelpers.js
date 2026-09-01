'use strict';

var base = module.superModule;

function getFutureDateDeliveryDates (array ,length, i, firstDate) {
    for (var j = i; j < length; j++) {
        var futureDateDelivery = firstDate.getTime();
        futureDateDelivery = new Date(futureDateDelivery + j * 86400000);
        var formatedDate = base.getFormattedDateTime(futureDateDelivery);
        if (formatedDate.toLowerCase().indexOf('saturday') > -1) {
            j += 2;
            length += 2;
            return getFutureDateDeliveryDates(array ,length, j, firstDate);
        } else {
            array.push({
                formatedDate: formatedDate,
                date: futureDateDelivery.getTime().toString()
            });
        }
    }
    return array;
}

base.handleShippingMethods = function (viewData) {
    var zenkraft = require('*/cartridge/scripts/zenkraft');
    var ZenkraftEDDHelper = require('*/cartridge/scripts/helpers/zenkraftEDDHelper');
    var thisViewData = viewData; // eslint-disable-line vars-on-top

    if (thisViewData.order) {
        var thisAddress = thisViewData.order.shipping[0].shippingAddress; // eslint-disable-line vars-on-top, max-len
        var thisMethods = thisViewData.order.shipping[0].applicableShippingMethods; // eslint-disable-line vars-on-top, max-len
        var thisItems = thisViewData.order.items; // eslint-disable-line vars-on-top
        var thisDates = []; // eslint-disable-line vars-on-top
        var thisMethWithDates = []; // eslint-disable-line vars-on-top
        var date = new Date();
            // if cutoffTime is set via site preference, check to see if current time is after cutoff. If so, add a day
        if (ZenkraftEDDHelper.isAfterCutoffDate()) {
            date.setDate(date.getDate() + 1);
        }
        var leadDate = base.getLeadTime();
        if (!empty(leadDate)) {
            date.setDate(date.getDate() + leadDate);
        }
        var day = date.getDate().toString();
        var month = (date.getMonth() + 1).toString();
        if (month.length == 1) {
            month = '0' + month;
        }
        var year = date.getFullYear().toString();

        var leadDateFormated = year + '-' + month + '-' + day;

        thisDates = zenkraft.getShippingData(thisAddress, thisItems, thisMethods, leadDateFormated);

    // if we get dates back
        if (!empty(thisDates)) {
            thisMethods.forEach(function filterMethods(method) {
                var key = method.shippingMethodAccountID ? 'id_' + method.shippingMethodAccountID : false;
                if (key && thisDates[key].rates) {
                    var thisMethod = base.filterShippingMethodsForEstimatedDate(method, thisDates[key].rates);
                    var dopulocations;
                    if (thisMethod.dropOffMethod) {
                        dopulocations = zenkraft.getDropOffLocations(thisAddress);
                        if (dopulocations.locations && dopulocations.locations.length > 0) {
                            thisMethod.dropOffLocations = dopulocations.locations;
                            thisMethWithDates.push(thisMethod);
                        }
                    } else if (thisMethod.futureDateDelivery && thisMethod.futureDateDelivery > 0 && !thisMethod.dropOffMethod) {
                        var parts = thisMethod.estimated_date.split('-');
                        var firstDate = new Date(parts[0], parts[1] - 1, parts[2]);
                        thisMethod.futureDeliveryDates = getFutureDateDeliveryDates([{
                            formatedDate: base.getFormattedDateTime(firstDate),
                            date: firstDate.getTime().toString()
                        }], thisMethod.futureDateDelivery, 1 ,firstDate)
                        thisMethWithDates.push(thisMethod);
                    } else {
                        thisMethWithDates.push(thisMethod);
                    }
                }
            });
            thisViewData.order.shipping[0].applicableShippingMethods = thisMethWithDates;
        } else {
            // Remove shipping methods with no price
            var methodsArray = [];

            thisMethods.forEach(function (method) {
                if (method.shippingCost !== 'N/A') {
                    methodsArray.push(method);
                }
            })

            thisViewData.order.shipping[0].applicableShippingMethods = methodsArray;
          }
        return thisViewData;
    }
};

module.exports = base;
