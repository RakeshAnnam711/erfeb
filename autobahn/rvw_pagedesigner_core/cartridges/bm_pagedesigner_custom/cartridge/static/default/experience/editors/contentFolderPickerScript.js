(() => {
    subscribe('sfcc:ready', async ({ value, config, isDisabled, isRequired, dataLocale, displayLocale }) => {
        const selectedValue = typeof value === 'object' && value !== null && typeof value.value === 'string' ? value.value : null;

        // Append basic DOM
        const template = obtainTemplate(config.init);
        const clone = document.importNode(template.content, true);
        document.body.appendChild(clone);
        document.body.style.background = '#ffffff';

        // Set props
        const selectEl = document.querySelector('select');
        selectEl.required = isRequired;
        selectEl.disabled = isDisabled;

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
        <option value="${init.siteRootFolder}">${init.placeholder}</option>
    </select>
  </div>
</div>`;
        return template;
    }

    function setOptions(options, selectedValue, selectEl) {
        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.text = option.name + ' (' + option.id + ')';
            optionEl.value = option.id;
            optionEl.selected = option.id === selectedValue;

            selectEl.appendChild(optionEl);
        });
    }
})();
