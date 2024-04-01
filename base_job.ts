import app from "@adonisjs/core/services/app"
import { ResqueConfig } from "./types.js"

export default class BaseJob {

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
    private async execute() {
        const resqueConfig = app.config.get<ResqueConfig>('resque')
        const jobName = this.jobName ?? this.constructor.name
        const queueName = this.queueName ?? resqueConfig.queueNameForJobs
        const queue = await app.container.make('queue')
        if (this.hasEnqueued) {
            return queue.enqueue(queueName, jobName, this.args)
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
    then(fn: (result: boolean | boolean[]) => void) {
        this.execute().then(fn)
    }
}
