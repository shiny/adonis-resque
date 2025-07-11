import app from "@adonisjs/core/services/app"
import Job from "./base_job.js"
import { NodeResqueJob } from './types.js'
import { getConfig } from "./index.js"
import { fsImportAll } from "@poppinss/utils"

export async function importAllJobs() {
    const path = getConfig('jobsPath') || 'app/jobs';
    const jobs: Record<string, unknown> = await fsImportAll(app.makePath(path), {
        filter (filePath): boolean {
            return filePath.endsWith('.ts') || filePath.endsWith('.js')
        },
        ignoreMissingRoot: true
    })
    /**
     * Duck typing check
     * @param job 
     * @returns 
     */
    const isValidJob = (job: any): job is typeof Job => {
        if (!job) {
            return false
        }
        if (typeof job?.prototype?.perform !== 'function') {
            return false
        }
        if (typeof job?.prototype?.enqueue !== 'function') {
            return false
        }
        return true
    }
    const Jobs = Object.values(jobs).filter(isValidJob)
    return Jobs.reduce(async (initlizedAccumulator, Job) => {
        let accumulator = await initlizedAccumulator
        const job = await app.container.make(Job)
        if (!Array.isArray(job.plugins)) {
            job.plugins = []
        }
        const plugins = job.plugins.map(([plugin]) => plugin)
        const pluginOptions = job.plugins.reduce((acc, [plugin, options]) => {
            acc[plugin.name] = options
            return acc
        }, {} as Record<string, any>)
        accumulator[Job.name] = {
            perform: async (...args: any[]) => {
                try {
                    const jobResult = await job.perform.call(job, ...args)
                    return jobResult
                } catch (error) {
                    return job.handleError.call(job, error)
                }
            },
            job,
            plugins,
            pluginOptions
        }
        return accumulator
    }, Promise.resolve<Record<string, NodeResqueJob>>({}))
}
