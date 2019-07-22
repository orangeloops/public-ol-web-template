"use strict";

const _ = require("lodash");
const chalk = require("chalk");
const helper = require("./helper");
const nodeExternals = require("webpack-node-externals");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const CircularDependencyPlugin = require("circular-dependency-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MomentLocalesPlugin = require("moment-locales-webpack-plugin");
const MomentTimezoneDataPlugin = require("moment-timezone-data-webpack-plugin");
const PreloadWebpackPlugin = require("preload-webpack-plugin");
const WebpackNotifierPlugin = require("webpack-notifier");
const sassJSONImporter = require("node-sass-json-importer");

const fs = require("fs");
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
const getCSSModuleLocalIdent = require("react-dev-utils/getCSSModuleLocalIdent");
const paths = require("./paths");
const modules = require("./modules");
const getClientEnvironment = require("./env");
const ModuleNotFoundPlugin = require("react-dev-utils/ModuleNotFoundPlugin");
const ForkTsCheckerWebpackPlugin = require("react-dev-utils/ForkTsCheckerWebpackPlugin");
const typescriptFormatter = require("react-dev-utils/typescriptFormatter");

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";
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

const sassResources = [paths.resolveApp("src/assets/stylesheets/base/_common.scss")];

const isBundleTypeLibrary = process.env.BUNDLE_TYPE === "library";

const appPackage = require(paths.appPackageJson);

const webpackConfig = process.env.WEBPACK_CONFIG ? require(paths.resolveApp(process.env.WEBPACK_CONFIG)) : {plugins: {}};

const baseStylesheetsConfig = require("./stylesheets.config");
const stylesheetsConfig = process.env.STYLESHEETS_CONFIG ? _.mergeWith(baseStylesheetsConfig, require(paths.resolveApp(process.env.STYLESHEETS_CONFIG))) : baseStylesheetsConfig;

const currentYear = new Date().getFullYear();

// This is the production and development configuration.
// It is focused on developer experience, fast rebuilds, and a minimal bundle.
module.exports = function(webpackEnv) {
  const isEnvCI = process.env.CI === "true";
  const isEnvStorybook = webpackEnv === "storybook";
  const isEnvDevelopment = webpackEnv === "development" || isEnvStorybook;
  const isEnvProduction = webpackEnv === "production";

  // Webpack uses `publicPath` to determine where the app is being served from.
  // It requires a trailing slash, or the file assets will get an incorrect path.
  // In development, we always serve from the root. This makes config easier.
  const publicPath = isEnvProduction ? paths.servedPath : isEnvDevelopment && "/";
  // Some apps do not use client-side routing with pushState.
  // For these, "homepage" can be set to "." to enable relative asset paths.
  const shouldUseRelativeAssetPaths = publicPath === "./";

  // `publicUrl` is just like `publicPath`, but we will provide it to our app
  // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
  // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
  const publicUrl = isEnvProduction ? publicPath.slice(0, -1) : isEnvDevelopment && "";
  // Get environment variables to inject into our app.
  const env = getClientEnvironment(publicUrl);

  console.log(chalk.blue(JSON.stringify(env.raw, null, 2)));

  // common function to get style loaders
  const getStyleLoaders = (cssOptions, preProcessors, stylelint = true) => {
    const loaders = [
      !isEnvStorybook && isEnvDevelopment && require.resolve("style-loader"),
      (isEnvStorybook || isEnvProduction) && {
        loader: MiniCssExtractPlugin.loader,
        options: Object.assign({}, shouldUseRelativeAssetPaths ? {publicPath: "../../"} : undefined),
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
      preProcessors.forEach(preProcessor => loaders.push(preProcessor));
    }
    return loaders;
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
      // {index: [isBundleTypeLibrary ? paths.appIndexLibrary : paths.appIndex]},
      paths.appIndex,
      // We include the app code last so that if there is a runtime error during
      // initialization, it doesn't blow up the WebpackDevServer client, and
      // changing JS code would still trigger a refresh.
    ].filter(Boolean),
    output: {
      // The build folder.
      path: isEnvProduction ? paths.appBuild : undefined,
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: isEnvDevelopment,
      // There will be one main bundle, and one file per asynchronous chunk.
      // In development, it does not produce real files.
      filename: isEnvProduction ? "static/js/[name].[contenthash:8].js" : isEnvDevelopment && "static/js/[name].js",
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: isEnvProduction ? "static/js/[name].[contenthash:8].chunk.js" : isEnvDevelopment && "static/js/[name].chunk.js",
      // We inferred the "public path" (such as / or /my-project) from homepage.
      // We use "/" in development.
      publicPath: publicPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: isEnvProduction ? info => path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, "/") : isEnvDevelopment && (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, "/")),
      ...(isBundleTypeLibrary
        ? {
            libraryTarget: "umd",
            library: "index",
            path: paths.appBuild,
            filename: "[name].js",
            chunkFilename: "static/js/[name].chunk.js",
          }
        : {
            path: paths.appBuild,
            filename: isEnvDevelopment ? "static/js/[name].js" : "static/js/[name].[chunkhash:8].js",
            chunkFilename: isEnvDevelopment ? "static/js/[name].chunk.js" : "static/js/[name].[chunkhash:8].chunk.js",
          }),
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            parse: {
              // we want terser to parse ecma 8 code. However, we don't want it
              // to apply any minfication steps that turns valid ecma 5 code
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
              // Pending futher investigation:
              // https://github.com/terser-js/terser/issues/120
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
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
            // Keep the runtime chunk seperated to enable long term caching
            // https://twitter.com/wSokra/status/969679223278505985
            runtimeChunk: true,
          }),
    },
    resolve: {
      // This allows you to set a fallback for where Webpack should look for modules.
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
      extensions: paths.moduleFileExtensions.map(ext => `.${ext}`).filter(ext => useTypeScript || !ext.includes("ts")),
      alias: {
        assets: paths.appAssets,
        appAssets: paths.appAssets,

        // https://www.contentful.com/blog/2017/10/27/put-your-webpack-bundle-on-a-diet-part-3/
        "lodash-es": "lodash",
        "lodash.keys": "lodash/keys",
        "lodash._getnative": "lodash/_getnative",
        "lodash.isarguments": "lodash/isarguments",
        "lodash.isarray": "lodash/isarray",
        "lodash.debounce": "lodash/debounce",
        "lodash.throttle": "lodash/throttle",
        "lodash.merge": "lodash/merge",
        "lodash.camelcase": "lodash/camelcase",

        mobx: paths.appNodeModules + "/mobx/lib/mobx.es6.js",

        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        "react-native": "react-native-web",
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
        // Also related to Plug'n'Play, but this time it tells Webpack to load its loaders
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
                formatter: require.resolve("react-dev-utils/eslintFormatter"),
                eslintPath: require.resolve("eslint"),
                quiet: isEnvCI,
              },
            },
          ],
          include: paths.appSrc,
        },
        {
          loader: require.resolve("webpack-ant-icon-loader"),
          enforce: "pre",
          options: {
            chunkName: "antd-icons",
          },
          include: [require.resolve("@ant-design/icons/lib/dist")],
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
                    limit: isEnvDevelopment ? 1 : 1024 * 8,
                    name: "static/media/[name].[hash:8].[ext]",
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
              test: /\.svg$/,
              include: /assets\/images\/icons/,
              use: [
                {
                  loader: require.resolve("babel-loader"),
                },
                {
                  loader: require.resolve("image-webpack-loader"),
                  options: {
                    disable: isEnvDevelopment,
                  },
                },
                {
                  loader: require.resolve("@svgr/webpack"),
                  options: {
                    babel: false,
                    icon: true,
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
                  },
                },
              ],
            },
            {
              test: /\.(eot|ttf|woff|woff2)$/,
              loader: require.resolve("file-loader"),
              options: {
                name: "static/media/[name].[hash:8].[ext]",
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
              include: paths.appSrc,
              loader: require.resolve("babel-loader"),
              options: {
                customize: require.resolve("babel-preset-react-app/webpack-overrides"),

                plugins: [
                  [
                    require.resolve("babel-plugin-named-asset-import"),
                    {
                      loaderMap: {
                        svg: {
                          ReactComponent: "@svgr/webpack?-prettier,-svgo![path]",
                        },
                      },
                    },
                  ],
                ],
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: true,
                cacheCompression: isEnvProduction,
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
                cacheCompression: isEnvProduction,

                // If an error happens in a package, it's possible to be
                // because it was compiled. Thus, we don't want the browser
                // debugger to show the original code. Instead, the code
                // being evaluated would be much more helpful.
                sourceMaps: false,
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
                          javascriptEnabled: true,
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
                          modifyVars: stylesheetsConfig.antd.variables,
                          javascriptEnabled: true,
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
                  // getLocalIdent: getCSSModuleLocalIdent,
                  localIdentName: "[name]_[local]_[hash:base64]",
                },
              }),
            },
            // Opt-in support for SASS. The logic here is somewhat similar
            // as in the CSS routine, except that "sass-loader" runs first
            // to compile SASS files into CSS.
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
                    data: fs.existsSync(paths.resolveApp("config/stylesheets.data.scss")) ? ` @import "config/stylesheets.data.scss";` : sassJSONImporter.transformJSONtoSass(stylesheetsConfig.sdk.variables),
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
                    // getLocalIdent: getCSSModuleLocalIdent,
                    localIdentName: "[name]_[local]_[hash:base64]",
                  },
                },
                [
                  {
                    loader: require.resolve("sass-loader"),
                    options: {
                      sourceMap: isEnvProduction && shouldUseSourceMap,
                      data: fs.existsSync(paths.resolveApp("config/stylesheets.data.scss")) ? ` @import "config/stylesheets.data.scss";` : sassJSONImporter.transformJSONtoSass(stylesheetsConfig.sdk.variables),
                      modules: true,
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
              },
            },
          ],
        },
        // ** STOP ** Are you adding a new loader?
        // Make sure to add the new loader(s) before the "file" loader.
      ],
    },
    plugins: [
      ...(webpackConfig.plugins.normalModuleReplacement || []).map(replacement => new webpack.NormalModuleReplacementPlugin(replacement[0], paths.resolveApp(replacement[1]))),
      !isEnvStorybook &&
        new webpack.ProvidePlugin({
          React: "react",
          ReactDOM: "react-dom",
        }),
      // Generates an `index.html` file with the <script> injected.
      !isEnvStorybook &&
        !isBundleTypeLibrary &&
        new HtmlWebpackPlugin(
          Object.assign(
            {},
            {
              inject: true,
              template: paths.appHtml,
              env: {
                ...process.env,
              },
            },
            isEnvProduction
              ? {
                  minify: {
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
                  },
                }
              : undefined
          )
        ),
      !isEnvStorybook &&
        isEnvProduction &&
        !isBundleTypeLibrary &&
        new PreloadWebpackPlugin({
          rel: "prefetch",
          include: "allAssets",
        }),
      // Inlines the webpack runtime script. This script is too small to warrant
      // a network request.
      !isEnvStorybook && isEnvProduction && !isBundleTypeLibrary && shouldInlineRuntimeChunk && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime~.+[.]js/]),
      // Makes some environment variables available in index.html.
      // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
      // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
      // In production, it will be an empty string unless you specify "homepage"
      // in `package.json`, in which case it will be the pathname of that URL.
      // In development, this will be an empty string.
      !isEnvStorybook && !isBundleTypeLibrary && new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
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
      isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebook/create-react-app/issues/240
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for Webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      // See https://github.com/facebook/create-react-app/issues/186
      isEnvDevelopment && new WatchMissingNodeModulesPlugin(paths.appNodeModules),
      isEnvStorybook && new MiniCssExtractPlugin(),
      !isEnvStorybook &&
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: "static/css/[name].[contenthash:8].css",
          chunkFilename: "static/css/[name].[contenthash:8].chunk.css",
        }),
      // Generate a manifest file which contains a mapping of all asset filenames
      // to their corresponding output file so that tools can pick it up without
      // having to parse `index.html`.
      !isEnvStorybook &&
        !isBundleTypeLibrary &&
        new ManifestPlugin({
          fileName: "asset-manifest.json",
          publicPath: publicPath,
          generate: (seed, files) => {
            const manifestFiles = files.reduce(function(manifest, file) {
              manifest[file.name] = file.path;
              return manifest;
            }, seed);

            return {
              files: manifestFiles,
            };
          },
        }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      // Generate a service worker script that will precache, and keep up to date,
      // the HTML & assets that are part of the Webpack build.
      !isEnvStorybook &&
        isEnvProduction &&
        !isBundleTypeLibrary &&
        new WorkboxWebpackPlugin.GenerateSW({
          cacheId: appPackage.name,
          clientsClaim: true,
          exclude: [/\.map$/, /asset-manifest\.json$/],
          importWorkboxFrom: "cdn",
          navigateFallback: publicUrl + "/index.html",
          navigateFallbackBlacklist: [
            // Exclude URLs starting with /_, as they're likely an API call
            new RegExp("^/_"),
            // Exclude URLs containing a dot, as they're likely a resource in
            // public/ and not a SPA route
            new RegExp("/[^/]+\\.[^/]+$"),
          ],
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
          tsconfig: paths.appTsConfig,
          reportFiles: ["**", "!**/*.json", "!**/__tests__/**", "!**/?(*.)(spec|test).*", "!**/src/setupProxy.*", "!**/src/setupTests.*"],
          watch: paths.appSrc,
          silent: true,
          // The formatter is invoked directly in WebpackDevServerUtils during development
          formatter: isEnvProduction ? typescriptFormatter : undefined,
        }),
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
        !isEnvDevelopment &&
        new BundleAnalyzerPlugin({
          analyzerMode: "disabled",
          generateStatsFile: true,
          statsFilename: "../build/stats.json",
        }),
    ].filter(Boolean),
    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
      module: "empty",
      dgram: "empty",
      dns: "mock",
      fs: "empty",
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
