'use strict';

const PagingModel = require('dw/web/PagingModel');

/**
 * PP Paging Model
 */
function CustomPagingModel() { }

/**
 * @param {dw.util.ArrayList} entries array list
 * @param {Object} page request.httpParameterMap.page
 * @param {Object} pagesize request.httpParameterMap.pagesize
 * @returns {dw.web.PagingModel} paging model
 */
CustomPagingModel.prototype.createPagingModel = function(entries, page, pagesize) {
    const currentPage = page.intValue || 1;
    const pagingModel = new PagingModel(entries);

    let pageSize = !empty(pagesize.intValue) ? pagesize.intValue : 10;

    pageSize = pageSize === 0 ? entries.length : pageSize;

    pagingModel.setPageSize(pageSize);
    pagingModel.setStart(pageSize * (currentPage - 1));

    return pagingModel;
};

/**
 * Creates parameters for PagingModel
 * @param {dw.web.PagingModel} pagingModel Paging Model
 * @param {request.httpParameterMap} httpParameterMap Current httpParameterMap
 * @returns {Object} Object with Paging Model parameters
 */
CustomPagingModel.prototype.createPagingModelParameters = function(pagingModel, httpParameterMap) {
    let showingEnd = pagingModel.start + pagingModel.pageSize;
    let rangeBegin;
    let rangeEnd;

    const lr = 2;
    const showingStart = pagingModel.start + 1;
    const parameters = httpParameterMap.getParameterNames().toArray().filter(function(parametersName) {
        return parametersName !== 'page';
    }).map(function(parametersName) {
        return {
            key: parametersName,
            value: httpParameterMap[parametersName]
        };
    });

    if (showingEnd > pagingModel.count) {
        showingEnd = pagingModel.count;
    }

    if (pagingModel.maxPage <= 2 * lr) {
        rangeBegin = 1;
        rangeEnd = pagingModel.maxPage - 1;
    } else {
        rangeBegin = Math.max(Math.min(pagingModel.currentPage - lr, pagingModel.maxPage - 2 * lr), 1);
        rangeEnd = Math.min(rangeBegin + 2 * lr, pagingModel.maxPage - 1);
    }

    return {
        current: pagingModel.start,
        totalCount: pagingModel.count,
        pageSize: pagingModel.pageSize,
        currentPage: pagingModel.currentPage,
        maxPage: pagingModel.maxPage,
        showingStart: showingStart,
        showingEnd: showingEnd,
        rangeBegin: rangeBegin,
        rangeEnd: rangeEnd,
        parameters: parameters
    };
};

module.exports = CustomPagingModel;
