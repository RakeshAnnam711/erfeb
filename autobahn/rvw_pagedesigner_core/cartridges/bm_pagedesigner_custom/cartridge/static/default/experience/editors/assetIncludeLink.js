(() => {
    subscribe('sfcc:ready', async ({ value, config, isDisabled, isRequired, dataLocale, displayLocale }) => {
        const { options = {}, placeholder = '' } = config;

        // Append basic DOM
        const template = obtainTemplate(placeholder);
        const clone = document.importNode(template.content, true);
        document.body.appendChild(clone);
        document.body.style.background = '#ffffff';

        // Set elements and props
        const linkEl = document.querySelector('a');
        const inputEl = document.querySelector('input');
        const buttonEl = document.querySelector('button');
        const linkMsg = document.getElementById('copy-link-message');
        const noLinkMsg = document.getElementById('no-link-message');
        const assetIdField = window.top.document.querySelector("[data-automation-attribute='assetId']");
        const assetId = assetIdField.value;

        if (assetId) {
            linkEl.href = window.top.location.pathname + '#/edit/page/' + assetId;
            inputEl.value = linkEl.href;
            inputEl.style.display = 'block';
            buttonEl.style.display = 'block';

            buttonEl.addEventListener('click', event => {
                event.preventDefault();
                inputEl.select();
                document.execCommand('copy');
                linkMsg.style.display = 'block'

                setTimeout(() => {
                    linkMsg.style.display = 'none'
                }, 3000);
            });
        } else {
            noLinkMsg.style.display = 'block';
        }
    });

    function obtainTemplate(placeholder) {
        const template = document.createElement('template');
        template.innerHTML = `
<div class="slds-grid slds-gutters_xx-small">
    <div class="slds-col slds-size_8-of-12">
        <input class="slds-input slds-text-body_small" style="display: none;" type="text" name="assetIdInput" value="${placeholder}"/>
    </div>
    <div class="slds-col slds-size_4-of-12">
        <button class="slds-button slds-button_neutral" style="display: none; white-space: nowrap;">Copy Link</button>
    </div>
</div>
<a href="${placeholder}" style="display: none" target="_blank" rel="noopener">Asset link</a>
<p id="copy-link-message" class="slds-text-color_success slds-m-top_small slds-text-body_small" style="display: none;">Link has been copied to your clipboard.</p>
<p id="no-link-message" class="slds-text-body_small" style="display: none";>Enter an ID in the Asset ID field and hit save to create a link.</p>
`;
        return template;
    }
})();
