'use strict';

/**
 * Retrieve the list of the customer
 * @param {Object} addressObj - object representing a address
 * @param {dw.customer.ProductList} list - target productList
 * @param {Object} preEvent - object representing a address shipping address
 * @param {dw.customer.Customer} customer - current customer
 * */
function addShippingAddress(addressObj, list, preEvent, customer) {
    var addressBook = customer.getAddressBook();
    var address;
    if (addressObj.newAddress) {
        address = addressBook.createAddress(addressObj.addressId);
        address.setFirstName(addressObj.firstName);
        address.setLastName(addressObj.lastName);
        address.setAddress1(addressObj.address1);
        if (addressObj.address2) {
            address.setAddress2(addressObj.address2);
        }
        address.setCity(addressObj.city);
        address.setStateCode(addressObj.stateCode);
        address.setPostalCode(addressObj.postalCode);
        address.setPhone(addressObj.phone);
        address.setCountryCode(addressObj.country);
    } else {
        address = addressBook.getAddress(addressObj.addressId);
    }

    if (preEvent) {
        list.setShippingAddress(address);
    } else {
        list.setPostEventShippingAddress(address);
    }
}

/**
 * Retrieve the list of the customer
 * @param {Object} eventInfo - object representing information about the event
 * @param {dw.customer.ProductList} list - target productList
 * */
function addEventInfo(eventInfo, list) {
    list.setName(eventInfo.eventName);
    list.setEventCountry(eventInfo.eventCountry);
    list.setEventState(eventInfo.eventState);
    list.setEventCity(eventInfo.eventCity);
    var dateSplit = eventInfo.eventDate.split('/');
    var eventDate = new Date(
            parseInt(dateSplit[2], 10),
            (parseInt(dateSplit[0], 10) - 1),
            parseInt(dateSplit[1], 10)
        );

    list.setEventDate(new Date(eventDate));
}

/**
 * Retrieve the list of the customer
 * @param {Object} registrant - object with information about the registrant
 * @param {dw.customer.ProductList} list - target productList
 * @param {Object} coRegistrant - object with information about the co-registrant
 * */
function addRegistrantInfo(registrant, list, coRegistrant) {
    var newRegistrant;
    if (coRegistrant) {
        newRegistrant = list.createCoRegistrant();
    } else {
        newRegistrant = list.createRegistrant();
    }
    newRegistrant.setEmail(registrant.email);
    newRegistrant.setFirstName(registrant.firstName);
    newRegistrant.setLastName(registrant.lastName);
    newRegistrant.setRole(registrant.role);
}

/**
 * @typedef config
 * @type Object
 * @property {number} type - a number for what type of product list is being created
 */
/**
 * Creates a list, based on the type sent in
 * @param {dw.customer.Customer} customer - current customer
 * @param {Object} config - configuration object
 * @return {dw.customer.ProductList} list - target productList
 */
function createList(customer, config) {
    var Transaction = require('dw/system/Transaction');
    var ProductListMgr = require('dw/customer/ProductListMgr');
    var list;

    if (config.type === 10) {
        Transaction.wrap(function () {
            list = ProductListMgr.createProductList(customer, config.type);

            if (config.name) {
                list.setName(config.name);
            }

            if (typeof config.public !== 'undefined') {
                list.setPublic(config.public);
            }
        });
    }

    if (config.type === 11) {
        Transaction.wrap(function () {
            list = ProductListMgr.createProductList(customer, config.type);

            addEventInfo(config.formData.eventInfo, list);
            addRegistrantInfo(config.formData.registrant, list, false);

            if (config.formData.coRegistrant) {
                addRegistrantInfo(config.formData.coRegistrant, list, true);
            }

            addShippingAddress(config.formData.preEventAddress, list, true, customer);

            if (config.formData.postEventAddress) {
                addShippingAddress(config.formData.postEventAddress, list, false, customer);
            }
        });
    }
    return list;
}

