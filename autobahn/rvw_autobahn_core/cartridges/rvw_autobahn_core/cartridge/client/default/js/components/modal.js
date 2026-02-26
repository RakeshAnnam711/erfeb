'use strict';

var abSlider = require('./slider');

function setModalBodyMaxHeight($modal) {
    var $modalBody = $modal.find('.modal-body');
    var headerHeight = $modal.find('.modal-header').outerHeight();
    var footerHeight = $modal.find('.modal-footer').length ? $modal.find('.modal-footer').outerHeight() : 0;
    var $modalDialog = $modal.find('.modal-dialog');
    var dialogMarginTop = parseInt($modalDialog.css('margin-top').split('px')[0]);
    var dialogMarginBottom = parseInt($modalDialog.css('margin-bottom').split('px')[0]);
    var dialogMarginHeight = dialogMarginTop + dialogMarginBottom;
    var $modalContent = $modal.find('.modal-content');
    var contentBorderTop = parseInt($modalContent.css('border-top-width').split('px')[0]);
    var contentBorderBottom = parseInt($modalContent.css('border-bottom-width').split('px')[0]);
    var subtractHeight = headerHeight + footerHeight + dialogMarginHeight + contentBorderTop + contentBorderBottom;
    var windowHeight = window.innerHeight; // using innerHeight to account for mobile browser URL bars, etc.

    $modalBody.css('max-height', windowHeight - subtractHeight);
}

/**
 * Generates the modal window on the first call.
 *
 */
function getModalHtmlElement(elementID, dialogClasses) {
    var id = elementID || 'customModal';
    var qvPDPLink = (id == 'quickViewModal') ? '    <a class="full-pdp-link" href=""></a>' : '';
    dialogClasses = dialogClasses || '';

    if ($('#' + id).length !== 0) {
        $('#' + id).remove();
    }
    var htmlString = '<div class="modal fade" id="' + id + '" role="dialog">'
        + '<span class="enter-message sr-only"></span>'
        + '<div class="modal-dialog ' + dialogClasses + '">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + qvPDPLink
        + '    <button type="button" class="close pull-right" data-dismiss="modal">'
        + '        <span aria-hidden="true">&times;</span>'
        + '        <span class="sr-only"> </span>'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
}

function onShownBsModal() {
    $('body').on('shown.bs.modal', '.modal', function() {
        $('body').trigger('modal:loaded', this);
    });
}

function onModalLoaded() {
    $('body').on('modal:loaded', function(event, modal) {
        var $modal = $(modal);

        // Check for modal-scrollbody helper class and adjust body max-height if found
        if ($modal.find('.modal-scrollbody').length
            || $modal.find('.quick-view-dialog').length
            || $modal.find('.choose-bonus-product-dialog').length) {
            setModalBodyMaxHeight($modal);
        }

        // Reinitialize mobile modal sliders to prevent tiny slider error on drag
        var $modalSlider = $modal.find('.slider-container .slider');
        if ($modalSlider.length && window.isMobile()) {
            $modalSlider.trigger('slider:destroy');
            abSlider.initializeSliders($modal);
        }
    });
}

/**
 * Parse HTML code in Ajax response
 *
 * @param {string} html - Rendered HTML from quickview template
 * @return {QuickViewHtml} - QuickView content components
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.product-quickview');
    if(body.length == 0) {
        body = $html.find('.modal-body').children()
    }
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * replaces the content in the modal window on for the selected product variation.
 * @param {string} selectedValueUrl - url to be used to retrieve a new product model
 */
function fillModalElement(selectedValueUrl, data, $modal) {
    $.ajax({
        url: selectedValueUrl,
        method: 'GET',
        data: data,
        dataType: 'json',
        success: function(data) {
            var parsedHtml = parseHtml(data.renderedTemplate);

            $modal.find('.modal-body').empty();
            $modal.find('.modal-body').html(parsedHtml.body);
            $modal.find('.modal-footer').html(parsedHtml.footer);
            $modal.find('.modal-header .close .sr-only').text(data.closeButtonText);
            $modal.find('.enter-message').text(data.enterDialogMessage);
            $modal.modal('show');

            if (data.dialogTitle) {
                $modal.find('.modal-header').prepend('<div class="modal-title">' + data.dialogTitle + '</div>')
            }
        }
    });
}

function initCustomModal() {
    $('body').on('click', '.custom-modal', function (e) {
        e.preventDefault();
        var cid = $(this).attr('data-cid');
        var title = $(this).attr('data-title');
        var dialogClasses = $(this).attr('data-dialog-classes');
        var selectedValueUrl = $(this).attr('href');

        getModalHtmlElement('customModal', dialogClasses);
        fillModalElement(selectedValueUrl, {cid: cid, title: title}, $('#customModal'));
    });
}

module.exports = {
    setModalBodyMaxHeight: setModalBodyMaxHeight,
    getModalHtmlElement: getModalHtmlElement,
    onShownBsModal: onShownBsModal,
    onModalLoaded: onModalLoaded,
    parseHtml: parseHtml,
    init: function() {
        onShownBsModal();
        onModalLoaded();
        initCustomModal();
    }
};
