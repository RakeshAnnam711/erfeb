const fs = require('fs');
const path = require('path');
const datafolder = `.${path.sep}data${path.sep}` + __filename.split(path.sep).pop().split('.')[0] + path.sep;

module.exports = function (data) {
    let realm = data.sandboxDomainPrefix; // 'zzrt-'
    let realmfilepath = datafolder + realm + 'dw.json'
    let realmdwjson = fs.existsSync(realmfilepath) && require(realmfilepath) || {};
    let sandboxdwjson;

    // ZZRT Sandbox Numbers 001-050
    if (data.hostname) {
        for (let sandbox = 1; sandbox <= 50; sandbox++) {
            let prefix = realm + sandbox.toString().padStart(3, '000');
            let filepath = datafolder + prefix + '-dw.json';

            // Search for hostname specific dw.json
            if (data.hostname.indexOf(prefix) === 0 && fs.existsSync(filepath)) {
                sandboxdwjson = require(filepath);
            }

            if (sandboxdwjson) break;
        }
    }

    let dwjson = {
        ...data,
        ...realmdwjson,
        ...(sandboxdwjson || {})
    }

    // Dynamic Array extension of replace commands (reverse order)
    dwjson.replace = [];
    dwjson.delimiter = dwjson.delimiter || ':';

    for (let replaceRule of ((sandboxdwjson || {}).replace || []).concat(realmdwjson.replace || []).concat(data.replace || [])) {
        let replaceKey = replaceRule.split(dwjson.delimiter)[0];
        let allKeys = dwjson.replace.map(function (rule) { return rule.split(dwjson.delimiter)[0]; });

        if (allKeys.join('|').indexOf(replaceKey) == -1) dwjson.replace.push(replaceRule);
    }

    return dwjson;
}
