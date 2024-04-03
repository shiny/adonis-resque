import { Queue } from "node-resque";
import { getConnection } from "./services/main.js";
import { NodeResqueJob } from "./types.js";

/**
 * Create a NodeResque Queue
 * @docs https://github.com/actionhero/node-resque?tab=readme-ov-file#queues
 * @param jobs 
 * @returns Queue
 */
export function createQueue(jobs: Record<string, NodeResqueJob>) {
    return new Queue({
        connection: getConnection()
    }, jobs);
}