/**
 * @typedef config
 * @type Object
 * @property {number} type - a number for what type of product list is being created
 */
/**
 * Retrieve the list of the customer
 * @param {dw.customer.Customer} customer - current customer
 * @param {Object} config - configuration object
 * @return {dw.customer.ProductList} list - target productList
 */
function getList(customer, config) {
    var productListMgr = require('dw/customer/ProductListMgr');
    var type = config.type;
    var list;
    if (config.type === 10) {
        var listCount = productListMgr.getProductLists(customer, type).length;

        list = listCount > 0
            ? productListMgr.getProductLists(customer, type)[0]
            : createList(customer, { type: type });
    } else if (config.type === 11) {
        list = productListMgr.getProductList(config.id);
    } else {
        list = null;
    }
    return list;
}

function getOptions(listItem) {
    var options = listItem.productOptionModel ? [] : false;
    if (options) {
        listItem.productOptionModel.options.toArray().forEach(function (option) {
            var selectedOption = listItem.productOptionModel.getSelectedOptionValue(option);
            var result = {
                displayName: option.displayName,
                displayValue: selectedOption.displayValue,
                optionId: option.ID,
                selectedValueId: selectedOption.ID
            };
            options.push(result);
        });
    }
    return options;
}

function getSelectedOptions(options) {
    if (options) {
        return options.map(function (option) {
            return { optionId: option.optionId, selectedValueId: option.selectedValueId };
        });
    }
    return null;
}

/**
 * @typedef config
 * @type Object
 */
/**
 * Deletes the list
 * @param {dw.customer.Customer} customer - current customer
 * @param {dw.customer.ProductList} list - target productList
 * @param {Object} config - configuration object
 */
function removeList(customer, list, config) {
    // will need a check on the current customer before deleting the list
    var Transaction = require('dw/system/Transaction');
    if (customer || config.mergeList) {
        var ProductListMgr = require('dw/customer/ProductListMgr');
        Transaction.wrap(function () {
            ProductListMgr.removeProductList(list);
        });
    }
}

/**
 * @typedef config
 * @type Object
 */
/**
 * loop through the products and match the id
 * @param {dw.customer.ProductList} list - target productList
 * @param {string} pid - The product's id
 * @param {Object} config - configuration object
 * @return {boolean} - boolean based on if the pid exists with the productList
 */
function itemExists(list, pid, config) {
    var collections = require('*/cartridge/scripts/util/collections');
    return collections.find(list.items, function (item) {
        return item.productID === pid;
    });
}

/**
 * @typedef config
 * @type Object
 */
/**
 * Add an Item to the current customers wishlist
 * @param {dw.customer.ProductList} list - target productList
 * @param {string} pid - The product's variation model
 * @param {Object} config - configuration object
 * @return {boolean} - boolean based on if the product was added to the wishlist
 */
function addItem(list, pid, config) {
    var Transaction = require('dw/system/Transaction');

    if (!list) { return false; }

    var itemExist = itemExists(list, pid, config);

    if (!itemExist) {
        var ProductMgr = require('dw/catalog/ProductMgr');

        var apiProduct = ProductMgr.getProduct(pid);

        if (apiProduct === null || apiProduct === 'undefined') { return false; }

        if (apiProduct && apiProduct.variationGroup) { return false; }

        if (apiProduct && list && config.qty) {
            try {
                Transaction.wrap(function () {
                    var productlistItem = list.createProductItem(apiProduct);

                    if (productlistItem.product.optionProduct) {
                        var optionModel = productlistItem.product.getOptionModel();

                        var productOptions = optionModel.options.iterator();
                        while (productOptions.hasNext()) {
                            var productOption = productOptions.next();
                            for (var i in config.selectedOptionValueIds) {
                                if (productOption.ID === config.selectedOptionValueIds[i].optionId) {
                                    var productOptionValue = optionModel.getOptionValue(productOption, config.selectedOptionValueIds[i].selectedValueId);
                                    optionModel.setSelectedOptionValue(productOption, productOptionValue);
                                    break;
                                }
                            }
                        }
                        productlistItem.setProductOptionModel(optionModel);
                    }

                    if (apiProduct.master) {
                        productlistItem.setPublic(false);
                    }

                    productlistItem.setQuantityValue(config.qty);
                });
            } catch (e) {
                return false;
            }
        }
        return true;
    } else if (itemExist && config.type === 11) {
        Transaction.wrap(function () {
            itemExist.setQuantityValue(itemExist.quantityValue + config.qty);
        });

        return true;
    }

    return false;
}

