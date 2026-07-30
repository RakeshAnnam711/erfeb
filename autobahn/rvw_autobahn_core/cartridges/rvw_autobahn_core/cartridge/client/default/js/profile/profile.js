'use strict';

var formValidation = require('base/components/formValidation');
var recaptcha = require('../components/recaptcha');

module.exports = {
    submitProfile: function () {
        $('form.edit-profile-form').submit(function (e) {
            var $form = $(this);
            e.preventDefault();
            var url = $form.attr('action');
            $form.spinner().start();
            $('form.edit-profile-form').trigger('profile:edit', e);
            recaptcha.check(e, {
                url: url,
                type: 'post',
                dataType: 'json',
                data: $form.serialize(),
                success: function (data) {
                    $form.spinner().stop();
                    if (!data.success) {
                        formValidation($form, data);
                    } else {
                        var userPayload = {
                            user_id: window.Customer?.customerNo || data.customerNo || data.email,
                            email:  $form.find('input[name="dwfrm_profile_customer_email"]').val() || '',
                
                            first_name: data.firstName || '',
                            last_name: data.lastName || '',
                
                            contacts: [
                                {
                                    type: "email",
                                    value:  $form.find('input[name="dwfrm_profile_customer_email"]').val() || '',
                                    status: data.emailOptIn ? "active" : "inactive"
                                }
                            ]
                        };
                
                        window.dataLayer = window.dataLayer || [];
                
                        dataLayer.push({
                            event: 'updated_user',
                            user: userPayload
                        });
                        console.log('Full SaveProfile response:', userPayload);
                        console.log('updated_user pushed successfully');
                        console.log(
                            'Last dataLayer event:',
                            window.dataLayer[window.dataLayer.length - 1]
                        );

                        location.href = data.redirectUrl;
                    }
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                    $form.spinner().stop();
                }
            });
            return false;
        });
    },

    submitPassword: function () {
        $('form.change-password-form').submit(function (e) {
            var $form = $(this);
            e.preventDefault();
            var url = $form.attr('action');
            $form.spinner().start();
            $('form.change-password-form').trigger('password:edit', e);
            recaptcha.check(e, {
                url: url,
                type: 'post',
                dataType: 'json',
                data: $form.serialize(),
                success: function (data) {
                    $form.spinner().stop();
                    if (!data.success) {
                        formValidation($form, data);
                    } else {
                        var passwordPayload = {
                            event: "password_changed",
                            properties: {
                                account_id: window.Customer?.customerNo || "",
                                password_changed_timestamp: new Date().toISOString(),
                                password_change_method: "User Initiated",
                                password_change_status: "Success",
                                phone: $form.find('input[name="phone"]').val() || "",
                                password_reset_flow: false,
                                two_factor_used: false,
                            }
                        };

                        window.dataLayer = window.dataLayer || [];
                        window.dataLayer.push(passwordPayload);
                        console.log('Password change event pushed:', passwordPayload);

                        location.href = data.redirectUrl;
                    }
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                    $form.spinner().stop();
                }
            });
            return false;
        });
    }
};
