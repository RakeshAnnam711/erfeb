function authorize() {
    // Flow already authorized the payment on their hosted checkout, we need to do nothing
    return { authorized: true, error: false, authResponse: {}};
}

module.exports = {
    Authorize: authorize
}
