import app from "@adonisjs/core/services/app"
export default class BaseJob {

    delayMs: number = 0
    runAtMs?: number
    queue?: string
    args: any[] = []

    static enqueue<T extends typeof BaseJob>(this: T, ...args: Parameters<T['prototype']['perform']>) {
        const job = new this
        return job.enqueue(...args)
    }
    enqueue<T extends BaseJob>(this: T, ...args: Parameters<T['perform']>) {
        this.queue = this.constructor.name
        this.args = args
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
    then(fn: (result: boolean) => void) {
        app.container.make('queue').then((queue) => {
            queue.enqueue('default', this.constructor.name, this.args).then(fn)
        })
        // console.log("then", this.constructor.name, this.runAtMs, this.delayMs, this.args)
    }
}
