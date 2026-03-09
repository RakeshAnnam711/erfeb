'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var VertexHelper = require('*/cartridge/scripts/helper/helper');
var vertexLogger = require('*/cartridge/scripts/lib/generalLogger');
var moduleName = 'initVertexApi~';
/**
 *
 * @param {string} transactionId unique transaction ID
 * @param {Object} constants object with credentials
 * @param {string} sender name of sender
 * @returns {Object} envelop for SOAP request
 */
function createDeleteTransactionEnvelope(transactionId, constants, sender) {
    /*
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <VertexEnvelope xmlns="urn:vertexinc:o-series:tps:7:0">
                <Login>
                    <TrustedId>6472904343785499</TrustedId>
                </Login>
                <DeleteRequest transactionId="T000123"/>
                <ApplicationData>
                    <Sender>SFCCPlatform</Sender>
                    <MessageLogging returnLogEntries="true"/>
                </ApplicationData>
            </VertexEnvelope>
        </soap:Body>
     </soap:Envelope>
     */

    var logLocation = moduleName + 'createDeleteTransactionEnvelope';
    var vertexSoap = webreferences2.CalculateTax;
    var Envelope = new vertexSoap.VertexEnvelope();
    var LoginType = new vertexSoap.LoginType();
    var DeleteRequestType = new vertexSoap.DeleteRequestType();
    var ApplicationData = new vertexSoap.VertexEnvelope.ApplicationData();
    var MessageLogging = new vertexSoap.VertexEnvelope.ApplicationData.MessageLogging();
    var selectedLevelType;
    var OverrideLoggingThreshold;

    vertexLogger.begin(logLocation, 'Parameters:', { transactionId: transactionId, sender: sender });

    if (!empty(constants.TrustedId)) {
        LoginType.setTrustedId(constants.TrustedId);
    } else if (!empty(constants.Username) && !empty(constants.Password)) {
        LoginType.setUserName(constants.Username);
        LoginType.setPassword(constants.Password);
    }

    // Add request processing detailed logging
    if (constants.detailedLogLevel !== 'NONE') {
        OverrideLoggingThreshold = new vertexSoap.VertexEnvelope.ApplicationData.MessageLogging.OverrideLoggingThreshold();
        OverrideLoggingThreshold.setThresholdScope('com.vertexinc.tps.common.domain.Transaction');
        selectedLevelType = vertexSoap.LogLevelType.fromValue(constants.detailedLogLevel);
        OverrideLoggingThreshold.setValue(selectedLevelType);

        MessageLogging.getOverrideLoggingThreshold().add(OverrideLoggingThreshold);
    }

    MessageLogging.setReturnLogEntries(true);
    ApplicationData.setMessageLogging(MessageLogging);
    ApplicationData.setSender(sender);

    DeleteRequestType.setTransactionId(transactionId);
    Envelope.setApplicationData(ApplicationData);
    Envelope.setLogin(LoginType);
    Envelope.setAccrualRequestOrAccrualResponseOrAccrualSyncRequest(DeleteRequestType);
    vertexLogger.end(logLocation);

    return Envelope;
}
/**
 *
 * @param {dw.svc.Service} service SOAP
 * @param {dw.order.Basket} cart Basket
 * @param {Object} CustomerType object for Vertex SOAP service
 * @param {Object} RequestType object for Vertex SOAP service
 * @param {Object} shippingFormMock mock data for calls from BM
 */
