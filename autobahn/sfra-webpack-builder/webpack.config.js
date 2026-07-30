"use strict";

const path = require("path");
const glob = require("glob");
// @Todo - replace as this is not maintained anymore
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// - cleans static folder
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
// - copy config
const WebpackCopyPlugin = require("copy-webpack-plugin");
// - linter
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const StyleLintWebpackPlugin = require("stylelint-webpack-plugin");
// Live reload
var LiveReloadPlugin = require("webpack-livereload-plugin");
// - minification
const TerserPlugin = require("terser-webpack-plugin");
// - Remove empty scssjs files
const RemoveEmptyScriptsPlugin = require("webpack-remove-empty-scripts");

//AUTOBAHN MOD add more plugins
const ProgressPlugin = require("webpack/lib/ProgressPlugin");
const ProvidePlugin = require("webpack/lib/ProvidePlugin");
const webpack = require("webpack");
const version = require("../package.json").version;

const helper = require("./helper/helper");
let sfraBuilderConfig =
  process.env.npm_lifecycle_script.indexOf("testRunner") === -1
    ? require(helper.getSfraBuilderConfig())
    : require(helper.getSfraBuilderFixtureConfig());
const webpackHelper = require("./webpackHandling/helper");

process.noDeprecation = true;

/**
 * Multicartridge webpack configuration.
 */
class WebpackBundle {
  /**
   * Scans the cartridge client side source folder and returns an
   * object with sass and javascript files.
   *
   * @param {string} cartridge - The cartridge name
   * @return {Object} - Object of sass and js files
   */
  static scanEntryPoints(cartridge, fileType) {
    const srcPath = path.resolve(
      process.env.PWD,
      cartridge,
      "cartridge/client"
    );
    const srcSCSSPath = path.join(srcPath, "*", "scss", "**", "*.scss");
    const srcJSPath = path.join(srcPath, "*", "js", "**", "*.js");
    //AUTOBAHN MOD we also compile /custom
    const srcJSCustomPath = path.join(srcPath, "*", "custom", "**", "*.js");
    const srcJSXPath = path.join(srcPath, "*", "js", "**", "*.jsx");
    let files = {};

    // Scan scss files
    if (fileType === "scss") {
      glob
        .sync(srcSCSSPath)
        .filter((source) => !path.basename(source).startsWith("_"))
        .forEach((source) => {
          let sourceRelativePath = path.dirname(path.relative(srcPath, source));
          sourceRelativePath = sourceRelativePath.split(path.sep);
          sourceRelativePath[1] = sourceRelativePath[1].replace("scss", "css");
          sourceRelativePath = sourceRelativePath.join(path.sep);
          const sourceName = path.basename(source);
          const outputFile = path
            .join(sourceRelativePath, sourceName)
            .split(path.sep)
            .join(path.posix.sep)
            .replace(".scss", ".scssjs"); // Webpack always create the output file
          files[outputFile] = source;
        });
    }

    // Scan js files
    if (fileType === "js") {
      glob
        .sync(srcJSPath)
        .filter((source) => {
          var includeJS = !path.basename(source).startsWith("_");
          if (sfraBuilderConfig.excludeJS && sfraBuilderConfig.excludeJS[cartridge]
            && sfraBuilderConfig.excludeJS[cartridge].indexOf(path.basename(source)) !== -1) {
            console.log(`Excluding js file from compile: ${source}`);
            includeJS = false;
          }
          return includeJS;
        })
        .forEach((source) => {
          const sourceRelativePath = path.dirname(
            path.relative(srcPath, source)
          );
          const sourceName = path.basename(source);
          const outputFile = path
            .join(sourceRelativePath, sourceName)
            .split(path.sep)
            .join(path.posix.sep);
          files[outputFile] = source;
        });

      // AUTOBAHN MOD compile /custom
      glob
        .sync(srcJSCustomPath)
        .filter((source) => {
          var includeJS = !path.basename(source).startsWith("_");
          if (sfraBuilderConfig.excludeJS && sfraBuilderConfig.excludeJS[cartridge]
            && sfraBuilderConfig.excludeJS[cartridge].indexOf(path.basename(source)) !== -1) {
            console.log(`Excluding js file from compile: ${source}`);
            includeJS = false;
          }
          return includeJS;
        })
        .forEach((source) => {
          const sourceRelativePath = path.dirname(
            path.relative(srcPath, source)
          );
          const sourceName = path.basename(source);
          const outputFile = path
            .join(sourceRelativePath, sourceName)
            .split(path.sep)
            .join(path.posix.sep);
          files[outputFile] = source;
        });
    }

    // Scan jsx files
    if (fileType === "jsx") {
      // Scan jsx files. The output file will copy to static/default/js folder.
      glob
        .sync(srcJSXPath)
        .filter((source) => !path.basename(source).startsWith("_"))
        .forEach((source) => {
          const sourceRelativePath = path.dirname(
            path.relative(srcPath, source)
          );
          const sourceName = path.basename(source);
          const outputFile = path
            .join(
              sourceRelativePath.replace("jsx", "js"),
              sourceName.replace(".jsx", ".js")
            )
            .split(path.sep)
            .join(path.posix.sep);
          files[outputFile] = source;
        });
    }
    return files;
  }

