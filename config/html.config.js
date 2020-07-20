"use strict";

module.exports = (env) => {
  const lang = "en";
  const noscript = "You need to enable JavaScript to run this app.";

  const head = {
    charset: "utf-8",
    meta: [
      {name: "Cache-Control", content: "no-cache, no-store, must-revalidate"},
      {name: "Expires", content: "0"},
      {name: "Pragma", content: "no-cache"},
      {name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, shrink-to-fit=no"},
      {name: "description", content: `${env.BUNDLE_NAME} (${env.PACKAGE_VERSION})`},
      {name: "bundle-name", content: env.BUNDLE_NAME},
      {name: "package-version", content: env.PACKAGE_VERSION},
      {name: "sdk-name", content: env.SDK_NAME},
      {name: "sdk-version", content: env.SDK_VERSION},
    ],
    links: "",
    styles: "",
    title: env.BUNDLE_NAME,
  };

  // https://github.com/itgalaxy/favicons#usage
  const favicons = {
    display: "standalone",
    orientation: "any",
    icons: {
      coast: false,
      yandex: false,
    },
  };

  const browsers = {
    links: `<link id="favicon" rel="shortcut icon" href="/favicons/favicon.ico">
              <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png">
              <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png">
              <link rel="icon" type="image/png" sizes="48x48" href="/favicons/favicon-48x48.png">`,
    styles: (options) => `<style>
              body {
                margin: 0;
                padding: 0;
                overflow: hidden;
              }
              
              .ol-browsers-container {
                height: 100vh;
                width: 100%;
                margin: 0;
                padding: 0;
                overflow: auto;
                display: flex;
                align-items: center;
              }
              
              .ol-browsers-box {
                margin: 0 auto;
                width: 300px;
                height: auto;
                text-align: center;
                font-family: ${(options.title && options.title.fontFamily) || "'Helvetica Neue', 'Open Sans', sans-serif"};
                padding: 20px;
              }
              
              .ol-browsers-box-image {
                margin: 0 auto;
                width: 150px;
                height: 150px;
                display: flex;
                align-items: center;
              }
              
              .ol-browsers-box-image img {
                width: 100%;
              }
              
              .ol-browsers-box-content h1 {
                font-size: ${(options.title && options.title.fontSize) || "30px"};
                font-weight: ${(options.title && options.title.fontWeight) || "inherit"};
                margin: 20px 0 0;
                padding: 0;
              }
              
              .ol-browsers-box-content p {
                font-family: ${(options.message && options.message.fontFamily) || "inherit"};
                font-size: ${(options.message && options.message.fontSize) || "24px"};
                font-weight: ${(options.message && options.message.fontWeight) || "inherit"};
                margin: 0;
                padding: 0;
              }
              
              .ol-browsers-box-content-p {
                padding-top: 20px !important;
              }
            </style>`,
    root: (options) => `<div class="ol-browsers-container">
            <div class="ol-browsers-box">
              <div class="ol-browsers-box-image"><img src="${options.image && options.image.src ? options.image.src : "./favicons/android-chrome-512x512.png"}" alt="${
      options.image && options.image.alt ? options.image.alt : "Logo"
    }" /></div>
              <div class="ol-browsers-box-content">
                <h1>${options.title && options.title.text !== "" ? options.title.text : "Improve your experience:"}</h1>
                <p>${options.message && options.message.text !== "" ? options.message.text : "Your browser is not currently supported."}</p>
                <p class="ol-browsers-box-content-p">
                  Try browsing with <a href="https://www.google.com/chrome/">Chrome</a>, <a href="https://www.mozilla.org/">Firefox</a>, <a href="https://www.apple.com/safari/">Safari</a> or
                  <a href="https://www.microsoft.com/en-us/windows/microsoft-edge">Edge</a> for a better experience.
                </p>
              </div>
            </div>
          </div>`,
  };

  return {
    index: {
      html: {
        lang: lang,
        head: head,
        body: {
          noscript: noscript,
          scripts: [{src: "index.js"}],
          root: `<div id="root"></div>`,
        },
      },
      favicons: favicons,
    },
    browsers: {
      html: {
        lang: lang,
        head: {
          ...head,
          links: browsers.links,
          styles: browsers.styles,
        },
        body: {
          noscript: noscript,
          scripts: [],
          root: browsers.root,
        },
      },
      favicons: favicons,
    },
  };
};
