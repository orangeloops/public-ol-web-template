import path from "path";
import fs from "fs-extra";
import del from "del";
import {projectPath} from "./helpers";

(async () => {
  const pathToDelete = path.join(projectPath, "node_modules", "webpack-dev-server", "ssl", "server.pem");

  if (fs.existsSync(pathToDelete)) {
    await del(pathToDelete);

    console.log(`- ${pathToDelete} deleted`);
  }

  fs.copyFileSync(path.join(projectPath, "config", "ssl", "server.pem"), path.join(projectPath, "node_modules", "webpack-dev-server", "ssl", "server.pem"));
})();
