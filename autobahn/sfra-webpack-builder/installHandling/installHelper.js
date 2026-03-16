const path = require("path");
const fs = require("fs");
const childProcess = require("child_process");
const helper = require("../helper/helper");

/**
 * Runs 'npm install' or 'yarn install' for cartridge
 */
function install(cartridgeFolder, packageInstallMode, CI) {
  console.log("cartridge", cartridgeFolder);
  const parentFolder = helper.getCartridgeParentFolder(cartridgeFolder);
  const hasPackageJson = fs.existsSync(
    path.resolve(cartridgeFolder, "package.json")
  );
  const parentHasPackageJson =
    parentFolder && fs.existsSync(path.resolve(parentFolder, "package.json"));

  // Abort if there's no 'package.json' in this folder
  if (!hasPackageJson && !parentHasPackageJson) {
    return;
  }
  const isProd = process.argv[2] === "production";
  // if (hasPackageJson) {
  //   childProcess.execSync(
  //     packageInstallMode +
  //       " install --legacy-peer-deps" +
  //       (isProd ? " --production" : ""),
  //     {
  //       cwd: cartridgeFolder,
  //       env: process.env,
  //       stdio: "inherit",
  //       windowsHide: true,
  //     }
  //   );
  // }
  if (parentHasPackageJson) {
    childProcess.execSync(
      packageInstallMode + (CI ? " ci " : " install ") +
        "--legacy-peer-deps" +
        (isProd ? " --production" : ""),
      {
        cwd: parentFolder,
        env: process.env,
        stdio: "inherit",
        windowsHide: true,
      }
    );
  }
}
/**
 * Runs 'npm install' for cartridge
 */
function npmInstall(cartridgeFolder, CI) {
  install(cartridgeFolder, "npm", CI);
}

/**
 * Runs 'yarn install' for cartridge
 */
function yarnInstall(cartridgeFolder, CI) {
  install(cartridgeFolder, "yarn", CI);
}

module.exports = {
  npmInstall: npmInstall,
  yarnInstall: yarnInstall,
};
