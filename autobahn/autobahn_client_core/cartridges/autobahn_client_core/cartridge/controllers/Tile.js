'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var context = res.viewData || {};

    if (req.querystring.section) {
        context.section = req.querystring.section;
    }

    if (context.product && context.product.gtmData) {
        var gtmData = context.product.gtmData;


        gtmData.item_brand = gtmData.brand || '';
    if (context.section) {
        gtmData.item_list_id = ('Homepage-' + context.section).toLowerCase().replace(/\s+/g, '_');
        gtmData.item_list_name = 'Homepage-' + context.section;
    } else {
        gtmData.item_list_id = '';
        gtmData.item_list_name = '';
    }
        gtmData.discount = Number(gtmData.discount_price) || 0;
        gtmData.quantity = 1;
        gtmData.item_category ='';
        gtmData.item_category2 ='';
        gtmData.price = Number(gtmData.price) || 0;
        delete gtmData.brand;
        delete gtmData.discount_price;
        delete gtmData.discount_percent;
    }

    res.setViewData(context);
    next();
});

module.exports = server.exports();
