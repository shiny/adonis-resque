import app from "@adonisjs/core/services/app"
import { fsImportAll } from "@poppinss/utils"
import { MultiWorker, Worker } from "node-resque"
import Job from "../base_job.js"
import { RedisConnections } from '@adonisjs/redis/types'
import { defineConfig } from "../define_config.js"
import { NodeResqueJob } from '../types.js'

export async function importJobs() {
    const jobs: Record<string, typeof Job> = await fsImportAll(app.makePath('app/jobs'))
    const Jobs = Object.values(jobs)
    return Jobs.reduce((accumulator, Job) => {
        const job = new Job
        accumulator[Job.name] = {
            perform: job.perform.bind(job)
        }
        return accumulator
    }, {} as Record<string, NodeResqueJob>)
}

export function getConnection() {
    const resqueConfig = app.config.get<ReturnType<typeof defineConfig>>('resque')
    const connections = app.config.get<RedisConnections>('redis.connections')
    const connection = connections[resqueConfig.redisConnection] as any
    return {
        host: connection.host,
        port: Number.parseInt(connection.port ?? '6379'),
        options: {
        password: connection.password,
        },
        pkg: 'ioredis',
        database: 0
    }
}

export async function createWorker(queues: string[]) {
    const jobs = await importJobs()
    return new Worker({
        connection: getConnection(),
        queues
    }, jobs)
}

export async function createMultiWorker(queues: string[]) {
    const jobs = await importJobs()
    const multiWorkerOption = app.config.get<MultiWorker['options']>('resque.multiWorkerOption')
    return new MultiWorker({
        queues,
        connection: getConnection(),
        ...multiWorkerOption,
    }, jobs)
}

export function isMultiWorkerEnabled() {
    return app.config.get<boolean>('resque.isMultiWorkerEnabled')
}