'use strict';
var server = require('server');

server.get('ShowContent', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var Logger = require('dw/system/Logger').getLogger('AB_ContentAsset');
    var Resource = require('dw/web/Resource');
    var ContentModel = require('*/cartridge/models/content');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var renderedTemplate = '';
    var apiContent = ContentMgr.getContent(req.querystring.cid);
    if (apiContent) {
        var content = new ContentModel(apiContent, '/components/content/contentAssetBodyOnly');
        renderedTemplate = renderTemplateHelper.getRenderedHtml({content: content}, '/components/content/contentAssetBodyOnly');
    } else {
        Logger.info('Content asset with ID {0} was included but not found', req.querystring.cid);
    }

    res.json({
        renderedTemplate: renderedTemplate,
        closeButtonText: Resource.msg('label.modal.close', 'common', null),
        enterDialogMessage: Resource.msg('label.modal.dialog.message', 'common', null),
        dialogTitle: req.querystring.title
    });
    return next();
});

module.exports = server.exports();
