import type { RedisConnections } from './types.js'
import { MultiWorker, Worker } from 'node-resque'

export function defineConfig<Connections extends RedisConnections>(config: {
    redisConnection: keyof Connections;
    multiWorkerOption: MultiWorker['options']
    isMultiWorkerEnabled: boolean
    workerOption: Worker['options']
}) {
    return config
}