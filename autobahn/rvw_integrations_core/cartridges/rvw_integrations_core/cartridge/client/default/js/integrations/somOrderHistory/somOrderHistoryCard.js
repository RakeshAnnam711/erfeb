
const namespace = window.somorderinfoval.namespace;
const endpoint = window.somorderinfoval.endpoint;

const emailAddress = window.somorderinfoval.customerEmail;
const customerID = window.somorderinfoval.customerID;
const customerNo = window.somorderinfoval.customerNo;
const appName = namespace + ":SelfServiceWrapper";
const lightningEndpoint = endpoint;
const cn_orderHistoryCard = namespace + ":orderHistoryCard";


function orderHistoryCard() {
    $("#som-orderHistoryCard").spinner().start();
    let te_orderHistoryCard = document.querySelector("[data-history-card");
    let componentAttributes = {
        email: emailAddress,
        customerID: customerID,
        customerNo: customerNo
    };

    $Lightning.use(
        appName,
        function () {
            $Lightning.createComponent(
                cn_orderHistoryCard,
                componentAttributes,
                te_orderHistoryCard,
                function (cmp) {
                    $("#som-orderHistoryCard").spinner().stop();
                }
            );
        },
        lightningEndpoint
    );
}

window.onload = function () {
    orderHistoryCard();
};
