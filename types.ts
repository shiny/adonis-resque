export { Worker, Plugins, Scheduler, Queue } from "node-resque"
export type { RedisConnections } from '@adonisjs/redis/types'
import BaseJob from "./base_job.js"
import { defineConfig } from "./define_config.js"
export type ResqueConfig = ReturnType<typeof defineConfig>

export interface NodeResqueJob {
    perform(..._args: any[]): any
    job: BaseJob
}
export interface JobSchedule {
    interval?: string | number
    cron?: string
}
