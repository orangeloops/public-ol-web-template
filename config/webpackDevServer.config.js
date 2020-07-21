"use strict";

const fs = require("fs-extra");
const errorOverlayMiddleware = require("react-dev-utils/errorOverlayMiddleware");
const evalSourceMapMiddleware = require("react-dev-utils/evalSourceMapMiddleware");
const noopServiceWorkerMiddleware = require("react-dev-utils/noopServiceWorkerMiddleware");
const ignoredFiles = require("react-dev-utils/ignoredFiles");
const redirectServedPath = require("react-dev-utils/redirectServedPathMiddleware");
const paths = require("./paths");
const getHttpsConfig = require("./getHttpsConfig");

const host = process.env.HOST || "0.0.0.0";
const sockHost = process.env.WDS_SOCKET_HOST;
const sockPath = process.env.WDS_SOCKET_PATH; // default: "/sockjs-node"
const sockPort = process.env.WDS_SOCKET_PORT;

const isProduction = process.env.NODE_ENV === "production";

module.exports = function (proxy, allowedHost) {
  return {
    stats: {
      // fallback value for stats options when an option is not defined (has precedence over local webpack defaults)
      all: undefined,
      // Add asset Information
      assets: true,
      // Sort assets by a field
      // You can reverse the sort with `!field`.
      assetsSort: "!size",
      // Add information about cached (not built) modules
      cached: true,
      // Show cached assets (setting this to `false` only shows emitted files)
      cachedAssets: false,
      // Add children information
      children: isProduction,
      // Add chunk information (setting this to `false` allows for a less verbose output)
      chunks: isProduction,
      // Add built modules information to chunk information
      chunkModules: isProduction,
      // Add the origins of chunks and chunk merging info
      chunkOrigins: isProduction,
      // Sort the chunks by a field
      // You can reverse the sort with `!field`. Default is `id`.
      chunksSort: "!size",
      // Context directory for request shortening
      context: "../src/",
      // `webpack --colors` equivalent
      colors: true,
      // Display the distance from the entry point for each module
      depth: isProduction,
      // Display the entry points with the corresponding bundles
      entrypoints: false,
      // Add --env information
      env: isProduction,
      // Add errors
      errors: true,
      // Add details to errors (like resolving log)
      errorDetails: true,
      // Exclude assets from being displayed in stats
      // This can be done with a String, a RegExp, a Function getting the assets name
      // and returning a boolean or an Array of the above.
      //         excludeAssets: "filter" | /filter/ | (assetName) => ... return true|false |
      //     ["filter"] | [/filter/] | [(assetName) => ... return true|false],
      // // Exclude modules from being displayed in stats
      // // This can be done with a String, a RegExp, a Function getting the modules source
      // // and returning a boolean or an Array of the above.
      // excludeModules: "filter" | /filter/ | (moduleSource) => ... return true|false |
      //     ["filter"] | [/filter/] | [(moduleSource) => ... return true|false],
      // // See excludeModules
      // exclude: "filter" | /filter/ | (moduleSource) => ... return true|false |
      //     ["filter"] | [/filter/] | [(moduleSource) => ... return true|false],
      // Add the hash of the compilation
      hash: true,
      // Set the maximum number of modules to be shown
      maxModules: 15,
      // Add built modules information
      modules: isProduction,
      // Sort the modules by a field
      // You can reverse the sort with `!field`. Default is `id`.
      modulesSort: "!size",
      // Show dependencies and origin of warnings/errors (since webpack 2.5.0)
      moduleTrace: isProduction,
      // Display bailout reasons
      optimizationBailout: true,
      // Show performance hint when file size exceeds `performance.maxAssetSize`
      performance: true,
      // Show the exports of the modules
      providedExports: false,
      // Add public path information
      publicPath: true,
      // Add information about the reasons why modules are included
      reasons: true,
      // Add the source code of modules
      source: true,
      // Add timing information
      timings: true,
      // Show which exports of a module are used
      usedExports: false,
      // Add webpack version information
      version: true,
      // Add warnings
      warnings: true,
      // Filter warnings to be shown (since webpack 2.4.0),
      // can be a String, Regexp, a function getting the warning and returning a boolean
      // or an Array of a combination of the above. First match wins.
      // warningsFilter: "filter" | /filter/ | ["filter", /filter/] | (warning) => ... return true|false
    },
    // WebpackDevServer 2.4.3 introduced a security fix that prevents remote
    // websites from potentially accessing local content through DNS rebinding:
    // https://github.com/webpack/webpack-dev-server/issues/887
    // https://medium.com/webpack/webpack-dev-server-middleware-security-issues-1489d950874a
    // However, it made several existing use cases such as development in cloud
    // environment or subdomains in development significantly more complicated:
    // https://github.com/facebook/create-react-app/issues/2271
    // https://github.com/facebook/create-react-app/issues/2233
    // While we're investigating better solutions, for now we will take a
    // compromise. Since our WDS configuration only serves files in the `public`
    // folder we won't consider accessing them a vulnerability. However, if you
    // use the `proxy` feature, it gets more dangerous because it can expose
    // remote code execution vulnerabilities in backends like Django and Rails.
    // So we will disable the host check normally, but enable it if you have
    // specified the `proxy` setting. Finally, we let you override it if you
    // really know what you're doing with a special environment variable.
    disableHostCheck: !proxy || process.env.DANGEROUSLY_DISABLE_HOST_CHECK === "true",
    // Enable gzip compression of generated files.
    compress: true,
    // Silence WebpackDevServer's own logs since they're generally not useful.
    // It will still show compile warnings and errors with this setting.
    clientLogLevel: "none",
    // By default WebpackDevServer serves physical files from current directory
    // in addition to all the virtual build products that it serves from memory.
    // This is confusing because those files won’t automatically be available in
    // production build folder unless we copy them. However, copying the whole
    // project directory is dangerous because we may expose sensitive files.
    // Instead, we establish a convention that only files in `public` directory
    // get served. Our build script will copy `public` into the `build` folder.
    // In `index.html`, you can get URL of `public` folder with %PUBLIC_URL%:
    // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
    // In JavaScript code, you can access it with `process.env.PUBLIC_URL`.
    // Note that we only recommend to use `public` folder as an escape hatch
    // for files like `favicon.ico`, `manifest.json`, and libraries that are
    // for some reason broken when imported through webpack. If you just want to
    // use an image, put it in `src` and `import` it from JavaScript instead.
    contentBase: paths.appPublic,
    contentBasePublicPath: paths.publicUrlOrPath,
    // By default files from `contentBase` will not trigger a page reload.
    watchContentBase: true,
    // Enable hot reloading server. It will provide WDS_SOCKET_PATH endpoint
    // for the WebpackDevServer client so it can learn when the files were
    // updated. The WebpackDevServer client is included as an entry point
    // in the webpack development configuration. Note that only changes
    // to CSS are currently hot reloaded. JS changes will refresh the browser.
    hot: true,
    // Use 'ws' instead of 'sockjs-node' on server since we're using native
    // websockets in `webpackHotDevClient`.
    transportMode: "ws",
    // Prevent a WS client from getting injected as we're already including
    // `webpackHotDevClient`.
    injectClient: false,
    // Enable custom sockjs pathname for websocket connection to hot reloading server.
    // Enable custom sockjs hostname, pathname and port for websocket connection
    // to hot reloading server.
    sockHost,
    sockPath,
    sockPort,
    // It is important to tell WebpackDevServer to use the same "publicPath" path as
    // we specified in the webpack config. When homepage is ".", default to serving
    // from the root.
    // remove last slash so user can land on `/test` instead of `/test/`
    publicPath: paths.publicUrlOrPath.slice(0, -1),
    // WebpackDevServer is noisy by default so we emit custom message instead
    // by listening to the compiler events with `compiler.hooks[...].tap` calls above.
    quiet: true,
    // Reportedly, this avoids CPU overload on some systems.
    // https://github.com/facebook/create-react-app/issues/293
    // src/node_modules is not ignored to support absolute imports
    // https://github.com/facebook/create-react-app/issues/1065
    watchOptions: {
      ignored: ignoredFiles(paths.appSrc),
    },
    https: getHttpsConfig(),
    host,
    overlay: false,
    historyApiFallback: {
      // Paths with dots should still use the history fallback.
      // See https://github.com/facebook/create-react-app/issues/387.
      disableDotRule: true,
      index: paths.publicUrlOrPath,
    },
    public: allowedHost,
    // `proxy` is run between `before` and `after` `webpack-dev-server` hooks
    proxy,
    before(app, server) {
      // Keep `evalSourceMapMiddleware` and `errorOverlayMiddleware`
      // middlewares before `redirectServedPath` otherwise will not have any effect
      // This lets us fetch source contents from webpack for the error overlay
      app.use(evalSourceMapMiddleware(server));
      // This lets us open files from the runtime error overlay.
      app.use(errorOverlayMiddleware());

      if (fs.existsSync(paths.proxySetup)) {
        // This registers user provided middleware for proxy reasons
        require(paths.proxySetup)(app);
      }
    },
    after(app) {
      // Redirect to `PUBLIC_URL` or `homepage` from `package.json` if url not match
      app.use(redirectServedPath(paths.publicUrlOrPath));

      // This service worker file is effectively a "no-op" that will reset any
      // previous service worker registered for the same host:port combination.
      // We do this in development to avoid hitting the production cache if
      // it used the same host and port.
      // https://github.com/facebook/create-react-app/issues/2272#issuecomment-302832432
      app.use(noopServiceWorkerMiddleware(paths.publicUrlOrPath));
    },
  };
};