function createSingleshippingCustomerBlock(service, cart, CustomerType, RequestType, shippingFormMock) {
    // If shippingFormMack is not null then it is a test call
    var CustomerTaxRegistrationType;
    var CustomerCodeType;

    if (shippingFormMock) {
        CustomerTaxRegistrationType = new service.TaxRegistrationType();
        CustomerTaxRegistrationType.setTaxRegistrationNumber(shippingFormMock.taxnumber);
        CustomerTaxRegistrationType.setIsoCountryCode(shippingFormMock.country.value);
        CustomerType.getTaxRegistration().add(CustomerTaxRegistrationType);

        CustomerCodeType = new service.CustomerCodeType();
        CustomerCodeType.setValue(shippingFormMock.email);
        CustomerType.setCustomerCode(CustomerCodeType);
        RequestType.setCustomer(CustomerType);
    } else {
        var form = null;
        if (session.forms.singleshipping) {
            form = session.forms.singleshipping.shippingAddress;
        } else if (session.forms.shipping) {
            form = session.forms.shipping.shippingAddress;
        }
        // If unregistered customer filled Tax Registration Number on single shipping step
        // and it is not USA
        if (form.addressFields.taxnumber.value && !cart.defaultShipment.shippingAddress.countryCode.value.match(/us|usa/i)) {
            CustomerTaxRegistrationType = new service.TaxRegistrationType();
            CustomerTaxRegistrationType.setTaxRegistrationNumber(form.addressFields.taxnumber.value);
            CustomerTaxRegistrationType.setIsoCountryCode(cart.defaultShipment.shippingAddress.countryCode.value);
            CustomerType.getTaxRegistration().add(CustomerTaxRegistrationType);
        }

        CustomerCodeType = new service.CustomerCodeType();

        if (cart.customer.authenticated && cart.customer.registered) {
            CustomerCodeType.setValue(cart.customerNo);
        } else if (cart.billingAddress) {
            if (session.forms.billing.billingAddress) {
                CustomerCodeType.setValue(session.forms.billing.billingAddress.email.emailAddress.value);
            } else if (session.forms.billing.contactInfoFields) {
                CustomerCodeType.setValue(session.forms.billing.contactInfoFields.email.value);
            }
        }
        CustomerType.setCustomerCode(CustomerCodeType);

        if (session.forms.singleshipping) {
            if (session.forms.singleshipping.fulfilled.value) {
                RequestType.setCustomer(CustomerType);
            }
        } else if (session.forms.shipping) {
            RequestType.setCustomer(CustomerType);
        }
    }
}
/**
 *
 * @param {dw.svc.Service} service SOAP
 * @param {dw.order.Basket} cart Basket
 * @param {Object} item object for Vertex SOAP service
 * @param {Object} LineItem object for Vertex SOAP service
 * @param {Object} CustomerType object for Vertex SOAP service
 * @param {Object} constants object with credentials
 */
function createMultishippingCustomerBlock(service, cart, item, LineItem, CustomerType, constants) {
    // here we need to add condition fot sfra multishipping
    if ((session.forms.multishipping && session.forms.multishipping.addressSelection.fulfilled.value && session.forms.multishipping.shippingOptions.fulfilled.value)
        || (cart.shipments.length > 1 && constants.SFRA)
    ) {
        if (constants.isVATEnabled && !empty(item.shipment.shippingAddress.custom.taxnumber)
            && item.shipment.shippingAddress.custom.taxnumber !== 'undefined'
            && item.shipment.shippingAddress.countryCode.value.match(/us|usa/i)) {
            var CustomerTaxRegistrationShipping = new service.TaxRegistrationType();
            CustomerTaxRegistrationShipping.setTaxRegistrationNumber(item.shipment.shippingAddress.custom.taxnumber);
            CustomerTaxRegistrationShipping.setIsoCountryCode(item.shipment.shippingAddress.countryCode.value);
            CustomerType.getTaxRegistration().add(CustomerTaxRegistrationShipping);
        }
        var CustomerDestination = new service.LocationType();
        CustomerDestination.setStreetAddress1(item.shipment.shippingAddress.address1);
        CustomerDestination.setStreetAddress2(item.shipment.shippingAddress.address2);
        CustomerDestination.setCity(item.shipment.shippingAddress.city);
        CustomerDestination.setPostalCode(item.shipment.shippingAddress.postalCode);
        CustomerDestination.setCountry(item.shipment.shippingAddress.countryCode.value);

        if (cart.billingAddress) {
            var CustomerCodeType = new service.CustomerCodeType();
            // here we should set another email
            if (constants.SFRA) {
                CustomerCodeType.setValue(session.forms.billing.contactInfoFields.email.value);
            } else {
                CustomerCodeType.setValue(session.forms.billing.billingAddress.email.emailAddress.value);
            }
            if (cart.customer.authenticated && cart.customer.registered) {
                CustomerCodeType.setValue(cart.customerNo);
            }
            CustomerType.setCustomerCode(CustomerCodeType);

            var CustomerTaxRegistrationBilling = new service.TaxRegistrationType();
            if (constants.isVATEnabled && cart.billingAddress.custom.taxnumber && cart.billingAddress.countryCode.value.match(/us|usa/i)) {
                CustomerTaxRegistrationBilling.setTaxRegistrationNumber(cart.billingAddress.custom.taxnumber);
                CustomerTaxRegistrationBilling.setIsoCountryCode(cart.billingAddress.countryCode.value);
            }

            var PhysicalLocation = new service.TaxRegistrationType.PhysicalLocation();

            PhysicalLocation.setCity(cart.billingAddress.city);
            PhysicalLocation.setCountry(cart.billingAddress.countryCode.value);
            PhysicalLocation.setPostalCode(cart.billingAddress.postalCode);
            PhysicalLocation.setStreetAddress1(cart.billingAddress.address1);
            CustomerTaxRegistrationBilling.getPhysicalLocation().add(PhysicalLocation);
            CustomerType.getTaxRegistration().add(CustomerTaxRegistrationBilling);
        }
        CustomerType.setDestination(CustomerDestination);
        LineItem.setCustomer(CustomerType);
    }
}
/**
 *
 * @param {Object} requestType object for Vertex SOAP service
 * @param {dw.order.Basket} cart Basket
 * @param {Object} constants object with credentials
 * @param {Object} MOCK_DATA object with mock data
 * @returns {Object} object Envelope for Vertex SOAP service
 */
