let dwjson = {
    ...require('./themes.dw.json'),
    ...require('./project.dw.json'),
    ...require('./dw.json')
};
// adjustment for prophet err log
if (!dwjson.version) dwjson.version = dwjson['code-version'];

// Include sandbox realm specific require module
if (dwjson.sandboxDomainPrefix != null) {
    try {
        let sandboxdwjs = require('./' + (dwjson.sandboxDomainPrefix || 'SBX-PREFIX-') + 'dw.js');
        dwjson = sandboxdwjs ? sandboxdwjs(dwjson) : dwjson;
    } catch (err) {
        console.error('LOG: Sandbox extension for dw.js: ' + dwjson.sandboxDomainPrefix + 'dw.js not found. It is NOT required.');
    }
}

let data = dwjson;

data.replace = data.replace || [];

// Dynamic Replace Params
for (let prop of 'username clientId hostname stagingDomain developmentDomain'.split(' ')) {
    let value = data[prop];

    // Pull string key-values from data obj (project.dw.json) ex: DWJSON.REPLACEME.hostname:zzrt-001.dx.commercecloud.salesforce.com
    if (typeof value === 'string') {
        dwjson.replace.push(['DWJSON.REPLACEME.', prop, ':', value].join(''));
    }
}

if (data.cartridge == null) {
    data.cartridgeAll = true;
} else {
    data.dataFor = data.dataFor || data.cartridge;
    data.cartridgePath = data.cartridgePath || data.cartridge.join(':');
}

if (data.dataFor == null) {
    data.dataAll = true;
} else if (data.dataReverse === true) {
    data.dataFor = data.dataFor.reverse();
}

data.uploadPath = data.themeUploadPath;

module.exports = data;
