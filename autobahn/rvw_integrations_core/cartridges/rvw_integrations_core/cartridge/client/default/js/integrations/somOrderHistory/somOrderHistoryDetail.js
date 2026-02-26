
const namespace = window.somorderinfoval.namespace;
const endpoint = window.somorderinfoval.endpoint;

const appName = namespace + ":SelfServiceWrapper";
const orderDetail = namespace + ":orderDetail";

const orderInfoDetail = namespace + ":orderDetailCard";
const orderProductInfoCard = namespace + ":productInformationCard";
const lightningEndpoint = endpoint;

let orderNo = window.somorderinfoval.orderno;

function showOrderDetail() {
    $("#som-orderDetail").spinner().start();

    let targetElement = document.querySelector("[data-order-detail-info]");

    let componentAttributes = {
        orderNo: orderNo,
    };

    $Lightning.use(
        appName,
        function () {
            $Lightning.createComponent(
                orderDetail,
                componentAttributes,
                targetElement,
                function (cmp) {
                    $("#som-orderDetail").spinner().stop();
                }
            );
        },
        lightningEndpoint
    );
}

window.onload = function () {
    showOrderDetail();
};
