'use strict';

module.exports = {
    flexible: {
        root: {
            backgroundColorPrimary: '#f9f9f9', // default: #ffffff
            errorColor: '#c40b0b', // default: #c40b0b
            fontFamily: 'Helvetica, Arial, sans-serif', // default: 'Helvetica, Arial, sans-serif',
            padding: '0px'
        },
        input: {
            borderRadius: '4px', // default: 4px
            borderColor: '#9e9e9e', // default: #9e9e9e
            focusBorderColor: '#4496f6' // default: #4496f6
        },
        toggle: {
            colorPrimary: '#0f005e', // default: #0f005e
            colorSecondary: '#ffffff' // default: #ffffff
        },
        text: {
            body: {
                color: '#222222', // default: #222222
                fontSize: '1rem' // default: 1rem
            },
            caption: {
                color: '#515151', // default: #515151
                fontSize: '0.875rem' // default: 0.875rem
            }
        },
        branding: 'light' // light | dark. Default: 'light'
    },
    component: {
        root: {
            backgroundColor: '#f9f9f9', // default: #ffffff | restrictions: no transparency
            errorColor: '#d9360b', // default: #d9360b | restrictions: no transparency
            fontFamily: 'Paypal-Open, Arial, sans-serif', // default: PayPal Open
            textColorBase: '#010b0d', // default: #010b0d | restrictions: no transparency
            fontSizeBase: '16px', // default: 16px | min: 13px | max: 24px
            padding: '0px', // default: 4px | min: 0px | max: 10px
            primaryColor: '#0057ff' // default: #0057ff | restrictions: no transparency
        },
        input: {
            backgroundColor: '#ffffff', // default: #ffffff | restrictions: no transparency
            borderRadius: '4px', // default: 4px | min: 0px | max: 32px
            borderColor: '#dadddd', // default: #dadddd | restrictions: no transparency
            borderWidth: '1px', // default: 1px | min: 1px | max: 5px
            textColorBase: '#010b0d', // default: #010b0d | restrictions: no transparency
            focusBorderColor: '#0057ff' // default: #0057ff | restrictions: no transparency
        }
    }
};
