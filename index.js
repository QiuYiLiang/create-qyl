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

async function main() {
  let projectName = argv._[0];
  let coreName = "core";
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
      ]);

      projectName = result.projectName;

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
    replaceFile(
      join(targetDir, "packages/core/package.json"),
      "__CORE__",
      coreName
    );
    replaceFile(join(targetDir, "scripts/watch.js"), "__CORE__", coreName);
    fs.moveSync(
      join(targetDir, "packages/core"),
      join(targetDir, "packages", coreName)
    );
    fs.mkdirSync(join(targetDir, "packages/fixtures"));
  } catch (e) {
    fs.removeSync(targetDir);
    console.log(e.message);
    return;
  }
}
