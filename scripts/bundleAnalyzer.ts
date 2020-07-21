import path from "path";
import fs from "fs-extra";
import {projectPath, runCommand} from "./helpers";

const statsPath = path.resolve(projectPath, "build", "stats.json");

if (fs.existsSync(statsPath)) runCommand(["webpack-bundle-analyzer", [statsPath]]);
else console.log("webpack-bundle-analyzer: stats not available");
