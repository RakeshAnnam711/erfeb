'use strict';

var toastHelpers = require('core/components/toast');
var wishlistHelpers = require('core/wishlist/components/helpers');

var eventShowMore = function (e) {
    e.stopPropagation();
    e.preventDefault();

    var showMoreUrl = $(this).data('url');
    $.spinner().start();

    $.ajax({
        url: showMoreUrl,
        data: { selectedUrl: showMoreUrl },
        method: 'GET',
        success: function (response) {
            var $updatedList = $(response).find('.list-container');
            $('.list-container').replaceWith($updatedList);
            window.history.replaceState(null, '', showMoreUrl);
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
};

var updateModalCreateListNames = function () {
    if ($('.wishlist-landing').length) {
        var listNames = $('.wishlist-landing .lists').data('listNames');
        var listNamesArray = [];

        if (listNames) {
            listNamesArray = listNames.split('|')
        }

        $('#wishlistModalCreateList, #wishlistModalEditList').data('listNames', listNamesArray);
    }
};

var eventUpdateLists = function (e, data) {
    var $landing = $('.wishlist-landing');

    $.spinner().start();

    $landing
        .find('.lists')
        .replaceWith(data.$lists);

    if (data.$lists.data('listNames') === '') {
        $landing.find('.lists').addClass('d-none');
        $landing.find('.wishlist-message-empty').removeClass('d-none');
    } else {
        $landing.find('.lists').removeClass('d-none');
        $landing.find('.wishlist-message-empty').addClass('d-none');
    }

    module.exports.updateModalCreateListNames();
    $.spinner().stop();
};

var eventOpenEditList = function (e, data) {
    $('#wishlistModalEditList')
        .attr({
            'data-wishlist-id': data.wishlistId,
            'data-wishlist-name': data.wishlistName
        })
        .data({
            wishlistId: data.wishlistId,
            wishlistName: data.wishlistName
        })
        .modal('show');
};

var eventOpenDeleteList = function (e, wishlistId) {
    $('#wishlistModalDeleteList')
        .attr('data-wishlist-id', wishlistId)
        .data('wishlistId', wishlistId)
        .modal('show');
};

var eventClickToggle = function (e) {
    $('.list-container .notes').toggleClass('show');
    $('.wishlist-landing-notes-text-show, .wishlist-landing-notes-text-hide').toggleClass('d-none');
};

const namePattern = /^[^<>&'"]+$/;

var addLandingEventListeners = function () {
    if ($('.wishlist-landing').length) {
        $('.wishlist-landing')
            .on('click', '.show-more-wishlists .btn', module.exports.methods.eventShowMore)
            .on('openDeleteList', module.exports.methods.eventOpenDeleteList)
            .on('openEditList', module.exports.methods.eventOpenEditList)
            .on('updateLists', module.exports.methods.eventUpdateLists)
            .on('click', '.wishlist-landing-notes-toggle', module.exports.methods.eventClickToggle)
            .on('click', '.js-wishlist-card-list-edit-modal', event => {
                event.preventDefault();
                $('.wishlist-landing').trigger('openEditList', $(event.target).data());
                setupValidation(
                    '#editProductListName',
                    '#editProductListNameHelp',
                    '.wishlist-edit-list-form',
                    namePattern
                );
            })
            .on('shown.bs.popover', '.js-show-search-form', function () {
                setTimeout(() => {
                    const $wishlistPopover = $('.wishlist-search-popover');
                    const $wishlistEmailInput = $wishlistPopover.find('#searchWishlistEmail');
                    if ($wishlistEmailInput.length) {
                        $wishlistEmailInput.trigger('focus');
                    }
                }, 50);
            });
    }
};

function createSearchResultsModal() {
    if ($('#wishlistSearchResultsModal').length !== 0) {
        $('#wishlistSearchResultsModal').remove();
    }
    var modalTemplate = `
        <div id="wishlistSearchResultsModal" class="modal fade wishlist-search-results-modal" tabindex="-1" role="dialog" aria-labelledby="wishlistSearchResultsModal">
            <div class="modal-dialog modal-scrollbody" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"></h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <ul class="wishlist-search-results"></ul>
                    </div>
                </div>
            </div>
        </div>
    `
    $('body').append(modalTemplate);
}

var searchWishlists = function () {
    if ($('.wishlist-landing').length) {
        $('body').on('click', '#searchWishlistBtn', function (event) {
            event.preventDefault();

            var $target = $(event.target);
            var url = $target.data('url');
            var $emailInput = $('#searchWishlistEmail');
            var emailValue = $emailInput.val();
            var emailPattern = $emailInput.attr('pattern');

            // form validation
            $('#searchForLists').find('.is-invalid').removeClass('is-invalid');
            if (!emailValue) {
                $emailInput.addClass('is-invalid').next('.invalid-feedback').text($emailInput.data('missing-msg'));
                return false;
            } else if (!RegExp(emailPattern).test(emailValue)) {
                $emailInput.addClass('is-invalid').next('.invalid-feedback').text($emailInput.data('pattern-mismatch-msg'));
                return false;
            }

            $.ajax({
                url: url,
                type: 'POST',
                dataType: 'json',
                data: $('#searchForLists').serialize(),
                success: function (data) {
                    if (!data.error) {
                        // set up modal
                        module.exports.methods.createSearchResultsModal();
                        var $resultsModal = $('#wishlistSearchResultsModal');
                        $resultsModal.find('.modal-title').text(data.message);
                        $resultsModal.modal('show');

                        // add search results to modal
                        var $resultsList = $resultsModal.find('.wishlist-search-results');
                        if (data.results.hits.length > 0) {
                            data.results.hits.forEach(hit => {
                                $resultsList.append(`
                                    <li class="wishlist-search-results-item">
                                        <a class="wishlist-search-results-link" href="${hit.url}">
                                            <span class="wishlist-search-results-name">${hit.name}</span>
                                            <span class="wishlist-search-results-count">(${hit.count} ${hit.countLabel})</span>
                                        </a>
                                    </li>
                                `);
                            });
                        } else {
                            $resultsList.replaceWith(`
                                <p class="wishlist-no-results">${$target.data('no-results')}</p>
                            `)
                        }
                    } else {
                        toastHelpers.methods.show('danger', data.message, true);
                    }

                    $('[data-toggle="popover"].interactive').popover('hide');
                }
            });
            return true;
        });
    }
}

/**
 * Create List Modal
 */
var createListModalEventClose = function(e) {
    $('#wishlistModalCreateList #newProductListName')
        .val('')
        .removeClass('is-invalid')
        .next('.invalid-feedback')
        .text('')
        .removeClass('d-block');
    $('.wishlist-create-list-form .create')
        .removeAttr('disabled');
};

var createListModalEventKeyupName = function(e) {
    var $this = $(this);
    var $invalidFeedback = $this.next('.invalid-feedback');
    var $submitButton = $('.wishlist-create-list-form .create');
    var name = $this.val().replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    var listNames = $('#wishlistModalCreateList').data().listNames;
    if (listNames && listNames.indexOf(name) !== -1) {
        $submitButton.attr('disabled', 'disabled');
        $invalidFeedback.text($this.data().errorDuplicateName).addClass('d-block');
        $this.addClass('is-invalid');
    } else {
        $submitButton.removeAttr('disabled');
        $invalidFeedback.text('').removeClass('d-block');
        $this.removeClass('is-invalid');
    }
};

var createListModalEventSubmitCreate = function(e) {
    e.preventDefault();
    var $this = $(this);
    var $modal = $('#wishlistModalCreateList');
    var $productListNameElement = $this.find('#newProductListName');
    var wishlistName = $productListNameElement.val();
    var landingPageSize = wishlistHelpers.getUrlParam('sz') ? Number(wishlistHelpers.getUrlParam('sz')) : null;

    if (wishlistName && wishlistName !== '') {
        $productListNameElement.removeClass('is-invalid');
        $.spinner().start();
        $.ajax({
            url: $this.data().url,
            method: 'POST',
            dataType: 'json',
            data: {
                name: wishlistName,
                view: 'landing',
                landingPageSize: landingPageSize
            },
            success: function(data) {
                var $listsHtml = $(data.renderedTemplate).find('.lists');
                if ($listsHtml.length && !data.error) {
                    $('.wishlist-landing').trigger('updateLists', {
                        $lists: $listsHtml
                    });
                } else {
                    toastHelpers.methods.show('danger', data.message, true);
                    $.spinner().stop();
                }
                $modal.modal('hide');
                $productListNameElement.val('');
            },
            error: function() {
                $modal.modal('hide');
                $productListNameElement.val('');
                $.spinner().stop();
            }
        });
        $('#wishlistModalCreateList').modal('hide');
    } else {
        $productListNameElement.addClass('is-invalid');
    }

};

var addCreateListModalEventListeners = function() {
    if ($('.wishlist-landing').length) {
        $('#wishlistModalCreateList')
            .on('submit', '.wishlist-create-list-form', module.exports.methods.createListModalEventSubmitCreate)
            .on('keyup', '#newProductListName', module.exports.methods.createListModalEventKeyupName)
            .on('hidden.bs.modal', module.exports.methods.createListModalEventClose)
            .on('shown.bs.modal', function () {
                setupValidation(
                    '#newProductListName',
                    '#newProductListNameHelp',
                    '.wishlist-create-list-form',
                    namePattern
                );
            });

    }
};

/**
 * Edit List Modal
 */
var editListModalEventShow = function(e) {
    var $this = $(this);
    $this
        .find('#editProductListName')
        .val($this.data().wishlistName);
};

var editListModalEventClose = function(e) {
    $(this)
        .removeAttr('data-wishlist-id')
        .removeAttr('data-wishlist-name')
        .removeData('wishlistId')
        .removeData('wishlistName')
        .find('#editProductListName')
        .val('&nbsp;')
        .removeClass('is-invalid')
        .next('.invalid-feedback')
        .text('')
        .removeClass('d-block');
    $('.wishlist-edit-list-form .save')
        .removeAttr('disabled');
};

var editListModalEventKeyupName = function(e) {
    var $this = $(this);
    var $invalidFeedback = $this.next('.invalid-feedback');
    var $submitButton = $('.wishlist-edit-list-form .save');
    var nameOriginal = $('#wishlistModalEditList').data('wishlistName').replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    var nameNew = $this.val().replace(/[^A-Za-z0-9]/g, '').toLowerCase();

    if (
        nameOriginal !== nameNew
        && $('#wishlistModalEditList').data().listNames.indexOf(nameNew) !== -1
    ) {
        $submitButton.attr('disabled', 'disabled');
        $invalidFeedback.text($this.data().errorDuplicateName).addClass('d-block');
        $this.addClass('is-invalid');
    } else {
        $submitButton.removeAttr('disabled');
        $invalidFeedback.text('').removeClass('d-block');
        $this.removeClass('is-invalid');
    }
};

var editListModalEventSubmitForm = function(e) {
    e.preventDefault();
    var $modal = $('#wishlistModalEditList');
    var landingPageSize = wishlistHelpers.getUrlParam('sz') ? Number(wishlistHelpers.getUrlParam('sz')) : null;
    $modal.find('.modal-content').spinner().start();
    $.ajax({
        url: $modal.data().url,
        method: 'POST',
        dataType: 'json',
        data: {
            wishlistId: $modal.data().wishlistId,
            wishlistName: $('#editProductListName').val(),
            landingPageSize: landingPageSize
        },
        success: function(data) {
            var $listsHtml = $(data.renderedTemplate).find('.lists');
            if ($listsHtml.length && !data.error) {
                $('.wishlist-landing').trigger('updateLists', {
                    $lists: $listsHtml
                });
            } else {
                toastHelpers.methods.show('danger', data.message, true);
                $modal.find('.modal-content').spinner().stop();
            }
            $modal.modal('hide');
        },
        error: function() {
            $modal.modal('hide');
            $modal.find('.modal-content').spinner().stop();
        }
    });
};

var editListModalEventClickDelete = function(e) {
    e.preventDefault();
    var $modal = $('#wishlistModalEditList');
    var wishlistId = $modal.data().wishlistId;
    $modal.modal('hide');
    $('.wishlist-landing').trigger('openDeleteList', wishlistId);
};

var editListModalAddEventListeners = function() {
    if ($('.wishlist-landing').length) {
        $('#wishlistModalEditList')
            .on('show.bs.modal', module.exports.methods.editListModalEventShow)
            .on('hidden.bs.modal', module.exports.methods.editListModalEventClose)
            .on('keyup', '#editProductListName', module.exports.methods.editListModalEventKeyupName)
            .on('submit', '.wishlist-edit-list-form', module.exports.methods.editListModalEventSubmitForm)
            .on('click', '.delete', module.exports.methods.editListModalEventClickDelete);
    }
};

/**
 * Delete List Modal
 */
var deleteListModalEventClose = function(e) {
    $(this).attr({'data-wishlist-id': ''}).data({wishlistId: ''});
};

var deleteListModalEventClickDelete = function(e) {
    e.preventDefault();
    var $modal = $('#wishlistModalDeleteList');
    var landingPageSize = wishlistHelpers.getUrlParam('sz') ? Number(wishlistHelpers.getUrlParam('sz')) : null;
    $modal.find('.modal-content').spinner().start();
    $.ajax({
        url: $modal.data().url,
        method: 'POST',
        dataType: 'json',
        data: {
            wishlistId: $modal.data().wishlistId,
            landingPageSize: landingPageSize
        },
        success: function(data) {
            var $listsHtml = $(data.renderedTemplate).find('.lists');
            if ($listsHtml.length && !data.error) {
                $('.wishlist-landing').trigger('updateLists', {
                    $lists: $listsHtml
                });
            } else {
                toastHelpers.methods.show('danger', data.message, true);
                $modal.find('.modal-content').spinner().stop();
            }
            $modal.modal('hide');
        },
        error: function() {
            $modal.find('.modal-content').spinner().stop();
            $modal.modal('hide');
        }
    });
}

var deleteListModalAddEventListeners = function() {
    if ($('.wishlist-landing').length) {
        $('#wishlistModalDeleteList')
            .on('click', '.wishlist-modal-delete-list-delete-button', module.exports.methods.deleteListModalEventClickDelete)
            .on('hidden.bs.modal', module.exports.methods.deleteListModalEventClose);
    }
};

function setupValidation(inputSelector, feedbackSelector, formSelector, pattern) {
    const $input = $(inputSelector);
    const $feedback = $(feedbackSelector);
    const patternError = $input.attr('title');

    // Blur validation
    $input.on('blur', function () {
        validate();
    });

    // Form submit validation
    $(formSelector).on('submit', function (e) {
        const isValid = validate();

        if (!isValid) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        }
    });

    // Core validation logic
    function validate() {
        const value = $input.val();
        const isValid = pattern.test(value);

        if (!isValid) {
            $input.addClass('is-invalid');
            if (value !== '') {
                $feedback.text(patternError);
            } else {
                $feedback.text('');
            }
            return false;
        } else {
            $input.removeClass('is-invalid');
            $feedback.text('');
            return true;
        }
    }
}

module.exports = {
    methods: {
        eventShowMore: eventShowMore,
        eventUpdateLists: eventUpdateLists,
        eventOpenEditList: eventOpenEditList,
        eventOpenDeleteList: eventOpenDeleteList,
        eventClickToggle: eventClickToggle,
        createSearchResultsModal: createSearchResultsModal,
        createListModalEventClose: createListModalEventClose,
        createListModalEventKeyupName: createListModalEventKeyupName,
        createListModalEventSubmitCreate: createListModalEventSubmitCreate,
        editListModalEventShow: editListModalEventShow,
        editListModalEventClose: editListModalEventClose,
        editListModalEventKeyupName: editListModalEventKeyupName,
        editListModalEventSubmitForm: editListModalEventSubmitForm,
        editListModalEventClickDelete: editListModalEventClickDelete,
        deleteListModalEventClose: deleteListModalEventClose,
        deleteListModalEventClickDelete: deleteListModalEventClickDelete
    },
    addLandingEventListeners: addLandingEventListeners,
    updateModalCreateListNames: updateModalCreateListNames,
    searchWishlists: searchWishlists,
    addCreateListModalEventListeners: addCreateListModalEventListeners,
    editListModalAddEventListeners: editListModalAddEventListeners,
    deleteListModalAddEventListeners: deleteListModalAddEventListeners
}
