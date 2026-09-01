/**
 * A Custom Step that converts saved PayPal accounts, namely Billing Agreement IDs
 * to Vault tokens and store them in new payment instrument
 *
 * @module bm_paypal/cartridge/scripts/steps/migrateBillingAgreement.js
 */

'use strict';

const File = require('dw/io/File');
const Alerts = require('dw/alert/Alerts');
const FileWriter = require('dw/io/FileWriter');
const Transaction = require('dw/system/Transaction');
const CSVStreamWriter = require('dw/io/CSVStreamWriter');
const SystemObjectMgr = require('dw/object/SystemObjectMgr');

const paypalApi = require('~/cartridge/scripts/paypal/api/paypal');
const paypalConstants = require('~/cartridge/config/constants');

let numberOfNotConvertedBAIds = 0;

let fileWriter;
let fileDirectory;
let csvStreamWriter;
let customerProfiles;

/**
 * Before step function
 */
const beforeStep = function() {
    const searchPattern = '[*';

    customerProfiles = SystemObjectMgr.querySystemObjects(
        'Profile',
        'custom.PP_API_billingAgreement LIKE {0}',
        'customerNo desc',
        searchPattern
    );
};

/**
 * Total count function
 * @returns {number} Returns the total number of items that are available.
 */
const getTotalCount = function() {
    return customerProfiles.getCount();
};

/**
 * Read function
 * @returns {Object|undefined} Returns the next element from the Iterator.
 */
const read = function() {
    return customerProfiles.hasNext() ? customerProfiles.next() : undefined;
};

/**
 * Process function
 * @param {Object} profile the item returned by the read function
 * @returns {Object} number of merged items
 */
const process = function(profile) {
    const successfullyConvertedBAs = [];
    const billingAgreements = JSON.parse(profile.custom.PP_API_billingAgreement);

    const conversionData = billingAgreements.map(function(billingAgreement) {
        const convertedVaultTokenResponse = paypalApi.createPaymentToken(
            billingAgreement.baID,
            paypalConstants.BA_TOKEN_TYPE,
            profile.custom.payPalCustomerId
        );

        if (!convertedVaultTokenResponse.error) {
            successfullyConvertedBAs.push(billingAgreement.baID);

            const paymentSource = convertedVaultTokenResponse.payment_source.paypal;

            return {
                vaultId: convertedVaultTokenResponse.id,
                payPalCustomerId: convertedVaultTokenResponse.customer.id,
                billingAddress: Object.assign(
                    paymentSource.address,
                    paymentSource.name,
                    paymentSource.phone ? paymentSource.phone.phone_number : null
                ),
                email: paymentSource.email_address
            };
        }

        numberOfNotConvertedBAIds++;

        return {
            baID: billingAgreement.baID,
            errorMessage: convertedVaultTokenResponse.error
        };
    });

    const notConvertedBAs = billingAgreements
        .filter(function(ba) {
            return !successfullyConvertedBAs.includes(ba.baID);
        })
        .map(function(ba) {
            return { baID: ba.baID };
        });

    // Rewrite the custom attribute with billing agreements that were not converted if one exist
    Transaction.wrap(function() {
        profile.custom.PP_API_billingAgreement = !empty(notConvertedBAs) ? JSON.stringify(notConvertedBAs) : null;
    });

    return {
        profile: profile,
        conversionsResult: conversionData
    };
};

/**
 * Write function
 * @param {dw.util.List} lines a list of items
 * @param {Object} params - An object of parameters passed to the step.
 */
const write = function(lines, params) {
    if (numberOfNotConvertedBAIds) {
        const currentDate = new Date().toISOString();
        const fileName = [params.sourceFileName, currentDate].join('_').concat('.csv');

        fileDirectory = [File.IMPEX, 'src', params.sourceFolderPath].join(File.SEPARATOR);

        const filePath = [fileDirectory, fileName].join(File.SEPARATOR);

        const directoryFile = new File(fileDirectory);
        const csvFile = new File(filePath);

        if (!directoryFile.exists()) {
            directoryFile.mkdirs();
        }

        csvFile.createNewFile();

        fileWriter = new FileWriter(csvFile);
        csvStreamWriter = new CSVStreamWriter(fileWriter);

        csvStreamWriter.writeNext(['Customer ID', 'Billing Agreement ID', 'Error Message']);
    }

    lines.toArray().forEach(function(profileData) {
        profileData.conversionsResult.forEach(function(conversionData) {
            const customerProfile = profileData.profile;

            if (conversionData.vaultId) {
                Transaction.wrap(function() {
                    if (!customerProfile.custom.payPalCustomerId) {
                        customerProfile.custom.payPalCustomerId = conversionData.payPalCustomerId;
                    }

                    const customerPaymentInstrument = customerProfile.wallet.createPaymentInstrument(paypalConstants.PAYMENT_METHOD_ID_PAYPAL);

                    // hack for SFRA account.js line 99 (paymentInstrument.creditCardType.toLowerCase())
                    customerPaymentInstrument.setCreditCardType(paypalConstants.CREDIT_CARD_TYPE_VISA);
                    customerPaymentInstrument.custom.currentPaypalEmail = conversionData.email;
                    customerPaymentInstrument.custom.paypalBillingAddress = JSON.stringify(conversionData.billingAddress);
                    customerPaymentInstrument.creditCardToken = conversionData.vaultId;
                });
            } else {
                csvStreamWriter.writeNext([customerProfile.customer.ID, conversionData.baID, conversionData.errorMessage]);
            }
        });
    });
};

/**
 * After step function
 */
const afterStep = function() {
    if (numberOfNotConvertedBAIds) {
        csvStreamWriter.close();
        fileWriter.close();

        Transaction.wrap(function() {
            Alerts.removeAlert('pp_migrate_billing_agreement');
            Alerts.addAlert('pp_migrate_billing_agreement', 'dw.customer.Customer', [numberOfNotConvertedBAIds, fileDirectory]);
        });
    }
};

module.exports = {
    beforeStep: beforeStep,
    getTotalCount: getTotalCount,
    read: read,
    process: process,
    write: write,
    afterStep: afterStep
};
