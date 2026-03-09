'use strict';


/**
 * mimics .copyFrom on a form object, except it uses .setHtmlValue which triggers validation on the field
 * does not support nested forms
 * @param {dw.web.Form} form - get with session.forms.address
 * @param {object} model - model/json object that contains data to copy to form
 * @returns {dw.web.Form} the modified form
 */
function copyFromModel(form, model) {
    var collections = require('*/cartridge/scripts/util/collections');
    collections.forEach(new dw.util.ArrayList(Object.keys(model)), function (key) {
        if (key in form) {
            form[key].setHtmlValue(model[key]);
        }
    })

    return form;
}

exports.copyFromModel = copyFromModel;
