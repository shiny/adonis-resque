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
            perform: job.perform.bind(job),
            job
        }
        return accumulator
    }, {} as Record<string, NodeResqueJob>)
}
