"use strict";
/* global describe it */
var assert = require("chai").assert;
var config = require("../it.config");
var chai = require("chai");
var chaiSubset = require("chai-subset");
chai.use(chaiSubset);
var axiosDefault = require("axios").default;
var { wrapper } = require('axios-cookiejar-support')
var { CookieJar } = require('tough-cookie')

const jar = new CookieJar();
const axios = wrapper(axiosDefault.create({ jar }));

const requestTemplate = {
    withCredentials: true,
    headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }
};

/**
 * Request CSRF Token and returns it
 * @returns {string} csrf token with query assigned
 */
async function requestCSRFToken() {
    const url = config.baseUrl + "/CSRF-Generate";
    const requestBody = Object.assign({}, requestTemplate);

    return axios.post(url, {}, requestBody)
        .then((response) => {
            const csrf = "&" + response.data.csrf.tokenName + '=' + response.data.csrf.token;
            return csrf;
        })
}

describe('Bambuser-Product', function() {
    this.timeout(5000);

    it('Should return bambuser models of SFRA product data - assumes a SFRA catalog', async function () {
        const cookieJar = new CookieJar();
        const axios = wrapper(axiosDefault.create({ jar: cookieJar }));
        const fs = require('fs');
        const testcases = [
            {
                ref: '701643421084M',
                id: 'tpl%3A4b2cd27433bebe821f14b4489e98bc635fc83da8',
            },
            {
                ref: '701642923459M',
                id: 'tpl%3A4b2cd27433bebe821f14b4489e98bc635fc83da9',
            },
            {
                ref: '013742000252M',
                id: 'tpl%3A4b2cd27433bebe821f14b4489e98bc635fc83da1',
            },
            {
                ref: '029407331258M',
                id: 'tpl%3A4b2cd27433bebe821f14b4489e98bc635fc83da2',
            },
        ];
        const expectedResponses = JSON.parse(fs.readFileSync('test/integration/bambuser/getProductResponse.json'));

        for (let i = 0; i < testcases.length; i++) {
            const testcase = testcases[i];
            await axios({
                url: `${config.baseUrl}/Bambuser-Product?ref=${testcase.ref}&id=${testcase.id}`,
                method: 'GET',
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
                transformResponse: [(data) => JSON.parse(data)],
            })
                .then((response) => {
                    const actual = response.data.product;
                    const expected = expectedResponses[i];
                    // assertions

                    // base prod
                    Object.keys(expected)
                        .forEach((prop) => {
                            if (prop !== 'variations') {
                                assert.equal(actual[prop], expected[prop]);
                            }
                        });
                    // variations
                    expected.variations.forEach((expectedVar, i) => {
                        const actualVar = actual.variations[i];
                        Object.keys(expected).forEach((prop) => {
                            // base properties
                            if (prop !== 'sizes' && prop !== 'imageURLs') {
                                assert.equal(expectedVar[prop], actualVar[prop]);
                            }
                            // image url
                            assert(actualVar.imageURLs.length > 0);
                            assert(/^https?/.test(actualVar.imageURLs[0]));
                            // sizes
                            expectedVar.sizes.forEach((expectedSize, j) => {
                                const actualSize = actualVar.sizes[j];
                                assert.equal(expectedSize.name, actualSize.name);
                                assert.equal(expectedSize.sku, actualSize.sku);
                                assert.deepEqual(expectedSize.price, actualSize.price);
                                assert(typeof actualSize.inStock === 'boolean');
                            });
                        });
                    });
                });
        };
    });
});