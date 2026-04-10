'use strict';

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var ProductList = require('dw/customer/ProductList');

server.post('AddList',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var wishlistModel = require('*/cartridge/models/wishlist/wishlist');
        var pid = req.form.pid;
        var newListName = req.form.name;
        var listIdOriginal = req.form.listIdOriginal;
        var wishlistAction = req.form.action;
        var view = req.form.view;
        var isDuplicateList = productListHelper.listExists(customer, {
            type: ProductList.TYPE_WISH_LIST,
            name: newListName
        });
        var renderedTemplate;
        var error = false;
        var errorMessage = Resource.msg('wishlist.createwishlist.failure.msg', 'wishlist', null);
        var viewData;

        if (!isDuplicateList) {
            productListHelper.createList(customer, {
                type: ProductList.TYPE_WISH_LIST,
                name: newListName,
                //defaults to public
                public: true
            });
        } else {
            error = true;
            errorMessage = Resource.msg('text.modal.duplicatelistnameerror', 'wishlist', null);
        }

        if (view === 'landing') {
            var landingPageSize = Number(req.form.landingPageSize);
            viewData = wishlistModel({
                landingPageSize: landingPageSize,
                wishlistSearchURL: URLUtils.url('Wishlist-Search').relative().toString()
            });
            renderedTemplate = renderTemplateHelper.getRenderedHtml(viewData, '/wishlist/wishlistLanding/components/listContainer');
        } else if (view === 'modalShowLists') {
            viewData = wishlistModel({
                pid: pid,
                listIdOriginal: listIdOriginal,
                wishlistAction: wishlistAction
            });
            renderedTemplate = renderTemplateHelper.getRenderedHtml(viewData, '/wishlist/components/modalShowLists');
        } else {
            error = true;
        }

        res.json({
            error: error,
            message: errorMessage,
            renderedTemplate: renderedTemplate
        });

        next();
    }
);

server.post('AddListNotes',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var wishlistId = req.form.wishlistId;
        var productListDescription = req.form.productListDescription || '';
        var list = productListHelper.getListByCustomer(customer, wishlistId);
        var error = false;
        var errorMessage = Resource.msg('wishlist.updatenotes.failure.msg', 'wishlist', null);

        if (list) {
            try {
                Transaction.wrap(function () {
                    list.setDescription(productListDescription);
                });
            } catch(e) {
                error = true;
            }
        } else {
            error = true;
        }

        res.json({
            error: error,
            message: errorMessage
        });

        next();
    }
);

// Used when a user clicks undo after removing from their wishlist
server.post('AddProduct',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var preferences = require('*/cartridge/config/preferences');
        var pid = req.form.pid;
        var wishlistID = req.form.wishlistId;
        var wishlistQuantities = parseInt(req.form.wishlistQuantities);
        var DEFAULT_MAX_ORDER_QUANTITY = preferences.maxOrderQty || 10;
        var selectedList;
        var options = req.form.productOptions;
        var optionsParsed = options ? JSON.parse(JSON.parse(options)) : null;
        var config = {
            qty: wishlistQuantities ? wishlistQuantities : 1,
            type: ProductList.TYPE_WISH_LIST,
            req: req,
            selectedOptionValueIds: optionsParsed
        };
        var error = false;
        var errorMessage = Resource.msg('wishlist.updatewishlist.failure.msg', 'wishlist', null);

        if (wishlistID) {
            selectedList = productListHelper.getListByCustomer(customer, wishlistID);
        } else {
            var deprecatedWishlist = productListHelper.getList(req.currentCustomer.raw, { type: 10 });
            selectedList = productListHelper.getDefaultList(deprecatedWishlist ? deprecatedWishlist : '');
        }

        // add or remove from the default list
        try {
            var itemOnList = productListHelper.getProductListItemByPID(selectedList, pid);
            if (!itemOnList) {
                productListHelper.addItem(selectedList, pid, config);
            } else {
                var newQuantity = (itemOnList.getQuantityValue() + (wishlistQuantities ? wishlistQuantities : 1));
                Transaction.wrap(function () {
                    itemOnList.setQuantityValue((newQuantity > DEFAULT_MAX_ORDER_QUANTITY) ? DEFAULT_MAX_ORDER_QUANTITY : newQuantity);
                });
            }
        } catch(e) {
            error = true;
        }

        res.json({
            error: error,
            message: errorMessage,
            manageLabel: Resource.msg('link.toast.managewishlist', 'wishlist', null),
            pid: pid,
            wishlistId: selectedList.ID,
            wishlistName: selectedList.name,
            wishlistActionType: 'add',
            wishlistUrl: URLUtils.url('Wishlist-ShowDetail', 'id', selectedList.ID).toString()
        });

        next();
    }
);

