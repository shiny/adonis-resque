import app from "@adonisjs/core/services/app"
import { fsImportAll } from "@poppinss/utils"
import Job from "./base_job.js"
import { NodeResqueJob } from './types.js'

export async function importAllJobs() {
    const jobs: Record<string, typeof Job> = await fsImportAll(app.makePath('app/jobs'), {
        ignoreMissingRoot: true
    })
    const Jobs = Object.values(jobs)
    return Jobs.reduce((accumulator, Job) => {
        const job = new Job
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
            plugins: job.plugins.map(([plugin]) => plugin),
            pluginOptions: job.plugins.reduce((acc, [plugin, options]) => {
                acc[plugin.name] = options
                return acc
            }, {} as Record<string, any>)
        }
        return accumulator
    }, {} as Record<string, NodeResqueJob>)
}
