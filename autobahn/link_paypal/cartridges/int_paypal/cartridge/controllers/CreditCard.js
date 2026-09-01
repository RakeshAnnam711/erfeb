'use strict';

const server = require('server');

const Resource = require('dw/web/Resource');

const utils = require('*/cartridge/scripts/paypal/utils');
const paypalApi = require('*/cartridge/scripts/paypal/api');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const paypalConstants = require('*/cartridge/config/constants');
const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
const creditCardHelper = require('*/cartridge/scripts/paypal/helpers/creditCardHelper');

server.post('CreateSetupToken',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const Encoding = require('dw/crypto/Encoding');

        const creditCardForm = utils.tryParseJSON(Encoding.fromBase64(req.body));
        const formFields = creditCardHelper.getCreditCardFields(creditCardForm);
        const preparedForm = creditCardHelper.prepareBodyForCreateSetupToken(formFields);

        const fieldsErrors = Object.keys(preparedForm).reduce(function(accum, field) {
            const validationResult = creditCardHelper.validateCardAccountPage(field, preparedForm[field]);

            if (validationResult.isError) {
                accum[field] = validationResult;
            }

            return accum;
        }, {});

        if (Object.keys(fieldsErrors).length > 0) {
            res.json({
                error: true,
                fieldsErrors: fieldsErrors
            });

            res.setStatusCode(400);

            return next();
        }

        const setupTokenResponse = paypalApi.createSetupToken(preparedForm);

        if (setupTokenResponse.err) {
            res.json({
                error: true,
                message: setupTokenResponse.err
            });

            res.setStatusCode(400);

            return next();
        }

        const customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');

        session.privacy.setupTokenId = setupTokenResponse.id;
        session.privacy.setupTokenCustomerId = customerHelper.getPaypalCustomerId(setupTokenResponse);

        if (setupTokenResponse.status === paypalConstants.PAYER_ACTION_REQUIRED) {
            const approveLink = setupTokenResponse.links.find(function(link) {
                return link.rel === 'approve';
            });

            res.json({
                error: false,
                verificationRequired: true,
                approveUrl: approveLink ? approveLink.href : '',
                cancelMessage: Resource.msg('paypal.creditcard.3ds.cancel', 'paypalerrors', null),
                closeMessage: Resource.msg('paypal.creditcard.3ds.verification.failed', 'paypalerrors', null)
            });

            return next();
        }

        res.json({ error: false });

        return next();
    }
);

server.post('AccountAddCreditCardHandle',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        if (!session.privacy.setupTokenId) {
            res.json({
                error: true,
                message: Resource.msg('paypal.creditcard.3ds.setuptoken.notset', 'paypalerrors', null)
            });

            res.setStatusCode(400);

            return next();
        }

        const Encoding = require('dw/crypto/Encoding');
        const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
        const addressHelper = require('*/cartridge/scripts/paypal/helpers/addressHelper');

        const creditCardForm = utils.tryParseJSON(Encoding.fromBase64(req.body));
        const paymentTokenResponse = paypalApi.createPaymentToken(
            session.privacy.setupTokenId,
            paypalConstants.SETUP_TOKEN_TYPE,
            session.privacy.setupTokenCustomerId
        );

        if (paymentTokenResponse.err) {
            res.json({
                error: true,
                message: paymentTokenResponse.err
            });

            res.setStatusCode(400);

            return next();
        }

        const billingAddressToSave = addressHelper.getBillingAddressToSave(creditCardForm);
        const billingAddressAsString = paypalHelper.stringifyBillingAddress(billingAddressToSave);

        creditCardHelper.saveCreditCardToCustomerWallet(paymentTokenResponse, billingAddressAsString);

        delete session.privacy.setupTokenId;
        delete session.privacy.setupTokenCustomerId;

        res.json({
            error: false,
            renderAccountsUrl: require('*/cartridge/config/urls').renderAccountsUrl
        });

        return next();
    }
);

server.get('RenderAccountsList', server.middleware.https, function(req, res, next) {
    const AccountModel = require('*/cartridge/models/account');
    const customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');
    const prefs = require('*/cartridge/config/preferences');

    const customerSavedCreditCards = AccountModel.getCustomerPaymentInstruments(
        customerHelper.getCustomerPaymentInstruments(prefs.paymentMethods.PAYPAL_CREDIT_CARD.paymentMethodId)
    );

    const renderData = {
        paypal: {
            customerSavedCreditCards: customerSavedCreditCards
        }
    };

    res.render('account/paypal/creditCardsLoop', renderData);

    return next();
});

server.get('Delete',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');

        const uuid = req.querystring.uuid;
        const piToDelete = paymentInstrumentHelper.getCustomerPiByUUID(uuid);
        const isDefaultCard = piToDelete.custom && piToDelete.custom.payPalDefaultCard;

        const response = paypalApi.deletePaymentToken(piToDelete.creditCardToken);

        if (response && response.err) {
            res.json({
                error: true,
                message: response.err
            });

            return next();
        }

        let newDefaultCreditCard;

        creditCardHelper.deleteCreditCardFromWallet(piToDelete);

        if (isDefaultCard) {
            creditCardHelper.setDefaultCard();
            newDefaultCreditCard = creditCardHelper.getDefaultCard();
        }

        res.json({
            error: false,
            newDefaultCreditCardId: newDefaultCreditCard ? newDefaultCreditCard.UUID : null,
            alertMessage: Resource.msg('creditcard.notification.removed', 'account', null)
        });

        return next();
    }
);

server.post('MakeDefault',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function(req, res, next) {
        const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');

        const uuid = req.querystring.uuid;
        const newDefaultCreditCard = paymentInstrumentHelper.getCustomerPiByUUID(uuid);

        if (!newDefaultCreditCard) {
            res.json({
                error: true,
                message: Resource.msg('creditcard.notfound', 'account', null)
            });

            return next();
        }

        const Transaction = require('dw/system/Transaction');

        const oldDefaultCreditCard = creditCardHelper.getDefaultCard();
        const oldDefaultCreditCardId = oldDefaultCreditCard ? oldDefaultCreditCard.UUID : null;

        if (newDefaultCreditCard.UUID === oldDefaultCreditCardId) {
            res.json({
                error: true,
                message: Resource.msg('creditcard.alreadydefault', 'account', null)
            });

            return next();
        }

        Transaction.wrap(function() {
            newDefaultCreditCard.custom.payPalDefaultCard = true;

            if (oldDefaultCreditCard) {
                oldDefaultCreditCard.custom.payPalDefaultCard = false;
            }
        });

        res.json({
            oldDefaultCreditCardId: oldDefaultCreditCardId,
            newDefaultCreditCardId: newDefaultCreditCard.UUID,
            message: Resource.msg('creditcard.setdefault', 'account', null)
        });

        return next();
    }
);

module.exports = server.exports();