// Used when a user clicks undo after removing from one or more lists
server.post('AddProductToLists',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var pid = req.form.pid;
        var wishlistIds = req.form.wishlistId;
        var wishlistQuantities = req.form.wishlistQuantities;
        var wishlistIdsArray = [];
        var wishlistQuantitiesArray = [];
        var error = false;
        var errorMessage = Resource.msg('wishlist.updatewishlist.failure.msg', 'wishlist', null);

        if (wishlistIds) {
            wishlistIdsArray = wishlistIds.split('|');
        }

        if (wishlistQuantities) {
            wishlistQuantitiesArray = wishlistQuantities.split('|');
        }

        try {
            productListHelper.addProductToLists(customer, req, pid, wishlistIdsArray, wishlistQuantitiesArray);
        } catch(e) {
            error = true;
        }

        res.json({
            error: error,
            message: errorMessage,
            manageLabel: Resource.msg('link.toast.managewishlist', 'wishlist', null),
            pid: pid,
            wishlistIds: wishlistIdsArray,
            wishlistName: Resource.msg('wishlist.addbacktoall.success.msg', 'wishlist', null),
            wishlistUrl: URLUtils.url('Wishlist-Show').toString(),
            wishlistActionType: 'add'
        });

        next();
    }
);

server.post('DeleteList',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var wishlistModel = require('*/cartridge/models/wishlist/wishlist');
        var wishlistId = req.form.wishlistId;
        var landingPageSize = Number(req.form.landingPageSize);
        var list = productListHelper.getListByCustomer(customer, wishlistId);
        var deprecatedWishlist = productListHelper.getList(req.currentCustomer.raw, { type: 10 });
        var defaultList = productListHelper.getDefaultList(deprecatedWishlist ? deprecatedWishlist : '');
        var renderedTemplate;
        var error = false;
        var errorMessage = Resource.msg('wishlist.deletewishlist.failure.msg', 'wishlist', null);

        //you can't delete the default list
        if (defaultList.UUID !== list.UUID) {
            try {
                productListHelper.removeList(customer, list, {
                    req: req,
                    type: ProductList.TYPE_WISH_LIST
                });

                var viewData = wishlistModel({
                    landingPageSize: landingPageSize
                });
                renderedTemplate = renderTemplateHelper.getRenderedHtml(viewData, '/wishlist/wishlistLanding/components/listContainer');
            } catch(e) {
                error = true;
            }

        } else {
            error = true;
        }

        res.json({
            error: error,
            message: errorMessage,
            renderedTemplate: renderedTemplate
        });

        next();
    }
);

server.post('EditList',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var wishlistModel = require('*/cartridge/models/wishlist/wishlist');
        var wishlistId = req.form.wishlistId;
        var wishlistName = req.form.wishlistName;
        var landingPageSize = Number(req.form.landingPageSize);
        var list = productListHelper.getListByCustomer(customer, wishlistId);
        var defaultList = productListHelper.getDefaultList();
        var renderedTemplate;
        var error = false;
        var errorMessage = Resource.msg('wishlist.editwishlist.failure.msg', 'wishlist', null);

        // you can't edit the default list
        if (
            defaultList.UUID !== list.UUID
            && wishlistName
            && wishlistName !== ''
        ) {
            try {
                Transaction.wrap(function () {
                    list.setName(wishlistName);
                });

                var viewData = wishlistModel({
                    landingPageSize: landingPageSize
                });
                renderedTemplate = renderTemplateHelper.getRenderedHtml(viewData, '/wishlist/wishlistLanding/components/listContainer');
            } catch(e) {
                error = true;
            }
        } else {
            error = true;
        }

        res.json({
            error: error,
            message: errorMessage,
            renderedTemplate: renderedTemplate
        });

        next();
    }
);

