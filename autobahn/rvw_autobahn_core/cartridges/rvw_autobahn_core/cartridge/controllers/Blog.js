var server = require('server');

// For legacy sites, redirect to Search-ShowContent
server.get('Show', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var legacyBlogRootFolderId = Resource.msg('blog.folderid', 'components', null);
    var query = req.querystring.q || legacyBlogRootFolderId;

    res.redirect(URLUtils.url('Search-ShowContent', 'fdid', query));

    next();
});

module.exports = server.exports();
