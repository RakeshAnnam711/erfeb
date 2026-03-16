const { assert } = require('chai');
const {
    describe,
    it,
    beforeEach,
    afterEach,
} = require('mocha');
const { setSuperModule, removeSuperModule } = require('../../testutils/superModule');
const Content = require('../../../cartridges/int_bambuser/cartridge/models/content');

describe('content', () => {
    // mocks
    const mockApiContent = {
        custom: {
            body: 'Hello',
            bambuserStreamId: 'streamId',
        },
        name: 'contentAssetName',
        template: 'templateName',
        UUID: 22,
        ID: 'contentAssetID',
        online: true,
        pageTitle: 'some title',
        pageDescription: 'some description',
        pageKeywords: 'some keywords',
        pageMetaTags: [{}],
    };

    const MockModel = function () {
        this.simpleProp = 'simple';
        this.complexProperty = {
            stringProp: 'string',
            numberProp: 1,
            booleanProp: true,
        };
        this.functionProp = function () {
            return 'function';
        };
        return this;
    };

    // stub superModule
    beforeEach(() => {
        setSuperModule(MockModel);
    });
    afterEach(() => {
        removeSuperModule();
    });

    it('should extend existing model', () => {
        const testContent = new Content(mockApiContent);
        const testSuper = new MockModel(mockApiContent);

        // test function equivalence
        assert(testSuper.functionProp() === testContent.functionProp());

        // test primitive equivalance
        delete testSuper.functionProp;
        assert.deepNestedInclude(testContent, testSuper);
    });

    it('should include enumerable property bambuserStreamId', () => {
        const testContent = new Content(mockApiContent);
        assert(Object.prototype.propertyIsEnumerable.call(testContent, 'bambuserStreamId'));
    });

    it('should map provided value', () => {
        const testContent = new Content(mockApiContent);
        assert(testContent.bambuserStreamId === 'streamId');
    });

    it('should handle missing metadata', () => {
        // deep clone hack
        const mockMissingMetadataApiContent = JSON.parse(JSON.stringify(mockApiContent));
        delete mockMissingMetadataApiContent.custom.bambuserStreamId;

        const testContent = new Content(mockMissingMetadataApiContent);

        assert(!('bambuserStreamId' in testContent));
    });
});