server.post('EditProduct',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var quantity = Number(req.form.quantity);
        var wishlistId = req.form.wishlistId;
        var productListItemId = req.form.productListItemId;
        var productList = productListHelper.getListByCustomer(customer, wishlistId);
        var error = false;

        // only adjust the wishlist count for wishlist owners; guests only change amount to add to cart
        if (productList && productListItemId) {
            var productListItem = productList.getItem(productListItemId);

            try {
                Transaction.wrap(function () {
                    productListItem.setQuantityValue(quantity);
                });
            } catch(e) {
                error = true;
            }
        }

        res.json({
            error: error,
            message: Resource.msg('wishlist.updatewishlist.failure.msg', 'wishlist', null)
        });

        next();
    }
);

server.post('MoveProducts',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var preferences = require('*/cartridge/config/preferences');
        var wishlistModel = require('*/cartridge/models/wishlist/wishlist');
        var listItemIds = req.form.listItemIds;
        var productListIdOriginal = req.form.productListIdOriginal;
        var productListIdNew = req.form.productListIdNew;
        var keepInOriginalList = req.form.keepInOriginalList == 'true' ? true : false;
        var productListOriginal = productListHelper.getListByCustomer(customer, productListIdOriginal);
        var productListNew = productListHelper.getListByCustomer(customer, productListIdNew);
        var DEFAULT_MAX_ORDER_QUANTITY = preferences.maxOrderQty || 10;
        var renderedTemplate;
        var error = false;
        var message = Resource.msg('text.toast.both', 'wishlist', null);

        if (listItemIds && productListOriginal && productListNew) {
            try {
                listItemIds = JSON.parse(listItemIds);

                Transaction.wrap(function () {
                    listItemIds.forEach(function(itemId) {
                        var item = productListOriginal.getItem(itemId);
                        var itemOnNewList = productListHelper.getProductListItemByPID(productListNew, item.productID);

                        if (!itemOnNewList) {
                            productListHelper.addItem(productListNew, item.productID, {
                                qty: item.quantityValue,
                                type: ProductList.TYPE_WISH_LIST,
                                req: req,
                                selectedOptionValueIds: item.productOptionModel ? productListHelper.getOptions(item) : ''
                            });
                        } else {
                            var newQuantity = (item.getQuantityValue() + itemOnNewList.getQuantityValue());
                            itemOnNewList.setQuantityValue((newQuantity > DEFAULT_MAX_ORDER_QUANTITY)? DEFAULT_MAX_ORDER_QUANTITY : newQuantity);
                        }

                        if (!keepInOriginalList) {
                            productListHelper.removeItemFromNamedList(productListOriginal, customer, item.productID, {
                                type: ProductList.TYPE_WISH_LIST,
                                req: req
                            });
                        }
                    });
                });

                var viewData = wishlistModel({
                    view: 'detail',
                    listid: productListIdOriginal
                });
                renderedTemplate = renderTemplateHelper.getRenderedHtml(viewData, '/wishlist/wishlistDetails/components/detailProducts');
            } catch(e) {
                error = true;
                message = Resource.msg('wishlist.updatewishlist.failure.msg', 'wishlist', null);
            }
        } else {
            error = true;
            message = Resource.msg('wishlist.updatewishlist.failure.msg', 'wishlist', null);
        }

        res.json({
            error: error,
            message: message,
            renderedTemplate: renderedTemplate
        });

        next();
    }
);

server.post('RemoveProduct',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var wishlistModel = require('*/cartridge/models/wishlist/wishlist');
        var listId = req.form.listId;
        var listItemId = req.form.listItemId;
        var list = productListHelper.getListByCustomer(customer, listId);
        var detailPageSize = Number(req.form.detailPageSize);
        var renderedTemplate;
        var error = false;
        var errorMessage = Resource.msg('wishlist.removefromwishlist.failure.msg', 'wishlist', null);

        if (list && listItemId) {
            try {
                var item = list.getItem(listItemId);
                productListHelper.removeItemFromNamedList(list, customer, item.productID, {
                    type: ProductList.TYPE_WISH_LIST,
                    req: req
                });

                var viewData = wishlistModel({
                    view: 'detail',
                    listid: listId,
                    detailPageSize: detailPageSize
                });
                renderedTemplate = renderTemplateHelper.getRenderedHtml(viewData, '/wishlist/wishlistDetails/components/detailProducts');
            } catch(e) {
                error = true;
            }
        } else {
            error = true;
        }

        res.json({
            error: error,
            message: errorMessage,
            renderedTemplate: renderedTemplate
        });

        next();
    }
);

