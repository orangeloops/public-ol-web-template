import path from "path";
import {projectPath, runCommand} from "./helpers";
import chokidar from "chokidar";
import fs from "fs";

const watchBasePath = path.resolve(projectPath, "src", "web");
const watcher = chokidar.watch("**/*.module.scss", {
  cwd: watchBasePath,
});

watcher.on("all", (event, relativePath) => {
  const absPath = path.join(watchBasePath, relativePath);

  if (event === "unlink") {
    const typesFilePath = absPath + ".d.ts";

    setTimeout(() => {
      if (fs.existsSync(typesFilePath)) fs.unlinkSync(typesFilePath);
    }, 200);
  }

  if (fs.existsSync(absPath)) runCommand(["tsm", [absPath, "--aliasPrefixes.~", "src/"]]);
});
