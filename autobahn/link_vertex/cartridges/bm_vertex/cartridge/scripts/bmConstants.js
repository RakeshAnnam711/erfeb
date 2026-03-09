'use strict';

var CurrentSite = require('dw/system/Site').getCurrent().preferences;
var p = CurrentSite ? CurrentSite.custom : {};

// Site preferences

module.exports.PREFERENCES = {
    Vertex_Address                   : p.Vertex_Address,
    Vertex_Company                   : p.Vertex_Company,
    Vertex_Country                   : p.Vertex_Country,
    Vertex_City                      : p.Vertex_City,
    Vertex_isAddressCleansingEnabled : p.Vertex_isAddressCleansingEnabled,
    Vertex_isEnabled                 : p.Vertex_isEnabled,
    Vertex_isInvoiceEnabled          : p.Vertex_isInvoiceEnabled,
    Vertex_isVATEnabled              : p.Vertex_isVATEnabled,
    Vertex_MainDivision              : p.Vertex_MainDivision,
    Vertex_Password                  : p.Vertex_Password,
    Vertex_TrustedId                 : p.Vertex_TrustedId,
    Vertex_PostalCode                : p.Vertex_PostalCode,
    Vertex_UserName                  : p.Vertex_UserName,
    Vertex_City_Admin                : p.Vertex_City_Admin,
    Vertex_Address_Admin             : p.Vertex_Address_Admin,
    Vertex_MainDivision_Admin        : p.Vertex_MainDivision_Admin,
    Vertex_Country_Admin             : p.Vertex_Country_Admin,
    Vertex_PostalCode_Admin          : p.Vertex_PostalCode_Admin,
    Vertex_ProductClassDepth         : p.Vertex_ProductClassDepth,
    Vertex_TaxRegistrationNumber     : p.Vertex_TaxRegistrationNumber,
    Vertex_ISOCountryCode            : p.Vertex_ISOCountryCode,
    Vertex_DeliveryTerms             : p.Vertex_DeliveryTerms,
    Vertex_DashboardURL              : p.Vertex_DashboardURL,
    Vertex_EndpointLookup            : p.Vertex_EndpointLookup,
    Vertex_EndpointTax               : p.Vertex_EndpointTax
};

module.exports.ALLOWED_FIELDS = [
    'Vertex_Address',
    'Vertex_Company',
    'Vertex_Country',
    'Vertex_City',
    'Vertex_isAddressCleansingEnabled',
    'Vertex_isEnabled',
    'Vertex_isVATEnabled',
    'Vertex_isInvoiceEnabled',
    'Vertex_MainDivision',
    'Vertex_Password',
    'Vertex_TrustedId',
    'Vertex_PostalCode',
    'Vertex_UserName',
    'Vertex_City_Admin',
    'Vertex_Address_Admin',
    'Vertex_MainDivision_Admin',
    'Vertex_Country_Admin',
    'Vertex_PostalCode_Admin',
    'Vertex_ProductClassDepth',
    'Vertex_TaxRegistrationNumber',
    'Vertex_ISOCountryCode',
    'Vertex_EndpointTax',
    'Vertex_EndpointLookup'
];

module.exports.TOGGLE_FIELDS = [
    'Vertex_isAddressCleansingEnabled',
    'Vertex_isEnabled',
    'Vertex_isInvoiceEnabled',
    'Vertex_ProductClassDepth',
    'Vertex_isVATEnabled'
];

module.exports.TAX_AREA_LOOKUP_MOCK_DATA = {
    address1: {
        value: '2301 Renaissance Blvd'
    },
    address2: {
        value: ''
    },
    city: {
        value: 'King Of Prussia'
    },
    states: {
        state: {
            value     : 'PA',
            htmlValue : 'PA'
        }
    },
    postal: {
        value: '19406-2772'
    },
    country: {
        value          : 'us',
        selectedOption : {
            value: 'us'
        }
    },
    taxnumber : 'DE1111111',
    email     : 'test@test.com'
};

module.exports.CART_MOCK_DATA = {
    UUID            : 'b50190bded01cbf4903b54e96b',
    getAllLineItems : function () {
        return {
            iterator: function () {
                return {
                    count   : 1,
                    hasNext : function () {
                        return this.count > 0;
                    },
                    next: function () {
                        this.count -=1;
                        return {
                            quantity: {
                                value: 9
                            },
                            constructor: {
                                name: 'dw.order.ProductLineItem'
                            },
                            productName : 'Health Job Test Product',
                            price       : {
                                decimalValue: 100.00
                            },
                            proratedPrice: {
                                decimalValue: 100.00
                            },
                            product: {
                                ID         : 'TEST_PRODUCT',
                                variant    : false,
                                categories : {
                                    0: {
                                        topLevel : true,
                                        ID       : 'category_id'
                                    },
                                    getLength: function () {
                                        return true;
                                    }
                                },
                                classificationCategory: {
                                    ID: 'Test-classification-category'
                                },
                                primaryCategory: {
                                    ID: 'test-primaryCategory-id'
                                }
                            },
                            priceValue : 100,
                            shipment   : {
                                ID: 'test-shipment-id'
                            }
                        };
                    }
                };
            }
        };
    },
    defaultShipment: {
        shippingLineItems: {
            iterator: function () {
                return [];
            }
        }
    },
    shipments: {
        length: 1
    },
    currencyCode   : 'USD',
    billingAddress : {
        email: {
            emailAddress: { value: 'test@test.com' }
        }
    },
    customer: {
        authenticated : true,
        registered    : true
    },
    customerNo: '00008003'
};
