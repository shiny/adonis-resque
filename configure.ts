/*
 * adonis-resque
 *
 * (c) Dai Jie <https://github.com/shiny>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type Configure from "@adonisjs/core/commands/configure";
import { packageName, stubsRoot } from "./index.js";
import { access } from "node:fs/promises";

/**
 * Configures the package
 */
export async function configure(command: Configure) {
  const codemods = await command.createCodemods();

  /**
   * Check if @adonisjs/redis installed, or provide some suggestion.
   */
  if (await doesDependencyPackageMissing(command)) {
    const dependencyPackage = "@adonisjs/redis";
    const shouldInstallPackages = await command.prompt.confirm(
      `Do you want to install dependencies ${dependencyPackage}?`,
      { name: "install", default: true },
    );
    const packagesToInstall = [
      {
        name: dependencyPackage,
        isDevDependency: false,
      },
    ];
    if (shouldInstallPackages) {
      await codemods.installPackages(packagesToInstall);
      command.logger.warning(
        `Run ${command.colors.bgMagenta(command.colors.red(`node ace configure ${dependencyPackage}`))} after installing`,
      );
    } else {
      await codemods.listPackagesToInstall(packagesToInstall);
    }
    command.logger.warning(
      `and configure ${command.colors.red(dependencyPackage)} correctly before using this package`,
    );
  }
  await codemods.makeUsingStub(stubsRoot, "config/resque.stub", {});

  /**
   * Register provider
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider(`${packageName}/providers/resque_provider`);
    rcFile.addCommand(`${packageName}/commands`);
  });
}

async function doesDependencyPackageMissing(command: Configure) {
  const redisConfigFile = command.app.configPath("redis.ts");
  try {
    await access(redisConfigFile);
    return false;
  } catch {
    return true;
  }
}
