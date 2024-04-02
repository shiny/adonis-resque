import { Queue } from "node-resque";
import { getConnection } from "./services/main.js";
import { NodeResqueJob } from "./types.js";

export function createQueue(jobs: Record<string, NodeResqueJob>) {
    return new Queue({
        connection: getConnection()
    }, jobs);
}
