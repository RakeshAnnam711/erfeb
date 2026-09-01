const { int_paypal: { fastlaneStyleOptionsPath } } = require('../path.json');

const { expect } = require('chai');

const proxyquire = require('proxyquire').noCallThru();

require('dw-api-mock/demandware-globals');
require('@babel/register')({
    plugins: ['babel-plugin-rewire']
});

const fastlaneStyleOptions = proxyquire(fastlaneStyleOptionsPath, {});

describe('Fastlane style options', () => {
    describe('flexible', () => {
        describe('root', () => {
            it('should have the correct root properties', () => {
                const root = fastlaneStyleOptions.flexible.root;

                expect(root).to.have.property('backgroundColorPrimary', '#f9f9f9');
                expect(root).to.have.property('errorColor', '#c40b0b');
                expect(root).to.have.property('fontFamily', 'Helvetica, Arial, sans-serif');
                expect(root).to.have.property('padding', '0px');
            });
        });

        describe('input', () => {
            it('should have the correct input properties', () => {
                const input = fastlaneStyleOptions.flexible.input;

                expect(input).to.have.property('borderRadius', '4px');
                expect(input).to.have.property('borderColor', '#9e9e9e');
                expect(input).to.have.property('focusBorderColor', '#4496f6');
            });
        });

        describe('toggle', () => {
            it('should have the correct toggle properties', () => {
                const toggle = fastlaneStyleOptions.flexible.toggle;

                expect(toggle).to.have.property('colorPrimary', '#0f005e');
                expect(toggle).to.have.property('colorSecondary', '#ffffff');
            });
        });

        describe('text', () => {
            it('should have the correct body properties', () => {
                const body = fastlaneStyleOptions.flexible.text.body;

                expect(body).to.have.property('color', '#222222');
                expect(body).to.have.property('fontSize', '1rem');
            });

            it('should have the correct caption properties', () => {
                const caption = fastlaneStyleOptions.flexible.text.caption;

                expect(caption).to.have.property('color', '#515151');
                expect(caption).to.have.property('fontSize', '0.875rem');
            });
        });

        it('should have the correct branding value', () => {
            expect(fastlaneStyleOptions.flexible).to.have.property('branding', 'light');
        });
    });

    describe('component', () => {
        describe('root', () => {
            it('should have the correct root properties', () => {
                const root = fastlaneStyleOptions.component.root;

                expect(root).to.have.property('backgroundColor', '#f9f9f9');
                expect(root).to.have.property('errorColor', '#d9360b');
                expect(root).to.have.property('fontFamily', 'Paypal-Open, Arial, sans-serif');
                expect(root).to.have.property('textColorBase', '#010b0d');
                expect(root).to.have.property('fontSizeBase', '16px');
                expect(root).to.have.property('padding', '0px');
                expect(root).to.have.property('primaryColor', '#0057ff');
            });
        });

        describe('input', () => {
            it('should have the correct input properties', () => {
                const input = fastlaneStyleOptions.component.input;

                expect(input).to.have.property('backgroundColor', '#ffffff');
                expect(input).to.have.property('borderRadius', '4px');
                expect(input).to.have.property('borderColor', '#dadddd');
                expect(input).to.have.property('borderWidth', '1px');
                expect(input).to.have.property('textColorBase', '#010b0d');
                expect(input).to.have.property('focusBorderColor', '#0057ff');
            });
        });
    });
});
