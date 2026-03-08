/*
 * adonis-resque
 *
 * (c) Dai Jie <https://github.com/shiny>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from "@adonisjs/core/services/app";
import { type Jobs, MultiWorker, Worker } from "node-resque";
import { type RedisConnections } from "@adonisjs/redis/types";
import { type defineConfig } from "../define_config.js";

export function getConnection() {
  const resqueConfig =
    app.config.get<ReturnType<typeof defineConfig>>("resque");
  const connections = app.config.get<RedisConnections>("redis.connections");
  const connection = connections[resqueConfig.redisConnection] as any;
  return {
    host: connection.host,
    port: Number.parseInt(connection.port ?? "6379"),
    options: connection,
    pkg: "ioredis",
    database: connection.db ?? 0,
  };
}

export function createWorker(jobs: Jobs, queues: string[]) {
  const workerOption = app.config.get<Worker["options"]>("resque.workerOption");
  return new Worker(
    {
      connection: getConnection(),
      queues,
      ...workerOption,
    },
    jobs,
  );
}

export function createMultiWorker(jobs: Jobs, queues: string[]) {
  const multiWorkerOption = app.config.get<MultiWorker["options"]>(
    "resque.multiWorkerOption",
  );
  return new MultiWorker(
    {
      queues,
      connection: getConnection(),
      ...multiWorkerOption,
    },
    jobs,
  );
}

export function isMultiWorkerEnabled() {
  return app.config.get<boolean>("resque.isMultiWorkerEnabled");
}