function createCalculateTaxEnvelope(requestType, cart, constants, MOCK_DATA) {
    var logLocation = moduleName + 'createCalculateTaxEnvelope';
    var service = webreferences2.CalculateTax;
    var Request = constants.Request[requestType + 'Request'];
    var Envelope = new service.VertexEnvelope();
    var LoginType = new service.LoginType();
    var RequestType = new service[Request.type]();
    var SellerType = new service.SellerType();
    var LocationTypeSeller = new service.LocationType();
    var LocationTypeSellerAdmin = new service.LocationType();
    var LocationTypeCustomer = new service.LocationType();
    var CustomerType = new service.CustomerType();
    var CustomerCodeType;
    var lineItemCounter = 0;
    var ApplicationData;
    var MessageLogging;
    var selectedLevelType;
    var OverrideLoggingThreshold;

    vertexLogger.begin(logLocation, 'Parameters:', { requestType: requestType, MOCK_DATA: MOCK_DATA });

    if (!empty(constants.TrustedId)) {
        LoginType.setTrustedId(constants.TrustedId);
    } else if (!empty(constants.Username) && !empty(constants.Password)) {
        LoginType.setUserName(constants.Username);
        LoginType.setPassword(constants.Password);
    }

    RequestType.setDocumentDate(new dw.util.Calendar());
    RequestType.setTransactionType(service.SaleTransactionType.valueOf(constants.TransactionType));

    if (requestType === 'Quotation') {
        RequestType.setDocumentNumber(cart.UUID);
        RequestType.setTransactionId(cart.UUID);
    } else {
        RequestType.setDocumentNumber(cart.orderNo);
        RequestType.setTransactionId(cart.orderNo);
    }
    //RVW Autobahn Custom change (constants.DeliveryTerms.displayValue.length...)
    if (constants.DeliveryTerms.displayValue.length > 0 && !empty(constants.DeliveryTerms)) {
        var DeliveryTermCodeType = service.DeliveryTermCodeType.valueOf(constants.DeliveryTerms);
        RequestType.setDeliveryTerm(DeliveryTermCodeType);
    }

    // START OF SELLER TYPE

    if (constants.Seller.city) { LocationTypeSeller.setCity(constants.Seller.city); }
    if (constants.Seller.address) { LocationTypeSeller.setStreetAddress1(constants.Seller.address); }
    if (constants.Seller.country) { LocationTypeSeller.setCountry(constants.Seller.country); }
    if (constants.Seller.mainDvision) { LocationTypeSeller.setMainDivision(constants.Seller.mainDvision); }
    if (constants.Seller.postalCode) { LocationTypeSeller.setPostalCode(constants.Seller.postalCode); }

    if (constants.Seller.city || constants.Seller.address || constants.Seller.country || constants.Seller.mainDvision || constants.Seller.postalCode) {
        SellerType.setPhysicalOrigin(LocationTypeSeller);
    }

    SellerType.setCompany(constants.Seller.company);
    // Administrative Origin

    if (constants.SellerAdmin.city) { LocationTypeSellerAdmin.setCity(constants.SellerAdmin.city); }
    if (constants.SellerAdmin.address) { LocationTypeSellerAdmin.setStreetAddress1(constants.SellerAdmin.address); }
    if (constants.SellerAdmin.country) { LocationTypeSellerAdmin.setCountry(constants.SellerAdmin.country); }
    if (constants.SellerAdmin.mainDvision) { LocationTypeSellerAdmin.setMainDivision(constants.SellerAdmin.mainDvision); }
    if (constants.SellerAdmin.postalCode) { LocationTypeSellerAdmin.setPostalCode(constants.SellerAdmin.postalCode); }

    if (constants.SellerAdmin.city || constants.SellerAdmin.address || constants.SellerAdmin.country || constants.SellerAdmin.mainDvision || constants.SellerAdmin.postalCode) {
        SellerType.setAdministrativeOrigin(LocationTypeSellerAdmin);
    } else {
        SellerType.setAdministrativeOrigin(LocationTypeSeller);
    }

    if (constants.isVATEnabled && !constants.Vertex_ISOCountryCode.match(/us|usa/i)) {
        var SellerTaxRegistrationType = new service.TaxRegistrationType();
        SellerTaxRegistrationType.setTaxRegistrationNumber(constants.Vertex_TaxRegistrationNumber);
        SellerTaxRegistrationType.setIsoCountryCode(constants.Vertex_ISOCountryCode);
        SellerType.getTaxRegistration().add(SellerTaxRegistrationType);
    }

    RequestType.setSeller(SellerType);
    // END OF SELLER TYPE

    // START OF CUSTOMER TYPE

    // MOCK_DATA needed for the Health Test JOB
    var shippingForm = MOCK_DATA;

    var forms = session.forms;
    if (!empty(forms)) {
        if (forms.singleshipping) {
            // Check if singleshipping step passed then we have shipping data
            if (forms.singleshipping && forms.singleshipping.fulfilled.value) {
                shippingForm = forms.singleshipping.shippingAddress.addressFields;
            }
        } else if (forms.shippingAddress) {
            shippingForm = forms.shippingAddress.addressFields;
        } else if (forms.shipping) {
            shippingForm = forms.shipping.shippingAddress.addressFields;
        }
    }

    // MOCK_DATA needed for the Health Test JOB
    if (shippingForm) {
        LocationTypeCustomer = new service.LocationType();
        LocationTypeCustomer.setStreetAddress1(shippingForm.address1.value);
        LocationTypeCustomer.setStreetAddress2(shippingForm.address2.value);
        LocationTypeCustomer.setCity(shippingForm.city.value);
        if (shippingForm.country.selectedOption) {
            LocationTypeCustomer.setCountry(shippingForm.country.selectedOption.value);
        }
        if (shippingForm.states.state) {
            LocationTypeCustomer.setMainDivision(shippingForm.states.state.htmlValue);
        } else if (shippingForm.states.stateCode) {
            LocationTypeCustomer.setMainDivision(shippingForm.states.stateCode.htmlValue);
        }
        if (shippingForm.postal) {
            LocationTypeCustomer.setPostalCode(shippingForm.postal.value);
        } else if (shippingForm.postalCode) {
            LocationTypeCustomer.setPostalCode(shippingForm.postalCode.htmlValue);
        }
        if (cart.shipments.length === 1) {
            CustomerCodeType = new service.CustomerCodeType();

            if (cart.customer.authenticated && cart.customer.registered) {
                CustomerCodeType.setValue(cart.customerNo);
            } else if (cart.billingAddress && !empty(session.forms)) {
                if (session.forms.billing.billingAddress) {
                    CustomerCodeType.setValue(session.forms.billing.billingAddress.email.emailAddress.value);
                } else if (session.forms.billing.contactInfoFields) {
                    CustomerCodeType.setValue(session.forms.billing.contactInfoFields.email.value);
                }
            }
            CustomerType.setCustomerCode(CustomerCodeType);
            
            CustomerType.setDestination(LocationTypeCustomer);
            RequestType.setCustomer(CustomerType);
        }
    }

    // Create Customer Block for VAT Singleshipping
    // if it's a test call we skip this conditions
    if (constants.isVATEnabled) {
        vertexLogger.debug(logLocation, 'Preparing customer VAT Data. isVATEnabled: true, MOCK_DATA: empty');
        var CurrencyType = new service.CurrencyType();
        CurrencyType.setIsoCurrencyCodeAlpha(cart.currencyCode);
        RequestType.setCurrency(CurrencyType);

        createSingleshippingCustomerBlock(service, cart, CustomerType, RequestType, MOCK_DATA);
    }
    // END OF CUSTOMER TYPE

    // START OF LineItemType

    var lineItems = cart.getAllLineItems().iterator();
    var items = [];

    while (lineItems.hasNext()) {
        var product;
        var LineItem;
        var MeasureType;
        var ProductType;
        var productClass;
        var objectFactory;
        var discountObj;
        var shipment;
        var shipmentPrice;
        var item = lineItems.next();
        var itemClass = item.constructor.name;
        switch (itemClass) {
            case 'dw.order.ProductLineItem':
                product = item;
                LineItem = new service[Request.lineItem]();
                CustomerType = new service.CustomerType();

                MeasureType = new service.MeasureType();
                MeasureType.setValue(new dw.util.Decimal(product.quantity.value));

                ProductType = new service.Product();
                productClass = VertexHelper.getProductClass(product);
                ProductType.setProductClass(productClass);
                ProductType.setValue(product.optionProductLineItem ? product.optionID : product.product.ID);

                var Discount = new service.Discount();
                var productPrice = product.price.decimalValue;
                LineItem.setLineItemId('PRODUCT??' + (product.optionProductLineItem ? product.optionID : product.product.ID));

                lineItemCounter += 1;
                LineItem.setLineItemNumber(lineItemCounter);
                LineItem.setQuantity(MeasureType);

                createMultishippingCustomerBlock(service, cart, item, LineItem, CustomerType, constants);

                if (productClass) {
                    ProductType.setProductClass(productClass);
                }

                LineItem.setProduct(ProductType);

                if (productPrice !== product.proratedPrice.decimalValue) {
                    objectFactory = new service.ObjectFactory();
                    discountObj = objectFactory.createAmount(productPrice.subtract(product.proratedPrice.decimalValue));
                    Discount.setDiscountPercentOrDiscountAmount(discountObj);
                    LineItem.setDiscount(Discount);
                    productPrice = product.proratedPrice.decimalValue;
                }
                LineItem.setFairMarketValue(item.priceValue);
                LineItem.setExtendedPrice(productPrice);

                // Send the shipment ID as ProjectNumber, for the Multishipping purpose
                LineItem.setProjectNumber(product.shipment.ID ? product.shipment.ID : 'null');

                items.push(LineItem);

                break;
            case 'dw.order.ShippingLineItem':
                var shipments = cart.getShipments().iterator();

                while (shipments.hasNext()) {
                    shipment = shipments.next();
                    if (shipment.getShippingLineItems().contains(item)) {
                        LineItem = new service[Request.lineItem]();
                        MeasureType = new service.MeasureType();
                        ProductType = new service.Product();
                        Discount = new service.Discount();
                        CustomerType = new service.CustomerType();

                        shipmentPrice = shipment.shippingLineItems[0].price.decimalValue;

                        MeasureType.setValue(new dw.util.Decimal(1));
                        LineItem.setLineItemId('SHIPPING??' + shipment.shippingLineItems[0].ID);
                        lineItemCounter += 1;
                        LineItem.setLineItemNumber(lineItemCounter);
                        LineItem.setQuantity(MeasureType);
                        LineItem.setProduct(ProductType);

                        createMultishippingCustomerBlock(service, cart, { shipment: shipment }, LineItem, CustomerType, constants);

                        if (shipmentPrice !== shipment.shippingLineItems[0].adjustedPrice.decimalValue) {
                            objectFactory = new service.ObjectFactory();
                            discountObj = objectFactory.createAmount(shipmentPrice.subtract(shipment.shippingLineItems[0].adjustedPrice.decimalValue));
                            Discount.setDiscountPercentOrDiscountAmount(discountObj);
                            LineItem.setDiscount(Discount);

                            shipmentPrice = shipment.shippingLineItems[0].adjustedPrice.decimalValue;
                        }

                        if (isNaN(shipmentPrice)) {
                            break;
                        }

                        LineItem.setFairMarketValue(shipment.shippingLineItems[0].priceValue);
                        LineItem.setExtendedPrice(shipmentPrice);

                        // Send the shipment ID as ProjectNumber, for the Multishipping purpose
                        LineItem.setProjectNumber(shipment.ID ? shipment.ID : 'null');

                        items.push(LineItem);
                    }
                }
                break;
            case 'dw.order.ProductShippingLineItem':
                shipment = item;
                LineItem = new service[Request.lineItem]();
                MeasureType = new service.MeasureType();
                ProductType = new service.Product();
                CustomerType = new service.CustomerType();
                Discount = new service.Discount();
                shipmentPrice = shipment.adjustedPrice.decimalValue;

                lineItemCounter += 1;

                MeasureType.setValue(new dw.util.Decimal(1));

                LineItem.setLineItemId('SHIPPING??PRODUCTLINEITEM:' + lineItemCounter);

                LineItem.setLineItemNumber(lineItemCounter);
                LineItem.setQuantity(MeasureType);
                LineItem.setProduct(ProductType);

                createMultishippingCustomerBlock(service, cart, item, LineItem, CustomerType, constants);

                if (isNaN(shipmentPrice)) {
                    break;
                }
                LineItem.setFairMarketValue(item.priceValue);
                LineItem.setExtendedPrice(shipmentPrice);

                // Send the shipment ID as ProjectNumber, for the Multishipping purpose
                LineItem.setProjectNumber(item.shipment.ID ? item.shipment.ID : 'null');

                items.push(LineItem);

                break;
            default:
        }
    }

    RequestType.getLineItem().add(items);
    // END OF LineItemType

    // Add request processing detailed logging
    if (constants.detailedLogLevel !== 'NONE') {
        ApplicationData = new service.VertexEnvelope.ApplicationData();
        MessageLogging = new service.VertexEnvelope.ApplicationData.MessageLogging();

        OverrideLoggingThreshold = new service.VertexEnvelope.ApplicationData.MessageLogging.OverrideLoggingThreshold();
        OverrideLoggingThreshold.setThresholdScope('com.vertexinc.tps.common.domain.Transaction');
        selectedLevelType = service.LogLevelType.fromValue(constants.detailedLogLevel);
        OverrideLoggingThreshold.setValue(selectedLevelType);

        MessageLogging.getOverrideLoggingThreshold().add(OverrideLoggingThreshold);
        MessageLogging.setReturnLogEntries(true);
        ApplicationData.setMessageLogging(MessageLogging);
        Envelope.setApplicationData(ApplicationData);
    }

    Envelope.setLogin(LoginType);
    Envelope.setAccrualRequestOrAccrualResponseOrAccrualSyncRequest(RequestType);

    vertexLogger.end(logLocation);

    return Envelope;
}

