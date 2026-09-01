'use strict';

/**
 * Client-side validation for registration form
 * Validates that email and confirm email match, and password and confirm password match
 */
document.addEventListener('DOMContentLoaded', function () {
    var registrationForm = document.querySelector('form.registration');
    
    if (!registrationForm) {
        return;
    }

    var emailInput = document.getElementById('registration-form-email');
    var emailConfirmInput = document.getElementById('registration-form-email-confirm');
    var passwordInput = document.getElementById('registration-form-password');
    var passwordConfirmInput = document.getElementById('registration-form-password-confirm');
    var submitButton = registrationForm.querySelector('button[type="submit"]');

    // Helper function to show validation error
    function showError(input, message) {
        var formGroup = input.closest('.form-group');
        var feedback = formGroup.querySelector('.invalid-feedback');
        
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        
        if (feedback) {
            feedback.textContent = message;
        }
    }

    // Helper function to clear validation error
    function clearError(input) {
        var formGroup = input.closest('.form-group');
        var feedback = formGroup.querySelector('.invalid-feedback');
        
        input.classList.remove('is-invalid');
        input.setCustomValidity(''); // Clear HTML5 validation error
        
        if (feedback) {
            feedback.textContent = '';
        }
    }

    // Validate email format in real-time and clear HTML5 validation errors
    function validateEmailFormat(input) {
        if (!input) {
            return;
        }

        input.setCustomValidity('');
        
        if (input.value.trim()) {
            var emailValue = input.value.trim();
            var hasAtSymbol = emailValue.indexOf('@') !== -1;
            
            // Check if email contains a TLD pattern (like .com, .net, .org, etc.)
            // Pattern matches: dot followed by 2-6 letter domain extension
            var tldPattern = /\.[a-z]{2,6}$/i;
            var hasTld = tldPattern.test(emailValue);
            
            // Only show error if TLD is present but @ symbol is missing
            if (hasTld && !hasAtSymbol) {
                // Set custom validity to show error
                input.setCustomValidity('Please include an \'@\' in the email address.');
                showError(input, 'Please include an \'@\' in the email address.');
            } else {
                // Check HTML5 validity
                var isValid = input.checkValidity();
                
                if (isValid) {
                    // Email format is valid - clear visual error state immediately
                    clearError(input);
                } else if (!hasTld || hasAtSymbol) {
                    // If no TLD yet, or has @ symbol, don't show error while typing
                    // Error will show on blur/submit if still invalid
                    clearError(input);
                }
            }
        } else {
            clearError(input);
        }
    }

    // Validate email match
    function validateEmailMatch() {
        if (!emailInput || !emailConfirmInput) {
            return true;
        }

        var email = emailInput.value.trim().toLowerCase();
        var emailConfirm = emailConfirmInput.value.trim().toLowerCase();

        if (emailConfirm && email !== emailConfirm) {
            showError(emailConfirmInput, 'Email addresses do not match');
            return false;
        } else {
            clearError(emailConfirmInput);
        }

        return true;
    }

    // Validate password match
    function validatePasswordMatch() {
        if (!passwordInput || !passwordConfirmInput) {
            return true;
        }

        var password = passwordInput.value;
        var passwordConfirm = passwordConfirmInput.value;

        if (passwordConfirm && password !== passwordConfirm) {
            showError(passwordConfirmInput, 'Passwords do not match');
            return false;
        } else {
            clearError(passwordConfirmInput);
        }

        return true;
    }

    // Real-time validation on input for email fields
    if (emailConfirmInput && emailInput) {
        emailInput.addEventListener('input', function() {
            validateEmailFormat(emailInput);
            validateEmailMatch();
        });
        emailInput.addEventListener('blur', function() {
            validateEmailFormat(emailInput);
            validateEmailMatch();
        });
        
        emailConfirmInput.addEventListener('input', function() {
            validateEmailFormat(emailConfirmInput);
            validateEmailMatch();
        });
        emailConfirmInput.addEventListener('blur', function() {
            validateEmailFormat(emailConfirmInput);
            validateEmailMatch();
        });
    }

    if (passwordConfirmInput) {
        passwordConfirmInput.addEventListener('blur', validatePasswordMatch);
        passwordConfirmInput.addEventListener('input', function() {
            if (passwordConfirmInput.value && passwordInput.value) {
                validatePasswordMatch();
            }
        });
        
        // Also validate when password field changes
        passwordInput.addEventListener('blur', validatePasswordMatch);
        passwordInput.addEventListener('input', function() {
            if (passwordConfirmInput.value && passwordInput.value) {
                validatePasswordMatch();
            }
        });
    }

    // Validate on form submit
    if (submitButton) {
        registrationForm.addEventListener('submit', function(e) {
            var isValid = true;

            // Validate email match
            if (!validateEmailMatch()) {
                isValid = false;
            }

            // Validate password match
            if (!validatePasswordMatch()) {
                isValid = false;
            }

            if (!isValid) {
                e.preventDefault();
                e.stopPropagation();
                
                // Focus on first invalid field
                if (emailConfirmInput && emailConfirmInput.classList.contains('is-invalid')) {
                    emailConfirmInput.focus();
                    emailConfirmInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (passwordConfirmInput && passwordConfirmInput.classList.contains('is-invalid')) {
                    passwordConfirmInput.focus();
                    passwordConfirmInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                return false;
            }
        });
    }
});

