(() => {

    subscribe('sfcc:ready', async ({ value, config, isDisabled, isRequired, dataLocale, displayLocale }) => {

        // Append basic DOM
        const template = getTemplate();
        const clone = document.importNode(template.content, true);
        document.body.appendChild(clone);
        document.body.style.background = '#ffffff';

        // Get selected date if available
        let selectedValue = typeof value === 'object' && value !== null && typeof value.value === 'string' ? value.value : null;

        // Get today's date to use as default
        if (selectedValue === null) {
            let today = new Date();
            let dd = String(today.getDate()).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0');
            let yyyy = today.getFullYear();
            let todaysDate = yyyy + '-' + mm + '-' + dd;

            selectedValue = todaysDate;

            emit({
                type: 'sfcc:value',
                payload: { value: today }
            });
        }

        // Initialize Flatpickr instance
        flatpickr(".datetimepicker", {
            defaultDate: selectedValue,
            enableTime: false,
            wrap: true,
            allowInput: true,
            positionElement: ".datetimepicker-button",
            static: "below left",
            onReady: [
                function (selectedDates, dateStr, instance) {
                    setHeight(instance);
                }
            ],
            onOpen: [
                function (selectedDates, dateStr, instance) {
                    setHeight(instance);
                }
            ],
            onClose: [
                function (selectedDates, dateStr, instance) {
                    setHeight(instance);
                }
            ],
            onChange: [
                function (selectedDates, dateStr, instance) {
                    // convert date entry to JS Date object
                    var [year, month, day] = dateStr.split('-');
                    var dateObject = new Date(year, month - 1, day);

                    // store updated value (won't send until save event)
                    emit({
                        type: 'sfcc:value',
                        payload: dateObject ? { value: dateObject } : null
                    });
                }
            ]
        });

    });

    // Update the iframe height to fit the contents
    function setHeight(instance) {
        var inputHeight = instance.input.offsetHeight;
        var calendarHeight = instance.calendarContainer.offsetHeight;
        var newHeight = inputHeight + calendarHeight;

        document.body.style.height = newHeight + 'px';
        instance.calendarContainer.style.marginTop = '1px';
    }

    // Create template for datepicker field
    function getTemplate() {
        const template = document.createElement('template');
        template.innerHTML = `
  <div class="slds-button-group datetimepicker" role="group">

    <input type="text" class="slds-input" style="border-right: 0; border-radius: .25rem 0 0 .25rem;" placeholder="Choose a date" data-input/>

    <button class="datetimepicker-button slds-button slds-button_last slds-button_icon slds-button_icon-border-filled" title="Choose Date" data-toggle>
        <svg class="slds-button__icon slds-input__icon slds-input__icon_right slds-icon-text-default" aria-hidden="true" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="52px" height="52px" viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve">
            <path d="M46.3,19.7H5.7c-0.9,0-1.6,0.7-1.6,1.6v23.5c0,2.6,2.1,4.7,4.7,4.7h34.4c2.6,0,4.7-2.1,4.7-4.7V21.3
            C47.9,20.4,47.2,19.7,46.3,19.7z M18.2,41.6c0,0.9-0.7,1.6-1.6,1.6h-3.1c-0.9,0-1.6-0.7-1.6-1.6v-3.1c0-0.9,0.7-1.6,1.6-1.6h3.1
            c0.9,0,1.6,0.7,1.6,1.6V41.6z M29.1,41.6c0,0.9-0.7,1.6-1.6,1.6h-3.1c-0.9,0-1.6-0.7-1.6-1.6v-3.1c0-0.9,0.7-1.6,1.6-1.6h3.1
            c0.9,0,1.6,0.7,1.6,1.6V41.6z M29.1,30.7c0,0.9-0.7,1.6-1.6,1.6h-3.1c-0.9,0-1.6-0.7-1.6-1.6v-3.1c0-0.9,0.7-1.6,1.6-1.6h3.1
            c0.9,0,1.6,0.7,1.6,1.6V30.7z M40.1,30.7c0,0.9-0.7,1.6-1.6,1.6h-3.1c-0.9,0-1.6-0.7-1.6-1.6v-3.1c0-0.9,0.7-1.6,1.6-1.6h3.1
            c0.9,0,1.6,0.7,1.6,1.6V30.7z M43.2,7.2h-3.9V5.6c0-1.7-1.4-3.1-3.1-3.1c-1.7,0-3.1,1.4-3.1,3.1v1.6H19V5.6c0-1.7-1.4-3.1-3.1-3.1
            s-3.1,1.4-3.1,3.1v1.6H8.8c-2.6,0-4.7,2.1-4.7,4.7v1.6c0,0.9,0.7,1.6,1.6,1.6h40.7c0.9,0,1.6-0.7,1.6-1.6v-1.6
            C47.9,9.3,45.8,7.2,43.2,7.2z"/>
        </svg>
        <span class="slds-assistive-text">Choose Date</span>
    </button>
</div>`

        return template;
    }

})();
