'use strict';

var EXPORT_TYPE = {
    CATALOG: 'CATALOG'
};

var HEADER_VALUES = {
    ID: 'id',
    TITLE: 'title',
    DESCRIPTION: 'description',
    UPC: 'gtin',
    IMAGE: 'image_link',
    PRODUCT_LINK: 'link',
    CATEGORY: 'product_type',
    //PRIMARY_CATEGORY: 'google_product_category',
    MASTER_PRODUCT_ID: 'item_group_id',
    BRAND: 'brand',
    PRICE: 'price',
    SALEPRICE: 'sale_price',
    BUNDLE: 'is_bundle',
    IN_STOCK: 'in_stock',
    SIZE: 'size',
    COLOR: 'color',
    MATERIAL: 'material',
    LENGTH: 'product_length',
    WIDTH: 'product_width',
    HEIGHT: 'product_height',
    WEIGHT: 'product_weight',
    AVAILABILITY_STATUS: 'availability',
    INSTOCK_DATE: 'availability_date',
    ADDTIONAL_IMAGE_LINKS: 'additional_image_link'
};

var FILE_NAME = {
    CATALOG: 'GMerchantFeed'
};

var FILE_EXTENSTION = {
    XML: 'xml',
    CSV: 'csv'
};

var CURRENCYCODE = 'USD';

var UNITS = {
    INCHES: 'in',
    CENTIMETERS: 'cm',
    LB: 'lb'
};

var IMAGE_TYPES = {
    LARGE: 'large',
    MEDIUM: 'medium',
    SMALL: 'small'
};

var ATTRIBUTES = {
    SIZE: 'size',
    COLOR: 'color',
    MATERIAL: 'material'
}

var DIMENSIONS = {
    LENGTH: 'length',
    WIDTH: 'width',
    HEIGHT: 'height',
    WEIGHT: 'weight'
};

var FILE_SEPARATOR = ',';

module.exports = {
    EXPORT_TYPE: EXPORT_TYPE,
    HEADER_VALUES: HEADER_VALUES,
    FILE_NAME: FILE_NAME,
    FILE_EXTENSTION: FILE_EXTENSTION,
    CURRENCYCODE: CURRENCYCODE,
    UNITS: UNITS,
    IMAGE_TYPES: IMAGE_TYPES,
    ATTRIBUTES: ATTRIBUTES,
    DIMENSIONS: DIMENSIONS,
    FILE_SEPARATOR: FILE_SEPARATOR
};
