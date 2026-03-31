module.exports = {
    getUrlParameter: (name, queryString) => {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(queryString);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
};