server.post('RemoveProductAllLists',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var pid = req.form.pid;
        var wishlistIds = productListHelper.removeProductAllLists(customer, req, pid);
        var error = false;
        var errorMessage = Resource.msg('wishlist.removefromwishlist.failure.msg', 'wishlist', null);

        if (!wishlistIds) {
            error = true;
        }

        res.json({
            error: error,
            message: errorMessage,
            manageLabel: Resource.msg('link.toast.managewishlist', 'wishlist', null),
            pid: pid,
            wishlistIds: wishlistIds.affected,
            wishlistsQuantities: wishlistIds.quantities,
            wishlistName: Resource.msg('wishlist.removefromall.success.msg', 'wishlist', null),
            wishlistUrl: URLUtils.url('Wishlist-Show').toString(),
            wishlistActionType: 'remove'
        });

        next();
    }
);

server.post('RemoveProducts',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var wishlistModel = require('*/cartridge/models/wishlist/wishlist');
        var listId = req.form.listId;
        var listItemIds = req.form.listItemIds ? JSON.parse(req.form.listItemIds) : listItemIds;
        var list = productListHelper.getListByCustomer(customer, listId);
        var detailPageSize = Number(req.form.detailPageSize);
        var renderedTemplate;
        var error = false;
        var errorMessage = Resource.msg('wishlist.removefromwishlist.failure.msg', 'wishlist', null);

        if (list && listItemIds) {
            try {
                Transaction.wrap(function () {
                    listItemIds.forEach(function(itemId) {
                        var item = list.getItem(itemId);
                        list.removeItem(item);
                    });
                });

                var viewData = wishlistModel({
                    view: 'detail',
                    listid: listId,
                    detailPageSize: detailPageSize
                });
                renderedTemplate = renderTemplateHelper.getRenderedHtml(viewData, '/wishlist/wishlistDetails/components/detailProducts');
            } catch(e) {
                error = true;
            }

        } else {
            error = true;
        }

        res.json({
            error: error,
            message: errorMessage,
            renderedTemplate: renderedTemplate
        });

        next();
    }
);

server.post('Search', function (req, res, next) {
    var wishListSearchModel = require('*/cartridge/models/wishlist/search');
    var results = wishListSearchModel(req.form.searchWishlistEmail);
    var error = !results;
    var message;

    if (error) {
        message = Resource.msg('wishlist.search.error.msg', 'wishlist', null);
    } else {
        var singularMessage = results.total + ' ' + Resource.msg('heading.search.wishlist.result.text', 'wishlist', null);
        var pluralMessage = results.total + ' ' + Resource.msg('heading.search.wishlist.results.text', 'wishlist', null);
        message = results.total === 1 ? singularMessage : pluralMessage;
    }

    res.json({
        error: error,
        results: results,
        message: message
    });

    next();
});

server.get('Show',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var wishlistModel = require('*/cartridge/models/wishlist/wishlist');
        var landingPageSize = req.httpParameterMap.get('sz').intValue || null;
        var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');
        var viewData = res.getViewData();

        // all authenticated already have default lists
        if (!customer.authenticated) {
            var deprecatedWishlist = productListHelper.getList(req.currentCustomer.raw, { type: 10 });
            var defaultList = productListHelper.getDefaultList(deprecatedWishlist ? deprecatedWishlist : '');
            // Non-logged in users can only have the default wishlist
            res.render('/wishlist/wishlistLanding/landing', wishlistModel({
                view: 'landing',
                landingPageSize: landingPageSize,
                breadcrumbs: breadcrumbHelpers.updateHomeURL(viewData),
                listid: defaultList.ID
            }));
        } else {
            res.render('/wishlist/wishlistLanding/landing', wishlistModel({
                view: 'landing',
                landingPageSize: landingPageSize,
                breadcrumbs: breadcrumbHelpers.updateHomeURL(viewData)
            }));
        }

        next();
    }
);

server.get('ShowDetail',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var wishlistModel = require('*/cartridge/models/wishlist/wishlist');
        var id = req.httpParameterMap.get('id').stringValue;
        var detailPageSize = req.httpParameterMap.get('sz').intValue || null;
        var landingPageSize = req.httpParameterMap.get('landingPageSize').intValue; // used for 'back' button

        res.render('/wishlist/wishlistDetails/detail', wishlistModel({
            view: 'detail',
            listid: id,
            detailPageSize: detailPageSize,
            landingPageSize: landingPageSize
        }));

        next();
    }
);

