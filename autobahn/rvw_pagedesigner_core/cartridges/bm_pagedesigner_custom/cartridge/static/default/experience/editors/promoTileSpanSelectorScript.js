(() => {
    subscribe('sfcc:ready', async ({ value, config, isDisabled, isRequired, dataLocale, displayLocale }) => {
        var selectedValue = typeof value === 'object' && value !== null && typeof value.value === 'string' ? value.value : null;

        if (selectedValue > config.init.rows){
            // if the preference was set to 4 when selections were made and then changed to 3 make any '4' selections = '3'
            selectedValue = selectedValue - 1;
        }
        // Append basic DOM
        const template = obtainTemplate(config.init);
        const clone = document.importNode(template.content, true);
        document.body.appendChild(clone);

        // Set props
        const selectEl = document.querySelector('select');

        // Set <options> from init()
        setOptions(config.init.options || [], selectedValue, selectEl);

        // Apply change listener
        selectEl.addEventListener('change', event => {
            const val = event.target.value;

            if (val) {
                emit({
                    type: 'sfcc:value',
                    payload: { value: val }
                });
            }
        });
    });

    function obtainTemplate(init) {
        const template = document.createElement('template');
        template.innerHTML = `
<div class="cc-attribute__form-element_control">
  <div class="slds-select_container">
    <select class="slds-select">
    </select>
  </div>
</div>`;
        return template;
    }

    function setOptions(options, selectedValue, selectEl) {
        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.text = option.displayValue;
            optionEl.value = option.value;
            optionEl.selected = option.value == selectedValue;

            selectEl.appendChild(optionEl);
        });
    }
})();
