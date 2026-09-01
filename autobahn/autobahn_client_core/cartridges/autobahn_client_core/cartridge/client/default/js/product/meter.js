'use strict';
module.exports = {

    init: function () {
        var condition = $("#product-card-details")?.find('.product-condition')[0]?.outerHTML;
        $('#prod-condition').html(condition);
        var prodCon = $('body').find('.product-condition').length;

        if (prodCon > 0) {
            var $condition = $('body').find('.product-condition').addClass('d-none');
            var conditiontxt = $condition.find('p:last-child').text().toLowerCase();
            var conditionNotes = $condition.find('p:last-child').text().split('.');            
            var activeCondition = ['pristine', 'excellent', 'very good', 'good'].find(c => conditiontxt.includes(c));
            var conditionHTML = ['Pristine', 'Excellent', 'Very Good', 'Good'].map(c => 
                `<div class="condition-name${c.toLowerCase() === activeCondition ? ' active' : ''}">
                    <div class="circle"></div>${c}
                </div>`
            ).join('');

            var item = `
            <div class="main-container">
                <div class="title-condition">
                    <div class="title">CONDITION
                        <button aria-label="Condition Scale" type="button" class="site-country" data-toggle="modal" data-target="#conditionScaleModal">
                            <i class="info-icon"></i>
                        </button>
                    </div>
                </div>
                <div class="condition">${conditionHTML}</div>
                <div class="condition-note"><p>${conditionNotes[2]?.trim()}.</p></div>
            </div>`;

            $condition.after(item);
        }

    }
}
