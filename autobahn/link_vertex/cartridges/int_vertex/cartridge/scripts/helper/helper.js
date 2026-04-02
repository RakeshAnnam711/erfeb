'use strict';

var StringUtils = require('dw/util/StringUtils');
var SecureRandom = require('dw/crypto/SecureRandom');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
/**
 * Helper for Vertex service
 */
function Helper() {}
Helper.prototype = {

    getFormattedDate: function () {
        var date = new Date();
        return StringUtils.format('{0}-{1}-{2}', date.getFullYear().toString(), this.insertLeadingZero(date.getMonth() + 1), this.insertLeadingZero(date.getDate()));
    },

    insertLeadingZero: function (number) {
        return number < 10 ? '0' + number : number;
    },

    beautifyAddresses: function (form, addresses) {
        var random = new SecureRandom();
        if (!addresses.length || ('postalAddress' in addresses[0] && empty(addresses[0].postalAddress))) {
            return [];
        }
        var items = [];
        for (var i in addresses) {
            var address = addresses[i];

            try {
                if (address.postalAddress) {
                    address = address.postalAddress[0];
                }
            } catch (e) {
                // do nothing
                // address@TaxLookupArea throw an exception in case undefined method instead undefined value
            }

            var newAddress = {
                UUID         : random.nextInt(),
                ID           : address.city,
                key          : address.postalCode + address.mainDivision + address.streetAddress1 + address.streetAddress2 + address.city + address.country,
                countryCode  : (address.country.toLowerCase()).substring(0, address.country.length - 1),
                postalCode   : address.postalCode,
                stateCode    : address.mainDivision,
                address1     : address.streetAddress1 == null ? form.address1.value : address.streetAddress1,
                address2     : address.streetAddress2,
                displayValue : address.city,
                city         : address.city
            };

            items.push(newAddress);
        }
        return items;
    },

    getCurrentNormalizedAddress: function () {
        var form = null;
        var postal = null;
        var state = null;
        if (request.httpParameterMap.multishipping && request.httpParameterMap.multishipping.value) {
            if (session.forms.multishipping) {
                form = session.forms.multishipping.editAddress.addressFields;
                postal = form.postal.value;
                state = form.states.state.value;
            }
        } else if (session.forms.singleshipping) {
            form = session.forms.singleshipping.shippingAddress.addressFields;
            postal = form.postal.value;
            state = form.states.state.value;
        } else if (session.forms.shipping.shippingAddress) {
            form = session.forms.shipping.shippingAddress.addressFields;
            postal = form.postalCode.value;
            state = form.states.stateCode.value;
        }

        return {
            UUID         : form.UUID,
            ID           : form.city.value,
            key          : Resource.msg('form.label.asis', 'vertex', null),
            address1     : form.address1.value,
            address2     : form.address2.value,
            city         : form.city.value,
            postalCode   : postal,
            stateCode    : state,
            countryCode  : empty(form.country.value) ? form.country.value : form.country.value.toLowerCase(),
            displayValue : form.city.value
        };
    },

    /**
     * @param {Object} normalizedAddresses Address
     * @description check if selected address fields and address fields in the form are identical. address2 field isn't required, so we skip this field.
     * @returns {boolean} екгу ша фввкуыыуы фку уйгфд
    */
    isEqualAddresses: function (normalizedAddresses) {
        var restrictedFields = ['ID', 'key', 'UUID', 'displayValue', 'address2'];
        var normalizedForm = this.getCurrentNormalizedAddress();

        if (session.privacy.VertexAddressSuggestions) {
            var previousForm = JSON.parse(session.privacy.VertexAddressSuggestions)[0];
            var currentForm = normalizedForm;
            var formsIsEqual = true;
            var formKeys = Object.keys(previousForm);

            for (var i in Object.keys(previousForm)) {
                var formFieldValue = previousForm[formKeys[i]];
                if (formFieldValue != currentForm[formKeys[i]]) {
                    formsIsEqual = false;
                }
            }

            if (formsIsEqual) {
                normalizedAddresses.push(normalizedForm);
            }
        }

        for (var i in normalizedAddresses) {
            var address = normalizedAddresses[i];
            var formIsEqual = true;
            var formKeys = Object.keys(address);

            for (var k in formKeys) {
                var fieldKey = formKeys[k];
                if (restrictedFields.indexOf(fieldKey) == -1) {
                    var fieldValue = address[fieldKey];

                    if (normalizedForm[fieldKey] != fieldValue) {
                        formIsEqual = false;
                    }
                }
            }

            if (formIsEqual) {
                return true;
            }
        }

        return false;
    },

    /**
     * @description get category name
     * @param {dw.order.LineItem} productWrap  ProductLineItem
     * @param {number} categoryDepth Integer 0: root, 1: product category
     * @example 'fruits-bananas-yellow_bananas'
     * @returns {string} category Id
     */
    getProductClass: function (productWrap) {
        var product;

        if (!empty(productWrap) && productWrap.product) {
            if (productWrap.product.variant) {
                product = productWrap.product.masterProduct;
            } else {
                product = productWrap.product;
            }

            // if product have no Classification category then get Primary category
            if (!product.classificationCategory) {
                return product.primaryCategory.ID;
            }

            return product.classificationCategory.ID;
        }
    },

    prepareCart: function (cart) {
        var GCs = cart.getGiftCertificateLineItems();
        var Products = cart.getAllProductLineItems();

        if (GCs.length) {
            var GCsi = GCs.iterator();
            Transaction.wrap(function () {
                while (GCsi.hasNext()) {
                    var GC = GCsi.next();
                    GC.updateTax(0.00);
                }
            });
        }

        // if we have only GC in the cart we should set zero tax to the default shipment
        if (!Products.length) {
            var lineItems = cart.getAllLineItems().iterator();

            while (lineItems.hasNext()) {
                var item = lineItems.next();
                var itemClassName = item.constructor.name;

                if (itemClassName == 'dw.order.ShippingLineItem') {
                    Transaction.wrap(function () {
                        item.updateTax(0.00);
                    });
                }
            }
        }
    }
};

module.exports = new Helper();
