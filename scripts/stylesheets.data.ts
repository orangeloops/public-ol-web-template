const fs = require("fs-extra");
const sassJSONImporter = require("node-sass-json-importer");

const isEnvCI = process.env.CI === "true";

if (!isEnvCI) generateStylesheets();

function generateStylesheets() {
  try {
    const stylesheetsConfig = eval(fs.readFileSync("./config/stylesheets.config.js", "utf-8"));

    const stylesheetsSass = sassJSONImporter.transformJSONtoSass(stylesheetsConfig.sdk.variables);

    fs.writeFile("./config/stylesheets.data.scss", stylesheetsSass);
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.log(e);
  }
}