  /**
   * Plugins based on the filetype.
   * @param {string} cartridge - The cartridge path
   * @param {string} fileType - determines compilation type
   * @param {boolean} isDevelopment - determines compile mode
   * @return {array} - Array of Plugins
   */
  static getPlugins(cartridge, fileType, env) {
    var plugins = [];
    if (
      fileType === "copy" &&
      sfraBuilderConfig.copyConfig &&
      sfraBuilderConfig.copyConfig[cartridge]
    ) {
      plugins.push(
        new WebpackCopyPlugin({
          patterns: sfraBuilderConfig.copyConfig[cartridge],
        })
      );
    }
    if (fileType === "clean") {
        // AUTOBAHN MOD conditional css clean
      if (env.noSCSS !== true) {
        plugins.push(
            new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ["*/css"],
            verbose: false,
            })
        );
      }
      // AUTOBAHN MOD conditional js and custom clean
      if (env.noJS !== true) {
        plugins.push(
            new CleanWebpackPlugin({
            // AUTOBAHN MOD clean /custom but not /fonts
            cleanOnceBeforeBuildPatterns: ["*/js", "*/custom"],
            verbose: false,
            })
        );
      }
    }
    if ((fileType === "js" || fileType === "jsx") && env.useLinter) {
      plugins.push(
        new ESLintWebpackPlugin({
          files: `${cartridge}/cartridge/client`,
          exclude: [
            "node_modules",
            sfraBuilderConfig.sfraFolderName ||
              "storefront-reference-architecture",
          ],
          fix:
            sfraBuilderConfig.lintConfig &&
            sfraBuilderConfig.lintConfig.eslintFix,
        })
      );
    }
    if ((fileType === "scss" || fileType === "jsx") && env.useLinter) {
      plugins.push(
        new StyleLintWebpackPlugin({
          files: `${cartridge}/cartridge/client`,
          exclude: [
            "node_modules",
            sfraBuilderConfig.sfraFolderName ||
              "storefront-reference-architecture",
          ],
          fix:
            sfraBuilderConfig.lintConfig &&
            sfraBuilderConfig.lintConfig.stylelintFix,
        })
      );
    }
    if (fileType === "scss") {
      plugins.push(
        new MiniCssExtractPlugin({
          filename: (pathData) =>
            pathData.chunk.name.replace(/\.scssjs$/, ".css"),
        }),
        new RemoveEmptyScriptsPlugin({ remove: /\.scssjs$/ })
      );
    }
    if (fileType === "jsx") {
      plugins.push(
        new MiniCssExtractPlugin({
          filename: (pathData) =>
            pathData.chunk.name
              .replace("/js/", "/css/")
              .replace(/\.js$/, ".css"),
        }),
        new RemoveEmptyScriptsPlugin({ remove: /\.scssjs$/ })
      );
    }
    if (
      env.livereload &&
      (fileType === "js" || fileType === "jsx" || fileType === "scss")
    ) {
      plugins.push(
        new LiveReloadPlugin({
          ignore: ["**/client/", "*.map"], // We listen only on compiled files
          liveCSS: false,
          liveImg: false,
          useSourceHash: true, // useSourceSize is faster than useSourceHash but but it has a downside. If file size hasn't changed no reload is triggered. For example if color has changed from #000000 to #ffffff no reload will be triggered!)
        })
      );
    }

    // AUTOBAHN MOD andd progress, banner, and provide plugin (provide is for cybersource resolve fallback config below)
    plugins.push(new ProgressPlugin({
        activeModules: true,
        entries: true,
        modules: true,
        modulesCount: 5000,
        profile: false,
        dependencies: true,
        dependenciesCount: 10000,
        percentBy: null,
    }));

    plugins.push(new webpack.BannerPlugin({
        banner: 'ab v' + version,
        include: /(.*\.js)|(.*\.css)/g
    }));

    //AUTOBAHN MOD add fallbacks for cybersource require('crypto')
    plugins.push(new ProvidePlugin({
        process: 'process/browser',
        Buffer: ["buffer", "Buffer"],
    }));

    return plugins;
  }

  /**
   * @typedef {{base: string}} alias
   */

  /**
   * Webpack uses aliases for module resolving, we build this dynamically so the same alias
   * can be used for a different file type
   * @param {Object} cartridgeAliases - Aliases which are avaible for module resolution
   * @param {string} fileType - JS/JSX or scss
   * @returns {Object} More dynamic aliases
   */
  static buildDynamicAliases(cartridgeAliases, fileType) {
    let aliases = {};
    // AUTOBAHN MOD support .alias and .extraAliases
    let aliasKeys = Object.keys(cartridgeAliases.alias);
    aliasKeys.forEach((key) => {
      aliases[key] = cartridgeAliases.alias[key] + "/" + fileType;
    });

    if ('extraAliases' in cartridgeAliases) {
        Object.assign(aliases, cartridgeAliases.extraAliases);
    }
    return aliases;
  }

  /**
   * @typedef {{dev: boolean, useLinter: boolean}} env
   */

  /**
   * Returns the webpack config object tree.
   * @param {Object} env - Environment variable which can be passed through commandline
   * @param {string} cartridge - The cartridge name
   * @param {string} fileType - The file type
   * @return {Object} - Webpack config
   */
  static bundleCartridge(env = {}, cartridge, fileType, site) {
    let entryFiles = this.scanEntryPoints(cartridge, fileType);
    console.log("bundleCartridge " + cartridge + " \nfileType " + fileType);
    if (
      fileType !== "clean" &&
      fileType !== "copy" &&
      Object.keys(entryFiles).length === 0
    ) {
      console.error(
        `Entry not found - please check if ${fileType} folder exist in your cartridge : ${cartridge}`
      );
      return null;
    }

    if (
      Object.keys(sfraBuilderConfig.aliasConfig).length === 0 ||
      Object.keys(sfraBuilderConfig.aliasConfig.alias).length === 0
    ) {
      console.error(
        "Alias config missing - needed for SFRA to compile - exiting"
      );
      return null;
    }

    const outputPath = path.resolve(
      process.env.PWD,
      cartridge,
      "cartridge",
      "static"
    );
    console.log("outputPath " + outputPath);
    let ruleSet = webpackHelper.buildRuleSet(
      process.env.PWD,
      cartridge,
      env,
      fileType
    );
    let plugins = this.getPlugins(cartridge, fileType, env);
    let modulePaths = ["node_modules"];
    const aliases = this.buildDynamicAliases(
      sfraBuilderConfig.aliasConfig,
      fileType
    );
    // loop through all cartridges for node_modules lookup
    // this allows to require node_modules from every plugin, regardless if those
    // modules are installed in the given plugin
    sfraBuilderConfig.sites.forEach((site) => {
        site.cartridges.forEach((includeCartridges) => {
            modulePaths.push(
            path.resolve(includeCartridges.split("cartridges")[0], "node_modules")
            );
        });
    });

    var result = {
      mode: env.dev === true ? "development" : "production",
      // AUTOBAHN MOD always use top level cartridge as root name
      name: site.cartridges[0] + "/" + (fileType === "jsx" ? "js" : fileType),
      stats: { children: env.dev === true },
      entry: entryFiles,
      output: {
        path: outputPath,
        filename: "[name]",
      },
      resolve: {
        alias: aliases,
        modules: modulePaths,
        // AUTOBAHN MOD add fallbacks for cybersource require('crypto')
        fallback: {
            "crypto": require.resolve("crypto-browserify"),
            "buffer": require.resolve("buffer"),
            "stream": require.resolve("stream-browserify"),
            "vm": require.resolve("vm-browserify")
        }
      },
      resolveLoader: {
        modules: [helper.getNodeModulesFolder(env, "")],
      },
      module: {
        rules: ruleSet,
      },
      plugins: plugins,
      devtool: env.devtoolsourcemap === true ? "source-map" : "eval",
      cache: true,
      optimization: {
        minimize: !(env.dev === true),
        minimizer: [new TerserPlugin()],
      },
      // AUTOBAHN MOD add extra logging
      infrastructureLogging: {
        level: 'verbose'
      }
    };

    return result;
  }
}

