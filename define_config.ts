/*
 * adonis-resque
 *
 * (c) Dai Jie <https://github.com/shiny>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { RedisConnections } from "./types.js";
import { type MultiWorker, type Worker } from "node-resque";

export function defineConfig<Connections extends RedisConnections>(config: {
  redisConnection: keyof Connections;
  runWorkerInWebEnv: boolean;
  runScheduler: boolean;
  isMultiWorkerEnabled: boolean;
  multiWorkerOption: MultiWorker["options"];
  workerOption: Worker["options"];
  queueNameForJobs: string;
  queueNameForWorkers: string;
  logger: string | null;
  verbose: boolean;
}) {
  return config;
}
