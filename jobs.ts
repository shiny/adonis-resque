/*
 * adonis-resque
 *
 * (c) Dai Jie <https://github.com/shiny>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from "@adonisjs/core/services/app";
import { fsImportAll } from "@poppinss/utils";
import type Job from "./base_job.js";
import { type NodeResqueJob } from "./types.js";

export async function importAllJobs() {
  const jobs: Record<string, unknown> = await fsImportAll(
    app.makePath("app/jobs"),
    {
      ignoreMissingRoot: true,
    },
  );

  const isValidJob = (job: any): job is typeof Job => {
    if (!job) {
      return false;
    }
    if (typeof job?.prototype?.perform !== "function") {
      return false;
    }
    if (typeof job?.prototype?.enqueue !== "function") {
      return false;
    }
    return true;
  };

  const Jobs = Object.values(jobs).filter(isValidJob);
  return Jobs.reduce(async (initlizedAccumulator, Job) => {
    let accumulator = await initlizedAccumulator;
    const job = await app.container.make(Job);
    if (!Array.isArray(job.plugins)) {
      job.plugins = [];
    }
    const plugins = job.plugins.map(([plugin]) => plugin);
    const pluginOptions = job.plugins.reduce(
      (acc, [plugin, options]) => {
        acc[plugin.name] = options;
        return acc;
      },
      {} as Record<string, any>,
    );
    accumulator[Job.name] = {
      perform: async (...args: any[]) => {
        try {
          const jobResult = await job.perform.call(job, ...args);
          return jobResult;
        } catch (error) {
          return job.handleError.call(job, error);
        }
      },
      job,
      plugins,
      pluginOptions,
    };
    return accumulator;
  }, Promise.resolve<Record<string, NodeResqueJob>>({}));
}