server.post('ShowModalShowLists',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var wishlistModel = require('*/cartridge/models/wishlist/wishlist');
        var pid = req.form.pid;
        var listIdOriginal = req.form.listIdOriginal;
        var wishlistAction = req.form.action;

        res.render('/wishlist/components/modalShowLists', wishlistModel({
            pid: pid,
            wishlistAction: wishlistAction,
            listIdOriginal: listIdOriginal
        }));

        next();
    }
);

server.get('ShowOther', server.middleware.https, function (req, res, next) {
    var id = req.querystring.id;
    var productListMgr = require('dw/customer/ProductListMgr');
    var apiList = productListMgr.getProductList(id);
    var wishlistModel = require('*/cartridge/models/wishlist/wishlist');
    var breadcrumbs = [
        {
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        }
    ];
    var loggedIn = req.currentCustomer.profile;
    if (loggedIn) {
        breadcrumbs.push({
            htmlValue: Resource.msg('link.backtolists', 'wishlist', null),
            url: URLUtils.url('Wishlist-Show').relative().toString()
        });
    }
    if (apiList) {
        if (apiList.owner.ID === req.currentCustomer.raw.ID) {
            res.redirect(URLUtils.url('Wishlist-ShowDetail', 'id', id));
            next();
        }
        if (apiList.public) {
            res.render('/wishlist/wishlistDetails/detail', wishlistModel({
                view: 'detail',
                listOwner: apiList.owner.ID,
                breadcrumbs: breadcrumbs,
                loggedIn: loggedIn,
                makePublicURL: '',
                listid: id
            }));
        }
    } else {
        res.render('/wishlist/wishlistDetails/detail', wishlistModel({
            breadcrumbs: breadcrumbs,
            loggedIn: loggedIn,
            errorMsg: Resource.msg('text.search.wishlist.not.viewable', 'wishlist', null)
        }));
    }
    next();
});

server.post('ToggleProduct',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var wishlistModel = require('*/cartridge/models/wishlist/wishlist');
        var defaultList = productListHelper.getDefaultList();
        var pid = req.form.pid;
        var quantity = Number(req.form.quantity);
        var options = req.form.options;
        var optionsParsed = options ? JSON.parse(options) : null;
        var config = {
            qty: quantity ? quantity : 1,
            type: ProductList.TYPE_WISH_LIST,
            req: req,
            selectedOptionValueIds: optionsParsed
        };
        var renderedTemplate;
        var error = false;
        var success= false;
        var message = '';
        var errorMessage = Resource.msg('wishlist.updatewishlist.failure.msg', 'wishlist', null);

        if (customer.authenticated) {
            try {
                var wishlistId = req.form.wishlistId;
                var productList = productListHelper.getListByCustomer(customer, wishlistId);

                if (productListHelper.itemExists(productList, pid, config)) {
                    let result = productListHelper.removeItemFromNamedList(productList, customer, pid, config);
                    message = Resource.msg('wishlist.removefromwishlist.success.msg', 'wishlist', null);
                    if (result.error == false) {
                        success = true;
                    }
                } else {
                    success = productListHelper.addItem(productList, pid, config);
                    message = Resource.msg('wishlist.addtowishlist.success.msg', 'wishlist', null);
                }

                var viewData = wishlistModel({ pid: pid });
                renderedTemplate = renderTemplateHelper.getRenderedHtml(viewData, '/wishlist/components/modalShowLists');
            } catch(e) {
                error = true;
            }

            if (!success) {
                message = errorMessage;
                error = true;
            }

            res.json({
                error: error,
                message: message,
                renderedTemplate: renderedTemplate
            });
        } else {
            try {
                var actionType;
                var productListQuantity;

                if (productListHelper.itemExists(defaultList, pid, {
                    type: ProductList.TYPE_WISH_LIST
                })) {
                    var productListItem = productListHelper.getProductListItemByPID(defaultList, pid);
                    productListQuantity = productListItem.getQuantityValue();
                    let result = productListHelper.removeItemFromNamedList(defaultList, customer, pid, {
                        type: ProductList.TYPE_WISH_LIST,
                        req: req
                    });
                    message = Resource.msg('wishlist.removefromwishlist.success.msg', 'wishlist', null);
                    actionType = 'remove';
                    if (result.error == false) {
                        success = true;
                    }
                } else {
                    success = productListHelper.addItem(defaultList, pid, config);
                    message = Resource.msg('wishlist.addtowishlist.success.msg', 'wishlist', null);
                    actionType = 'add';
                }
            } catch(e) {
                error = true;
            }

            if (!success) {
                message = errorMessage;
                error = true;
            }

            res.json({
                success: success,
                error: error,
                message: message,
                manageLabel: Resource.msg('link.toast.managewishlist', 'wishlist', null),
                pid: pid,
                wishlistId: defaultList.ID,
                wishlistName: defaultList.name,
                wishlistQuantities: productListQuantity,
                wishlistActionType: actionType,
                wishlistUrl: URLUtils.url('Wishlist-ShowDetail', 'id', defaultList.ID).toString()
            });
        }

        next();
    }
);