exports.CalculateTax = LocalServiceRegistry.createService('vertex.CalculateTax', {
    /*
     * 'params' object should have the following properties:
     *  CalculateTax operation
     *  {
     *      constants   : vertex constants object,  (REQUIRED)
     *      requestType : 'Invoice' || 'Quotation'  (REQUIRED)
     *      cart        : a cart or mock data       (REQUIRED)
     *      MOCK_DATA   : tax area lookup mock data (OPTIONAL)
     *  }
     *  DeleteTransaction operation
     *  {
     *      constants     : vertex constants object, (REQUIRED)
     *      transactionId : transaction to delete    (REQUIRED)
     *      sender        : sender name              (REQUIRED)
     *  }
     */
    createRequest: function (svc, operation, params) {
        var logLocation = moduleName + 'vertex.CalculateTax.createRequest';
        var vertexEnvelope;
        var mockData;
        var service = webreferences2.CalculateTax;

        vertexLogger.begin(logLocation, 'Parameters:', { operation: operation, params: params });

        if (operation === 'DeleteTransaction') {
            vertexEnvelope = createDeleteTransactionEnvelope(params.transactionId, params.constants, params.sender);
        }

        // requestType, cart, constants, MOCK_DATA

        if (operation === 'CalculateTax') {
            mockData = ('MOCK_DATA' in params) ? params.MOCK_DATA : null;
            vertexEnvelope = createCalculateTaxEnvelope(params.requestType, params.cart, params.constants, mockData);
        }

        svc.serviceClient = service.getDefaultService(); // eslint-disable-line no-param-reassign
        svc.URL = params.constants.CalculateTaxURL; // eslint-disable-line no-param-reassign

        vertexLogger.trace(logLocation, ' Request Data:', { URL: params.constants.CalculateTaxURL, Envelope: vertexEnvelope.toString() });
        vertexLogger.end(logLocation);

        return vertexEnvelope;
    },

    execute: function (svc, Envelope) {
        vertexLogger.debug('vertex.CalculateTax.execute', ' - executing service call');
        return svc.serviceClient.calculateTax70(Envelope);
    },

    parseResponse: function (svc, Envelope) {
        vertexLogger.debug('vertex.CalculateTax.parseResponse', ' - parsing response');
        return Envelope.getAccrualRequestOrAccrualResponseOrAccrualSyncRequest();
    },

    filterLogMessage: function (logMsg) {
        return vertexLogger.jsonHideSensitiveInfo(logMsg);
    }

});