// default export function
module.exports = (env) => {
  let bundlesFiles = [];
  if (env.testRunner) {
    return invoketestRunner();
  }
  // AUTOBAHN MOD support multiple site compilation
  sfraBuilderConfig.sites.forEach((site) => {
    site.cartridges.forEach((cartridge) => {
        // AUTOBAHN MOD conditionally include clean for segmented builds
        if (env.noClean !== true) {
            bundlesFiles.push(WebpackBundle.bundleCartridge(env, cartridge, "clean", site));
        }
        // AUTOBAHN MOD we don't use jsx
        // bundlesFiles.push(WebpackBundle.bundleCartridge(env, cartridge, "jsx", site));

        // AUTOBAHN MOD conditionally include js for segmented builds
        if (env.noJS !== true) {
            bundlesFiles.push(WebpackBundle.bundleCartridge(env, cartridge, "js", site));
        }

        // AUTOBAHN MOD conditionally include js for segmented builds
        if (env.noSCSS !== true) {
            bundlesFiles.push(WebpackBundle.bundleCartridge(env, cartridge, "scss", site));
        }

        // AUTOBAHN MOD conditionally include js for segmented builds
        if (env.noCopy !== true) {
            bundlesFiles.push(WebpackBundle.bundleCartridge(env, cartridge, "copy", site));
        }
      });
  });

  return bundlesFiles.filter((bundleFiles) => !!bundleFiles);
};

// exposed for testability
module.exports.getPlugins = WebpackBundle.getPlugins;
module.exports.buildDynamicAliases = WebpackBundle.buildDynamicAliases;
module.exports.scanEntryPoints = WebpackBundle.scanEntryPoints;
module.exports.bundleCartridge = WebpackBundle.bundleCartridge;

/**
 * testRunner allows to run the webpack config in testable context
 */
function invoketestRunner() {
  let bundlesFiles = [];
  let sfraBuilderConfigFake = require("./webpackHandling/fixture_sfraBuilderConfig");
  let env = {};
  env.dev = false;
  env.testRunner = true;
  sfraBuilderConfigFake.cartridges.forEach((cartridge) => {
    bundlesFiles.push(WebpackBundle.bundleCartridge(env, cartridge, "js"));
    bundlesFiles.push(WebpackBundle.bundleCartridge(env, cartridge, "scss"));
  });
  return bundlesFiles;
}
