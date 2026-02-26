'use strict';

function getCurrent() {
    return {
        getPreferences: function () {
            return {
                getCustom: function () {
                    return {
                        forterSiteID: 'forter_Site_ID',
                        forterSecretKey: 'forter_Secret_Key',
                        forterEnabled: true,
                        forterCancelOrderOnDecline: true,
                        forterAutoInvoiceOnApprove: true,
                        forterShowDeclinedPage: true,
                        forterCustomDeclineMessage: 'custom error message'
                    };
                }
            };
        }
    };
}

module.exports = {
    getCurrent: getCurrent
};
