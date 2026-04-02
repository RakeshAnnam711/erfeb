document.addEventListener('DOMContentLoaded', function () {
    // Set initial aria-checked based on default selected sort option
    const selectedBtn = document.querySelector('.sortDropdown[data-selected="true"]');
    if (selectedBtn) {
        const selectedLi = selectedBtn.closest('.dropdown-item[role="radio"]');
        if (selectedLi) {
            selectedLi.setAttribute('aria-checked', 'true');
        }
    }

    // Set all other options to aria-checked="false"
    document.querySelectorAll('.dropdown-item[role="radio"]:not([aria-checked="true"])').forEach(item => {
        item.setAttribute('aria-checked', 'false');
    });

    // Handle click on sort options
    const sortButtons = document.querySelectorAll('.sortDropdown');

    sortButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Reset all items
            document.querySelectorAll('.dropdown-item[role="radio"]').forEach(item => {
                item.setAttribute('aria-checked', 'false');
            });

            // Set selected item
            const selectedLi = this.closest('.dropdown-item[role="radio"]');
            if (selectedLi) {
                selectedLi.setAttribute('aria-checked', 'true');
            }
        });
    });
});
