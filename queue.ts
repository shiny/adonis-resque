/*
 * adonis-resque
 *
 * (c) Dai Jie <https://github.com/shiny>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Queue } from "node-resque";
import { getConnection } from "./services/main.js";
import { type NodeResqueJob } from "./types.js";

/**
 * Create a NodeResque Queue
 * @docs https://github.com/actionhero/node-resque?tab=readme-ov-file#queues
 */
export function createQueue(jobs: Record<string, NodeResqueJob>) {
  return new Queue({ connection: getConnection() }, jobs);
}
