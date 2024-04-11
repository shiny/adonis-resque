import app from "@adonisjs/core/services/app"
import { ResqueConfig } from "./types.js"
import { Logger, LoggerManager } from "@adonisjs/core/logger"
import { LoggerConfig, LoggerManagerConfig } from "@adonisjs/core/types/logger"

export default class BaseJob {

    interval?: string | number
    cron?: string

    delayMs: number = 0
    runAtMs?: number
    /**
     * the default JobName is this class name  
     * it **MUST be a unique name**
     */
    jobName?: string
    /**
     * set a queueName for this job
     * default configured in `config/resque.ts`
     */
    queueName?: string
    args: any[] = []
    allArgs: any[][] = []
    hasEnqueued: boolean = false
    hasEnqueuedAll: boolean = false
    app = app
    logger: Logger
    constructor() {
        this.logger = this.createLogger()
    }
    private createLogger() {
        const loggerName = app.config.get<string | null>('resque.logger')
        const loggerConfig = app.config.get<LoggerManagerConfig<Record<string, LoggerConfig>>>('logger')
        const manager = new LoggerManager(loggerConfig)
        if (loggerName) {
            return manager.use(loggerName)
        } else {
            return manager.use()
        }
    }
    static enqueue<T extends typeof BaseJob>(this: T, ...args: Parameters<T['prototype']['perform']>) {
        const job = new this
        return job.enqueue(...args)
    }
    enqueue<T extends BaseJob>(this: T, ...args: Parameters<T['perform']>) {
        this.args = args
        this.hasEnqueued = true
        return this
    }
    static queue(queueName: string) {
        const job = new this
        return job.queue(queueName)
    }
    queue(queueName: string) {
        this.queueName = queueName
        return this
    }
    static enqueueAll<T extends typeof BaseJob>(this: T, args: Parameters<T['prototype']['perform']>[]) {
        const job = new this
        return job.enqueueAll(args)
    }
    enqueueAll<T extends BaseJob>(this: T, args: Parameters<T['perform']>[]) {
        this.allArgs = args
        this.hasEnqueuedAll = true
        return this
    }

    static in(ms: number) {
        return (new this).in(ms)
    }
    in(ms: number) {
        this.delayMs = ms
        return this
    }
    static at(ms: number) {
        return (new this).at(ms)
    }
    at(ms: number) {
        this.runAtMs = ms
        return this
    }
    perform(..._args: any[]): any {

    }
    handleError(error: unknown) {
        this.logger.error((error as Error).message)
        throw error
    }
    private async execute() {
        const resqueConfig = app.config.get<ResqueConfig>('resque')
        const jobName = this.jobName ?? this.constructor.name
        const queueName = this.queueName ?? resqueConfig.queueNameForJobs
        const queue = await app.container.make('queue')
        if (this.hasEnqueued) {
            const getTips = () => {
                if (!resqueConfig.verbose) {
                    return undefined
                }
                const tips = `enqueued to queue ${queueName}, job ${jobName}`
                if (this.delayMs) {
                    return `${tips}, delay ${this.delayMs}ms`
                } else if (this.runAtMs) {
                    return `${tips}, run at ${this.runAtMs}`
                } else {
                    return tips
                }
            }
            this.logger.info(getTips())
            if (this.delayMs) {
                return queue.enqueueIn(this.delayMs, queueName, jobName, this.args)
            } else if (this.runAtMs) {
                return queue.enqueueAt(this.runAtMs, queueName, jobName, this.args)
            } else {
                return queue.enqueue(queueName, jobName, this.args)
            }
        } else if (this.hasEnqueuedAll) {
            return Promise.all(this.allArgs.map(arg => queue.enqueue(queueName, jobName, arg)))
        } else {
            return false
        }
    }
    /**
     * this method runs after an `await` statement
     * e.g, 
     * ```typescript
     * await job.enqueue().in(2000)
     * ```
     * @param fn 
     */
    then(fn: (result: void | boolean | boolean[]) => void) {
        this.execute().then(fn)
    }
}
