const gulp = require("gulp");
const through = require("through2");
const fs = require("fs-extra");
const del = require("del");
const shell = require("gulp-shell");

function cleanPrecompiledFiles() {
  return through.obj((file, encoding, callback) => {
    let regex = /.(ts|tsx)$/;

    const options = {force: true};

    if (regex.test(file.path)) {
      const compiledFile = file.path.replace(regex, ".js");
      const reactFile = file.path.replace(regex, ".jsx");
      const reactMapFile = file.path.replace(regex, ".jsx.map");
      const mapFile = file.path.replace(regex, ".js.map");
      const typeInformation = file.path.replace(regex, ".d.ts");

      del.sync([compiledFile, reactFile, reactMapFile, mapFile, typeInformation], options);
    }

    regex = /.(jsx)$/;

    if (regex.test(file.path)) {
      const compiledFile = file.path.replace(regex, ".js");
      const mapFile = file.path.replace(regex, ".js.map");

      del.sync([compiledFile, mapFile], options);
    }

    regex = /.(scss)$/;

    if (regex.test(file.path)) {
      const compiledFile = file.path.replace(regex, ".css");
      const mapFile = file.path.replace(regex, ".css.map");

      del.sync([compiledFile, mapFile], options);
    }

    callback();
  });
}

gulp.task("clean-precompiled", function() {
  return gulp.src("./src/**").pipe(cleanPrecompiledFiles());
});

gulp.task("clean-builds", done => {
  const emptyDir = target => {
    if (fs.existsSync(target)) fs.emptyDirSync(target);
  };

  emptyDir("./build");
  emptyDir("./.storybook_build");

  done();
});

gulp.task("clean-install-npm-modules", done => {
  const deleteFile = target => {
    if (fs.existsSync(target)) fs.unlinkSync(target);
  };

  const emptyDir = target => {
    if (fs.existsSync(target)) fs.emptyDirSync(target);
  };

  emptyDir("./node_modules");
  deleteFile("./package-lock.json");

  done();
});

gulp.task("clean", gulp.series("clean-precompiled", "clean-builds"));

gulp.task("build-web", shell.task("npm run build"));

gulp.task("build-web-storybook", gulp.series(shell.task("npm run build-storybook")));

gulp.task("build", gulp.series("clean", "build-web", "build-web-storybook"));
