document.addEventListener('DOMContentLoaded', function () {
    var submitButton = document.querySelector('.submit-customer-login');
    var form = document.getElementById('registered-customer');

    if (submitButton && form) {
        submitButton.addEventListener('click', function (e) {
            var inputs = form.querySelectorAll('input[required]');
            for (var i = 0; i < inputs.length; i++) {
                var input = inputs[i];
                var val = input.value.trim();

                if (!val) {
                    // Empty required field
                    e.preventDefault();
                    input.focus();
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return false;
                }

                if (input.type === 'email') {
                    // Strict pattern check for email
                    var emailPattern = /^[\w.%+\-]+@[\w.\-]+\.\w{2,}$/;
                    if (!emailPattern.test(val)) {
                        e.preventDefault();
                        input.focus();
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return false;
                    }
                }

                if (input.type === 'password') {
                    // Check minimum length 8
                    if (val.length < 8) {
                        e.preventDefault();
                        input.focus();
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return false;
                    }
                }
            }
            // if all validation passes, form submits normally
        });
    }
});
