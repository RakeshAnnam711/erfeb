'use strict';

/**
 * @namespace Disputes
 */

const server = require('server');

const prefs = require('~/cartridge/config/preferences');
const disputeHelper = require('~/cartridge/scripts/paypal/disputeHelper');
const constants = require('*/cartridge/config/constants');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

const hm = request.httpParameterMap;

/**
 * View PayPal Disputes
 */
server.get('Start', server.middleware.https, function(req, res, next) {
    const ArrayList = require('dw/util/ArrayList');
    const Paging = require('~/cartridge/models/ppPaging');
    const versions = require('~/cartridge/config/versions');

    const isSearchByDisputeId = hm.disputeId && hm.disputeId.submitted;
    const isSearchByDisputeReason = hm.disputeReason && hm.disputeReason.submitted;
    const isSearchByDisputeStatus = hm.disputeStatus && hm.disputeStatus.submitted || (!isSearchByDisputeReason && !isSearchByDisputeId);

    const disputes = new ArrayList(disputeHelper.getDisputes(hm));

    const paging = new Paging();
    const pagingModel = paging.createPagingModel(disputes, hm.page, hm.pagesize);
    const pagingModelParameters = paging.createPagingModelParameters(pagingModel, hm);

    const domain = versions.INSTANCE_TYPE === 'production' ? 'www.paypal.com' : 'www.sandbox.paypal.com';

    let stats = {};
    let disputeReasons = [];
    let disputeStatuses = [];

    if (!prefs.simplifiedDisputePage) {
        stats = disputeHelper.getUniqueStatuses();

        disputeReasons = disputeHelper.generateDisputeSearchOptions(constants.DISPUTE_REASONS);
        disputeStatuses = disputeHelper.generateDisputeSearchOptions(constants.DISPUTE_STATUSES);
    }

    res.render('disputes/disputes', {
        disputes: disputes,
        stats: JSON.stringify(stats),
        availabilityOfStats: Object.keys(stats).length > 0,
        resolutionCenterLink: ['https://', domain, '/resolutioncenter'].join(''),
        PagingModel: pagingModel,
        disputeReasons: disputeReasons,
        disputeStatuses: disputeStatuses,
        isSearchByDisputeId: isSearchByDisputeId,
        pagingModelParameters: pagingModelParameters,
        isSearchByDisputeReason: isSearchByDisputeReason,
        isSearchByDisputeStatus: isSearchByDisputeStatus,
        simplifiedDisputePage: prefs.simplifiedDisputePage
    });

    next();
});

/**
 * View PayPal Dispute Details
 */
server.get('Details',
    server.middleware.https,
    csrfProtection.validateRequest,
    function(req, res, next) {
        try {
            const disputeId = hm.get('dispute_id').stringValue;
            const dispute = disputeHelper.getDispute(disputeId);

            let stats = {};
            let diffsForUpdate = {};

            if (!prefs.simplifiedDisputePage) {
                diffsForUpdate = disputeHelper.getDiffsForUpdate(disputeId);

                if (Object.keys(diffsForUpdate).length) {
                    disputeHelper.updateDisputeCO(dispute);
                }

                if ('status' in diffsForUpdate) {
                    stats = disputeHelper.getUniqueStatuses();
                }
            }

            res.render('disputes/dispute', {
                dispute: dispute,
                stats: JSON.stringify(stats),
                diffsForUpdate: JSON.stringify(diffsForUpdate),
                hasFullHistory: disputeHelper.hasFullHistory(dispute)
            });
        } catch (error) {
            const responseHelper = require('*/cartridge/scripts/helpers/responseHelper');

            responseHelper.handleControllerError(error, res, 400);
        }

        next();
    }
);

module.exports = server.exports();
