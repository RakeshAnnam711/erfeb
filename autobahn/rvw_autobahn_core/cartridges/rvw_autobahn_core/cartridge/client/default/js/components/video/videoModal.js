'use strict';

// WGACA MODIFICATION minor structure changes <h5> to <div>
// const ModalTemplate =   `<div id="videoModal" class="video-modal modal fade" tabindex="-1" role="dialog" aria-labelledby="videoModal">
//                             <div class="modal-dialog modal-lg" role="document">
//                                 <div class="modal-content">
//                                     <div class="modal-header">
//                                         <h5 class="modal-title"></h5>
//                                         <button type="button" class="close" data-dismiss="modal" aria-label="Close">
//                                             <span aria-hidden="true">&times;</span>
//                                         </button>
//                                     </div>
//                                     <div class="modal-body"></div>
//                                 </div>
//                             </div>
//                         </div>`;

const ModalTemplate =   `<div id="videoModal" class="video-modal modal fade" tabindex="-1" role="dialog" aria-labelledby="videoModal">
                            <div class="modal-dialog modal-lg" role="document">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <div class="modal-title"></div>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body"></div>
                                </div>
                            </div>
                        </div>`;

const ModalStates = {
    NOT_READY: 0,
    READY: 1,
    OPEN: 2,
    CLOSED: 3
};

module.exports = (() => {
    var myState = ModalStates.NOT_READY;
    var currentVideo = '';

    if (!$('#videoModal').length) {
        $(ModalTemplate).appendTo('body');
        myState = ModalStates.READY;
    }

    const $modal = $('#videoModal');

    return {
        States: ModalStates,

        launch: (player) => {
            $modal.detach().appendTo('body'); // keep video modal on top of any other open modals

            //test if modal is already in use
            if (myState === ModalStates.OPEN) {
                console.error('Cannot launch' + player.id + ', Modal is already in use for: ' + currentVideo);
            } else {
                $modal.on('show.bs.modal', () => {
                    if(typeof player.getShowEventHandler === 'function') {
                        player.getShowEventHandler();
                    }
                    myState = ModalStates.OPEN;
                    currentVideo = player.id;

                }).on('shown.bs.modal', () => {
                    if(typeof player.getShownEventHandler === 'function') {
                        player.getShownEventHandler();
                    }

                }).on('hide.bs.modal', () => {
                    if(typeof player.getHideEventHandler === 'function') {
                        player.getHideEventHandler();
                    }
                    myState = ModalStates.CLOSED;

                }).on('hidden.bs.modal', () => {
                    if(typeof player.getHiddenEventHandler === 'function') {
                        player.getHiddenEventHandler();
                    }

                    $modal.modal('dispose');
                }).modal();
            }
        },

        setState: (state) => {
            if (ModalStates[state]) {
                myState = state;
            }
        },

        getState: () => myState,

        is: (state) => (myState === state),

        getModalObj: () => $modal
    };
})();
