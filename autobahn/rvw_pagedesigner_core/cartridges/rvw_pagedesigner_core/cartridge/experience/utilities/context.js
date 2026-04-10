var context = [];

module.exports = {
    addContext: function (ctx) {
        context.push(ctx);
    },
    context: context
};
