import app from "@adonisjs/core/services/app"
import { Jobs, MultiWorker, Worker } from "node-resque"
import { RedisConnections } from '@adonisjs/redis/types'
import { defineConfig } from "../define_config.js"

export function getConnection() {
    const resqueConfig = app.config.get<ReturnType<typeof defineConfig>>('resque')
    const connections = app.config.get<RedisConnections>('redis.connections')
    const connection = connections[resqueConfig.redisConnection] as any
    return {
        host: connection.host,
        port: Number.parseInt(connection.port ?? '6379'),
        options: connection,
        pkg: 'ioredis',
        database: 0,
    }
}

export function createWorker(jobs: Jobs, queues: string[]) {
    const workerOption = app.config.get<Worker['options']>('resque.workerOption')
    return new Worker({
        connection: getConnection(),
        queues,
        ...workerOption
    }, jobs)
}

export function createMultiWorker(jobs: Jobs, queues: string[]) {
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