'use strict';

var server = require('server');
var Resource = require('dw/web/Resource');
var recentlyViewedHelper = require('*/cartridge/scripts/helpers/RecentlyViewedHelper.js');

server.get('GetListJson', function (req, res, next) {
    var list = recentlyViewedHelper.getList(req);

    res.json({
        success: true,
        msg: Resource.msg('recentlyviewed.addtorecentlyviewed.success.msg', 'recentlyviewed', null),
        pList: list
    });

    next();
});

server.post('AddProduct', function (req, res, next) {
    try {
        var arrayLimit = 10;
        var body = JSON.parse(req.body);
        var list = recentlyViewedHelper.getList(req);
        list.push(body.pid);
        var uniqueArray = Array.from(new Set(list));
        uniqueArray = uniqueArray.filter(Boolean);
        uniqueArray.splice(0, uniqueArray.length - arrayLimit);
        recentlyViewedHelper.setList(req, uniqueArray);

        res.json({
            success: true,
            pid: body.pid,
            msg: Resource.msg('recentlyviewed.addtorecentlyviewed.success.msg', 'recentlyviewed', null)
        });
    } catch(err) {
        res.json({
            error: true,
            msg: Resource.msg('recentlyviewed.addtorecentlyviewed.error.msg', 'recentlyviewed', null)
        });
    }
    next();
});

server.get('GetProduct', function (req, res, next) {
    var ProductFactory = require('*/cartridge/scripts/factories/product');

    var requestPid = req.querystring.pid;

    var productRequest = {
        pid: requestPid
    };

    var productDetails = ProductFactory.get(productRequest);

    if (productDetails) {
        res.json({
            success: true,
            pid: requestPid,
            msg: Resource.msg('recentlyviewed.getproductdetails.success.msg', 'recentlyviewed', null),
            product: productDetails
        });
    } else {
        res.json({
            error: true,
            pid: requestPid,
            msg: Resource.msg('recentlyviewed.getproduct.error.msg', 'recentlyviewed', null)
        });
    }

    next();
});

server.get('GetAllProducts', function (req, res, next) {
    var ProductFactory = require('*/cartridge/scripts/factories/product');

    var pidList = recentlyViewedHelper.getList(req);

    var productList = [];

    try {
        pidList.forEach(function(value){
            var productRequest = {
                pid: value
            };

            productList.push(ProductFactory.get(productRequest));
        });

        res.json({
            success: true,
            pid: pidList,
            msg: Resource.msg('recentlyviewed.getproductdetails.success.msg', 'recentlyviewed', null),
            products: productList
        });
    } catch(err) {
        res.json({
            error: true,
            pidList: pidList,
            msg: Resource.msg('recentlyviewed.getproduct.error.msg', 'recentlyviewed', null)
        });
    }

    next();
});

module.exports = server.exports();
