'use strict';

exports.toJSON = toJSON;

function toJSON(wsdl, result) {
    if (!result) {
        result = {};
    }
    if (!wsdl) {
        return result;
    }

    for (var i in Object.keys(wsdl)) {
        var key = Object.keys(wsdl)[i];
        if ((typeof wsdl[key] !== 'function') && wsdl[key] !== null) {
            if (typeof wsdl[key] === 'string' || typeof wsdl[key] === 'number' || typeof wsdl[key] === 'boolean') {
                result[key] = wsdl[key];
            } else if (typeof wsdl[key] === 'object') {
                if (wsdl[key].toString().indexOf('function', -1) === -1 && wsdl[key].toString().indexOf('webreferences', -1) === -1) {
                    if ('class' in wsdl[key]) {
                        //BigInteger and others
                        if (wsdl[key].toString().startsWith('[Ljava.lang.String')) {
                            result[key] = toJSON(wsdl[key]);
                        } else {
                            result[key] = wsdl[key].toString();
                        }
                    } else {
                        result[key] = toJSON(wsdl[key]);
                    }
                } else {
                    result[key] = toJSON(wsdl[key]);
                }
            }
        }
    }

    return result;
}

