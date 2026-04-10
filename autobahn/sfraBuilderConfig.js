'use strict';

const path = require('path');

/**
 * Allows to configure aliases for you require loading
 */
module.exports.aliasConfig = {
    // enter all aliases to configure

    alias : {
        base: path.resolve(
            process.cwd(), // eslint-disable-next-line max-len
            './storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/'
        ),
        client_core: path.resolve(
            process.cwd(), // eslint-disable-next-line max-len
            './autobahn_client_core/cartridges/autobahn_client_core/cartridge/client/default/'
        ),
        core: path.resolve(
            process.cwd(), // eslint-disable-next-line max-len
            './rvw_autobahn_core/cartridges/rvw_autobahn_core/cartridge/client/default/'
        ),
        integrations: path.resolve(
            process.cwd(), // eslint-disable-next-line max-len
            './rvw_integrations_core/cartridges/rvw_integrations_core/cartridge/client/default/'
        ),
        bopis: path.resolve(
            process.cwd(), // eslint-disable-next-line max-len
            './rvw_integrations_core/cartridges/rvw_bopis_integration/cartridge/client/default/'
        ),
        yotpo: path.resolve(
            process.cwd(), // eslint-disable-next-line max-len
            './rvw_integrations_core/cartridges/rvw_yotpo_integration/cartridge/client/default/'
        ),
        affirm: path.resolve(
            process.cwd(), // eslint-disable-next-line max-len
            './link_affirm/cartridges/int_affirm_sfra/cartridge/client/default/'
        ),
        pagedesigner: path.resolve(
            process.cwd(), // eslint-disable-next-line max-len
            './rvw_pagedesigner_core/cartridges/rvw_pagedesigner_core/cartridge/client/default/'
        ),
        globale: path.resolve(
            process.cwd(), // eslint-disable-next-line max-len
            './ink_globale/cartridges/int_globale_sfra/cartridge/client/default/'
        )
    },
    extraAliases : {
        'constants': path.resolve(
            process.cwd(), // eslint-disable-next-line max-len
            './rvw_autobahn_core/cartridges/rvw_autobahn_core/cartridge/scripts/constants/'
        ),
        'jquery': path.resolve(
            process.cwd(), // eslint-disable-next-line max-len
            './storefront-reference-architecture/node_modules/jquery'
        )
    }
}

module.exports.sites = [
    {
        name: 'autobahn_client_core',
        cartridges: [
            './autobahn_client_core/cartridges/autobahn_client_core',
            './rvw_integrations_core/cartridges/rvw_integrations_core',
            './rvw_autobahn_core/cartridges/rvw_autobahn_core',
            './rvw_pagedesigner_core/cartridges/rvw_pagedesigner_core',
            './int_bambuser/cartridges/int_bambuser',
            './link_globale/cartridges/int_globale_sfra',
            './storefront-reference-architecture/cartridges/app_storefront_base'
        ]
    }
];

module.exports.copyConfig = {
    './storefront-reference-architecture/cartridges/app_storefront_base': [
      { from: './storefront-reference-architecture/node_modules/flag-icons/flags', to: 'default/fonts/flags' },
    ],
  };
