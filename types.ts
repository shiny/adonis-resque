export { Worker, Plugins, Scheduler, Queue } from "node-resque"
export type { RedisConnections } from '@adonisjs/redis/types'
import { Plugin } from "node-resque"
import BaseJob from "./base_job.js"
import { defineConfig } from "./define_config.js"
export type ResqueConfig = ReturnType<typeof defineConfig>

export interface NodeResqueJob {
    perform(..._args: any[]): any
    job: BaseJob
    plugins: typeof Plugin[],
    pluginOptions: Record<string, any>
}
export interface JobSchedule {
    interval?: string | number
    cron?: string
}

export interface ResqueFailure {
    workerId?: number
    queue: string
    job: NodeResqueJob
    failure: Error
    duration: number
}
declare module '@adonisjs/core/types' {
    interface EventsList {
        'resque:failure': ResqueFailure
    }
}
  