import {runCommand} from "./helpers";

(async () => {
  await Promise.all([runCommand("react-snap"), runCommand(["npm", ["run", "bundle:analyzer"]])]);
})();
