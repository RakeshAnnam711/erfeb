'use strict';

/**
 * Return Billing Agreement email from PayPal Billing Form
 *
 * @param {Object} ppBillingForm paypal billing form
 * @returns {string} email from form
 */
function getBAEmailFromForm(ppBillingForm) {
    if (ppBillingForm.paypalActiveAccount && !empty(ppBillingForm.paypalActiveAccount.htmlValue)) {
        return ppBillingForm.paypalActiveAccount.htmlValue;
    }
    if (ppBillingForm.billingAgreementPayerEmail) {
        return ppBillingForm.billingAgreementPayerEmail.htmlValue;
    }
    return false;
}

/**
* Get PayPal Billing Agreement
*
* @param {Object} billingForm - current customer billing Form
* @returns {Object} billingAgreement - selected Billing Agreement
*/
function createBaFromForm(billingForm) {
    return {
        baID: billingForm.paypal.billingAgreementID.htmlValue,
        default: billingForm.paypal.makeDefaultPaypalAccount.checked,
        email: getBAEmailFromForm(billingForm.paypal),
        saveToProfile: billingForm.paypal.savePaypalAccount.checked
    };
}

/**
 * Compare form billing agreement email with saved billing agreement email under paypal Payment Instrument
 *
 * @param {string} activeBA - current saved paypal Payment Instrument ba
 * @param {Object} formBA - current customer  ba billingForm
 * @returns {boolean} true or false
 */
function isSameBillingAgreement(activeBA, formBA) {
    return activeBA.email === formBA.email &&
        activeBA.default === formBA.default &&
        activeBA.saveToProfile === formBA.saveToProfile;
}

/**
 *  Saves BA properties to session: ID, isDefault, email and saveToProfile
 * @param  {Object} activeBA - active billing agreement
 */
function saveBAtoSession(activeBA) {
    session.privacy.baID = activeBA.baID;
    session.privacy.isBADefault = activeBA.default;
    session.privacy.baEmail = activeBA.email;
    session.privacy.saveToProfile = activeBA.saveToProfile;
}

/**
 * Get BA info stored in session
 * @returns {Object} Billing agreement from session
 */
function getBAFromSession() {
    return {
        baID: session.privacy.baID,
        default: session.privacy.isBADefault,
        email: session.privacy.baEmail,
        saveToProfile: session.privacy.saveToProfile
    };
}

/**
 *  Remove baID baDefault value and ba email from session
 */
function removeBAfromSession() {
    delete session.privacy.baID;
    delete session.privacy.isBADefault;
    delete session.privacy.baEmail;
    delete session.privacy.saveToProfile;
}

/**
 * Check if each saved billing agreement is active and remove inactive BAs
 * @param {Object} savedBA - current saved billing agreements
 * @param {Object} billingAgreementModel - billing agreement model
 */
function filterBillingAgreements(savedBA, billingAgreementModel) {
    savedBA.forEach(function (ba) {
        var isBillingAgreementActive = billingAgreementModel.checkBillingAgreementStatus(ba.baID);
        if (!isBillingAgreementActive) {
            billingAgreementModel.removeBillingAgreement(ba);
        }
    });
}

module.exports = {
    createBaFromForm: createBaFromForm,
    getBAEmailFromForm: getBAEmailFromForm,
    isSameBillingAgreement: isSameBillingAgreement,
    getBAFromSession: getBAFromSession,
    removeBAfromSession: removeBAfromSession,
    saveBAtoSession: saveBAtoSession,
    filterBillingAgreements: filterBillingAgreements
};