function addProductToLists(customer, req, pid, lists, quantities) {
    var Transaction = require('dw/system/Transaction');
    var ProductList = require('dw/customer/ProductList');
    var productListMgr = require('dw/customer/ProductListMgr');
    var productLists = productListMgr.getProductLists(customer, ProductList.TYPE_WISH_LIST);

    Transaction.wrap(function () {
        productLists.toArray().forEach(function(list) {
            var indexOfFound = lists.indexOf(list.UUID);

            if (indexOfFound !== -1) {
                addItem(list, pid, {
                    qty: quantities[indexOfFound] ? parseInt(quantities[indexOfFound], 10) : 1,
                    type: ProductList.TYPE_WISH_LIST,
                    req: req
                });
            }
        });
    });
}

/**
 * @typedef configObj
 * @type Object
 */
/**
 * move all of the products from listFrom to listTO, skipping items that already exists in listTo
 * @param {dw.customer.ProductList} listTo - the logged in users wishlist
 * @param {dw.customer.ProductList} listFrom - the wishlist from the guest customer
 * @param {Object} req - local request object
 * @param {Object} configObj - configuration object
 * @return {Array} - pids that where added to the list
 */
function mergelists(listTo, listFrom, req, configObj) {
    var config;
    var pid;
    var addedItems = [];
    if (listTo && listFrom) {
        listFrom.items.toArray().forEach(function (item) {
            config = {
                qty: item.quantityValue,
                req: req,
                type: configObj.type
            };

            pid = item.productID;
            if (!itemExists(listTo, pid, config)) {
                addItem(listTo, pid, config);
                addedItems.push(pid);
            }
        });
        removeList(null, listFrom, { mergeList: true });
    }
    return addedItems;
}

/**
 * @typedef config
 * @type Object
 */
/**
 * remove an Item from the current customers productList
 * @param {dw.customer.Customer} customer - current customer
 * @param {string} pid - The product's variation model
 * @param {Object} config - configuration object
 * @return {Object} result - result object with {dw.customer.ProductList} as one of the properties or result{} with error msg
 */
function removeItem(customer, pid, config) {
    var Resource = require('dw/web/Resource');
    var list = getList(customer, config);
    var item = itemExists(list, pid, config);
    var result = {};
    if (item) {
        var Transaction = require('dw/system/Transaction');
        try {
            Transaction.wrap(function () {
                list.removeItem(item);
            });
        } catch (e) {
            result.error = true;
            result.msg = Resource.msg('remove.item.failure.msg', 'productlist', null);
            result.prodList = null;
            return result;
        }
        result.error = false;
        result.prodList = list;
    }
    return result;
}

/**
 * return the item from the given wishlist that matches the specified productID
 * @param {dw.customer.ProductList} list - target productList
 * @param {string} pid - The product's id
 * @return {dw.customer.ProductListItem} list - target productListItem
 */
function getItemFromList(list, pid) {
    var collections = require('*/cartridge/scripts/util/collections');
    var listItem = collections.find(list.items, function (item) {
        return item.productID === pid;
    });
    return listItem;
}

/**
 * This function toggles the public/private flag on a list or item, the customer must be the owner of the list to change the status flag.
 * @param {dw.customer} customer - the logged in users wishlist
 * @param {string} itemID - id of the item to be toggled
 * @param {string} listID - id of the list to be toggled
 * @return {Object} - result of the attempt to toggle the public status of the item / list
 */
