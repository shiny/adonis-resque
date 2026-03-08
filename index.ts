/*
 * adonis-resque
 *
 * (c) Dai Jie <https://github.com/shiny>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export const packageName = "adonis-resque";

export { configure } from "./configure.js";
export { defineConfig } from "./define_config.js";

export { Worker } from "node-resque";
export { Queue } from "node-resque";
export { default as BaseJob } from "./base_job.js";
export { default as BasePlugin } from "./base_plugin.js";
export { Plugin } from "./plugin.js";
export type {
  RetryOptions,
  JobLockOptions,
  NoopOptions,
  QueueLockOptions,
} from "./plugin.js";
import { type ResqueConfig } from "./types.js";
export * from "./types.js";
import app from "@adonisjs/core/services/app";

export const stubsRoot = import.meta.dirname + "/stubs";

/**
 * Get a resque config
 * @param name key name
 */
export function getConfig<Key extends keyof ResqueConfig>(
  name: Key,
): ResqueConfig[Key] {
  return getConfigAll()[name];
}

/**
 * Get all resque config
 */
export function getConfigAll() {
  return app.config.get<ResqueConfig>("resque");
}
