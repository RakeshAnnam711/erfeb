
/**
 * Mock of dw.customer.Profile
 */
function Profile() {
    this.custom = {
        TaxJarCustomerExemptionRegions: [
            { getValue: function () { return 'UT'; } },
            { getValue: function () { return 'CO'; } }
        ],
        TaxJarCustomerExemptionType: {
            getValue: function () { return 'wholesale'; }
        }
    };
}

module.exports = Profile;