function toggleStatus(customer, itemID, listID) {
    var result = {};
    var Transaction = require('dw/system/Transaction');
    var ProductListMgr = require('dw/customer/ProductListMgr');
    var Resource = require('dw/web/Resource');
    var apiList;
    if (!customer || !listID) {
        result.error = true;
        result.msg = Resource.msg('list.togglepublic.error.msg', 'productlist', null);
        return result;
    }

    apiList = ProductListMgr.getProductList(listID);
    if (apiList && apiList.owner.ID !== customer.ID) {
        result.error = true;
        result.msg = Resource.msg('list.togglepublic.error.msg', 'productlist', null);
        return result;
    }

    if (!itemID && apiList) {
        try {
            Transaction.wrap(function () {
                apiList.setPublic(!apiList.isPublic());
            });
        } catch (e) {
            result.error = true;
            result.msg = Resource.msg('list.togglepublic.error.msg', 'productlist', null);
            return result;
        }
        result.success = true;
        result.msg = Resource.msg('list.togglepublic.success.msg', 'productlist', null);
    }

    if (itemID && apiList) {
        var item = apiList.getItem(itemID);

        if (item && item.product.master) {
            result.error = true;
            result.msg = Resource.msg('list.togglepublic.master.error.msg', 'productlist', null);
            return result;
        }

        try {
            Transaction.wrap(function () {
                item.setPublic(!item.isPublic());
            });
        } catch (e) {
            result.error = true;
            result.msg = Resource.msg('list.togglepublic.error.msg', 'productlist', null);
            return result;
        }
        result.success = true;
        result.msg = Resource.msg('listitem.togglepublic.success.msg', 'productlist', null);
    }
    return result;
}

function getListByCustomer(customer, listId) {
    var ProductListMgr = require('dw/customer/ProductListMgr');
    var ProductList = require('dw/customer/ProductList');
    var lists = ProductListMgr.getProductLists(customer, ProductList.TYPE_WISH_LIST).toArray();
    var selectedList;

    lists.forEach(function(list) {
        if (list.UUID === listId) {
            selectedList = list;
        }
    })

    return selectedList;
};

/**
 * create quantity array for building product quantity select menu ui
 *
 * @param {Object} [product] - decorated product model
 * @returns {Array} - array for quantity select menu ui
 */
function getListQuantity(product, quantity) {
    var listQuantity = [];
    var i = product.minOrderQuantity;
    while (i !== (product.maxOrderQuantity + 1)) {
        listQuantity.push({
            label: i.toFixed(),
            value: i.toFixed(),
            selected: quantity === i ? true : false
        });
        i = i + 1;
    }
    return listQuantity;
}

/**
 * @typedef config
 * @type Object
 * @property {number} type - a number for what type of product list is being retrieved
 */
/**
 * Retrieve the list of the customer
 * @param {dw.customer.Customer} customer - current customer
 * @param {Object} config - configuration object
 * @return {dw.customer.ProductList} list - target productList
 */
 function getLists(oldCustomer, config) {
    var result;
    if (oldCustomer) {
        var productListMgr = require('dw/customer/ProductListMgr');
        var type = config.type;
        result = productListMgr.getProductLists(customer, type);
    }
    return result;
}

function getProductListItemByPID(list, pid) {
    var collections = require('*/cartridge/scripts/util/collections');
    return collections.find(list.items, function (item) {
        if (item.productID === pid) {
            return item;
        }
    });
}

/**
 * Retrieve default list of the customer
 * */
 var getDefaultList = function(deprecatedWishlist) {
    var Resource = require('dw/web/Resource');
    var ProductList = require('dw/customer/ProductList');
    //check for default list and create if not already existing
    var defaultList;
    defaultList = listExists(customer, {
        type: ProductList.TYPE_WISH_LIST,
        name: Resource.msg('title.list.default', 'wishlist', null)
    });
    if (!defaultList) {
        //check if wishlist exists
        if (!empty(deprecatedWishlist)) {
            defaultList = deprecatedWishlist;
            if (defaultList.public) {
                // setting the old wishlist to private to not show in searches by default
                var Transaction = require('dw/system/Transaction');
                Transaction.wrap(function () {
                    defaultList.public = false;
                });
            }
        } else {
            defaultList = createDefaultList();
        }
    }
    return defaultList;
};

