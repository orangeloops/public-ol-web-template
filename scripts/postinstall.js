const paths = require("../config/paths");
const fs = require("fs-extra");

copyVendorsFolder();

function copyVendorsFolder() {
  const sourcePath = paths.appPath + "/config/vendors";
  const targetPath = paths.appNodeModules;

  if (fs.existsSync(sourcePath)) {
    fs.copySync(sourcePath, targetPath, {
      dereference: true,
    });
  }
}
