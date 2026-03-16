'use strict';

function URLAction() {
    this.args = Array.prototype.slice.call(arguments);
    this.action = this.args[0];
    this.siteId = this.args[1];
    this.locale = this.args[2];
    this.host = (this.args.length >= 4) ? this.args[3] : 'www.example.com';
}

module.exports = URLAction;