exports.LookupTaxAreas = LocalServiceRegistry.createService('vertex.LookupTaxAreas', {
    createRequest: function (svc, form, constants) {
        var logLocation = 'vertex.LookupTaxAreas.createRequest';
        var service = webreferences2.LookupTaxAreas;
        var Envelope = new service.VertexEnvelope();
        var TaxAreaLookupType = new service.TaxAreaLookupType();
        var TaxAreaRequestType = new service.TaxAreaRequestType();
        var PostalAddressType = new service.PostalAddressType();
        var LoginType = new service.LoginType();
        var ApplicationData;
        var MessageLogging;
        var selectedLevelType;
        var OverrideLoggingThreshold;

        vertexLogger.begin(logLocation, 'Address form:', { form: form });

        if (!empty(constants.TrustedId)) {
            LoginType.setTrustedId(constants.TrustedId);
        } else if (!empty(constants.Username) && !empty(constants.Password)) {
            LoginType.setUserName(constants.Username);
            LoginType.setPassword(constants.Password);
        }

        /**
         * Envelope
         *    LoginType
         *    TaxAreaRequestType
         *        PostalAddressType
         */
        TaxAreaLookupType.setAsOfDate(new dw.util.Calendar());

        PostalAddressType.setStreetAddress1(form.address1.value);

        if (!empty(form.address2.value)) {
            PostalAddressType.setStreetAddress2(form.address2.value);
        }

        PostalAddressType.setCity(form.city.value);
        if (form.states.state) {
            PostalAddressType.setMainDivision(form.states.state.value);
        } else if (form.states.stateCode) {
            PostalAddressType.setMainDivision(form.states.stateCode.htmlValue);
        }
        if (form.postal) {
            PostalAddressType.setPostalCode(form.postal.value);
        } else if (form.postalCode) {
            PostalAddressType.setPostalCode(form.postalCode.htmlValue);
        }
        PostalAddressType.setCountry(form.country.value);

        TaxAreaLookupType.setTaxAreaIdOrPostalAddressOrExternalJurisdiction(PostalAddressType);

        TaxAreaRequestType.setTaxAreaLookup(TaxAreaLookupType);

        // Add request processing detailed logging
        if (constants.detailedLogLevel !== 'NONE') {
            ApplicationData = new service.VertexEnvelope.ApplicationData();
            MessageLogging = new service.VertexEnvelope.ApplicationData.MessageLogging();

            OverrideLoggingThreshold = new service.VertexEnvelope.ApplicationData.MessageLogging.OverrideLoggingThreshold();
            OverrideLoggingThreshold.setThresholdScope('com.vertexinc.tps.common.domain.Transaction');
            selectedLevelType = service.LogLevelType.fromValue(constants.detailedLogLevel);
            OverrideLoggingThreshold.setValue(selectedLevelType);

            MessageLogging.getOverrideLoggingThreshold().add(OverrideLoggingThreshold);
            MessageLogging.setReturnLogEntries(true);
            ApplicationData.setMessageLogging(MessageLogging);
            Envelope.setApplicationData(ApplicationData);
        }

        Envelope.setLogin(LoginType);
        Envelope.setAccrualRequestOrAccrualResponseOrAccrualSyncRequest(TaxAreaRequestType);

        svc.serviceClient = service.getDefaultService(); // eslint-disable-line no-param-reassign
        svc.URL = constants.LookupTaxAreaURL; // eslint-disable-line no-param-reassign

        vertexLogger.trace(logLocation, 'Parameters:', { URL: constants.LookupTaxAreaURL, Envelope: Envelope.toString() });
        vertexLogger.end(logLocation);

        return Envelope;
    },

    execute: function (svc, Envelope) {
        vertexLogger.debug('vertex.LookupTaxAreas.execute', '');
        return svc.serviceClient.lookupTaxAreas70(Envelope);
    },

    parseResponse: function (svc, Envelope) {
        var TaxAreaResponse = Envelope.getAccrualRequestOrAccrualResponseOrAccrualSyncRequest();
        var TaxAreaResultType = TaxAreaResponse.getTaxAreaResult();
        var result = {
            response            : 'NORMAL',
            addresses           : [],
            message             : '',
            taxAreaId           : '',
            confidenceIndicator : 100
        };

        vertexLogger.debug('vertex.LookupTaxAreas.parseResponse', '');

        if (!empty(TaxAreaResultType)) {
            if (TaxAreaResultType.length === 1) {
                var status = TaxAreaResultType[0].getStatus();

                result.taxAreaId = TaxAreaResultType[0].taxAreaId.toString();
                result.confidenceIndicator = TaxAreaResultType[0].confidenceIndicator;

                if (!empty(status)) {
                    if (status.length === 1) {
                        result.response = status[0].lookupResult.toString();
                        result.addresses = TaxAreaResultType[0].postalAddress;
                    } else if (status.length > 1) {
                        for (var i = 0; i < status.length; i += 1) {
                            var s = status[i].lookupResult.toString();

                            if (s === 'NORMAL') {
                                result.response = 'NORMAL';
                                result.addresses = TaxAreaResultType[0].postalAddress;
                                break;
                            }

                            if (s === 'BAD_REGION_FIELDS') {
                                result.response = 'BAD_REGION_FIELDS';
                                result.message = 'Please enter a valid address';
                                break;
                            }
                        }
                    }
                }
            } else if (TaxAreaResultType.length > 1) {
                for (var key = 0; key < TaxAreaResultType.length; key += 1) {
                    var TaxArea = TaxAreaResultType[key];
                    if (TaxArea && TaxArea.postalAddress) {
                        result.addresses.push(TaxArea);
                    }
                }
            }
        }

        return result;
    },

    filterLogMessage: function (logMsg) {
        return vertexLogger.jsonHideSensitiveInfo(logMsg);
    }
});
