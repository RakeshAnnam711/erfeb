
const namespace = window.somorderinfoval.namespace;
const endpoint = window.somorderinfoval.endpoint;
const detailurl = window.somorderinfoval.detailurl;

const emailAddress = window.somorderinfoval.customerEmail;
const customerID = window.somorderinfoval.customerID;
const customerNo = window.somorderinfoval.customerNo;
const appName = namespace + ":SelfServiceWrapper";
const lightningEndpoint = endpoint;
const cn_orderHistory = namespace + ":orderHistory";

function orderHistory() {
    $(".account-page").spinner().start();
    let te_orderHistory = document.querySelector("[data-lightning-out]");
    let componentAttributes = {
        email: emailAddress,
        customerID: customerID,
        customerNo: customerNo,
        detailurlprefix: detailurl,
    };
    $Lightning.use(
        appName,
        function () {
            $Lightning.createComponent(
                cn_orderHistory,
                componentAttributes,
                te_orderHistory,
                function (cmp) {
                    $(".account-page").spinner().stop();
                }
            );
        },
        lightningEndpoint
    );
}


window.onload = function () {
    orderHistory();
};
