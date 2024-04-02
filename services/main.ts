import app from "@adonisjs/core/services/app"
import { MultiWorker, Worker } from "node-resque"
import { RedisConnections } from '@adonisjs/redis/types'
import { defineConfig } from "../define_config.js"
import { importAllJobs } from "../jobs.js"

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
    const jobs = await importAllJobs()
    return new Worker({
        connection: getConnection(),
        queues
    }, jobs)
}

export async function createMultiWorker(queues: string[]) {
    const jobs = await importAllJobs()
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