/**
 * Create default list of the customer
 * */
 var createDefaultList = function() {
    var Resource = require('dw/web/Resource');
    var ProductList = require('dw/customer/ProductList');
    var defaultList = createList(customer, {
        type: ProductList.TYPE_WISH_LIST,
        name: Resource.msg('title.list.default', 'wishlist', null),
        //defaults to public
        public: true
    });
    return defaultList;
};

/**
 * @typedef config
 * @type Object
 * @property {number} type - a number for what type of product list is being created
 */
/**
 * Retrieve the list of the customer
 * @param {dw.customer.Customer} customer - current customer
 * @param {Object} config - configuration object
 * @return {Boolean} result - if found in lists
 */
 function listExists(customer, config) {
    var productListMgr = require('dw/customer/ProductListMgr');
    var ProductList = require('dw/customer/ProductList');
    var type = config.type;
    var lists;
    var existingList;
    existingList = false;
    if (config.type === ProductList.TYPE_WISH_LIST) {
        lists = productListMgr.getProductLists(customer, type);

        if (lists.length > 0) {
            lists.toArray().forEach(function (item) {
                if (!existingList && item.name === config.name) {
                    existingList = item;
                }
            });
        }
    }
    return existingList;
}

/**
 * @typedef config
 * @type Object
 */
/**
 * remove an Item from the current customers productList
 * @param {dw.customer.Customer} customer - current customer
 * @param {string} pid - The product's variation model
 * @param {Object} config - configuration object
 * @return {Object} result - result object with {dw.customer.ProductList} as one of the properties or result{} with error msg
 */
 function removeItemFromNamedList(list, customer, pid, config) {
    var Resource = require('dw/web/Resource');
    var item = itemExists(list, pid, config);
    var result = {};

    if (item) {
        var Transaction = require('dw/system/Transaction');

        try {
            Transaction.wrap(function () {
                list.removeItem(item);
            });
        } catch (e) {
            result.error = true;
            result.msg = Resource.msg('remove.item.failure.msg', 'productlist', null);
            result.prodList = null;
            return result;
        }

        result.error = false;
        result.prodList = list;
    }
    return result;
}


function removeProductAllLists(customer, req, pid) {
    var Transaction = require('dw/system/Transaction');
    var ProductList = require('dw/customer/ProductList');
    var productListMgr = require('dw/customer/ProductListMgr');
    var productLists = productListMgr.getProductLists(customer, ProductList.TYPE_WISH_LIST);
    var productListsAffected = [];
    var productListsAffectedQuantities = [];

    Transaction.wrap(function () {
        productLists.toArray().forEach(function(list) {
            var productListItems = list.getItems();

            productListItems.toArray().forEach(function(item) {
                if (item.productID === pid) {
                    var quantity = item.getQuantityValue();
                    list.removeItem(item);
                    productListsAffected.push(list.UUID);
                    productListsAffectedQuantities.push(quantity);
                }
            });
        });
    });
    return {
        affected: productListsAffected,
        quantities: productListsAffectedQuantities
    };
}

