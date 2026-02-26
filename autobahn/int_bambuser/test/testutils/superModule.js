/**
 * sets mock superModule
 * @param {Object} mockSuperModule superModule to set
 */
module.exports.setSuperModule = function (mockSuperModule) {
    const modulePrototype = Object.getPrototypeOf(module);
    Object.defineProperty(modulePrototype, 'superModule', {
        value: mockSuperModule,
    });
};

/**
 * removes mock
 */
module.exports.removeSuperModule = function () {
    const modulePrototype = Object.getPrototypeOf(module);
    delete modulePrototype.superModule;
};
