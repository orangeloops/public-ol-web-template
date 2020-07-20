"use strict";

const _ = require("lodash");
const chalk = require("chalk");
const helper = require("./helper");
const nodeExternals = require("webpack-node-externals");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const CircularDependencyPlugin = require("circular-dependency-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");
const MomentLocalesPlugin = require("moment-locales-webpack-plugin");
const MomentTimezoneDataPlugin = require("moment-timezone-data-webpack-plugin");
const PreloadWebpackPlugin = require("preload-webpack-plugin");
const WebpackNotifierPlugin = require("webpack-notifier");
const sassJSONImporter = require("node-sass-json-importer");

const fs = require("fs-extra");
const path = require("path");
const webpack = require("webpack");
const resolve = require("resolve");
const PnpWebpackPlugin = require("pnp-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const safePostCssParser = require("postcss-safe-parser");
const ManifestPlugin = require("webpack-manifest-plugin");
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
const WatchMissingNodeModulesPlugin = require("react-dev-utils/WatchMissingNodeModulesPlugin");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
const paths = require("./paths");
const modules = require("./modules");
const getClientEnvironment = require("./env");
const ModuleNotFoundPlugin = require("react-dev-utils/ModuleNotFoundPlugin");
const ForkTsCheckerWebpackPlugin = require("react-dev-utils/ForkTsCheckerWebpackPlugin");
const typescriptFormatter = require("react-dev-utils/typescriptFormatter");

const appPackageJson = require(paths.appPackageJson);

const isBundleTypeLibrary = process.env.BUNDLE_TYPE === "library";
const isBundleTypeApp = !isBundleTypeLibrary;

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = isBundleTypeApp && process.env.GENERATE_SOURCEMAP !== "false";
// Some apps do not need the benefits of saving a web request, so not inlining the chunk
// makes for a smoother build process.
const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== "false";

// Check if TypeScript is setup
const useTypeScript = fs.existsSync(paths.appTsConfig);

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

const sassResources = [paths.resolveApp("src/assets/stylesheets/abstracts/_variables.scss"), paths.resolveApp("src/assets/stylesheets/abstracts/_functions.scss"), paths.resolveApp("src/assets/stylesheets/abstracts/_mixins.scss")];

const webpackConfig = process.env.WEBPACK_CONFIG ? require(paths.resolveApp(process.env.WEBPACK_CONFIG)) : {plugins: {}};

const currentYear = new Date().getFullYear();

const mergeWithCustomizer = (value, sourceValue, key) => {
  return _.isArray(value) ? sourceValue : undefined;
};

// This is the production and development configuration.
// It is focused on developer experience, fast rebuilds, and a minimal bundle.
module.exports = function (webpackEnv) {
  const isEnvCI = process.env.CI === "true";
  const isEnvStorybook = webpackEnv === "storybook";
  const isEnvDevelopment = webpackEnv === "development" || isEnvStorybook;
  const isEnvProduction = webpackEnv === "production";

  const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || isEnvDevelopment ? 1 : 1024 * 8);

  // Variable used for enabling profiling in Production
  // passed into alias object. Uses a flag if passed into the build command
  const isEnvProductionProfile = isEnvProduction && process.argv.includes("--profile");

  // We will provide `paths.publicUrlOrPath` to our app
  // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
  // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
  // Get environment variables to inject into our app.
  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  process.env.PACKAGE_VERSION = env.raw.PACKAGE_VERSION;
  process.env.SDK_VERSION = env.raw.SDK_VERSION;

  console.log(chalk.blue(JSON.stringify(env.raw, null, 2)));

  const baseStylesheetsConfig = require("./stylesheets.config");
  const stylesheetsConfig = process.env.STYLESHEETS_CONFIG ? _.mergeWith(baseStylesheetsConfig, require(paths.resolveApp(process.env.STYLESHEETS_CONFIG)), mergeWithCustomizer) : baseStylesheetsConfig;

  const baseHtmlConfig = require("./html.config")(env.raw);
  const customHtmlConfig = process.env.HTML_CONFIG ? require(paths.resolveApp(process.env.HTML_CONFIG))(env.raw, baseHtmlConfig) : undefined;

  const htmlConfig = customHtmlConfig ? _.mergeWith(baseHtmlConfig, customHtmlConfig, mergeWithCustomizer) : baseHtmlConfig;
  const htmlHelper = require("./html.helper")(env.raw, htmlConfig);

  // common function to get style loaders
  const getStyleLoaders = (cssOptions, preProcessors, stylelint = true) => {
    const loaders = [
      !isEnvStorybook && isEnvDevelopment && require.resolve("style-loader"),
      (isEnvStorybook || isEnvProduction) && {
        loader: MiniCssExtractPlugin.loader,
        // css is located in `static/css`, use "../../" to locate index.html folder
        // in production `paths.publicUrlOrPath` can be a relative path
        options: paths.publicUrlOrPath.startsWith(".") ? {publicPath: "../../"} : {},
      },
      {
        loader: require.resolve("css-loader"),
        options: {
          ...stylesheetsConfig.cssLoader.options,
          sourceMap: isEnvProduction && shouldUseSourceMap,
          importLoaders: 1 + (preProcessors ? preProcessors.length : 0),
          ...cssOptions,
        },
      },
      {
        // Options for PostCSS as we reference these options twice
        // Adds vendor prefixing based on your specified browser support in
        // package.json
        loader: require.resolve("postcss-loader"),
        options: {
          ...stylesheetsConfig.postcssLoader.options(!isEnvCI && stylelint),
          sourceMap: isEnvProduction && shouldUseSourceMap,
        },
      },
    ].filter(Boolean);
    if (preProcessors) {
      preProcessors.forEach((preProcessor) => loaders.push(preProcessor));
    }
    return loaders;
  };

  const htmlMinifyOptions = {
    // https://github.com/kangax/html-minifier#options-quick-reference
    removeComments: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    removeStyleLinkTypeAttributes: true,
    keepClosingSlash: true,
    minifyJS: true,
    minifyCSS: true,
    minifyURLs: true,
  };

  const svgoOptions = {
    // https://github.com/svg/svgo#what-it-can-do
    plugins: [{removeTitle: true}, {removeDesc: true}],
  };

  return {
    mode: isEnvProduction ? "production" : isEnvDevelopment && "development",
    // Stop compilation early in production
    bail: isEnvProduction,
    devtool: isEnvProduction ? (shouldUseSourceMap ? "source-map" : false) : isEnvDevelopment && "cheap-module-source-map",
    // These are the "entry points" to our application.
    // This means they will be the "root" imports that are included in JS bundle.
    entry: [
      // Include an alternative client for WebpackDevServer. A client's job is to
      // connect to WebpackDevServer by a socket and get notified about changes.
      // When you save a file, the client will either apply hot updates (in case
      // of CSS changes), or refresh the page (in case of JS changes). When you
      // make a syntax error, this client will display a syntax error overlay.
      // Note: instead of the default WebpackDevServer client, we use a custom one
      // to bring better experience for Create React App users. You can replace
      // the line below with these two lines if you prefer the stock client:
      // require.resolve('webpack-dev-server/client') + '?/',
      // require.resolve('webpack/hot/dev-server'),
      isEnvDevelopment && require.resolve("react-dev-utils/webpackHotDevClient"),
      // Finally, this is your app's code:
      paths.appIndex,
      // We include the app code last so that if there is a runtime error during
      // initialization, it doesn't blow up the WebpackDevServer client, and
      // changing JS code would still trigger a refresh.
    ].filter(Boolean),
    output: {
      // The build folder.
      path: isEnvProduction && isBundleTypeApp ? paths.appBuild : paths.appTemp,
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: isEnvDevelopment,
      // There will be one main bundle, and one file per asynchronous chunk.
      // In development, it does not produce real files.
      filename: isBundleTypeLibrary ? "[name].js" : `static/js/[name]${isEnvProduction ? ".[chunkhash:8]" : ""}.js`,
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: isBundleTypeLibrary ? "[name].js" : `static/js/[name]${isEnvProduction ? ".[chunkhash:8]" : ""}.chunk.js`,
      // We inferred the "public path" (such as / or /my-project) from homepage.
      // We use "/" in development.
      publicPath: paths.publicUrlOrPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: isEnvProduction ? (info) => path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, "/") : isEnvDevelopment && ((info) => path.resolve(info.absoluteResourcePath).replace(/\\/g, "/")),
      // Prevents conflicts when multiple webpack runtimes (from different apps)
      // are used on the same page.
      jsonpFunction: `webpackJsonp${appPackageJson.name}`,
      // this defaults to 'window', but by setting it to 'this' then
      // module chunks which are built will work in web workers as well.
      globalObject: "this",
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            parse: {
              // We want terser to parse ecma 8 code. However, we don't want it
              // to apply any minification steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              // Disabled because of an issue with Uglify breaking seemingly valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              // Disabled because of an issue with Terser breaking valid code:
              // https://github.com/facebook/create-react-app/issues/5250
              // Pending further investigation:
              // https://github.com/terser-js/terser/issues/120
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            // Added for profiling in devtools
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            output: {
              ecma: 5,
              comments: false,
              // Turned on because emoji and regex is not minified properly using default
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true,
            },
          },
          // Use multi-process parallel running to improve the build speed
          // Default number of concurrent runs: os.cpus().length - 1
          parallel: true,
          // Enable file caching
          cache: true,
          sourceMap: shouldUseSourceMap,
        }),
        // This is only used in production mode
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            parser: safePostCssParser,
            map: shouldUseSourceMap
              ? {
                  // `inline: false` forces the sourcemap to be output into a
                  // separate file
                  inline: false,
                  // `annotation: true` appends the sourceMappingURL to the end of
                  // the css file, helping the browser find the sourcemap
                  annotation: true,
                }
              : false,
          },
          cssProcessorPluginOptions: {
            preset: ["default", {minifyFontValues: {removeQuotes: false}, mergeLonghand: false}], // https://github.com/cssnano/cssnano/issues/675
          },
        }),
      ],
      // Automatically split vendor and commons
      // https://twitter.com/wSokra/status/969633336732905474
      // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
      ...(isBundleTypeLibrary
        ? {
            splitChunks: false,
            runtimeChunk: false,
          }
        : {
            splitChunks: {
              chunks: "all",
            },
            // Keep the runtime chunk separated to enable long term caching
            // https://twitter.com/wSokra/status/969679223278505985
            // https://github.com/facebook/create-react-app/issues/5358
            runtimeChunk: {
              name: (entrypoint) => `runtime-${entrypoint.name}`,
            },
          }),
    },
    resolve: {
      // This allows you to set a fallback for where webpack should look for modules.
      // We placed these paths second because we want `node_modules` to "win"
      // if there are any conflicts. This matches Node resolution mechanism.
      // https://github.com/facebook/create-react-app/issues/253
      modules: ["node_modules", paths.appNodeModules].concat(modules.additionalModulePaths || []),
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebook/create-react-app/issues/290
      // `web` extension prefixes have been added for better support
      // for React Native Web.
      extensions: paths.moduleFileExtensions.map((ext) => `.${ext}`).filter((ext) => useTypeScript || !ext.includes("ts")),
      alias: {
        assets: paths.appAssets,
        appAssets: paths.appAssets,

        // https://www.contentful.com/blog/2017/10/27/put-your-webpack-bundle-on-a-diet-part-3/
        "lodash-es": "lodash",
        "lodash._getnative": "lodash/_getNative",
        "lodash.camelcase": "lodash/camelCase",
        "lodash.debounce": "lodash/debounce",
        "lodash.isarguments": "lodash/isArguments",
        "lodash.isarray": "lodash/isArray",
        "lodash.isfinite": "lodash/isFinite",
        "lodash.keys": "lodash/keys",
        "lodash.merge": "lodash/merge",
        "lodash.throttle": "lodash/throttle",

        mobx: paths.appNodeModules + "/mobx/lib/mobx.es6.js",

        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        "react-native": "react-native-web",
        // Allows for better profiling with ReactDevTools
        ...(isEnvProductionProfile && {
          "react-dom$": "react-dom/profiling",
          "scheduler/tracing": "scheduler/tracing-profiling",
        }),
        ...(modules.webpackAliases || {}),
      },
      plugins: [
        // Adds support for installing with Plug'n'Play, leading to faster installs and adding
        // guards against forgotten dependencies and such.
        PnpWebpackPlugin,
        // Prevents users from importing files from outside of src/ (or node_modules/).
        // This often causes confusion because we only process files within src/ with babel.
        // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
        // please link the files into your node_modules/ and let module-resolution kick in.
        // Make sure your source files are compiled, as they will not be processed in any way.
        new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson]),
      ],
    },
    resolveLoader: {
      plugins: [
        // Also related to Plug'n'Play, but this time it tells webpack to load its loaders
        // from the current package.
        PnpWebpackPlugin.moduleLoader(module),
      ],
    },
    module: {
      strictExportPresence: false,
      rules: [
        // Disable require.ensure as it's not a standard language feature.
        {parser: {requireEnsure: false}},

        // First, run the linter.
        // It's important to do this before Babel processes the JS.
        {
          test: /\.(js|mjs|jsx|ts|tsx)$/,
          enforce: "pre",
          use: [
            {
              loader: require.resolve("eslint-loader"),
              options: {
                configFile: ".eslintrc.js",
                cache: true,
                formatter: require.resolve("react-dev-utils/eslintFormatter"),
                eslintPath: require.resolve("eslint"),
                resolvePluginsRelativeTo: __dirname,
                quiet: isEnvCI,
              },
            },
          ],
          include: paths.appSrc,
        },
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.
          oneOf: [
            // "url" loader works like "file" loader except that it embeds assets
            // smaller than specified limit in bytes as data URLs to avoid requests.
            // A missing `test` is equivalent to a match.
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.wav$/],
              use: [
                {
                  loader: require.resolve("url-loader"),
                  options: {
                    limit: imageInlineSizeLimit,
                    name: "static/media/[name].[hash:8].[ext]",
                    emitFile: isBundleTypeApp,
                    esModule: false,
                  },
                },
                {
                  loader: require.resolve("image-webpack-loader"),
                  options: {
                    disable: isEnvDevelopment,
                  },
                },
              ],
            },
            {
              test: /\.icon\.svg$/,
              use: [
                {
                  loader: require.resolve("@svgr/webpack"),
                  options: {
                    icon: true,
                    svgo: isBundleTypeApp,
                    svgoConfig: svgoOptions,
                  },
                },
              ],
            },
            {
              test: /\.svg$/,
              use: [
                {
                  loader: require.resolve("svg-url-loader"),
                  options: {
                    limit: isEnvDevelopment ? 1 : 1024 * 4,
                    name: "static/media/[name].[hash:8].[ext]",
                    encoding: "base64",
                    stripdeclarations: true,
                  },
                },
                {
                  loader: require.resolve("image-webpack-loader"),
                  options: {
                    disable: isEnvDevelopment,
                    svgo: {
                      enabled: isBundleTypeApp,
                      ...svgoOptions,
                    },
                  },
                },
              ],
            },
            {
              test: /\.(eot|otf|ttf|woff|woff2)$/,
              loader: require.resolve("file-loader"),
              options: {
                name: "static/media/[name].[hash:8].[ext]",
                emitFile: isBundleTypeApp,
              },
            },
            {
              test: /\.(graphql|gql)$/,
              loader: require.resolve("graphql-tag/loader"),
            },
            // Process application JS with Babel.
            // The preset includes JSX, Flow, TypeScript and some ESnext features.
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: [paths.appSrc],
              loader: require.resolve("babel-loader"),
              options: {
                configFile: paths.resolveApp(".babelrc.js"),
                customize: require.resolve("babel-preset-react-app/webpack-overrides"),

                plugins: [
                  [
                    require.resolve("babel-plugin-named-asset-import"),
                    {
                      loaderMap: {
                        svg: {
                          ReactComponent: "@svgr/webpack?-prettier,-svgo,+titleProp,+ref![path]",
                        },
                      },
                    },
                  ],
                ],
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: true,
                // See #6846 for context on why cacheCompression is disabled
                cacheCompression: false,
                compact: isEnvProduction,
              },
            },
            // Process any JS outside of the app with Babel.
            // Unlike the application JS, we only compile the standard ES features.
            {
              test: /\.(js|mjs)$/,
              exclude: [/@babel(?:\/|\\{1,2})runtime/, /core-js/],
              loader: require.resolve("babel-loader"),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: [[require.resolve("babel-preset-react-app/dependencies"), {helpers: true}]],
                cacheDirectory: true,
                // See #6846 for context on why cacheCompression is disabled
                cacheCompression: false,

                // Babel sourcemaps are needed for debugging into node_modules
                // code.  Without the options below, debuggers like VSCode
                // show incorrect code and set breakpoints on the wrong lines.
                sourceMaps: shouldUseSourceMap,
                inputSourceMap: shouldUseSourceMap,
              },
            },
            {
              test: /\.less$/,
              oneOf: [
                {
                  exclude: /antd\/(dist|es)/,
                  use: getStyleLoaders(
                    {},
                    [
                      {
                        loader: require.resolve("less-loader"),
                        options: {
                          sourceMap: isEnvProduction && shouldUseSourceMap,
                          lessOptions: {
                            javascriptEnabled: true,
                          },
                        },
                      },
                    ],
                    false
                  ),
                },
                {
                  include: /antd\/(dist|es)/,
                  use: getStyleLoaders(
                    {},
                    [
                      {
                        loader: require.resolve("less-loader"),
                        options: {
                          sourceMap: isEnvProduction && shouldUseSourceMap,
                          lessOptions: {
                            modifyVars: stylesheetsConfig.antd.variables,
                            javascriptEnabled: true,
                          },
                        },
                      },
                    ],
                    false
                  ),
                },
              ],
            },
            // "postcss" loader applies autoprefixer to our CSS.
            // "css" loader resolves paths in CSS and adds assets as dependencies.
            // "style" loader turns CSS into JS modules that inject <style> tags.
            // In production, we use MiniCSSExtractPlugin to extract that CSS
            // to a file, but in development "style" loader enables hot editing
            // of CSS.
            // By default we support CSS Modules with the extension .module.css
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({}),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // using the extension .module.css
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                modules: {
                  getLocalIdent: helper.getCSSModuleLocalIdent,
                },
              }),
            },
            // Opt-in support for SASS (using .scss or .sass extensions).
            // By default we support SASS Modules with the
            // extensions .module.scss or .module.sass
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders({}, [
                {
                  loader: require.resolve("sass-loader"),
                  options: {
                    sourceMap: isEnvProduction && shouldUseSourceMap,
                    prependData: fs.existsSync(paths.resolveApp("config/stylesheets.data.scss")) ? ` @import "config/stylesheets.data.scss";` : sassJSONImporter.transformJSONtoSass(stylesheetsConfig.sdk.variables),
                  },
                },
                {
                  loader: require.resolve("sass-resources-loader"),
                  options: {
                    resources: sassResources,
                  },
                },
              ]),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules, but using SASS
            // using the extension .module.scss or .module.sass
            {
              test: sassModuleRegex,
              use: getStyleLoaders(
                {
                  sourceMap: isEnvProduction && shouldUseSourceMap,
                  modules: {
                    getLocalIdent: helper.getCSSModuleLocalIdent,
                  },
                },
                [
                  {
                    loader: require.resolve("sass-loader"),
                    options: {
                      sourceMap: isEnvProduction && shouldUseSourceMap,
                      prependData: fs.existsSync(paths.resolveApp("config/stylesheets.data.scss")) ? ` @import "config/stylesheets.data.scss";` : sassJSONImporter.transformJSONtoSass(stylesheetsConfig.sdk.variables),
                      sassOptions: {
                        modules: true,
                      },
                    },
                  },
                  {
                    loader: require.resolve("sass-resources-loader"),
                    options: {
                      resources: sassResources,
                    },
                  },
                ]
              ),
            },
            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader doesn't use a "test" so it will catch all modules
            // that fall through the other loaders.
            {
              loader: require.resolve("file-loader"),
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise be processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/, /\.ejs$/],
              options: {
                name: "static/[name].[hash:8].[ext]",
                emitFile: isBundleTypeApp,
              },
            },
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
          ],
        },
      ],
    },
    plugins: [
      ...(webpackConfig.plugins.normalModuleReplacement || []).map((replacement) => new webpack.NormalModuleReplacementPlugin(replacement[0], paths.resolveApp(replacement[1]))),
      // Generates an `index.html` file with the <script> injected.
      !isEnvStorybook &&
        isBundleTypeApp &&
        new HtmlWebpackPlugin({
          title: process.env.BUNDLE_NAME,
          inject: true,
          minify: isEnvProduction ? htmlMinifyOptions : false,
          cache: false,
          template: paths.appHtml,
          templateParameters: (compilation, assets, options, page) => htmlHelper.templateParameters(compilation, assets, options, htmlConfig.index),
          filename: "index.html",
        }),
      !isEnvStorybook &&
        isBundleTypeApp &&
        new HtmlWebpackPlugin({
          title: process.env.BUNDLE_NAME,
          inject: false,
          minify: isEnvProduction ? htmlMinifyOptions : false,
          cache: false,
          template: paths.appHtmlBrowsers,
          templateParameters: (compilation, assets, options, page) => htmlHelper.templateParameters(compilation, assets, options, htmlConfig.browsers),
          filename: "browsers.html",
        }),
      !isEnvStorybook &&
        isBundleTypeApp &&
        new FaviconsWebpackPlugin({
          logo: paths.appFavicon,
          prefix: "favicons/",
          inject: (htmlPlugin) => path.basename(htmlPlugin.options.filename) === "index.html",
          cache: !isEnvProduction,
          mode: "webapp",
          devMode: "webapp",
          favicons: {
            appName: env.raw.BUNDLE_NAME,
            appShortName: env.raw.BUNDLE_SHORT_NAME,
            appDescription: null,
            developerName: appPackageJson.author.name,
            developerURL: appPackageJson.author.url,
            start_url: "./index.html",
            logging: false,
            ...htmlConfig.index.favicons,
            ...stylesheetsConfig.favicons,
            icons: {
              ...htmlConfig.index.favicons.icons,
              ...stylesheetsConfig.favicons.icons,
            },
          },
        }),
      !isEnvStorybook &&
        isEnvProduction &&
        isBundleTypeApp &&
        new PreloadWebpackPlugin({
          rel: "prefetch",
          include: "allAssets",
          fileBlacklist: [/\.map$/, /favicons/],
          excludeHtmlNames: ["browsers.html"],
        }),
      // Inlines the webpack runtime script. This script is too small to warrant
      // a network request.
      // https://github.com/facebook/create-react-app/issues/5358
      !isEnvStorybook && isEnvProduction && isBundleTypeApp && shouldInlineRuntimeChunk && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
      // Makes some environment variables available in index.html.
      // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
      // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
      // It will be an empty string unless you specify "homepage"
      // in `package.json`, in which case it will be the pathname of that URL.
      // In development, this will be an empty string.
      !isEnvStorybook && isBundleTypeApp && new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      // This gives some necessary context to module not found errors, such as
      // the requesting resource.
      new ModuleNotFoundPlugin(paths.appPath),
      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
      // It is absolutely essential that NODE_ENV is set to production
      // during a production build.
      // Otherwise React will be compiled in the very slow development mode.
      new webpack.DefinePlugin(env.stringified),
      // This is necessary to emit hot updates (currently CSS only):
      isEnvDevelopment && isBundleTypeApp && new webpack.HotModuleReplacementPlugin(),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebook/create-react-app/issues/240
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      // See https://github.com/facebook/create-react-app/issues/186
      isEnvDevelopment && new WatchMissingNodeModulesPlugin(paths.appNodeModules),
      isEnvStorybook && !isEnvProduction && new MiniCssExtractPlugin(),
      isEnvProduction &&
        isBundleTypeApp &&
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: "static/css/[name].[contenthash:8].css",
          chunkFilename: "static/css/[name].[contenthash:8].chunk.css",
        }),
      // Generate an asset manifest file with the following content:
      // - "files" key: Mapping of all asset filenames to their corresponding
      //   output file so that tools can pick it up without having to parse
      //   `index.html`
      // - "entrypoints" key: Array of files which are included in `index.html`,
      //   can be used to reconstruct the HTML if necessary
      !isEnvStorybook &&
        isBundleTypeApp &&
        new ManifestPlugin({
          fileName: "asset-manifest.json",
          publicPath: paths.publicUrlOrPath,
          generate: (seed, files, entrypoints) => {
            const manifestFiles = files.reduce((manifest, file) => {
              manifest[file.name] = file.path;
              return manifest;
            }, seed);
            const entrypointFiles = entrypoints.main.filter((fileName) => !fileName.endsWith(".map"));

            return {
              files: manifestFiles,
              entrypoints: entrypointFiles,
            };
          },
        }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      // Generate a service worker script that will precache, and keep up to date,
      // the HTML & assets that are part of the webpack build.
      !isEnvStorybook &&
        isEnvProduction &&
        isBundleTypeApp &&
        new WorkboxWebpackPlugin.GenerateSW({
          cacheId: appPackageJson.name,
          clientsClaim: true,
          exclude: [/\.map$/, /asset-manifest\.json$/, /\.npmignore/, /favicons/, /(index|browsers)\.(js|html)$/],
          navigateFallback: paths.publicUrlOrPath + "/index.html",
          navigateFallbackDenylist: [
            // Exclude URLs starting with /_, as they're likely an API call
            new RegExp("^/_"),
            // Exclude any URLs whose last part seems to be a file extension
            // as they're likely a resource and not a SPA route.
            // URLs containing a "?" character won't be blacklisted as they're likely
            // a route with query params (e.g. auth callbacks).
            new RegExp("/[^/?]+\\.[^/]+$"),
          ],
          runtimeCaching: [
            {
              urlPattern: /(index|browsers)\.(js|html)$/,
              handler: "NetworkOnly",
            },
          ],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        }),
      // TypeScript type checking
      useTypeScript &&
        new ForkTsCheckerWebpackPlugin({
          typescript: resolve.sync("typescript", {
            basedir: paths.appNodeModules,
          }),
          async: isEnvDevelopment,
          useTypescriptIncrementalApi: true,
          checkSyntacticErrors: true,
          resolveModuleNameModule: process.versions.pnp ? `${__dirname}/pnpTs.js` : undefined,
          resolveTypeReferenceDirectiveModule: process.versions.pnp ? `${__dirname}/pnpTs.js` : undefined,
          tsconfig: paths.appTsConfig,
          reportFiles: ["**", "!**/*.json", "!**/__tests__/**", "!**/?(*.)(spec|test).*", "!**/src/setupProxy.*", "!**/src/setupTests.*"],
          silent: true,
          // The formatter is invoked directly in WebpackDevServerUtils during development
          formatter: isEnvProduction ? typescriptFormatter : undefined,
        }),
      new helper.IgnoreCSSConflictingPlugin(),
      isEnvProduction &&
        new MomentLocalesPlugin({
          localesToKeep: ["en", "es"],
        }),
      isEnvProduction &&
        new MomentTimezoneDataPlugin({
          startYear: currentYear - 5,
          endYear: currentYear + 5,
          matchZones: /^America\//,
        }),
      new WebpackNotifierPlugin({alwaysNotify: true}),
      new CircularDependencyPlugin({
        // exclude detection of files based on a RegExp
        exclude: /a\.js|node_modules/,
        // add errors to webpack instead of warnings
        failOnError: false,
        // set the current working directory for displaying module paths
        cwd: process.cwd(),
      }),
      !isEnvCI &&
        isEnvProduction &&
        isBundleTypeApp &&
        new BundleAnalyzerPlugin({
          analyzerMode: "disabled",
          generateStatsFile: true,
          statsFilename: "../build/stats.json",
        }),
    ].filter(Boolean),
    // Some libraries import Node modules but don't use them in the browser.
    // Tell webpack to provide empty mocks for them so importing them works.
    node: {
      module: "empty",
      dgram: "empty",
      dns: "mock",
      fs: "empty",
      http2: "empty",
      net: "empty",
      tls: "empty",
      child_process: "empty",
    },
    // Turn off performance processing because we utilize
    // our own hints via the FileSizeReporter
    performance: false,
    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: isEnvDevelopment ? {} : isBundleTypeLibrary ? [nodeExternals()] : [],
  };
};
