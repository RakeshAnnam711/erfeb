'use strict';

function URL(data) {
    this.data = data;
    this.params = [];
    this.append = function (name, val) {
        this.params.push({ name: name, val: val });
        return this;
    };
    this.toString = function () {
        var result = [this.data.protocol, this.data.host, this.data.path].join('');
        if (this.params.length) {
            result += '?';
            var paramsArray = [];
            this.params.forEach(function (param) {
                paramsArray.push(param.name + '=' + param.val);
            });
            result += paramsArray.join('&');
        }

        return result;
    };
}

module.exports = URL;
