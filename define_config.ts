import type { RedisConnections } from './types.js'
import { MultiWorker, Worker } from 'node-resque'

export function defineConfig<Connections extends RedisConnections>(config: {
    redisConnection: keyof Connections
    runWorkerInWebEnv: boolean
    runScheduler: boolean
    isMultiWorkerEnabled: boolean
    multiWorkerOption: MultiWorker['options']
    workerOption: Worker['options']
    queueNameForJobs: string
    queueNameForWorkers: string | string[]
}) {
    return config
}