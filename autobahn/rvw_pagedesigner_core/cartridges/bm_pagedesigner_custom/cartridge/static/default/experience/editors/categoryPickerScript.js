(() => {
    let $input;
    let $button;
    let $list;
    let data;
    let initialCategories;

    subscribe('sfcc:ready', async ({ value, config, isDisabled, isRequired, dataLocale, displayLocale }) => {
        const { options = {}, placeholder = '' } = config;

        // Update vars on load
        data = value || {};
        initialCategories = config.init;

        // Populate data on load. If a new value is found from breakout window, add to data object
        if (data.type === 'sfcc:categoryPicker') {
            data.rootCategory = data.value;
        }
        data.selectedIds = 'selectedIds' in data && data.selectedIds.length > 0 ? data.selectedIds : [];
        data.rootCategory = 'rootCategory' in data && data.rootCategory !== null ? data.rootCategory : '';

        // Append basic DOM
        const template = obtainTemplate(placeholder);
        const clone = document.importNode(template.content, true);
        document.body.appendChild(clone);
        document.body.style.background = '#ffffff';

        // Define editor's selectors
        $input = $('input[type="text"]');
        $button = $('button');
        $list = $('ul');

        // Populate values
        let topLevelCategories;
        if (data.rootCategory === '') {
            topLevelCategories = initialCategories;
        } else {
            $input.val(data.rootCategory);
            topLevelCategories = updateTopLevelCategories(initialCategories, data.rootCategory);
        }
        buildList(topLevelCategories || [], data, $list);

        // Event handler for top-level category selector
        $button.click(() => {
            handleBreakoutOpen();
        });

        // Event handler for checkbox category selections
        $list.on('change', 'input', event => {
            const categoryId = event.target.id;
            const isChecked = $(event.target).is(':checked');

            if (categoryId) {
                const $nextLevel = $(event.target).closest('.slds-form-element').next('.slds-is-nested');

                if (isChecked) {
                    data.selectedIds.push(categoryId);
                    $nextLevel.removeClass('slds-is-collapsed').addClass('slds-is-expanded');
                } else {
                    data.selectedIds = data.selectedIds.filter(item => item !== categoryId);
                    $nextLevel.removeClass('slds-is-expanded').addClass('slds-is-collapsed');
                }

                emit({
                    type: 'sfcc:value',
                    payload: data
                });
            }
        });
    });

    // Set up initial template for the editor
    function obtainTemplate() {
        const template = document.createElement('template');
        template.innerHTML = `
<label class="slds-form-element__label" for="rootCategoryInput">Top-level category</label>
<div class="slds-grid slds-grid_vertical-align-start">
    <div class="slds-col slds-grow">
        <input type="text" disabled class="slds-input" id="rootCategoryInput" placeholder="Site root">
    </div>
    <div class="slds-col slds-grow-none slds-m-left_xx-small">
        <button type="button" class="slds-button slds-button_neutral">Select</button>
    </div>
</div>
<label class="slds-form-element__label slds-p-top_x-small">Choose categories to display</label>
<ul class="slds-p-left_xxx-small" data-menu-level="1"></ul>
`;
        return template;
    }

    // When a new root category is chosen, update the top-level categories accordingly
    function updateTopLevelCategories(categories, rootCategory) {
        let categoryList = [];

        categories.forEach(category => {
            if (category.id === rootCategory || rootCategory === '' || rootCategory === 'root') {
                // Use rootCategory if provided, otherwise fall back to initial top-level categories
                categoryList = category.subCategories && category.subCategories.length > 0 ? category.subCategories : initialCategories;
            } else if (category.subCategories && category.subCategories.length > 0) {
                updateTopLevelCategories(category.subCategories, rootCategory);
            }
        });

        return categoryList;
    }

    // Add categories and their subcategories to the checkbox list
    function addCategoryItem(category, data, $list, menuLevel) {
        const isSelected = data.selectedIds.indexOf(category.id) !== -1;
        const $item = $(`
<li class="slds-form-element">
    <div class="slds-form-element__control">
        <div class="slds-checkbox">
            <input type="checkbox" name="options" id="${category.id}" value="${category.id}" ${isSelected ? 'checked="checked"' : ''} />
            <label class="slds-checkbox__label" for="${category.id}">
                <span class="slds-checkbox_faux"></span>
                <span class="slds-form-element__label">${category.name}</span>
            </label>
        </div>
    </div>
</li>`);

        $list.append($item);
        
        if (category.subCategories && category.subCategories.length > 0) {
            menuLevel = menuLevel + 1;
            const expandedClass = isSelected ? 'slds-is-expanded' : 'slds-is-collapsed';
            const $subCategoryList = $('<ul class="slds-is-nested ' + expandedClass + '" data-menu-level=' + menuLevel + '">');

            $list.append($subCategoryList);

            category.subCategories.forEach(subCategory => {
                addCategoryItem(subCategory, data, $subCategoryList, menuLevel);
            });
        }
    }

    // Create the category checkbox list
    function buildList(categories, data, $list) {
        let menuLevel = 1;

        if (categories.length > 0) {
            categories.forEach(category => {
                addCategoryItem(category, data, $list, menuLevel);
            });
        } else {
            const $noCategoriesMessage = $(`
<li class="slds-has-error">
    <div class="slds-form-element__help"><strong>${data.rootCategory}</strong> has no subcategories. Please choose another top-level category.</div>
</li>`);
            $list.append($noCategoriesMessage);
        }
    }

    // Open the prebuilt SFCC category picker breakout window
    function handleBreakoutOpen() {
        emit({
            type: 'sfcc:breakout',
            payload: {
                id: 'sfcc:categoryPicker',
                title: 'Choose a Top-Level Category'
            }
        }, handleBreakoutClose);
    }

    // Close the breakout window, apply if a category's chosen
    function handleBreakoutClose({ type, value }) {
        if (type === 'sfcc:breakoutApply' && value !== undefined) {
            handleBreakoutApply(value);
        }
    }

    // Apply a new category selection, update DOM, and emit the data for it
    function handleBreakoutApply(value) {
        $input.val(value.value);
        data.rootCategory = value.value || '';
        data.value = value.value;

        // Rebuild category list
        let topLevelCategories = updateTopLevelCategories(initialCategories, data.rootCategory);
        $list.empty();
        buildList(topLevelCategories || [], data, $list);

        emit({
            type: 'sfcc:value',
            payload: value
        });
    }
})();
