const minimist = require("minimist");
const prompts = require("prompts");
const { join, resolve } = require("path");
const fs = require("fs-extra");

const argv = minimist(process.argv.slice(2), { string: ["_"] });
const cwd = process.cwd();

main();

function replaceFile(filePath, sourceRegx, targetStr) {
  fs.writeFileSync(
    filePath,
    fs.readFileSync(filePath, "utf8").replaceAll(sourceRegx, targetStr)
  );
}

function replaceFiles(filePaths, targets) {
  filePaths.forEach((filePath) => {
    targets.forEach(([sourceRegx, targetStr]) => {
      replaceFile(filePath, sourceRegx, targetStr);
    });
  });
}

async function main() {
  let projectName = argv._[0];
  let coreName = "core";
  let corePackageName = "core";
  if (!projectName) {
    try {
      const result = await prompts([
        {
          type: "text",
          name: "projectName",
          message: "Project name:",
          initial: "qyl-monorepo",
        },
        {
          type: "text",
          name: "coreName",
          message: "Core name:",
          initial: "core",
        },
        {
          type: "text",
          name: "corePackageName",
          message: "Core Package name:",
          initial: "core",
        },
      ]);

      projectName = result.projectName;

      corePackageName = result.corePackageName;

      coreName = result.coreName;
    } catch (e) {
      console.log(e.message);
      return;
    }
  }
  const templateDir = resolve(__dirname, "template");
  const targetDir = join(cwd, projectName);
  try {
    fs.copySync(templateDir, targetDir);

    const filePaths = [
      "packages/core/package.json",
      "scripts/buildConfig.json",
      "tsconfig.json",
    ].map((path) => join(targetDir, path));

    const targets = [
      ["__CORE_PACKAGE__", corePackageName],
      ["__CORE__", coreName],
    ];

    replaceFiles(filePaths, targets);

    if (coreName !== "core") {
      fs.moveSync(
        join(targetDir, "packages/core"),
        join(targetDir, "packages", coreName)
      );
    }
    ["examples", `packages/${coreName}/__tests__`].forEach((dirname) => {
      fs.mkdirSync(join(targetDir, dirname));
    });
  } catch (e) {
    fs.removeSync(targetDir);
    console.log(e.message);
    return;
  }
}
