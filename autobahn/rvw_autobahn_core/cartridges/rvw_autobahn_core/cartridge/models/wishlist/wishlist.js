'use strict';

var preferences = require('*/cartridge/config/preferences');
var DEFAULT_PAGE_SIZE = preferences.defaultPageSize ? preferences.defaultPageSize : 12;

/**
 * Decorate product with full product information
 *
 * @param {Object} [config] - any provided product id(s), product list ids
 * @returns {Object} - Decorated product model
 */
module.exports = function wishlist(config) {
    var server = require('server');
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var ProductListMgr = require('dw/customer/ProductListMgr');
    var ProductList = require('dw/customer/ProductList');
    var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
    var Resource = require('dw/web/Resource');
    var BasketMgr = require('dw/order/BasketMgr');
    var productListsArray = [];
    var pid = (config && config.pid) ? config.pid : false;
    var pids = (config && config.pids) ? JSON.parse(config.pids) : false;
    var listId = (config && config.listid) ? config.listid : false;
    var listIdLocked;
    var listIdOriginal = (config && config.listIdOriginal) ? config.listIdOriginal : false;
    var listOwner = (config && config.listOwner) ? config.listOwner : '';
    var wishlistAction = (config && config.wishlistAction) ? config.wishlistAction : false;
    var view = (config && config.view) ? config.view : '';
    var landingPageSize = (config && config.landingPageSize) ? config.landingPageSize : DEFAULT_PAGE_SIZE;
    var detailPageSize = (config && config.detailPageSize) ? config.detailPageSize : DEFAULT_PAGE_SIZE;
    var currentBasket = BasketMgr.getCurrentBasket();
    if (listId) {
        // fetch list by ID for detail page
        var productListOwned = productListHelper.getListByCustomer(customer, listId);
        if (productListOwned) {
            productListsArray = [productListOwned];
        } else {
            var productListNotOwned = ProductListMgr.getProductList(listId);
            if (productListNotOwned && productListNotOwned.isPublic()) {
                productListsArray = [productListNotOwned];
                listIdLocked = productListNotOwned.UUID;
            }
        }
    } else {
        // fetch all lists for landing page
        productListsArray = productListHelper.getLists(customer, {
            type: ProductList.TYPE_WISH_LIST
        }).toArray();

        // sort lists to show most recently modified first
        productListsArray.sort((a, b) => {
            return new Date(b.lastModified) - new Date(a.lastModified);
        });
    }

    // start building the returned view object
    var viewData = {
        CurrentPageMetaData: {
            title: Resource.msg('title.landing.pagetitle', 'wishlist', null)
        },
        urls: {
            addList: URLUtils.url('Wishlist-AddList').toString(),
            addListNotes: URLUtils.url('Wishlist-AddListNotes').toString(),
            addProduct: URLUtils.url('Wishlist-AddProduct').toString(),
            addToCart: URLUtils.url('Cart-AddProduct').toString(),
            deleteList: URLUtils.url('Wishlist-DeleteList').toString(),
            editList: URLUtils.url('Wishlist-EditList').toString(),
            editProduct: URLUtils.url('Wishlist-EditProduct').toString(),
            moveProducts: URLUtils.url('Wishlist-MoveProducts').toString(),
            quickViewUpdate: URLUtils.url('Wishlist-UpdateFromQuickView').toString(),
            removeProduct: URLUtils.url('Wishlist-RemoveProduct').toString(),
            removeProductAllLists: URLUtils.url('Wishlist-RemoveProductAllLists').toString(),
            removeProducts: URLUtils.url('Wishlist-RemoveProducts').toString(),
            searchLists: URLUtils.url('Wishlist-Search').toString(),
            showMoreLanding: URLUtils.url('Wishlist-Show', 'sz', landingPageSize + DEFAULT_PAGE_SIZE).toString(),
            showMoreDetail: URLUtils.url('Wishlist-ShowDetail', 'id', listId, 'sz', detailPageSize + DEFAULT_PAGE_SIZE).toString(),
            showModalShowLists: URLUtils.url('Wishlist-ShowModalShowLists').toString(),
            toggleProduct: URLUtils.url('Wishlist-ToggleProduct').toString(),
            updateProductQuantity: URLUtils.url('Wishlist-UpdateProductQuantity').toString()
        },
        breadcrumbs: [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            }
        ],
        pid: pid,
        wishlistAction: wishlistAction,
        lists: [],
        listNames: []
    };

    productListsArray.forEach(function(list) {
        var listData;
        var products = new Array();
        var isSelected = false;
        var pidQuantity = 1;

        var pidInList = productListHelper.getItemFromList(list, pid);
        if (pid && pidInList) {
            isSelected = true;
            pidQuantity = pidInList.getQuantityValue();
        }

        // add product list item details - reverse order to place most recently added/modified products first
        list.getProductItems().toArray().reverse().forEach(function (item) {
            if (!pids || (pids && pids.indexOf(parseInt(item.productID)) !== -1)) {
                var product = ProductFactory.get({
                    pid: item.productID
                });

                // Check to see if we have an id in product object. If not then that product is probably no longer in catalog so we skip over it.
                // Depending on client and the size of their customer's wishlists this may need to call removeItemFromNamedList() and delete product
                // from the wishlist instead.
                if (!('id' in product)) {
                    return;
                }

                if (view === 'detail') {
                    if (item.productOptionModel) {
                        var options = productListHelper.getOptions(item);
                        Object.defineProperty(product, 'productOptions', {
                            enumerable: true,
                            value: {
                                options: options,
                                selectedOptions: productListHelper.getSelectedOptions(options)
                            }
                        });
                    }
                    // normalize some item properties to be what the cart templates expect
                    Object.defineProperty(product, 'quantityOptions', {
                        enumerable: true,
                        value: {
                            minOrderQuantity: product.minOrderQuantity,
                            maxOrderQuantity: product.maxOrderQuantity
                        }
                    });
                    Object.defineProperty(product, 'quantity', {
                        enumerable: true,
                        value: item.getQuantityValue()
                    });
                    Object.defineProperty(product, 'quickViewUrl', {
                        enumerable: true,
                        value: URLUtils.url('Product-ShowQuickView', 'pid', item.productID, 'source', (product.productType === 'set' ? 'set-quickview-wishlist' : 'quickview-wishlist'))
                    });
                    Object.defineProperty(product, 'listItemID', {
                        enumerable: true,
                        value: item.ID
                    });
                    Object.defineProperty(product, 'UUID', {
                        enumerable: true,
                        value: item.UUID
                    });
                    Object.defineProperty(product, 'listQuantity', {
                        enumerable: true,
                        value: productListHelper.getListQuantity(product, item.getQuantityValue())
                    });
                    if (product.productType === 'master') {
                        //change add to cart to 'Select Attributes' and trigger quickview
                        Object.defineProperty(product, 'selectAttributes', {
                            enumerable: true,
                            value: URLUtils.url('Product-ShowQuickView', 'pid', item.productID, 'source', 'quickview-wishlist')
                        });
                    }
                    var productInCart = false;
                    if (currentBasket) {
                        var basketItems = currentBasket.getAllProductLineItems().toArray();
                        productInCart = basketItems.some(function (pli) {
                            return pli.productID === item.productID;
                        });
                    }
    
                    Object.defineProperty(product, 'inCart', {
                        enumerable: true,
                        value: productInCart
                    });
                }
                products.push(product);
            }
        });

        // add product list details
        if (!listIdOriginal || (listIdOriginal && (listIdOriginal !== list.ID)))  {
            var shareUrl = URLUtils.abs('Wishlist-ShowDetail', 'id', list.ID).toString();
            // update landing page links to enable detail page back button functionality with 'more' state persistence
            var url = view === 'landing'
                ? URLUtils.url('Wishlist-ShowDetail', 'id', list.ID, 'landingPageSize', landingPageSize).toString()
                : URLUtils.url('Wishlist-ShowDetail', 'id', list.ID).toString();

            listData = {
                ID: list.ID,
                name: list.name,
                listOwner: listOwner,
                description: list.description,
                count: list.productItems.size(),
                isLocked: list.UUID === listIdLocked ? true : false,
                isSelected: isSelected,
                pidQuantity: pidQuantity,
                isPublic: list.public,
                makePublicUrl: URLUtils.url('ProductList-TogglePublic', 'ID', list.ID, 'type', 10),
                products: products,
                url: url,
                shareUrl: shareUrl
            };

            listData.name = listData.name ? listData.name : 'Wishlist'
            viewData.lists.push(listData);
            viewData.listNames.push(listData.name.replace(/[^A-Za-z0-9]/g, '').toLowerCase());

            // if working with a specific product list
            if (listId === list.ID) {
                viewData.listSelected = listData;
                viewData.CurrentPageMetaData.title = listData.name + ' - ' + viewData.CurrentPageMetaData.title;
            }

        }
    });

    viewData.listNames = viewData.listNames.join('|');
    viewData.landingPageSize = landingPageSize;
    viewData.detailPageSize = detailPageSize;

    return viewData;
};
