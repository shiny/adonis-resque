export { Worker, Plugins, Scheduler, Queue } from "node-resque"
export type { RedisConnections } from '@adonisjs/redis/types'
import { defineConfig } from "./define_config.js"
export type ResqueConfig = ReturnType<typeof defineConfig>

export interface NodeResqueJob {
    perform(..._args: any[]): any
}