server.post('UpdateFromQuickView',
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var wishlistModel = require('*/cartridge/models/wishlist/wishlist');
        var listId = req.form.listId;
        var pid = req.form.pid;
        var pidUpdated = req.form.pidUpdated;
        var list = productListHelper.getListByCustomer(customer, listId);
        var detailPageSize = Number(req.form.detailPageSize);
        var item = list ? productListHelper.getProductListItemByPID(list, pid) : '';
        var selectedOptionValueIds = JSON.parse(req.form.selectedOptionValueIds) || '';
        var config = {
            qty: item.getQuantityValue(),
            selectedOptionValueIds: selectedOptionValueIds,
            req: req,
            type: ProductList.TYPE_WISH_LIST
        };
        var renderedTemplate;
        var error = false;
        var errorMessage = Resource.msg('wishlist.removefromwishlist.failure.msg', 'wishlist', null);

        if (list && pid) {
            try {
                Transaction.wrap(function () {
                    // Always remove the previous one and re-add the new one in case options have changed
                    var previousItem = productListHelper.getItemFromList(list, pid);
                    list.removeItem(previousItem);
                    productListHelper.addItem(list, pidUpdated, config);
                });

                var viewData = wishlistModel({
                    view: 'detail',
                    listid: listId,
                    detailPageSize: detailPageSize
                });
                renderedTemplate = renderTemplateHelper.getRenderedHtml(viewData, '/wishlist/wishlistDetails/components/detailProducts');
            } catch(e) {
                error = true;
            }
        } else {
            error = true;
        }

        res.json({
            error: error,
            message: errorMessage,
            renderedTemplate: renderedTemplate
        });

        next();
    }
);

server.get('GetProduct', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var wishlistId = req.querystring.wishlistId;
    var productListItemId = req.querystring.productListItemId;
    var list = productListHelper.getListByCustomer(customer, wishlistId);
    var item = list.getItem(productListItemId);
    var requestQuantity = item.quantityValue;

    // If the product has options
    var optionProductLineItems = productListHelper.getOptions(item);
    var selectedOptions = null;
    var selectedOptionValueId = null;

    if (optionProductLineItems && optionProductLineItems.length) {
        optionProductLineItems.forEach(optionProductLineItem => {
            selectedOptionValueId = optionProductLineItem.selectedValueId;
            selectedOptions = [{ optionId: optionProductLineItem.optionId, selectedValueId: optionProductLineItem.selectedValueId, productId: item.productID }];
        });
    }

    var params = {
        pid: item.productID,
        quantity: requestQuantity,
        options: selectedOptions
    };

    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var context = {
        product: ProductFactory.get(params),
        selectedQuantity: requestQuantity,
        selectedOptionValueId: selectedOptionValueId,
        closeButtonText: Resource.msg('link.edit.product.close', 'wishlist', null),
        enterDialogMessage: Resource.msg('msg.enter.edit.wishlist.product', 'wishlist', null),
        template: 'product/quickView.isml',
        dialogTitle: Resource.msg('title.modal.edititem', 'wishlist', null)
    };

    res.setViewData(context);

    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();

        res.json({
            renderedTemplate: renderTemplateHelper.getRenderedHtml(viewData, viewData.template)
        });
    });

    next();
});

module.exports = server.exports();
