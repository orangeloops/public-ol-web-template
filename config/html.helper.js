"use strict";

module.exports = (env, htmlConfig) => ({
  templateParameters: (compilation, assets, options, page) => {
    const head = {
      charset: {
        value: page.html.head.charset,
        markup: page.html.head.charset ? `<meta charSet="${page.html.head.charset}"/>` : "",
      },
      meta: {
        value: page.html.head.meta,
        markup: page.html.head.meta ? page.html.head.meta.map((meta) => `<meta name="${meta.name}" content="${meta.content}"/>`).join("\n") : "",
      },
      links: page.html.head.links,
      styles: page.html.head.styles,
      title: {
        value: page.html.head.title,
        markup: page.html.head.title ? `<title>${page.html.head.title}</title>` : "",
      },
    };

    const body = {
      noscript: {
        value: page.html.body.noscript,
        markup: page.html.body.noscript ? `<noscript> ${page.html.body.noscript} </noscript>` : "",
      },
      scripts: {
        value: page.html.body.scripts,
        markup: page.html.body.scripts ? page.html.body.scripts.map((script) => `<script src="${script.src}"${script.async ? " async" : ""}></script>`).join("\n") : "",
      },
      root: page.html.body.root,
    };

    return {
      compilation: compilation,
      webpackConfig: compilation.options,
      htmlWebpackPlugin: {
        files: assets,
        options: options,
      },
      env: {...env.raw},
      html: {
        ...page.html,
        head: {
          ...head,
          content: `${head.charset.markup}${head.meta.markup}${head.links}${typeof head.styles === "function" ? head.styles({}) : head.styles}${head.title.markup}`,
          contentWith: (options) => `${head.charset.markup}${head.meta.markup}${head.links}${typeof head.styles === "function" ? head.styles(options) : head.styles}${head.title.markup}`,
        },
        body: {
          ...body,
          content: `${body.noscript.markup}${body.scripts.markup}${typeof body.root === "function" ? body.root({}) : body.root}`,
          contentWith: (options) => `${body.noscript.markup}${body.scripts.markup}${typeof body.root === "function" ? body.root(options) : body.root}`,
        },
      },
    };
  },
});
