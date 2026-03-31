'use strict';

function CustomerAddress() {
    this.address1 = '';
    this.address2 = '';
    this.city = '';
    this.companyName = '';
    this.countryCode = '';
    this.firstName = '';
    this.fullName = '';
    this.ID = '';
    this.jobTitle = '';
    this.lastName = '';
    this.phone = '';
    this.postalCode = '';
    this.postBox = '';
    this.salutation = '';
    this.secondName = '';
    this.stateCode = '';
    this.suffix = '';
    this.suite = '';

    this.getAddress1 = function () {
        return this.address1;
    };
    this.setAddress1 = function (val) {
        this.address1 = val;
    };

    this.getAddress2 = function () {
        return this.address2;
    };
    this.setAddress2 = function (val) {
        this.address2 = val;
    };

    this.getCity = function () {
        return this.city;
    };
    this.setCity = function (val) {
        this.city = val;
    };

    this.getCompanyName = function () {
        return this.companyName;
    };
    this.setCompanyName = function (val) {
        this.companyName = val;
    };

    this.getCountryCode = function () {
        return this.countryCode;
    };
    this.setCountryCode = function (val) {
        this.countryCode = val;
    };

    this.getFirstName = function () {
        return this.firstName;
    };
    this.setFirstName = function (val) {
        this.firstName = val;
    };

    this.getFullName = function () {
        return this.fullName;
    };
    this.setFullName = function (val) {
        this.fullName = val;
    };

    this.getID = function () {
        return this.ID;
    };
    this.setID = function (val) {
        this.ID = val;
    };

    this.getJobTitle = function () {
        return this.jobTitle;
    };
    this.setJobTitle = function (val) {
        this.jobTitle = val;
    };

    this.getLastName = function () {
        return this.lastName;
    };
    this.setLastName = function (val) {
        this.lastName = val;
    };

    this.getPhone = function () {
        return this.phone;
    };
    this.setPhone = function (val) {
        this.phone = val;
    };

    this.getPostalCode = function () {
        return this.postalCode;
    };
    this.setPostalCode = function (val) {
        this.postalCode = val;
    };

    this.getPostBox = function () {
        return this.postBox;
    };
    this.setPostBox = function (val) {
        this.postBox = val;
    };

    this.getSalutation = function () {
        return this.salutation;
    };
    this.setSalutation = function (val) {
        this.salutation = val;
    };

    this.getSecondName = function () {
        return this.secondName;
    };
    this.setSecondName = function (val) {
        this.secondName = val;
    };

    this.getStateCode = function () {
        return this.stateCode;
    };
    this.setStateCode = function (val) {
        this.stateCode = val;
    };

    this.getSuffix = function () {
        return this.suffix;
    };
    this.setSuffix = function (val) {
        this.suffix = val;
    };

    this.getSuite = function () {
        return this.suite;
    };
    this.setSuite = function (val) {
        this.suite = val;
    };
}

module.exports = new CustomerAddress();
