/*
 * adonis-resque
 *
 * (c) Dai Jie <https://github.com/shiny>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from "@adonisjs/core/services/app";
import { type ResqueConfig, type ResqueFailure } from "./types.js";
import { type Plugin } from "node-resque";

export default class BaseJob {
  interval?: string | number;
  cron?: string;

  plugins: [typeof Plugin, any][] = [];

  delayMs: number = 0;
  runAtMs?: number;
  /**
   * the default JobName is this class name
   * it **MUST be a unique name**
   */
  jobName?: string;
  /**
   * set a queueName for this job
   * default configured in `config/resque.ts`
   */
  queueName?: string;
  args: any[] = [];
  allArgs: any[][] = [];
  hasEnqueued: boolean = false;
  hasEnqueuedAll: boolean = false;
  app = app;

  constructor(..._args: any[]) {}

  queue(queueName: string) {
    this.queueName = queueName;
    return this;
  }

  static async enqueueAll<T extends typeof BaseJob>(
    this: T,
    args: Parameters<T["prototype"]["perform"]>[],
  ) {
    const job = await app.container.make(this);
    return job.enqueueAll(args);
  }

  async enqueueAll<T extends BaseJob>(
    this: T,
    args: Parameters<T["perform"]>[],
  ) {
    this.allArgs = args;
    this.hasEnqueuedAll = true;
    return this.execute();
  }

  perform(..._args: any[]): any {}

  handleError(error: unknown) {
    throw error;
  }

  onFailure(_failure: ResqueFailure): void | Promise<void> {}

  private async execute() {
    const resqueConfig = app.config.get<ResqueConfig>("resque");
    const jobName = this.jobName ?? this.constructor.name;
    const queueName = this.queueName ?? resqueConfig.queueNameForJobs;
    const queue = await app.container.make("queue");
    let logger = await app.container.make("logger");
    if (resqueConfig.logger) {
      logger.use(resqueConfig.logger);
    }
    if (this.hasEnqueued) {
      const getTips = () => {
        if (!resqueConfig.verbose) {
          return undefined;
        }
        const tips = `enqueued to queue ${queueName}, job ${jobName}`;
        if (this.delayMs) {
          return `${tips}, delay ${this.delayMs}ms`;
        } else if (this.runAtMs) {
          return `${tips}, run at ${this.runAtMs}`;
        } else {
          return tips;
        }
      };
      const tips = getTips();
      if (tips) {
        logger.info(tips);
      }
      if (this.delayMs) {
        return queue.enqueueIn(this.delayMs, queueName, jobName, this.args);
      } else if (this.runAtMs) {
        return queue.enqueueAt(this.runAtMs, queueName, jobName, this.args);
      } else {
        return queue.enqueue(queueName, jobName, this.args);
      }
    } else if (this.hasEnqueuedAll) {
      return Promise.all(
        this.allArgs.map((arg) => queue.enqueue(queueName, jobName, arg)),
      );
    } else {
      return false;
    }
  }

  private push<T extends BaseJob>({
    args,
    delayMs,
    runAtMs,
  }: {
    args: Parameters<T["perform"]>;
    delayMs?: number;
    runAtMs?: number;
  }) {
    this.args = args;
    this.hasEnqueued = true;
    this.delayMs = delayMs ? delayMs : 0;
    this.runAtMs = runAtMs;
    return this.execute();
  }

  static async enqueue<T extends typeof BaseJob>(
    this: T,
    ...args: Parameters<InstanceType<T>["perform"]>
  ) {
    const job = await app.container.make(this);
    return job.enqueue(...args);
  }

  async enqueue<T extends BaseJob>(this: T, ...args: Parameters<T["perform"]>) {
    return this.push({
      args,
    });
  }

  /**
   * @param this
   * @param delayMs In ms, the number of ms to delay before this job is able to start being worked on
   * @param args
   * @returns
   */
  static async enqueueIn<T extends typeof BaseJob>(
    this: T,
    delayMs: number,
    ...args: Parameters<InstanceType<T>["perform"]>
  ) {
    const job = await app.container.make(this);
    return job.enqueueIn(delayMs, ...args);
  }

  async enqueueIn<T extends BaseJob>(
    this: T,
    delayMs: number,
    ...args: Parameters<T["perform"]>
  ) {
    return this.push({
      args,
      delayMs,
    });
  }

  static async enqueueAt<T extends typeof BaseJob>(
    this: T,
    runAtMs: number,
    ...args: Parameters<InstanceType<T>["perform"]>
  ) {
    const job = await app.container.make(this);
    return job.enqueueAt(runAtMs, ...args);
  }

  async enqueueAt<T extends BaseJob>(
    this: T,
    runAtMs: number,
    ...args: Parameters<T["perform"]>
  ) {
    return this.push({
      args,
      runAtMs,
    });
  }
}