var setAddress = function(params) {
    var Transaction = require('dw/system/Transaction');
    var addressBook = customer.getProfile().getAddressBook();
    var quoteAddress;
    var isChecked = (params.isChecked && params.isChecked === 'on')? true : false;
    var updateAddressBook = function(address, params) {
        if (
            params.firstName
            && params.lastName
            && params.address1
            && params.stateCode
            && params.countryCode
            && params.city
            && params.postalCode
            && params.phone
        ) {
            if (params.ID) {
                address.setID(params.ID);
            }
            address.setFirstName(params.firstName);
            address.setLastName(params.lastName);
            address.setAddress1(params.address1);
            address.setAddress2(params.address2 || '');
            address.setStateCode(params.stateCode);
            address.setCountryCode(params.countryCode);
            address.setCity(params.city);
            address.setPostalCode(params.postalCode);
            address.setPhone(params.phone);
        }
        return address;
    };

    if (isChecked && params.addressChange === 'new') {
        Transaction.wrap(function () {
            quoteAddress = updateAddressBook(addressBook.createAddress(params.ID), {
                firstName: params.firstName,
                lastName: params.lastName,
                address1: params.address1,
                address2: params.address2,
                stateCode: params.stateCode,
                countryCode: params.countryCode,
                city: params.city,
                postalCode: params.postalCode,
                phone: params.phone
            });
        });
    } else if (isChecked && params.addressChange === 'update') {
        addressBook.addresses.toArray().forEach(function(address) {
            if (params.address === address.UUID) {
                Transaction.wrap(function () {
                    quoteAddress = updateAddressBook(address, {
                        ID: params.ID,
                        firstName: params.firstName,
                        lastName: params.lastName,
                        address1: params.address1,
                        address2: params.address2,
                        stateCode: params.stateCode,
                        countryCode: params.countryCode,
                        city: params.city,
                        postalCode: params.postalCode,
                        phone: params.phone
                    });
                });
            }
        });
    } else if (isChecked) {
        addressBook.addresses.toArray().forEach(function(address) {
            if (params.address === address.UUID) {
                quoteAddress = address;
            }
        });
    } else {
        quoteAddress = addressBook.getPreferredAddress();
    }
    return quoteAddress;
};

/**
 * Update URL from guest wishlist ID to authenticated customer's wishlist ID
 * @param {string} redirectString - original redirect URL
 * @return {string} updated redirect URL
 */
function updateWishlistDetailRedirectUrl(redirectString) {
    var URLUtils = require('dw/web/URLUtils');
    var wishlistDetailUrl = URLUtils.url('Wishlist-ShowDetail');

    if (redirectString.includes(wishlistDetailUrl)) {

        // get guest wishlist ID
        var queryString = redirectString.split('?')[1];
        var queryStringArray = queryString.split('&');
        var idParamIndex = queryStringArray.findIndex(param => param.includes("id="));
        var guestWishlistId = queryStringArray[idParamIndex].split('id=')[1];

        // get authenticated customer's wishlist ID
        var customerDefaultWishlist = module.exports.getDefaultList();
        var customerWishlistId = customerDefaultWishlist.ID;
        // check if user is logging in while viewing their own list (e.g. session timeout)
        var customerMatchingWishlist = module.exports.getListByCustomer(customer, guestWishlistId);

        // update redirect URL to authenticated customer's default wishlist unless guest user is viewing their own list
        if (!empty(guestWishlistId) && !empty(customerWishlistId) && !customerMatchingWishlist) {
            redirectString = redirectString.replace(guestWishlistId, customerWishlistId);
        }
    }

    return redirectString;
}

module.exports = {
    getList: getList,
    getOptions: getOptions,
    getSelectedOptions: getSelectedOptions,
    addItem: addItem,
    removeItem: removeItem,
    createList: createList,
    removeList: removeList,
    itemExists: itemExists,
    mergelists: mergelists,
    getItemFromList: getItemFromList,
    toggleStatus: toggleStatus,
    addProductToLists: addProductToLists,
    createDefaultList: createDefaultList,
    getDefaultList: getDefaultList,
    getListByCustomer: getListByCustomer,
    getListQuantity: getListQuantity,
    getLists: getLists,
    getProductListItemByPID: getProductListItemByPID,
    listExists: listExists,
    removeItemFromNamedList: removeItemFromNamedList,
    removeProductAllLists: removeProductAllLists,
    setAddress: setAddress,
    updateWishlistDetailRedirectUrl: updateWishlistDetailRedirectUrl
};
