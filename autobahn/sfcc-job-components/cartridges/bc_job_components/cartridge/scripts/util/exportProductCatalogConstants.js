'use strict';

var EXPORT_TYPE = {
    CATALOG: 'CATALOG',
    INVENTORY: 'INVENTORY'
};

var HEADER_VALUES = {
    ID: 'Product ID',
    PRODUCT_LINK: 'Product URL',
    TITLE: 'Product Title',
    DESCRIPTION: 'Product Description',
    SIZE: 'Size',
    IMAGE: 'Image',
    PRICE: 'Price',
    BRAND: 'Brand',
    AVAILABILITY_STATUS: 'Product Available',
    GENDER: 'Gender',
    PRIMARY_CATEGORY: 'Category',
    MODEL: 'Model',
    LAUNCHDATE: 'Launch Date',
    MATERIAL: 'Material',
    COLOR: 'Color',
    CLOSURE: 'Closure',
    LOCATION: 'Location',
    CONDITION: 'Condition',
    CATEGORY: 'Categories',
    SALE_PRICE: 'Sale Price',
    SEARCHABLE: 'SEARCHABLE',
    SEARCHABLE_IF_UNAVAILABLE: 'SEARCHABLE_IF_UNAVAILABLE',
    ONLINE: 'ONLINE'
};

var FILE_NAME = {
    CATALOG: 'export-catalog',
    INVENTORY: 'export-inventory'
};

var FILE_EXTENSTION = {
    XML: 'xml',
    CSV: 'csv'
};

var IMAGE_TYPES = {
    LARGE: 'large',
    MEDIUM: 'medium',
    SMALL: 'small'
};

var FILE_SEPARATOR = ',';

module.exports = {
    EXPORT_TYPE: EXPORT_TYPE,
    HEADER_VALUES: HEADER_VALUES,
    FILE_NAME: FILE_NAME,
    FILE_EXTENSTION: FILE_EXTENSTION,
    IMAGE_TYPES: IMAGE_TYPES,
    FILE_SEPARATOR: FILE_SEPARATOR
};
