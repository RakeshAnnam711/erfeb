'use strict';

module.exports = () => {
    const CardFieldsModel = require('../models/creditCard/cardFields');

    const cardFieldsInstance = new CardFieldsModel();

    if (cardFieldsInstance.paypalCreditCardListEl) {
        cardFieldsInstance.processCcAccountList();
        cardFieldsInstance.processBilligAddressList();
    }

    if (cardFieldsInstance.saveCreditCardAccountContainerEl) {
        cardFieldsInstance.processSaveCheckbox();
    }

    cardFieldsInstance.init();
};
